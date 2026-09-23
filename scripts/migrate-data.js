const { Pool } = require('pg');

const localPool = new Pool({
  connectionString: 'postgresql://postgres:12345678@localhost:5432/culturace'
});

const supabasePool = new Pool({
  connectionString: 'postgresql://postgres:%40culturace321@db.ifxhfbxrmfljnydytrll.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function migrateData() {
  console.log('--- MIGRATING DATA FROM LOCAL POSTGRES TO SUPABASE ---');

  // 1. Events
  const events = await localPool.query('SELECT * FROM events');
  for (const e of events.rows) {
    await supabasePool.query(
      `INSERT INTO events (id, name, event_date, description, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, event_date = EXCLUDED.event_date`,
      [e.id, e.name, e.event_date, e.description, e.created_at]
    );
  }
  console.log(`Migrated ${events.rows.length} events`);

  // 2. Users
  const users = await localPool.query('SELECT * FROM users');
  for (const u of users.rows) {
    await supabasePool.query(
      `INSERT INTO users (id, name, email, phone, gender, jersey_size, emergency_contact, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone`,
      [u.id, u.name, u.email, u.phone, u.gender, u.jersey_size, u.emergency_contact, u.created_at]
    );
  }
  // Sync users sequence
  await supabasePool.query(`SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users))`);
  console.log(`Migrated ${users.rows.length} users`);

  // 3. Orders
  const orders = await localPool.query('SELECT * FROM orders');
  for (const o of orders.rows) {
    await supabasePool.query(
      `INSERT INTO orders (id, user_id, event_id, category, total_amount, status, expires_at, paid_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, paid_at = EXCLUDED.paid_at`,
      [o.id, o.user_id, o.event_id, o.category, o.total_amount, o.status, o.expires_at, o.paid_at, o.created_at]
    );
  }
  console.log(`Migrated ${orders.rows.length} orders`);

  // 4. Tickets
  const tickets = await localPool.query('SELECT * FROM tickets');
  for (const t of tickets.rows) {
    await supabasePool.query(
      `INSERT INTO tickets (id, order_id, user_id, bib_number, qr_code_token, ticket_url, ticket_code, racepack_taken, racepack_taken_at, racepack_handled_by, is_used, check_in_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (id) DO NOTHING`,
      [t.id, t.order_id, t.user_id, t.bib_number, t.qr_code_token, t.ticket_url, t.ticket_code || t.bib_number, t.racepack_taken, t.racepack_taken_at, t.racepack_handled_by, t.is_used, t.check_in_at, t.created_at]
    );
  }
  await supabasePool.query(`SELECT setval('tickets_id_seq', (SELECT COALESCE(MAX(id), 1) FROM tickets))`);
  console.log(`Migrated ${tickets.rows.length} tickets`);

  // 5. Race Waves
  const waves = await localPool.query('SELECT * FROM race_waves');
  for (const w of waves.rows) {
    await supabasePool.query(
      `INSERT INTO race_waves (id, event_id, category, gun_start_time, is_started, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [w.id, w.event_id, w.category, w.gun_start_time, w.is_started, w.created_at]
    );
  }
  if (waves.rows.length > 0) {
    await supabasePool.query(`SELECT setval('race_waves_id_seq', (SELECT COALESCE(MAX(id), 1) FROM race_waves))`);
  }
  console.log(`Migrated ${waves.rows.length} race waves`);

  // 6. Race Timings
  const timings = await localPool.query('SELECT * FROM race_timings');
  for (const tm of timings.rows) {
    await supabasePool.query(
      `INSERT INTO race_timings (id, ticket_id, bib_number, category, finish_time, duration_ms, formatted_duration, recorded_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [tm.id, tm.ticket_id, tm.bib_number, tm.category, tm.finish_time, tm.duration_ms, tm.formatted_duration, tm.recorded_by, tm.created_at]
    );
  }
  if (timings.rows.length > 0) {
    await supabasePool.query(`SELECT setval('race_timings_id_seq', (SELECT COALESCE(MAX(id), 1) FROM race_timings))`);
  }
  console.log(`Migrated ${timings.rows.length} race timings`);

  console.log('--- ALL DATA SUCCESSFULLY MIGRATED TO SUPABASE ---');
  await localPool.end();
  await supabasePool.end();
}

migrateData().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
