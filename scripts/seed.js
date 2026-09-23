const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:12345678@localhost:5432/culturace'
});

async function main() {
  await pool.query(`
    INSERT INTO events (id, name, event_date, description)
    VALUES (1, 'CULTURACE 2026 - Pasuruan Red Edition', '2026-11-29 05:30:00', 'Heritage Run Masjid Moekhlas Sidik Pandaan')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
  `);
  console.log('Event 1 ensured successfully!');
  const res = await pool.query('SELECT * FROM events');
  console.log('Events in DB:', res.rows);
  await pool.end();
}

main().catch(err => {
  console.error(err);
  pool.end();
});
