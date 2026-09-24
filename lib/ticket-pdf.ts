import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export interface GenerateTicketPdfParams {
  customerName: string;
  orderId: string;
  bibNumber: string;
  categoryName: string;
  jerseySize: string;
  qrCodeToken: string;
  amount: number;
}

/**
 * Membuat buffer dokumen PDF E-Ticket resmi Culturace 2026 ukuran 1 halaman A4.
 */
export async function generateTicketPdf(params: GenerateTicketPdfParams): Promise<Buffer> {
  const {
    customerName,
    orderId,
    bibNumber,
    categoryName,
    jerseySize,
    qrCodeToken,
    amount,
  } = params;

  // 1. Generate QR Code image buffer (PNG)
  const qrImageBuffer = await QRCode.toBuffer(qrCodeToken, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 220,
    color: {
      dark: '#1f1b19',
      light: '#ffffff',
    },
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 36,
      autoFirstPage: true,
      info: {
        Title: `E-Ticket Culturace 2026 - BIB ${bibNumber}`,
        Author: 'Culturace Indonesia',
        Subject: 'Official Digital Race Pass',
      },
    });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
    doc.on('error', (err) => {
      reject(err);
    });

    // Dimensi & Posisi Kartu (A4 = 595.28 x 841.89 pt)
    const cardX = 48;
    const cardY = 45;
    const cardWidth = 500;
    const cardHeight = 750;

    // Background Kertas Luar Lembut
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f7f3ee');

    // Shadow & Card Utama
    doc.save();
    doc.roundedRect(cardX + 3, cardY + 5, cardWidth, cardHeight, 18).fill('rgba(0,0,0,0.06)');
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 16).fill('#ffffff');
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 16).lineWidth(1.2).stroke('#e2d5c8');
    doc.restore();

    // 1. HEADER KARTU
    const headerHeight = 90;
    doc.save();
    // Potong header agar mengikuti rounded corner kartu
    doc.roundedRect(cardX, cardY, cardWidth, headerHeight + 16, 16).clip();
    doc.rect(cardX, cardY, cardWidth, headerHeight).fill('#8a0e1e');

    // Badge OFFICIAL RACE PASS
    doc.roundedRect(cardX + 24, cardY + 16, 115, 18, 4).fill('#f3ba61');
    doc.fillColor('#3a0a18').fontSize(8.5).font('Helvetica-Bold').text('OFFICIAL RACE PASS', cardX + 31, cardY + 21);

    // Judul Acara
    doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('CULTURACE 2026', cardX + 24, cardY + 40);
    doc.fillColor('#f8d7da').fontSize(9.5).font('Helvetica').text('Masjid Merah Moekhlas Sidik Race Edition · Pandaan', cardX + 24, cardY + 67);

    // Kategori di kanan atas
    doc.fillColor('#f3ba61').fontSize(8.5).font('Helvetica-Bold').text('KATEGORI', cardX + cardWidth - 110, cardY + 22, { width: 85, align: 'right' });
    doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text(categoryName.replace(/Fun Run/i, '').trim(), cardX + cardWidth - 110, cardY + 36, { width: 85, align: 'right' });
    doc.restore();

    // 2. HERO BIB & PESERTA
    const heroY = cardY + headerHeight + 18;
    doc.fillColor('#8a7772').fontSize(9).font('Helvetica-Bold').text('NOMOR BIB RESMI', cardX, heroY, { width: cardWidth, align: 'center' });

    // Angka BIB Besar
    doc.fillColor('#a91024').fontSize(54).font('Helvetica-Bold').text(bibNumber, cardX, heroY + 14, { width: cardWidth, align: 'center' });

    // Nama Peserta
    doc.fillColor('#1f2024').fontSize(18).font('Helvetica-Bold').text(customerName.toUpperCase(), cardX, heroY + 76, { width: cardWidth, align: 'center' });
    doc.fillColor('#8a7772').fontSize(9.5).font('Helvetica').text(`ORDER ID: #${orderId}`, cardX, heroY + 100, { width: cardWidth, align: 'center' });

    // Garis putus-putus pembatas
    doc.save();
    doc.moveTo(cardX + 24, heroY + 120).lineTo(cardX + cardWidth - 24, heroY + 120).dash(4, { space: 4 }).lineWidth(1).stroke('#eeded2');
    doc.restore();

    // 3. BADGE STATUS (Lunas & Racepack)
    const statusY = heroY + 134;
    const badgeWidth = (cardWidth - 48 - 14) / 2;
    const badgeHeight = 44;

    // Status Pembayaran
    doc.roundedRect(cardX + 24, statusY, badgeWidth, badgeHeight, 8).fill('#fcfaf7');
    doc.roundedRect(cardX + 24, statusY, badgeWidth, badgeHeight, 8).lineWidth(1).stroke('#eee2d6');
    doc.fillColor('#8a7772').fontSize(7.5).font('Helvetica-Bold').text('STATUS PEMBAYARAN', cardX + 34, statusY + 9);
    doc.fillColor('#137333').fontSize(11).font('Helvetica-Bold').text('✓ LUNAS (SETTLED)', cardX + 34, statusY + 22);

    // Status Race Pack
    const badge2X = cardX + 24 + badgeWidth + 14;
    doc.roundedRect(badge2X, statusY, badgeWidth, badgeHeight, 8).fill('#fffcf4');
    doc.roundedRect(badge2X, statusY, badgeWidth, badgeHeight, 8).lineWidth(1).stroke('#fce0b6');
    doc.fillColor('#8a7772').fontSize(7.5).font('Helvetica-Bold').text('STATUS RACE PACK', badge2X + 10, statusY + 9);
    doc.fillColor('#b06000').fontSize(11).font('Helvetica-Bold').text('⏱ BELUM DIAMBIL', badge2X + 10, statusY + 22);

    // 4. KOTAK QR CODE
    const qrContainerY = statusY + badgeHeight + 14;
    const qrBoxHeight = 190;
    doc.roundedRect(cardX + 24, qrContainerY, cardWidth - 48, qrBoxHeight, 10).fill('#faf6f2');
    doc.roundedRect(cardX + 24, qrContainerY, cardWidth - 48, qrBoxHeight, 10).lineWidth(1.5).stroke('#eadfd6');

    doc.fillColor('#8a7772').fontSize(8.5).font('Helvetica-Bold').text('SCAN KODE QR DI LOKASI RACE PACK & GATE', cardX + 24, qrContainerY + 10, { width: cardWidth - 48, align: 'center' });

    // Tempel Gambar QR Code
    const qrSize = 120;
    const qrX = cardX + (cardWidth - qrSize) / 2;
    const qrY = qrContainerY + 26;
    doc.roundedRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 6).fill('#ffffff');
    doc.roundedRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 6).lineWidth(1).stroke('#e0d2c6');
    doc.image(qrImageBuffer, qrX, qrY, { width: qrSize, height: qrSize });

    // Token Text
    doc.roundedRect(qrX - 25, qrY + qrSize + 10, qrSize + 50, 16, 4).fill('#ffffff');
    doc.roundedRect(qrX - 25, qrY + qrSize + 10, qrSize + 50, 16, 4).lineWidth(1).stroke('#e0d2c6');
    doc.fillColor('#6a5c57').fontSize(8.5).font('Courier-Bold').text(qrCodeToken, qrX - 25, qrY + qrSize + 14, { width: qrSize + 50, align: 'center' });

    // 5. DETAIL SPESIFIKASI PESERTA
    const metaY = qrContainerY + qrBoxHeight + 16;

    const drawMetaRow = (label: string, value: string, yPos: number) => {
      doc.fillColor('#7d716e').fontSize(10).font('Helvetica').text(label, cardX + 28, yPos);
      doc.fillColor('#1f2024').fontSize(10).font('Helvetica-Bold').text(value, cardX + 28, yPos, { width: cardWidth - 56, align: 'right' });
      doc.moveTo(cardX + 28, yPos + 18).lineTo(cardX + cardWidth - 28, yPos + 18).lineWidth(0.6).stroke('#f0e6dd');
    };

    drawMetaRow('Ukuran Jersey Peserta', `Size ${jerseySize || 'M'}`, metaY);
    drawMetaRow('Jadwal Pelaksanaan Race', 'Minggu, 29 Nov 2026 · 05:30 WIB', metaY + 24);
    drawMetaRow('Lokasi Start / Finish', 'Masjid Merah Moekhlas Sidik Pandaan, Pasuruan', metaY + 48);

    // 6. FOOTER KARTU
    const footerHeight = 44;
    const footerY = cardY + cardHeight - footerHeight;
    doc.save();
    doc.roundedRect(cardX, footerY - 16, cardWidth, footerHeight + 16, 16).clip();
    doc.rect(cardX, footerY, cardWidth, footerHeight).fill('#1f1b19');
    doc.fillColor('#baa79d').fontSize(8.5).font('Helvetica').text(
      'Tunjukkan QR Code ini pada panitia untuk mengambil race pack atau check-in gerbang start.',
      cardX + 20,
      footerY + 16,
      { width: cardWidth - 40, align: 'center' }
    );
    doc.restore();

    doc.end();
  });
}
