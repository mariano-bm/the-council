import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();
  try {
    const sql = readFileSync(join(__dirname, '001_initial.sql'), 'utf8');
    await client.query(sql);
    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
