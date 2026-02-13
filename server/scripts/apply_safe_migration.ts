import dotenv from 'dotenv';
import path from 'path';
import { Client } from 'pg';
import fs from 'fs';

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL not found in .env');
    process.exit(1);
  }

  const sqlPath = path.resolve(__dirname, '../drizzle/0001_safe_add_constraints.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('Migration file not found:', sqlPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  try {
    console.log('Applying safe migration...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Safe migration applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    try { await client.query('ROLLBACK'); } catch {};
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
