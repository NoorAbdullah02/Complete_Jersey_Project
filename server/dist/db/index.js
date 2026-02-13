"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.initDb = initDb;
const node_postgres_1 = require("drizzle-orm/node-postgres");
const pg_1 = require("pg");
const schema = __importStar(require("./schema"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
let client = null;
async function getDb() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is required');
    }
    const c = new pg_1.Client({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    });
    await c.connect();
    const db = (0, node_postgres_1.drizzle)(c, { schema });
    return { db, client: c };
}
async function initDb() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is required');
    }
    const c = new pg_1.Client({
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
//# sourceMappingURL=index.js.map