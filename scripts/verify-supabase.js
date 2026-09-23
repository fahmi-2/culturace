const fs = require('fs');
const { Pool } = require('pg');

const env = fs.readFileSync('.env', 'utf8');
const match = env.match(/DATABASE_URL=["']?([^"'\r\n]+)/);
const dbUrl = match[1];

console.log('Connecting to:', dbUrl.replace(/:[^:@]+@/, ':****@'));

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const events = await pool.query('SELECT * FROM events');
  console.log('Events in Supabase:', events.rows.length);
  if (events.rows.length === 0) {
    await pool.query(
      'INSERT INTO events (id, name, event_date, description) VALUES (1, $1, $2, $3) ON CONFLICT (id) DO NOTHING',
      ['CULTURACE 2026 - Pasuruan Red Edition', '2026-11-29 05:30:00', 'Heritage Run Masjid Moekhlas Sidik Pandaan']
    );
    console.log('Default event ID 1 created in Supabase!');
  }

  const users = await pool.query('SELECT COUNT(*) FROM users');
  console.log('Users in Supabase:', users.rows[0].count);

  const orders = await pool.query('SELECT COUNT(*) FROM orders');
  console.log('Orders in Supabase:', orders.rows[0].count);

  const tickets = await pool.query('SELECT COUNT(*) FROM tickets');
  console.log('Tickets in Supabase:', tickets.rows[0].count);

  console.log('ALL TABLES ARE READY IN SUPABASE!');
  await pool.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
