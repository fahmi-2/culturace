import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Helper format durasi milidetik ke HH:MM:SS atau MM:SS.mmm
function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// 1. GET: Ambil status Gun Start Wave & Tabel Finish Leaderboard
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '5K';

    // Status Gun Start
    const waveRes = await pool.query(
      `SELECT * FROM race_waves WHERE category = $1 ORDER BY id DESC LIMIT 1`,
      [category]
    );
    const wave = waveRes.rows[0] || null;

    // Leaderboard Pelari yang Finish
    const timingsRes = await pool.query(`
      SELECT 
        rt.id AS timing_id,
        rt.bib_number,
        rt.category,
        rt.finish_time,
        rt.duration_ms,
        rt.formatted_duration,
        rt.recorded_by,
        u.name AS runner_name,
        u.gender,
        u.jersey_size
      FROM race_timings rt
      JOIN tickets t ON rt.ticket_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE rt.category = $1
      ORDER BY rt.duration_ms ASC
    `, [category]);

    return NextResponse.json({
      category,
      wave,
      leaderboard: timingsRes.rows
    });
  } catch (error: any) {
    console.error('Timing GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// 2. POST: Gun Start / Quick BIB Finish Logging
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, category = '5K', bibNumber, recordedBy = 'Marshal Timing' } = body;

    // A. ACTION: GUN START (Mulai Balapan)
    if (action === 'gun_start') {
      const now = new Date();
      const waveRes = await pool.query(`
        INSERT INTO race_waves (event_id, category, gun_start_time, is_started)
        VALUES (1, $1, $2, TRUE)
        RETURNING *
      `, [category, now]);

      return NextResponse.json({
        success: true,
        message: `Gun Start untuk kategori ${category} berhasil dimulai!`,
        wave: waveRes.rows[0]
      });
    }

    // B. ACTION: RECORD FINISH TIME (Pencatatan BIB Cepat)
    if (action === 'record_finish') {
      if (!bibNumber) {
        return NextResponse.json({ error: 'Nomor BIB wajib diisi' }, { status: 400 });
      }

      const cleanBib = bibNumber.trim().toUpperCase();

      // Cek tiket pelari
      const ticketRes = await pool.query(`
        SELECT t.id AS ticket_id, t.bib_number, o.category, u.name AS runner_name
        FROM tickets t
        JOIN orders o ON t.order_id = o.id
        JOIN users u ON t.user_id = u.id
        WHERE t.bib_number = $1
      `, [cleanBib]);

      if (ticketRes.rows.length === 0) {
        return NextResponse.json({ error: `Nomor BIB '${cleanBib}' tidak terdaftar di sistem!` }, { status: 404 });
      }

      const ticket = ticketRes.rows[0];

      // Cek apakah sudah pernah tercatat finish
      const existingTiming = await pool.query(`
        SELECT id, formatted_duration FROM race_timings WHERE ticket_id = $1
      `, [ticket.ticket_id]);

      if (existingTiming.rows.length > 0) {
        return NextResponse.json({
          error: `Pelari ${cleanBib} (${ticket.runner_name}) sudah tercatat finish dengan waktu ${existingTiming.rows[0].formatted_duration}!`
        }, { status: 400 });
      }

      // Ambil Gun Start wave kategori
      const waveRes = await pool.query(`
        SELECT gun_start_time, is_started 
        FROM race_waves 
        WHERE category = $1 AND is_started = TRUE 
        ORDER BY id DESC LIMIT 1
      `, [ticket.category]);

      if (waveRes.rows.length === 0 || !waveRes.rows[0].gun_start_time) {
        return NextResponse.json({
          error: `Gun Start untuk kategori ${ticket.category} belum dimulai! Tekan tombol 'Mulai Balapan' terlebih dahulu.`
        }, { status: 400 });
      }

      const gunStartTime = new Date(waveRes.rows[0].gun_start_time).getTime();
      const finishTime = Date.now();
      const durationMs = Math.max(0, finishTime - gunStartTime);
      const formattedDuration = formatDuration(durationMs);

      const timingInsert = await pool.query(`
        INSERT INTO race_timings (ticket_id, bib_number, category, finish_time, duration_ms, formatted_duration, recorded_by)
        VALUES ($1, $2, $3, NOW(), $4, $5, $6)
        RETURNING *
      `, [ticket.ticket_id, cleanBib, ticket.category, durationMs, formattedDuration, recordedBy]);

      return NextResponse.json({
        success: true,
        message: `Finish tercatat: #${cleanBib} ${ticket.runner_name} (${formattedDuration})`,
        timing: timingInsert.rows[0],
        runnerName: ticket.runner_name
      });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenal' }, { status: 400 });
  } catch (error: any) {
    console.error('Timing POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
