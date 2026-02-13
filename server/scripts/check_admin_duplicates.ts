import dotenv from 'dotenv';
import path from 'path';
import { Client } from 'pg';

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL not found in .env');
    process.exit(1);
  }

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    console.log('Checking for duplicate usernames in admin_users...');
    const res = await client.query(`
      SELECT username, array_agg(id ORDER BY id) AS ids, COUNT(*) AS cnt
      FROM admin_users
      GROUP BY username
      HAVING COUNT(*) > 1
      ORDER BY cnt DESC;
    `);

    if (res.rows.length === 0) {
      console.log('No duplicate usernames found.');
      process.exit(0);
    }

    console.log(`Found ${res.rows.length} duplicate username(s):`);
    for (const row of res.rows) {
      console.log(`- ${row.username}: count=${row.cnt}, ids=${row.ids.join(',')}`);
    }

    console.log('\nNo changes were made. If you want to remove duplicates (keep lowest id per username), rerun with env var FIX=true');
    console.log('Example: FIX=true npx tsx scripts/check_admin_duplicates.ts');

    // If FIX=true, perform deletion: keep lowest id per username
    if (process.env.FIX === 'true') {
      console.log('\nFIX=true detected — removing duplicate rows (keeping lowest id per username)...');
      const delRes = await client.query(`
        DELETE FROM admin_users a
        USING admin_users b
        WHERE a.username = b.username
          AND a.id > b.id
      `);
      console.log(`Deleted ${delRes.rowCount} duplicate row(s).`);
    }
  } catch (err) {
    console.error('Error checking duplicates:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
