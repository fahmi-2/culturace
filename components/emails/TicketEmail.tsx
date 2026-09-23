import * as React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Text,
  Section,
  Heading,
  Hr,
  Button
} from '@react-email/components';

interface TicketEmailProps {
  customerName: string;
  eventName: string;
  orderId: string;
  amount?: number;
  categoryName?: string;
  bibName?: string;
  jerseySize?: string;
  ticketUrl?: string;
  ticketCode?: string;
}

export const TicketEmail = (props: TicketEmailProps): React.ReactElement => {
  const {
    customerName,
    eventName,
    orderId,
    amount,
    categoryName,
    bibName,
    jerseySize,
    ticketUrl,
    ticketCode
  } = props;

  const formattedAmount = amount ? new Intl.NumberFormat('id-ID').format(amount) : undefined;

  return (
    <Html>
      <Head />
      <Preview>E-Ticket & Nota Resmi: {eventName} (Order #{orderId})</Preview>
      <Body style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', backgroundColor: '#f5f0eb', padding: '30px 10px' }}>
        <Container style={{ backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden', maxWidth: '580px', margin: '0 auto', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #e7ded6' }}>
          
          {/* Header */}
          <Section style={{ backgroundColor: '#8a0e1e', padding: '32px 30px', textAlign: 'center' }}>
            <Heading style={{ color: '#ffffff', margin: '0', fontSize: '26px', letterSpacing: '2px', fontWeight: '900' }}>
              CULTURACE 2026
            </Heading>
            <Text style={{ color: '#f8d7da', margin: '6px 0 0 0', fontSize: '13px', letterSpacing: '1px' }}>
              MASJID MOEKHLAS SIDIK RACE EDITION · PANDAAN
            </Text>
          </Section>

          {/* Body */}
          <Section style={{ padding: '32px 30px' }}>
            <Heading style={{ fontSize: '20px', color: '#1a1817', margin: '0 0 12px 0' }}>
              Pembayaran Berhasil!
            </Heading>
            <Text style={{ fontSize: '15px', color: '#555', lineHeight: '1.6', margin: '0 0 24px 0' }}>
              Halo <strong>{customerName}</strong>, pendaftaranmu telah terkonfirmasi. Berikut adalah bukti nota pembayaran dan akses e-ticket digital lomba lari Culturace 2026.
            </Text>

            {/* Ticket Card Preview */}
            <Section style={{ backgroundColor: '#fff9f4', border: '1px dashed #d48b94', borderRadius: '12px', padding: '20px', margin: '0 0 24px 0' }}>
              <table style={{ width: '100%' }}>
                <tbody>
                  <tr>
                    <td style={{ paddingBottom: '10px' }}>
                      <Text style={{ fontSize: '11px', color: '#8a7772', margin: '0', textTransform: 'uppercase' }}>KODE TIKET</Text>
                      <Text style={{ fontSize: '16px', fontWeight: 'bold', color: '#8a0e1e', margin: '2px 0 0 0', fontFamily: 'monospace' }}>{ticketCode || `TIX-${orderId}`}</Text>
                    </td>
                    <td style={{ paddingBottom: '10px', textAlign: 'right' }}>
                      <Text style={{ fontSize: '11px', color: '#8a7772', margin: '0', textTransform: 'uppercase' }}>ORDER ID</Text>
                      <Text style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', margin: '2px 0 0 0' }}>{orderId}</Text>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingTop: '10px', borderTop: '1px solid #eee' }}>
                      <Text style={{ fontSize: '11px', color: '#8a7772', margin: '0', textTransform: 'uppercase' }}>BIB NAME / RUNNER</Text>
                      <Text style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', margin: '2px 0 0 0' }}>{bibName || customerName}</Text>
                    </td>
                    <td style={{ paddingTop: '10px', borderTop: '1px solid #eee', textAlign: 'right' }}>
                      <Text style={{ fontSize: '11px', color: '#8a7772', margin: '0', textTransform: 'uppercase' }}>KATEGORI</Text>
                      <Text style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', margin: '2px 0 0 0' }}>{categoryName || '5K Fun Run'}</Text>
                    </td>
                  </tr>
                  {jerseySize && (
                    <tr>
                      <td colSpan={2} style={{ paddingTop: '10px', borderTop: '1px solid #eee' }}>
                        <Text style={{ fontSize: '11px', color: '#8a7772', margin: '0', textTransform: 'uppercase' }}>UKURAN JERSEY</Text>
                        <Text style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', margin: '2px 0 0 0' }}>Size {jerseySize}</Text>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Section>

            {/* Rincian Nota */}
            {formattedAmount && (
              <Section style={{ backgroundColor: '#fcfcfc', border: '1px solid #f0f0f0', borderRadius: '8px', padding: '16px', margin: '0 0 24px 0' }}>
                <table style={{ width: '100%', fontSize: '14px' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: '#666' }}>Total Pembayaran Lunas</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#1a1817' }}>Rp {formattedAmount}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#666' }}>Status</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#2e7d32' }}>LUNAS / SETTLED</td>
                    </tr>
                  </tbody>
                </table>
              </Section>
            )}

            {/* Tombol E-Ticket */}
            {ticketUrl && (
              <Section style={{ textAlign: 'center', margin: '28px 0 16px 0' }}>
                <Button
                  href={ticketUrl}
                  style={{
                    backgroundColor: '#8a0e1e',
                    color: '#ffffff',
                    padding: '14px 28px',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    display: 'inline-block'
                  }}
                >
                  Buka E-Ticket & Barcode Race
                </Button>
              </Section>
            )}

            <Hr style={{ borderColor: '#f0e6dd', margin: '30px 0 20px 0' }} />

            <Text style={{ fontSize: '13px', color: '#8a7772', lineHeight: '1.5', margin: '0' }}>
              <strong>Petunjuk Race Pack Collection:</strong><br />
              Simpan bukti email ini atau buka tautan E-Ticket Anda saat pengambilan race pack di lokasi acara Masjid Moekhlas Sidik Pandaan, Pasuruan.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={{ backgroundColor: '#1f1b19', padding: '20px 30px', textAlign: 'center' }}>
            <Text style={{ color: '#baa79d', fontSize: '12px', margin: '0' }}>
              RUN WITH CULTURE · RUN WITH PURPOSE<br />
              © 2026 CULTURACE PASURUAN
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default TicketEmail;
