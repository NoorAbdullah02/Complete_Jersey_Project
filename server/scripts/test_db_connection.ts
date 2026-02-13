import dotenv from 'dotenv';
import path from 'path';
import { Client } from 'pg';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const url = process.env.DATABASE_URL;
  console.log('DATABASE_URL present:', !!url);
  if (!url) process.exit(1);

  const client = new Client({ connectionString: url, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });
  try {
    await client.connect();
    const res = await client.query('SELECT NOW() as now');
    console.log('Connected. DB time:', res.rows[0].now);
    await client.end();
  } catch (err) {
    console.error('Connection error:', err);
    process.exit(1);
  }
}

main();
