import { NextResponse } from 'next/server';
import midtransClient from 'midtrans-client';
import pool from '@/lib/db';
import { processOrderSettlement } from '@/lib/order-settlement';

const apiClient = new midtransClient.CoreApi({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
});

export async function POST(request: Request) {
  try {
    let orderId: string | undefined;
    try {
      const body = await request.json();
      orderId = body?.orderId;
    } catch {
      // Body kosong diizinkan untuk sync all
    }

    // Jika ada orderId spesifik, sinkronkan order tersebut. Jika tidak, sinkronkan semua pending orders.
    let targetOrders = [];
    if (orderId) {
      const o = await pool.query('SELECT id, user_id, category, total_amount FROM orders WHERE id = $1', [orderId]);
      targetOrders = o.rows;
    } else {
      const o = await pool.query("SELECT id, user_id, category, total_amount FROM orders WHERE status = 'pending'");
      targetOrders = o.rows;
    }

    const updated = [];

    for (const ord of targetOrders) {
      try {
        const statusResponse = await (apiClient as any).transaction.status(ord.id);
        const transStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;

        if (transStatus === 'settlement' || transStatus === 'capture') {
          if (fraudStatus === 'accept' || !fraudStatus) {
            // Gunakan service resmi processOrderSettlement (Gmail SMTP & WhatsApp)
            const result = await processOrderSettlement(ord.id);
            updated.push({
              id: ord.id,
              status: 'settlement',
              bibNumber: result.ticket?.bib_number
            });
          }
        } else if (['cancel', 'deny', 'expire'].includes(transStatus)) {
          await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [transStatus, ord.id]);
          updated.push({ id: ord.id, status: transStatus });
        }
      } catch (err: any) {
        console.warn(`Could not sync order ${ord.id}:`, err?.message);
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount: updated.length,
      updatedOrders: updated
    });

  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  return POST(new Request('http://localhost/api/admin/payments/sync', {
    method: 'POST',
    body: JSON.stringify({})
  }));
}
