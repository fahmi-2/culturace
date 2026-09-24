const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:12345678@localhost:5432/culturace'
});

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, '../schema.sql'), 'utf8');
  console.log('Running migration...');
  await pool.query(sql);
  console.log('Migration completed successfully!');

  // Pastikan ada event default jika belum ada
  await pool.query(`
    INSERT INTO events (id, name, event_date, description)
    VALUES (1, 'CULTURACE 2026 - Pasuruan Red Edition', '2026-11-29 05:30:00', 'Heritage Run Masjid Merah Moekhlas Sidik Pandaan')
    ON CONFLICT (id) DO NOTHING;
  `);

  // Pastikan wave default untuk 5K jika belum ada
  await pool.query(`
    INSERT INTO race_waves (id, event_id, category, is_started)
    VALUES (1, 1, '5K', FALSE)
    ON CONFLICT (id) DO NOTHING;
  `);

  console.log('Default event & wave verified!');
  await pool.end();
}

migrate().catch(err => {
  console.error('Migration error:', err);
  pool.end();
});
