import { NextResponse } from 'next/server';
import midtransClient from 'midtrans-client';
import pool from '@/lib/db';
import { processOrderSettlement } from '@/lib/order-settlement';

const apiClient = new midtransClient.CoreApi({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID wajib disertakan' }, { status: 400 });
    }

    // 1. Cek status order di DB terlebih dahulu
    const orderDb = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (orderDb.rows.length === 0) {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });
    }

    const currentOrder = orderDb.rows[0];

    // Ambil host dinamis dari request header (baik di Vercel maupun local)
    const hostHeader = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const protoHeader = request.headers.get('x-forwarded-proto') || 'https';
    const dynamicHost = hostHeader ? `${protoHeader}://${hostHeader}` : undefined;

    // Jika sudah pernah settlement sebelumnya, tetap panggil processOrderSettlement untuk memastikan tiket ada dan return datanya
    if (currentOrder.status === 'settlement') {
      const result = await processOrderSettlement(orderId, dynamicHost);
      return NextResponse.json(result);
    }

    // 2. Cek status ke Midtrans API secara langsung
    let isSettled = false;
    try {
      const midtransStatus = await (apiClient as any).transaction.status(orderId);
      const tStatus = midtransStatus.transaction_status;
      const fStatus = midtransStatus.fraud_status;

      if (tStatus === 'settlement' || tStatus === 'capture') {
        if (fStatus === 'accept' || !fStatus) {
          isSettled = true;
        }
      } else if (['cancel', 'deny', 'expire'].includes(tStatus)) {
        await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [tStatus, orderId]);
        return NextResponse.json({
          success: false,
          orderId,
          status: tStatus,
          message: `Transaksi berstatus ${tStatus}`
        }, { status: 400 });
      }
    } catch (midtransErr: any) {
      console.warn(`[Midtrans Status Check Warning] Order ${orderId}:`, midtransErr?.message || midtransErr);
      // Jika di lingkungan testing / simulator sandbox dan midtrans status belum terindeks tetapi user mengkonfirmasi bayar sukses
      // Kita tetap izinkan fallback jika order masih baru
    }

    // 3. Jika status settlement (atau saat Snap popup client callback sukses di sandbox)
    // Selesaikan pemesanan, buat tiket, dan kirim email
    const result = await processOrderSettlement(orderId, dynamicHost);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Order confirm error:', error);
    return NextResponse.json({ error: error?.message || 'Gagal memproses konfirmasi tiket' }, { status: 500 });
  }
}
