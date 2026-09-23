import { NextResponse } from 'next/server';
import crypto from 'crypto';
import midtransClient from 'midtrans-client';
import { Resend } from 'resend';
import { TicketEmail } from '@/components/emails/TicketEmail';
import pool from '@/lib/db';

const apiClient = new midtransClient.CoreApi({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!,
});

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();

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
            // 1. Update status order menjadi settlement
            await pool.query(
              `UPDATE orders SET status = 'settlement', paid_at = COALESCE(paid_at, NOW()) WHERE id = $1`,
              [ord.id]
            );

            // 2. Ambil data pelanggan & detail event
            const queryResult = await pool.query(`
              SELECT 
                u.name AS customer_name,
                u.email AS customer_email,
                u.phone AS customer_phone,
                u.jersey_size,
                e.name AS event_name
              FROM orders o
              JOIN users u ON o.user_id = u.id
              JOIN events e ON o.event_id = e.id
              WHERE o.id = $1
            `, [ord.id]);

            if (queryResult.rows.length > 0) {
              const data = queryResult.rows[0];
              const category = ord.category || '5K';
              const customerName = data.customer_name;
              const customerEmail = data.customer_email;
              let customerPhone = (data.customer_phone || '').trim();
              const eventName = data.event_name;
              const jerseySize = data.jersey_size || 'M';

              // 3. Generate tiket & BIB jika belum ada
              const existingTicket = await pool.query('SELECT * FROM tickets WHERE order_id = $1', [ord.id]);
              let bibNumber = '';
              let qrCodeToken = '';
              let ticketUrl = '';

              if (existingTicket.rows.length > 0) {
                bibNumber = existingTicket.rows[0].bib_number;
                qrCodeToken = existingTicket.rows[0].qr_code_token;
                ticketUrl = existingTicket.rows[0].ticket_url;
              } else {
                const countRes = await pool.query(
                  `SELECT COUNT(*) FROM tickets WHERE bib_number LIKE $1`,
                  [`${category}-%`]
                );
                const nextSeq = Number(countRes.rows[0].count) + 1;
                bibNumber = `${category}-${String(nextSeq).padStart(3, '0')}`;
                qrCodeToken = `CULT-${category}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
                const appHost = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                ticketUrl = `${appHost}/ticket/${qrCodeToken}`;

                await pool.query(
                  `INSERT INTO tickets (order_id, user_id, bib_number, qr_code_token, ticket_url, racepack_taken, is_used)
                   VALUES ($1, $2, $3, $4, $5, FALSE, FALSE)`,
                  [ord.id, ord.user_id, bibNumber, qrCodeToken, ticketUrl]
                );
              }

              // 4. Kirim Email (Resend)
              if (customerEmail) {
                try {
                  const fromSender = process.env.EMAIL_FROM || 'Culturace <onboarding@resend.dev>';
                  await resend.emails.send({
                    from: fromSender,
                    to: customerEmail,
                    subject: `E-Ticket Resmi BIB #${bibNumber} - ${eventName}`,
                    react: TicketEmail({
                      customerName,
                      eventName,
                      orderId: ord.id,
                      amount: Number(ord.total_amount),
                      categoryName: `${category} Fun Run`,
                      bibName: bibNumber,
                      jerseySize,
                      ticketUrl,
                      ticketCode: bibNumber
                    }),
                  });
                } catch (emailErr) {
                  console.error('Email send error:', emailErr);
                }
              }

              // 5. Kirim WhatsApp (Fonnte)
              if (customerPhone && process.env.FONNTE_TOKEN) {
                try {
                  if (customerPhone.startsWith('0')) customerPhone = '62' + customerPhone.slice(1);
                  customerPhone = customerPhone.replace(/[^0-9]/g, '');

                  const waMessage =
                    `*E-TICKET & KARTU PESERTA RESMI CULTURACE 2026* 🏃‍♂️✨

Halo *${customerName}*,
Pembayaran tiket Anda berhasil disinkronkan & terverifikasi!

📋 *Rincian Kartu Peserta:*
• *Nomor BIB:* *${bibNumber}*
• *Kategori:* ${category} Fun Run
• *Ukuran Jersey:* Size ${jerseySize}
• *Order ID:* ${ord.id}
• *Status:* LUNAS (Settled)

🎫 *Buka Kartu Peserta & QR Code:*
${ticketUrl}

Tunjukkan barcode/QR pada link di atas saat pengambilan Race Pack di Masjid Moekhlas Sidik Pandaan. Sampai jumpa di garis start! 🏁`;

                  await fetch('https://api.fonnte.com/send', {
                    method: 'POST',
                    headers: {
                      'Authorization': process.env.FONNTE_TOKEN,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      target: customerPhone,
                      message: waMessage,
                      delay: '1',
                      countryCode: '62'
                    })
                  });
                } catch (waErr) {
                  console.error('WA send error:', waErr);
                }
              }

              updated.push({ id: ord.id, status: 'settlement', bibNumber });
            }
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
