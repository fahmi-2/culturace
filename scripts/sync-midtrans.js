const crypto = require('crypto');
const { Pool } = require('pg');
const midtransClient = require('midtrans-client');

const pool = new Pool({
  connectionString: 'postgresql://postgres:12345678@localhost:5432/culturace'
});

const apiClient = new midtransClient.CoreApi({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
});

async function main() {
  console.log('Checking orders in database...');
  const res = await pool.query("SELECT id, user_id, category, total_amount, status FROM orders WHERE status = 'pending'");
  console.log(`Found ${res.rows.length} pending orders.`);

  for (const ord of res.rows) {
    try {
      console.log(`Checking Midtrans status for ${ord.id}...`);
      const st = await apiClient.transaction.status(ord.id);
      console.log(`Order ${ord.id} status in Midtrans:`, st.transaction_status);

      if (st.transaction_status === 'settlement' || st.transaction_status === 'capture') {
        // Update order to settlement
        await pool.query(
          "UPDATE orders SET status = 'settlement', paid_at = COALESCE(paid_at, NOW()) WHERE id = $1",
          [ord.id]
        );

        // Generate Ticket & BIB jika belum ada
        const exTix = await pool.query("SELECT * FROM tickets WHERE order_id = $1", [ord.id]);
        if (exTix.rows.length === 0) {
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
            "INSERT INTO tickets (order_id, user_id, bib_number, qr_code_token, ticket_url, racepack_taken, is_used) VALUES ($1, $2, $3, $4, $5, FALSE, FALSE)",
            [ord.id, ord.user_id, bibNumber, qrCodeToken, ticketUrl]
          );
          console.log(`Ticket & BIB generated: ${bibNumber} for order ${ord.id}`);
        }
      }
    } catch (err) {
      console.error(`Error checking ${ord.id}:`, err.message);
    }
  }

  console.log('Done syncing!');
  await pool.end();
}

main().catch(err => {
  console.error(err);
  pool.end();
});
