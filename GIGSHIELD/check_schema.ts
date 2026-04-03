import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function check() {
  const db = await open({
    filename: 'C:/Users/ELCOT/Desktop/GIGSHIELD/GIGSHIELD/database.sqlite',
    driver: sqlite3.Database
  });

  const columns = await db.all('PRAGMA table_info(users)');
  console.log('--- USERS TABLE COLUMNS ---');
  columns.forEach(c => console.log(`- ${c.name} (${c.type})`));
  
  const admins = await db.all('SELECT email, role, admin_type, status FROM users WHERE role = "admin"');
  console.log('--- ADMINS IN DB ---');
  admins.forEach(a => console.log(`${a.email} | ${a.role} | ${a.admin_type} | ${a.status}`));
}

check().catch(console.error);
