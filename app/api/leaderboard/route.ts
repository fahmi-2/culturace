import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';

    // Ambil data finisher resmi jika sudah ada yang finish
    let query = `
      SELECT 
        rt.id AS timing_id,
        t.id AS ticket_id,
        rt.bib_number,
        '5K' AS category,
        rt.finish_time,
        rt.duration_ms,
        rt.formatted_duration AS net_time,
        'FINISH LINE' AS last_checkpoint,
        rt.formatted_duration AS split_time,
        u.name AS runner_name,
        u.gender,
        TRUE AS is_finished
      FROM race_timings rt
      JOIN tickets t ON rt.ticket_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;

    const values: any[] = [];
    if (search) {
      values.push(`%${search}%`);
      query += ` AND (u.name ILIKE $1 OR rt.bib_number ILIKE $1)`;
    }
    query += ` ORDER BY rt.duration_ms ASC`;

    const finishedRes = await pool.query(query, values);

    // Jika pelari belum finish atau sedikit, ambil juga pelari terdaftar (tickets) agar live race data selalu berisi peserta riil dari database
    let combined = [...finishedRes.rows];

    const excludeIds = finishedRes.rows.map(r => r.ticket_id);
    let registeredQuery = `
      SELECT 
        NULL AS timing_id,
        t.id AS ticket_id,
        t.bib_number,
        '5K' AS category,
        NULL AS finish_time,
        NULL AS duration_ms,
        CASE 
          WHEN t.is_used = TRUE THEN 'On Track'
          ELSE 'Starting Line'
        END AS net_time,
        CASE 
          WHEN t.is_used = TRUE THEN 'Gate Start (Checked-in)'
          ELSE 'Masjid Moekhlas Sidik'
        END AS last_checkpoint,
        '--:--:--' AS split_time,
        u.name AS runner_name,
        u.gender,
        FALSE AS is_finished
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;

    const regValues: any[] = [];
    if (excludeIds.length > 0) {
      registeredQuery += ` AND t.id NOT IN (${excludeIds.join(',')})`;
    }
    if (search) {
      regValues.push(`%${search}%`);
      registeredQuery += ` AND (u.name ILIKE $1 OR t.bib_number ILIKE $1)`;
    }
    registeredQuery += ` ORDER BY t.bib_number ASC`;

    const registeredRes = await pool.query(registeredQuery, regValues);
    combined = [...combined, ...registeredRes.rows];

    // Info status wave 5K
    const waveRes = await pool.query(`
      SELECT gun_start_time, is_started 
      FROM race_waves 
      WHERE category = '5K' 
      ORDER BY id DESC LIMIT 1
    `);

    return NextResponse.json({
      category: '5K',
      wave: waveRes.rows[0] || null,
      runners: combined
    });
  } catch (error: any) {
    console.error('Live race data error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
