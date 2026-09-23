import pg from 'pg';
const { Pool } = pg;

const isSupabaseOrRemote = process.env.DATABASE_URL?.includes('supabase.co') || process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isSupabaseOrRemote ? { rejectUnauthorized: false } : undefined,
});

export { pool };
export default pool;

