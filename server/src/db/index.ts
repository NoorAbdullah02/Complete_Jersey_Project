import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

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

  console.log('🔄 Sychronizing database schema...');

  // 1. Core Tables
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
      role VARCHAR(20) DEFAULT 'admin',
      is_verified BOOLEAN DEFAULT false,
      verification_token VARCHAR(200),
      refresh_token VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Ensure 'role' column exists for legacy installations
  try {
    await c.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT \'admin\'');
  } catch (e) {
    // Column might already exist or table might be locked
  }

  await c.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(60),
      password_hash VARCHAR(200),
      is_verified BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await c.query(`
    CREATE TABLE IF NOT EXISTS authenticators (
      credential_id VARCHAR(300) PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      admin_user_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
      credential_public_key TEXT NOT NULL,
      counter INTEGER DEFAULT 0 NOT NULL,
      credential_device_type VARCHAR(30) NOT NULL,
      credential_backed_up BOOLEAN DEFAULT false NOT NULL,
      transports VARCHAR(200),
      name VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Ensure 'name' column exists in authenticators for legacy installations
  try {
    await c.query('ALTER TABLE authenticators ADD COLUMN IF NOT EXISTS name VARCHAR(100)');
  } catch (e) {
    // Column might already exist
  }

  await c.query(`
    CREATE TABLE IF NOT EXISTS webauthn_challenges (
      id SERIAL PRIMARY KEY,
      challenge VARCHAR(300) NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      admin_user_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
      expires_at TIMESTAMP NOT NULL
    )
  `);

  await c.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(200) PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      admin_user_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
      device_info TEXT,
      ip_address VARCHAR(50),
      last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await c.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      admin_user_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      metadata TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await c.query(`
    CREATE TABLE IF NOT EXISTS inventory (
      id SERIAL PRIMARY KEY,
      item_name VARCHAR(100) UNIQUE NOT NULL,
      sku VARCHAR(50) UNIQUE NOT NULL,
      quantity INTEGER DEFAULT 0 NOT NULL,
      min_threshold INTEGER DEFAULT 10,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await c.query(`
    CREATE TABLE IF NOT EXISTS stock_logs (
      id SERIAL PRIMARY KEY,
      inventory_id INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
      change INTEGER NOT NULL,
      reason VARCHAR(100),
      admin_user_id INTEGER REFERENCES admin_users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await c.query(`
    CREATE TABLE IF NOT EXISTS coupons (
      id SERIAL PRIMARY KEY,
      code VARCHAR(20) UNIQUE NOT NULL,
      discount_type VARCHAR(20) NOT NULL,
      discount_value DECIMAL(10, 2) NOT NULL,
      max_usage INTEGER,
      current_usage INTEGER DEFAULT 0,
      expiry_date TIMESTAMP,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await c.query(`
    CREATE TABLE IF NOT EXISTS payment_logs (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      provider VARCHAR(20) NOT NULL,
      transaction_id VARCHAR(100) NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      status VARCHAR(20) NOT NULL,
      raw_response TEXT,
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
  console.log('✅ Database synchronized successfully');
}
