-- 1. TABEL USERS (Peserta / Pelanggan)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    gender VARCHAR(20),
    jersey_size VARCHAR(10),
    emergency_contact VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABEL EVENTS (Acara Lari / Culturace)
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    event_date TIMESTAMP NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABEL ORDERS (Pesanan & Transaksi Midtrans)
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL DEFAULT '5K',
    total_amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    expires_at TIMESTAMP NOT NULL,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABEL TICKETS (Kartu Peserta / E-Ticket)
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bib_number VARCHAR(20) UNIQUE NOT NULL,
    qr_code_token VARCHAR(255) UNIQUE NOT NULL,
    ticket_url TEXT,
    racepack_taken BOOLEAN DEFAULT FALSE,
    racepack_taken_at TIMESTAMP,
    racepack_handled_by VARCHAR(100),
    is_used BOOLEAN DEFAULT FALSE,
    check_in_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABEL RACE WAVES (Sesi Start Kategori Lari)
CREATE TABLE IF NOT EXISTS race_waves (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    gun_start_time TIMESTAMP,
    is_started BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABEL RACE TIMINGS (Pencatatan Waktu & Leaderboard)
CREATE TABLE IF NOT EXISTS race_timings (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER UNIQUE NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    bib_number VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    finish_time TIMESTAMP NOT NULL,
    duration_ms BIGINT NOT NULL,
    formatted_duration VARCHAR(30) NOT NULL,
    recorded_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. INDEX PERFORMANCE (Optimasi Scanning QR & Live Leaderboard)
CREATE INDEX IF NOT EXISTS idx_tickets_bib ON tickets(bib_number);
CREATE INDEX IF NOT EXISTS idx_tickets_qr ON tickets(qr_code_token);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_expires ON orders(expires_at);
CREATE INDEX IF NOT EXISTS idx_timings_duration_category ON race_timings(category, duration_ms ASC);