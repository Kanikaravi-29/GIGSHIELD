import { initDB } from './server/db.ts';
try {
  await initDB();
  console.log('✅ SQLite Schema Upgraded with new columns!');
} catch (e) {
  console.error('❌ Migration failed:', e);
}
process.exit(0);
