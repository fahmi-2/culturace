const crypto = require('crypto');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:12345678@localhost:5432/culturace'
});

async function main() {
  console.log('Generating missing tickets for settlement orders...');
  const res = await pool.query(`
    SELECT o.id, o.user_id, o.category
    FROM orders o
    LEFT JOIN tickets t ON t.order_id = o.id
    WHERE o.status = 'settlement' AND t.id IS NULL
  `);

  console.log(`Found ${res.rows.length} settlement orders without tickets.`);

  for (const ord of res.rows) {
    const category = ord.category || '5K';
    const countRes = await pool.query(
      "SELECT COUNT(*) FROM tickets WHERE bib_number LIKE $1",
      [`${category}-%`]
    );
    const nextSeq = Number(countRes.rows[0].count) + 1;
    const bibNumber = `${category}-${String(nextSeq).padStart(3, '0')}`;
    const qrCodeToken = `CULT-${category}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    const ticketUrl = `http://localhost:3000/ticket/${qrCodeToken}`;

    await pool.query(
      `INSERT INTO tickets (order_id, user_id, bib_number, qr_code_token, ticket_url, ticket_code, racepack_taken, is_used)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE, FALSE)`,
      [ord.id, ord.user_id, bibNumber, qrCodeToken, ticketUrl, bibNumber]
    );

    console.log(`Generated ticket for order ${ord.id}: BIB #${bibNumber}, Token: ${qrCodeToken}`);
  }

  const finalCheck = await pool.query(`
    SELECT o.id, o.status, t.bib_number, t.qr_code_token, u.name
    FROM orders o
    JOIN users u ON o.user_id = u.id
    LEFT JOIN tickets t ON t.order_id = o.id
  `);
  console.log('All orders & tickets now:');
  console.table(finalCheck.rows);

  await pool.end();
}

main().catch(err => {
  console.error(err);
  pool.end();
});
