import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Resend } from 'resend';
import midtransClient from 'midtrans-client';
import { TicketEmail } from '@/components/emails/TicketEmail';
import pool from '@/lib/db';
import { processOrderSettlement } from '@/lib/order-settlement';

const apiClient = new midtransClient.CoreApi({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!,
});

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Verifikasi status notifikasi dari Midtrans
    let statusResponse = body;
    try {
      statusResponse = await (apiClient as any).transaction.notification(body);
    } catch (err: any) {
      console.warn('Notification verification warning:', err?.message || err);
    }

    const orderId = statusResponse.order_id || body.order_id;
    const transactionStatus = statusResponse.transaction_status || body.transaction_status;
    const fraudStatus = statusResponse.fraud_status || body.fraud_status;

    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      if (fraudStatus === 'challenge') {
        console.log(`Transaction is challenged for Order ID: ${orderId}`);
      } else if (fraudStatus === 'accept' || !fraudStatus) {
        console.log(`Payment success/settlement for Order ID: ${orderId}`);

        // Proses settlement, pembuatan tiket, dan pengiriman email e-ticket
        await processOrderSettlement(orderId);
      }
    } else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
      await pool.query(
        `UPDATE orders SET status = $1 WHERE id = $2`,
        [transactionStatus, orderId]
      );
      console.log(`Payment status updated to ${transactionStatus} for Order ID: ${orderId}`);
    }

    return NextResponse.json({ status: 'success', message: 'Notification processed' }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
