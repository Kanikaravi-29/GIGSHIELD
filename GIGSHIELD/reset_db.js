const Database = require('better-sqlite3');
const path = require('path');

// Try both possible DB paths
const dbPath = 'C:/Users/ELCOT/Desktop/GIGSHIELD/database.sqlite';

try {
  const db = new Database(dbPath);

  db.exec(`
    DELETE FROM claims;
    DELETE FROM policies;
    DELETE FROM triggers;
    DELETE FROM users;
    DELETE FROM sqlite_sequence WHERE name IN ('claims','policies','triggers','users');
  `);

  const users    = db.prepare('SELECT COUNT(*) as c FROM users').get();
  const policies = db.prepare('SELECT COUNT(*) as c FROM policies').get();
  const claims   = db.prepare('SELECT COUNT(*) as c FROM claims').get();
  const triggers = db.prepare('SELECT COUNT(*) as c FROM triggers').get();

  console.log('✅ Database fully wiped.');
  console.log(`   users:    ${users.c}`);
  console.log(`   policies: ${policies.c}`);
  console.log(`   claims:   ${claims.c}`);
  console.log(`   triggers: ${triggers.c}`);
  console.log('');
  console.log('👉 Restart the backend server — it will auto-create admin@gigshield.com + demo worker on startup.');
  db.close();
} catch (err) {
  console.error('❌ Failed:', err.message);
}
