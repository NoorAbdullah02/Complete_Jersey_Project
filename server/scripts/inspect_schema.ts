import dotenv from 'dotenv';
import path from 'path';
import { Client } from 'pg';

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

async function inspect() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL not found in .env');
    process.exit(1);
  }

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    const tables = ['admin_users', 'expenses', 'orders', 'order_items'];

    for (const table of tables) {
      console.log(`\n--- Table: ${table} ---`);

      const cols = await client.query(
        `SELECT column_name, is_nullable, data_type, column_default
         FROM information_schema.columns
         WHERE table_schema='public' AND table_name=$1
         ORDER BY ordinal_position;`, [table]
      );
      console.table(cols.rows);

      const pk = await client.query(
        `SELECT tc.constraint_name, kcu.column_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name
         WHERE tc.table_schema='public' AND tc.table_name=$1 AND tc.constraint_type='PRIMARY KEY';`, [table]
      );
      if (pk.rows.length) console.log('Primary Key:', Array.from(new Set(pk.rows.map(r=>r.column_name))).join(', '));
      else console.log('Primary Key: <none>');

      const fks = await client.query(
        `SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
         JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
         WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public' AND tc.table_name=$1;`, [table]
      );
      if (fks.rows.length) {
        console.log('Foreign Keys:');
        console.table(fks.rows);
      } else console.log('Foreign Keys: <none>');

      const uniq = await client.query(
        `SELECT tc.constraint_name, kcu.column_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
         WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema='public' AND tc.table_name=$1;`, [table]
      );
      if (uniq.rows.length) {
        console.log('Unique Constraints:');
        console.table(uniq.rows);
      } else console.log('Unique Constraints: <none>');
    }

  } catch (err) {
    console.error('Inspect error:', err);
  } finally {
    await client.end();
  }
}

inspect();
