import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const db = await open({ filename: 'C:/Users/ELCOT/Desktop/GIGSHIELD/database.sqlite', driver: sqlite3.Database });
const u = await db.get('SELECT COUNT(*) as c FROM users');
const p = await db.get('SELECT COUNT(*) as c FROM policies');
const c = await db.get('SELECT COUNT(*) as c FROM claims');
console.log(`users: ${u.c} | policies: ${p.c} | claims: ${c.c}`);
await db.close();
