import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { getDb, getPool, closeDb } from './client';

async function runMigrations() {
  console.log('Running database migrations...');
  const db = getDb();
  await migrate(db, { migrationsFolder: './src/db/migrations' });
  console.log('Migrations completed successfully');
  await closeDb();
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  getPool().end();
  process.exit(1);
});
