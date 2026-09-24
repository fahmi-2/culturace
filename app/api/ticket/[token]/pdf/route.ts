import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generateTicketPdf } from '@/lib/ticket-pdf';

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
        u.name AS user_name,
        u.email AS user_email,
        u.jersey_size,
        o.id AS order_id,
        o.category,
        o.total_amount,
        e.name AS event_name
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

    const t = result.rows[0];

    const pdfBuffer = await generateTicketPdf({
      customerName: t.user_name,
      orderId: t.order_id,
      bibNumber: t.bib_number,
      categoryName: `${t.category || '5K'} Fun Run`,
      jerseySize: t.jersey_size || 'M',
      qrCodeToken: t.qr_code_token,
      amount: Number(t.total_amount || 0),
    });

    return new Response(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="E-Ticket-${t.bib_number}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('PDF download error:', error);
    return NextResponse.json({ error: error?.message || 'Gagal membuat file PDF' }, { status: 500 });
  }
}
