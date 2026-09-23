import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // 1. Total statistik overview
    const totalOrdersRes = await pool.query(`
      SELECT 
        COUNT(*) AS total_orders,
        COUNT(*) FILTER (WHERE status = 'settlement') AS paid_orders,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending_orders,
        COUNT(*) FILTER (WHERE status = 'expire') AS expired_orders,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'settlement'), 0) AS total_revenue
      FROM orders
    `);

    const ticketsStatRes = await pool.query(`
      SELECT 
        COUNT(*) AS total_tickets,
        COUNT(*) FILTER (WHERE racepack_taken = TRUE) AS racepack_taken_count,
        COUNT(*) FILTER (WHERE is_used = TRUE) AS checked_in_count
      FROM tickets
    `);

    // 2. Race timing stats
    const finishRes = await pool.query(`
      SELECT COUNT(*) AS total_finishers FROM race_timings
    `);

    // 3. Status wave kategori 5K
    const waveRes = await pool.query(`
      SELECT * FROM race_waves WHERE category = '5K' LIMIT 1
    `);

    // 4. Riwayat transaksi terbaru
    const recentOrdersRes = await pool.query(`
      SELECT 
        o.id,
        o.total_amount,
        o.status,
        o.expires_at,
        o.paid_at,
        o.created_at,
        u.name AS user_name,
        u.email AS user_email,
        u.jersey_size,
        t.bib_number
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN tickets t ON t.order_id = o.id
      ORDER BY o.created_at DESC
      LIMIT 8
    `);

    return NextResponse.json({
      stats: {
        ...totalOrdersRes.rows[0],
        ...ticketsStatRes.rows[0],
        ...finishRes.rows[0],
        wave5K: waveRes.rows[0] || null
      },
      recentOrders: recentOrdersRes.rows
    });
  } catch (error: any) {
    console.error('Admin overview error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
