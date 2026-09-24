import nodemailer from 'nodemailer';

// Konfigurasi transporter menggunakan SMTP Gmail
export const mailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: (process.env.GMAIL_USER || '').trim(),
    pass: (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, ''), // Hapus spasi jika ada
  },
});

export interface SendTicketEmailParams {
  to: string;
  customerName: string;
  eventName: string;
  orderId: string;
  amount: number;
  categoryName: string;
  bibName: string;
  jerseySize: string;
  ticketUrl: string;
  ticketCode: string;
}

export async function sendTicketEmail(params: SendTicketEmailParams) {
  const {
    to,
    customerName,
    eventName,
    orderId,
    amount,
    categoryName,
    bibName,
    jerseySize,
    ticketUrl,
    ticketCode,
  } = params;

  const formattedAmount = new Intl.NumberFormat('id-ID').format(amount);

  const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>E-Ticket Resmi Culturace 2026</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f0eb; padding: 24px 10px; margin: 0;">
  <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; max-width: 580px; margin: 0 auto; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e7ded6;">
    
    <!-- Header -->
    <div style="background-color: #8a0e1e; padding: 28px 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px; font-weight: 900;">
        CULTURACE 2026
      </h1>
      <p style="color: #f8d7da; margin: 6px 0 0 0; font-size: 13px; letter-spacing: 1px;">
        MASJID MOEKHLAS SIDIK RACE EDITION · PANDAAN
      </p>
    </div>

    <!-- Body -->
    <div style="padding: 28px 24px;">
      <h2 style="font-size: 19px; color: #1a1817; margin: 0 0 10px 0;">
        Pembayaran Berhasil!
      </h2>
      <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 0 0 20px 0;">
        Halo <strong>${customerName}</strong>, pendaftaranmu telah terkonfirmasi. Berikut adalah bukti nota pembayaran dan akses e-ticket digital lomba lari Culturace 2026.
      </p>

      <!-- Ticket Card Preview -->
      <div style="background-color: #fff9f4; border: 1px dashed #d48b94; border-radius: 12px; padding: 18px; margin: 0 0 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>
            <tr>
              <td style="padding-bottom: 10px;">
                <div style="font-size: 11px; color: #8a7772; text-transform: uppercase;">KODE TIKET / BIB</div>
                <div style="font-size: 17px; font-weight: bold; color: #8a0e1e; margin-top: 2px; font-family: monospace;">${ticketCode || `TIX-${orderId}`}</div>
              </td>
              <td style="padding-bottom: 10px; text-align: right;">
                <div style="font-size: 11px; color: #8a7772; text-transform: uppercase;">ORDER ID</div>
                <div style="font-size: 14px; font-weight: bold; color: #333; margin-top: 2px;">${orderId}</div>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 10px; border-top: 1px solid #eee;">
                <div style="font-size: 11px; color: #8a7772; text-transform: uppercase;">NAMA PESERTA</div>
                <div style="font-size: 14px; font-weight: bold; color: #333; margin-top: 2px;">${bibName || customerName}</div>
              </td>
              <td style="padding-top: 10px; border-top: 1px solid #eee; text-align: right;">
                <div style="font-size: 11px; color: #8a7772; text-transform: uppercase;">KATEGORI</div>
                <div style="font-size: 14px; font-weight: bold; color: #333; margin-top: 2px;">${categoryName || '5K Fun Run'}</div>
              </td>
            </tr>
            ${jerseySize ? `
            <tr>
              <td colspan="2" style="padding-top: 10px; border-top: 1px solid #eee;">
                <div style="font-size: 11px; color: #8a7772; text-transform: uppercase;">UKURAN JERSEY</div>
                <div style="font-size: 14px; font-weight: bold; color: #333; margin-top: 2px;">Size ${jerseySize}</div>
              </td>
            </tr>
            ` : ''}
          </tbody>
        </table>
      </div>

      <!-- Rincian Nota -->
      <div style="background-color: #fcfcfc; border: 1px solid #f0f0f0; border-radius: 8px; padding: 14px; margin: 0 0 24px 0;">
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tbody>
            <tr>
              <td style="color: #666; padding: 4px 0;">Total Pembayaran</td>
              <td style="text-align: right; font-weight: bold; color: #1a1817; padding: 4px 0;">Rp ${formattedAmount}</td>
            </tr>
            <tr>
              <td style="color: #666; padding: 4px 0;">Status Transaksi</td>
              <td style="text-align: right; font-weight: bold; color: #2e7d32; padding: 4px 0;">LUNAS / SETTLED</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tombol E-Ticket & Cetak PDF -->
      <div style="text-align: center; margin: 26px 0 16px 0;">
        <a href="${ticketUrl}?print=true" target="_blank" style="background-color: #8a0e1e; color: #ffffff; padding: 13px 26px; border-radius: 8px; font-size: 14px; font-weight: bold; text-decoration: none; display: inline-block; box-shadow: 0 4px 12px rgba(138,14,30,0.25);">
          📄 Cetak / Unduh PDF E-Ticket
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #f0e6dd; margin: 24px 0 16px 0;" />

      <p style="font-size: 12px; color: #8a7772; line-height: 1.5; margin: 0;">
        <strong>Petunjuk Race Pack Collection:</strong><br />
        Simpan bukti email ini atau buka link E-Ticket Anda saat pengambilan race pack di lokasi Masjid Moekhlas Sidik Pandaan, Pasuruan.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #1f1b19; padding: 16px 20px; text-align: center;">
      <p style="color: #baa79d; font-size: 11px; margin: 0;">
        RUN WITH CULTURE · RUN WITH PURPOSE<br />
        © 2026 CULTURACE PASURUAN
      </p>
    </div>

  </div>
</body>
</html>
  `;

  return await mailTransporter.sendMail({
    from: `"Culturace Official" <${process.env.GMAIL_USER}>`,
    to,
    subject: `E-Ticket & Nota Resmi: ${eventName} (BIB #${ticketCode})`,
    html: htmlContent,
  });
}
