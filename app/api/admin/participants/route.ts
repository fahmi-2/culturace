import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';
    const racepackFilter = searchParams.get('racepack') || '';
    const checkinFilter = searchParams.get('checkin') || '';

    let baseQuery = `
      SELECT 
        t.id AS ticket_id,
        t.bib_number,
        t.qr_code_token,
        t.ticket_url,
        t.racepack_taken,
        t.racepack_taken_at,
        t.racepack_handled_by,
        t.is_used,
        t.check_in_at,
        t.created_at AS ticket_created_at,
        u.id AS user_id,
        u.name AS user_name,
        u.email AS user_email,
        u.phone AS user_phone,
        u.jersey_size,
        o.id AS order_id,
        o.category,
        o.status AS order_status,
        rt.formatted_duration AS finish_time,
        rt.id AS timing_id
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      JOIN orders o ON t.order_id = o.id
      LEFT JOIN race_timings rt ON rt.ticket_id = t.id
      WHERE 1=1
    `;

    const values: any[] = [];

    if (search) {
      values.push(`%${search}%`);
      baseQuery += ` AND (u.name ILIKE $${values.length} OR t.bib_number ILIKE $${values.length} OR u.email ILIKE $${values.length} OR u.phone ILIKE $${values.length})`;
    }

    if (racepackFilter === 'taken') {
      baseQuery += ` AND t.racepack_taken = TRUE`;
    } else if (racepackFilter === 'untaken') {
      baseQuery += ` AND t.racepack_taken = FALSE`;
    }

    if (checkinFilter === 'checked') {
      baseQuery += ` AND t.is_used = TRUE`;
    } else if (checkinFilter === 'unchecked') {
      baseQuery += ` AND t.is_used = FALSE`;
    }

    baseQuery += ` ORDER BY t.bib_number ASC`;

    const result = await pool.query(baseQuery, values);
    return NextResponse.json({ participants: result.rows });
  } catch (error: any) {
    console.error('Participants fetch error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
