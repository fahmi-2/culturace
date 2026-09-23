import { NextResponse } from 'next/server';
import crypto from 'crypto';
import midtransClient from 'midtrans-client';
import pool from '@/lib/db';
import { processOrderSettlement } from '@/lib/order-settlement';

const apiClient = new midtransClient.CoreApi({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!,
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';

    // Auto-cek dan sinkronkan order pending ke API Midtrans secara live
    try {
      const pendingOrders = await pool.query(`
        SELECT id, user_id, category, expires_at 
        FROM orders 
        WHERE status = 'pending'
      `);

      for (const ord of pendingOrders.rows) {
        try {
          const st = await (apiClient as any).transaction.status(ord.id);
          const transStatus = st.transaction_status;
          const fraudStatus = st.fraud_status;

          if (transStatus === 'settlement' || transStatus === 'capture') {
            if (fraudStatus === 'accept' || !fraudStatus) {
              await processOrderSettlement(ord.id);
            }
          } else if (['cancel', 'deny', 'expire'].includes(transStatus)) {
            await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [transStatus, ord.id]);
          } else if (new Date(ord.expires_at).getTime() < Date.now()) {
            await pool.query("UPDATE orders SET status = 'expire' WHERE id = $1", [ord.id]);
          }
        } catch (subErr) {
          // Abaikan jika order belum dibuat di midtrans
        }
      }
    } catch (e) {
      console.warn('Sync in payments GET failed:', e);
    }

    let query = `
      SELECT 
        o.id AS order_id,
        o.category,
        o.total_amount,
        o.status,
        o.expires_at,
        o.paid_at,
        o.created_at,
        u.name AS user_name,
        u.email AS user_email,
        u.phone AS user_phone,
        u.jersey_size,
        t.bib_number
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN tickets t ON t.order_id = o.id
      WHERE 1=1
    `;

    const values: any[] = [];

    if (search) {
      values.push(`%${search}%`);
      query += ` AND (o.id ILIKE $${values.length} OR u.name ILIKE $${values.length} OR u.email ILIKE $${values.length} OR t.bib_number ILIKE $${values.length})`;
    }

    if (status && status !== 'all') {
      values.push(status);
      query += ` AND o.status = $${values.length}`;
    }

    query += ` ORDER BY o.created_at DESC`;

    const result = await pool.query(query, values);

    return NextResponse.json({ orders: result.rows });
  } catch (error: any) {
    console.error('Payments fetch error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
