import { NextResponse } from 'next/server';
import midtransClient from 'midtrans-client';
import pool from '@/lib/db';

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      gender,
      emergencyContact,
      categoryTitle = '5K Fun Run',
      category = '5K',
      categoryPrice,
      donation = 0,
      adminFee = 5000,
      totalAmount,
      jerseySize = 'M',
      bibName
    } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Nama dan Email wajib diisi' }, { status: 400 });
    }

    // 1. Pastikan Event ID 1 ada
    let eventId = 1;
    const eventRes = await pool.query('SELECT id FROM events WHERE id = 1');
    if (eventRes.rows.length === 0) {
      const newEvent = await pool.query(
        `INSERT INTO events (id, name, event_date, description)
         VALUES (1, 'CULTURACE 2026 - Pasuruan Red Edition', '2026-11-29 05:30:00', 'Heritage Run Masjid Merah Moekhlas Sidik Pandaan')
         ON CONFLICT (id) DO NOTHING
         RETURNING id`
      );
      if (newEvent.rows.length > 0) {
        eventId = newEvent.rows[0].id;
      }
    }

    // 2. Simpan atau perbarui data User di database
    const userRes = await pool.query(
      `INSERT INTO users (name, email, phone, gender, jersey_size, emergency_contact)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO UPDATE 
       SET name = EXCLUDED.name, 
           phone = EXCLUDED.phone, 
           jersey_size = COALESCE(EXCLUDED.jersey_size, users.jersey_size),
           gender = COALESCE(EXCLUDED.gender, users.gender),
           emergency_contact = COALESCE(EXCLUDED.emergency_contact, users.emergency_contact)
       RETURNING id, name, email, phone`,
      [name, email, phone || '', gender || null, jerseySize, emergencyContact || '']
    );
    const user = userRes.rows[0];

    // 3. Generate Order ID unik
    const orderId = `CULTURACE-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const finalAmount = Number(totalAmount) || (Number(categoryPrice) + Number(donation) + Number(adminFee));

    // 4. Lifetime pesanan: 30 menit (NOW() + INTERVAL '30 MINUTE')
    const orderInsertRes = await pool.query(
      `INSERT INTO orders (id, user_id, event_id, category, total_amount, status, expires_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', NOW() + INTERVAL '30 MINUTE')
       RETURNING expires_at`,
      [orderId, user.id, eventId, category, finalAmount]
    );
    const expiresAt = orderInsertRes.rows[0].expires_at;

    // 5. Parameter Midtrans Snap
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: finalAmount,
      },
      customer_details: {
        first_name: user.name,
        email: user.email,
        phone: user.phone || '08123456789',
      },
      item_details: [
        {
          id: `CAT-${category}`,
          price: Number(categoryPrice) || 150000,
          quantity: 1,
          name: `${categoryTitle} (BIB: ${bibName || 'RUNNER'}, Size: ${jerseySize})`.slice(0, 50),
        },
        ...(donation > 0
          ? [
            {
              id: 'DONASI',
              price: Number(donation),
              quantity: 1,
              name: 'Donasi Pelestarian Budaya',
            },
          ]
          : []),
        {
          id: 'FEE-ADMIN',
          price: Number(adminFee),
          quantity: 1,
          name: 'Biaya Layanan Admin',
        },
      ],
      enabled_payments: [
        'gopay',
        'shopeepay',
        'qris',
        'bca_va',
        'bni_va',
        'bri_va',
        'mandiri_bill',
        'permata_va',
        'other_va'
      ],
    };

    // 6. Buat transaksi Snap
    const transaction = await snap.createTransaction(parameter);

    return NextResponse.json({
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
      orderId,
      expiresAt,
      userId: user.id
    }, { status: 200 });

  } catch (error: any) {
    console.error('Checkout API error:', error);
    return NextResponse.json({
      error: error?.message || 'Gagal memproses pendaftaran transaksi'
    }, { status: 500 });
  }
}
