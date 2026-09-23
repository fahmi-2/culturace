import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    // Tandai semua order pending yang sudah melewati batas waktu expires_at menjadi 'expire'
    const result = await pool.query(`
      UPDATE orders
      SET status = 'expire'
      WHERE status = 'pending' AND expires_at < NOW()
      RETURNING id, status
    `);

    return NextResponse.json({
      success: true,
      message: `${result.rowCount} order telah diperbarui menjadi expire`,
      expiredOrders: result.rows
    });
  } catch (error: any) {
    console.error('Error checking order expiry:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  return POST(new Request('http://localhost/api/orders/check-expiry'));
}
