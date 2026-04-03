import { initDB } from './server/db.ts';
await initDB();
console.log('✅ Initialization and seeding complete.');
process.exit(0);
