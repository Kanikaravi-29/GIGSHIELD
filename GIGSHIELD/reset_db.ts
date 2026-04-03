import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const dbPath = 'C:/Users/ELCOT/Desktop/GIGSHIELD/database.sqlite';

const db = await open({ filename: dbPath, driver: sqlite3.Database });

console.log('🗑️  Wiping all data from GigShield database...\n');

await db.run('DELETE FROM claims');
await db.run('DELETE FROM policies');
await db.run('DELETE FROM triggers');
await db.run('DELETE FROM users');

// Reset auto-increment counters
await db.run("DELETE FROM sqlite_sequence WHERE name IN ('claims','policies','triggers','users')").catch(() => {});

const users    = await db.get('SELECT COUNT(*) as c FROM users');
const policies = await db.get('SELECT COUNT(*) as c FROM policies');
const claims   = await db.get('SELECT COUNT(*) as c FROM claims');
const triggers = await db.get('SELECT COUNT(*) as c FROM triggers');

console.log('✅ Database fully wiped:');
console.log(`   users:    ${users.c}`);
console.log(`   policies: ${policies.c}`);
console.log(`   claims:   ${claims.c}`);
console.log(`   triggers: ${triggers.c}`);
console.log('');
console.log('👉 Now restart the backend server.');
console.log('   It will auto-create admin@gigshield.com (admin123) + hebe@mail.com (demo123).');

await db.close();
