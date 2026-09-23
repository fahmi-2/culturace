import crypto from 'crypto';
import pool from '@/lib/db';
import { sendTicketEmail } from '@/lib/mailer';

export interface ProcessSettlementResult {
  success: boolean;
  orderId: string;
  ticket?: {
    id: number;
    bib_number: string;
    qr_code_token: string;
    ticket_url: string;
    user_name: string;
    user_email: string;
    user_phone: string;
    jersey_size: string;
    category: string;
    total_amount: number;
    status: string;
  };
  emailSent?: boolean;
  message?: string;
}

export async function processOrderSettlement(orderId: string): Promise<ProcessSettlementResult> {
  // 1. Update status order menjadi settlement
  await pool.query(
    `UPDATE orders 
     SET status = 'settlement', paid_at = COALESCE(paid_at, NOW()) 
     WHERE id = $1`,
    [orderId]
  );

  // 2. Ambil detail pesanan & user
  const queryResult = await pool.query(
    `SELECT 
      o.id AS order_id,
      o.user_id,
      o.category,
      o.total_amount,
      o.status,
      u.name AS customer_name,
      u.email AS customer_email,
      u.phone AS customer_phone,
      u.jersey_size,
      e.name AS event_name
    FROM orders o
    JOIN users u ON o.user_id = u.id
    JOIN events e ON o.event_id = e.id
    WHERE o.id = $1`,
    [orderId]
  );

  if (queryResult.rows.length === 0) {
    return { success: false, orderId, message: 'Order not found in database' };
  }

  const data = queryResult.rows[0];
  const category = data.category || '5K';
  const customerName = data.customer_name;
  const customerEmail = data.customer_email;
  let customerPhone = (data.customer_phone || '').trim();
  const eventName = data.event_name;
  const totalAmount = data.total_amount;
  const jerseySize = data.jersey_size || 'M';

  // 3. Pastikan tiket di-generate dan tersimpan
  const existingTicket = await pool.query('SELECT * FROM tickets WHERE order_id = $1', [orderId]);
  let ticketRecord: any;

  if (existingTicket.rows.length > 0) {
    ticketRecord = existingTicket.rows[0];
  } else {
    // Generate Nomor BIB urut per kategori (contoh: 5K-001, 5K-002, 10K-001)
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM tickets WHERE bib_number LIKE $1`,
      [`${category}-%`]
    );
    const nextSeq = Number(countRes.rows[0].count) + 1;
    const bibNumber = `${category}-${String(nextSeq).padStart(3, '0')}`;

    // Generate Token Unik untuk QR Code
    const qrCodeToken = `CULT-${category}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    const appHost = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const ticketUrl = `${appHost}/ticket/${qrCodeToken}`;

    const insertRes = await pool.query(
      `INSERT INTO tickets (order_id, user_id, bib_number, qr_code_token, ticket_url, ticket_code, racepack_taken, is_used)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE, FALSE)
       RETURNING *`,
      [orderId, data.user_id, bibNumber, qrCodeToken, ticketUrl, bibNumber]
    );
    ticketRecord = insertRes.rows[0];
  }

  // 4. Kirim Email E-Ticket via Gmail SMTP
  let emailSent = false;
  if (customerEmail) {
    try {
      await sendTicketEmail({
        to: customerEmail,
        customerName,
        eventName,
        orderId,
        amount: Number(totalAmount),
        categoryName: `${category} Fun Run`,
        bibName: customerName,
        jerseySize,
        ticketUrl: ticketRecord.ticket_url,
        ticketCode: ticketRecord.bib_number
      });
      emailSent = true;
      console.log(`[Email] E-ticket successfully sent to ${customerEmail} for Order #${orderId}`);
    } catch (emailErr) {
      console.error(`[Email Error] Failed to send email to ${customerEmail}:`, emailErr);
    }
  }

  // 5. Kirim WhatsApp Invoice via Fonnte jika nomor telepon ada
  if (customerPhone && process.env.FONNTE_TOKEN) {
    try {
      if (customerPhone.startsWith('0')) {
        customerPhone = '62' + customerPhone.slice(1);
      }
      customerPhone = customerPhone.replace(/[^0-9]/g, '');

      const formattedTotal = new Intl.NumberFormat('id-ID').format(Number(totalAmount));
      const paymentDate = new Date().toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        dateStyle: 'medium',
        timeStyle: 'short'
      });

      const waInvoiceMessage = 
`🧾 *INVOICE PEMBAYARAN RESMI - CULTURACE 2026*
------------------------------------------------
Yth. *${customerName}*,
Terima kasih, pembayaran tiket Anda telah kami terima dan terverifikasi secara sah.

📌 *DETAIL TRANSAKSI:*
• *No. Invoice / Order ID:* ${orderId}
• *Tanggal:* ${paymentDate} WIB
• *Kategori:* ${category} Fun Run
• *Nomor BIB Peserta:* *${ticketRecord.bib_number}*
• *Ukuran Jersey:* Size ${jerseySize}
• *Total Pembayaran:* *Rp ${formattedTotal}*
• *Status:* *LUNAS (PAID / SETTLED)*

------------------------------------------------
🎫 *AKSES E-TICKET & BARCODE CHECK-IN:*
E-Ticket resmi telah kami kirimkan ke email Anda (*${customerEmail}*).
Anda juga dapat melihat barcode/QR kartu peserta secara langsung pada tautan berikut:
${ticketRecord.ticket_url}

Simpan pesan ini sebagai bukti transaksi resmi saat pengambilan Race Pack di Masjid Moekhlas Sidik Pandaan.

Salam hangat,
*Panitia Pelaksana Culturace 2026*`;

      await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          'Authorization': process.env.FONNTE_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target: customerPhone,
          message: waInvoiceMessage,
          delay: '1',
          countryCode: '62'
        })
      });
      console.log(`[WhatsApp] Invoice sent to ${customerPhone}`);
    } catch (waError) {
      console.error('[WhatsApp Error] Failed to send invoice:', waError);
    }
  }

  return {
    success: true,
    orderId,
    emailSent,
    ticket: {
      id: ticketRecord.id,
      bib_number: ticketRecord.bib_number,
      qr_code_token: ticketRecord.qr_code_token,
      ticket_url: ticketRecord.ticket_url,
      user_name: customerName,
      user_email: customerEmail,
      user_phone: customerPhone,
      jersey_size: jerseySize,
      category,
      total_amount: Number(totalAmount),
      status: 'settlement'
    }
  };
}
