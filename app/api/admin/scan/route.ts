import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, mode, officerName = 'Panitia' } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token QR Code tidak valid' }, { status: 400 });
    }

    // 1. Cari data tiket berdasarkan QR Code Token atau BIB Number
    const ticketRes = await pool.query(`
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
        u.jersey_size,
        o.id AS order_id,
        o.category,
        o.status AS order_status
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      JOIN orders o ON t.order_id = o.id
      WHERE t.qr_code_token = $1 OR t.bib_number = $1
    `, [token.trim()]);

    if (ticketRes.rows.length === 0) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Data peserta tidak ditemukan dalam sistem.' 
      }, { status: 404 });
    }

    const ticket = ticketRes.rows[0];

    // Pastikan pesanan sudah lunas
    if (ticket.order_status !== 'settlement') {
      return NextResponse.json({
        valid: false,
        ticket,
        error: 'Status pembayaran peserta belum lunas (Settlement)!'
      }, { status: 400 });
    }

    // MODE 1: Pengambilan Race Pack
    if (mode === 'racepack') {
      if (ticket.racepack_taken) {
        return NextResponse.json({
          valid: false,
          alreadyTaken: true,
          ticket,
          message: `PERINGATAN: Race Pack sudah pernah diambil pada ${new Date(ticket.racepack_taken_at).toLocaleString('id-ID')}!`
        });
      }

      // Berikan respon verifikasi peserta agar panitia bisa melihat ukuran jersey dan menekan konfirmasi
      return NextResponse.json({
        valid: true,
        actionRequired: 'confirm_racepack',
        ticket,
        message: 'Peserta terverifikasi! Silakan siapkan Race Pack sesuai ukuran jersey.'
      });
    }

    // MODE 2: Check-in Hari-H di Gerbang Start
    if (mode === 'checkin') {
      if (ticket.is_used) {
        return NextResponse.json({
          valid: false,
          alreadyCheckedIn: true,
          ticket,
          message: `PERINGATAN: Peserta sudah melakukan check-in pada ${new Date(ticket.check_in_at).toLocaleString('id-ID')}!`
        });
      }

      // Update langsung check-in peserta
      await pool.query(`
        UPDATE tickets
        SET is_used = TRUE, check_in_at = NOW()
        WHERE id = $1
      `, [ticket.ticket_id]);

      return NextResponse.json({
        valid: true,
        ticket: { ...ticket, is_used: true, check_in_at: new Date() },
        message: `BERHASIL CHECK-IN! Selamat berlari, ${ticket.user_name} (#${ticket.bib_number}).`
      });
    }

    return NextResponse.json({ error: 'Mode scanner tidak valid' }, { status: 400 });

  } catch (error: any) {
    console.error('Scan error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Konfirmasi penyerahan racepack setelah dicek
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { ticketId, officerName = 'Panitia' } = body;

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID wajib' }, { status: 400 });
    }

    const check = await pool.query('SELECT racepack_taken FROM tickets WHERE id = $1', [ticketId]);
    if (check.rows.length === 0) {
      return NextResponse.json({ error: 'Tiket tidak ditemukan' }, { status: 404 });
    }

    if (check.rows[0].racepack_taken) {
      return NextResponse.json({ error: 'Racepack sudah diserahkan sebelumnya' }, { status: 400 });
    }

    await pool.query(`
      UPDATE tickets
      SET racepack_taken = TRUE, racepack_taken_at = NOW(), racepack_handled_by = $1
      WHERE id = $2
    `, [officerName, ticketId]);

    return NextResponse.json({
      success: true,
      message: 'Race pack berhasil diserahkan dan tercatat di sistem.'
    });
  } catch (error: any) {
    console.error('Confirm racepack error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
