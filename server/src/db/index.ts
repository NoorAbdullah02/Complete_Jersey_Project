import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

let client: Client | null = null;

export async function getDb(): Promise<{ db: any; client: Client }> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const c = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  });

  await c.connect();
  const db = drizzle(c, { schema });
  return { db, client: c };
}

export async function initDb(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const c = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  });

  await c.connect();

  // Create tables if not exists (keep in sync with schema.ts)
  await c.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      name VARCHAR(30) NOT NULL,
      mobile_number VARCHAR(15) NOT NULL,
      email VARCHAR(40) NOT NULL,
      transaction_id VARCHAR(30),
      notes TEXT,
      final_price DECIMAL(10, 2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await c.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(30) UNIQUE NOT NULL,
      name VARCHAR(60),
      email VARCHAR(100),
      password_hash VARCHAR(200) NOT NULL,
      is_verified BOOLEAN DEFAULT false,
      verification_token VARCHAR(200),
      refresh_token VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await c.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      description VARCHAR(200) NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      category VARCHAR(50) DEFAULT 'general',
      date VARCHAR(20),
      created_by VARCHAR(30),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await c.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      jersey_number VARCHAR(6) NOT NULL,
      jersey_name VARCHAR(30),
      batch VARCHAR(15),
      size VARCHAR(10) NOT NULL,
      collar_type VARCHAR(20) NOT NULL,
      sleeve_type VARCHAR(20) NOT NULL,
      item_price DECIMAL(10, 2) NOT NULL
    )
  `);

  await c.end();
  console.log('Database initialized successfully');
}
