import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const query = `
      SELECT 
        t.id AS ticket_id,
        t.bib_number,
        t.qr_code_token,
        t.racepack_taken,
        t.racepack_taken_at,
        t.is_used,
        t.check_in_at,
        u.name AS user_name,
        u.email AS user_email,
        u.phone AS user_phone,
        u.jersey_size,
        o.id AS order_id,
        o.category,
        o.status AS order_status,
        o.total_amount,
        o.paid_at,
        e.name AS event_name,
        e.event_date,
        e.description AS event_description
      FROM tickets t
      JOIN orders o ON t.order_id = o.id
      JOIN users u ON t.user_id = u.id
      JOIN events e ON o.event_id = e.id
      WHERE t.qr_code_token = $1
    `;

    const result = await pool.query(query, [token]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Tiket tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ ticket: result.rows[0] });
  } catch (error: any) {
    console.error('Ticket fetch error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
