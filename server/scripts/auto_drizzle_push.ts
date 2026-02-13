import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Client } from 'pg';

// Load environment from project server/.env when running compiled JS from dist/scripts
// __dirname (when compiled) -> <repo>/server/dist/scripts
// so server/.env is two levels up: ../../.env
const envPath = path.resolve(__dirname, '..', '..', '.env');
console.log(`Loading env from ${envPath}`);
dotenv.config({ path: envPath });

function run(cmd: string) {
  console.log('> ' + cmd);
  // Avoid strict typing issues with older @types/node by omitting `shell` option here
  execSync(cmd, { stdio: 'inherit' });
}

const outDir = path.resolve(__dirname, '..', 'drizzle');

async function main() {
  try {
    // 1) Generate migration SQL files
    run('npx drizzle-kit generate');

    // 2) Sanitize generated SQL files: remove DROP/TRANSCATE lines and script markers
    const sqlFiles: string[] = [];
    if (fs.existsSync(outDir)) {
      const files = fs.readdirSync(outDir).filter(f => f.endsWith('.sql'));
      for (const file of files) {
        const p = path.join(outDir, file);
        let txt = fs.readFileSync(p, 'utf8');
        const orig = txt;

        txt = txt
          .split('\n')
          .filter(line => {
            const t = line.trim();
            const l = t.toUpperCase();
            if (t.startsWith('-->')) return false; // drizzle statement-breakpoint
            if (l.startsWith('TRUNCATE TABLE')) return false;
            if (l.includes('DROP CONSTRAINT')) return false;
            if (l.includes('DROP COLUMN')) return false;
            return true;
          })
          .join('\n');

        if (txt !== orig) {
          console.log(`Sanitized ${file} (removed DROP/TRUNCATE/markers)`);
          fs.writeFileSync(p, txt, 'utf8');
        }

        sqlFiles.push(p);
      }
    }

    // 3) Execute sanitized SQL files directly against the DB to avoid interactive prompt
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL not set in environment');
    }

    const client = new Client({ connectionString: dbUrl, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined });
    await client.connect();

    try {
      for (const file of sqlFiles) {
        let sql = fs.readFileSync(file, 'utf8');
        if (!sql.trim()) continue;
        // make CREATE TABLE safe
        sql = sql.replace(/CREATE TABLE\s+"([^\"]+)"/gi, 'CREATE TABLE IF NOT EXISTS "$1"');
        // wrap ADD CONSTRAINT statements so they only run if constraint doesn't exist
        sql = sql.replace(/(ALTER TABLE[\s\S]*?ADD CONSTRAINT\s+"([^"]+)"[\s\S]*?;)/gi, (_m, stmt, name) => {
          const escaped = name.replace(/'/g, "''");
          return `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${escaped}') THEN ${stmt} END IF; END$$;`;
        });
        // make ADD COLUMN idempotent
        sql = sql.replace(/ADD COLUMN\s+/gi, 'ADD COLUMN IF NOT EXISTS ');
        console.log(`Executing ${path.basename(file)}...`);
        await client.query('BEGIN');
          await client.query(sql);
        await client.query('COMMIT');
      }
    } finally {
      await client.end();
    }

    console.log('Auto drizzle push (direct SQL apply) completed');
  } catch (err) {
    console.error('Auto push failed:', err);
    process.exit(1);
  }
}

main();
