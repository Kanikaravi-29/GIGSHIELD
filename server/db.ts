import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Open SQLite database file using dynamic absolute path for cross-platform compatibility
export const getDB = async () => {
  return open({
    filename: path.join(__dirname, '../database.sqlite'),
    driver: sqlite3.Database
  });
};

export const initDB = async () => {
  const db = await getDB();

  try {
    // Create Tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        platform TEXT,
        city TEXT,
        zone TEXT,
        daily_income REAL,
        role TEXT NOT NULL DEFAULT 'worker',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS policies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        package TEXT NOT NULL,
        coverage_level REAL NOT NULL,
        premium REAL NOT NULL,
        risk_probability REAL NOT NULL,
        selected_triggers TEXT,
        start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        end_date DATETIME NOT NULL,
        status TEXT NOT NULL DEFAULT 'Active',
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS triggers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trigger_type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS claims (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        trigger_type TEXT NOT NULL,
        payout_amount REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'Under Review',
        gps_match INTEGER DEFAULT 1,
        fraud_risk TEXT DEFAULT 'Low',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // NEW: Payment tracking table
    await db.exec(`
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    razorpay_order_id TEXT NOT NULL,
    razorpay_payment_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

    // NEW: Payout simulation table
    await db.exec(`
  CREATE TABLE IF NOT EXISTS payouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    claim_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    transaction_id TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (claim_id) REFERENCES claims(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);
    // Force Schema Upgrade: Add missing columns sequentially
    const schemaUpgrades = [
      { col: "ALTER TABLE claims ADD COLUMN lat REAL", label: "lat" },
      { col: "ALTER TABLE claims ADD COLUMN lng REAL", label: "lng" },
      { col: "ALTER TABLE claims ADD COLUMN updated_at DATETIME", label: "updated_at" },
      { col: "ALTER TABLE users ADD COLUMN platform_id TEXT", label: "platform_id" },
      { col: "ALTER TABLE users ADD COLUMN platform_registration_number TEXT", label: "platform_registration_number" },
      { col: "ALTER TABLE users ADD COLUMN admin_type TEXT", label: "admin_type" },
      { col: "ALTER TABLE claims ADD COLUMN zone TEXT", label: "zone" },
      { col: "ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'pending'", label: "status" },
    ];

    for (const upgrade of schemaUpgrades) {
      try {
        await db.run(upgrade.col);
        console.log(`✅ Database Migration: Column [${upgrade.label}] added successfully.`);
      } catch (e: any) {
        if (e.message.includes('duplicate column') || e.message.includes('already exists')) {
          // Safe to ignore
        } else {
          console.warn(`⚠️ Warning: Schema upgrade [${upgrade.label}] failed: ${e.message}`);
        }
      }
    }

    // Add unique constraints via Indexes (Bypasses SQLite ALTER TABLE limitation)
    try {
      await db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_platform_id ON users(platform_id) WHERE platform_id IS NOT NULL`);
      await db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_reg_number ON users(platform_registration_number) WHERE platform_registration_number IS NOT NULL`);
      console.log('✅ Unique constraints enforced via partial indexes.');
    } catch (indexError: any) {
      console.warn('⚠️ Constraint enforcement warning:', indexError.message);
    }

    // Double check column existence
    const userColumns = await db.all('PRAGMA table_info(users)');
    const colNames = userColumns.map(c => c.name);
    console.log(`📡 Users Table Schema verified: [${colNames.join(', ')}]`);

    // ── Multi-Admin Enforcement (runs every startup) ────────────────────
    const adminAccounts = [
      { email: 'admin@gigshield.com', type: 'control', name: 'Super Admin' },
      { email: 'control@gigshield.com', type: 'control', name: 'Control Admin' },
      { email: 'security@gigshield.com', type: 'security', name: 'Security Admin' },
      { email: 'verify@gigshield.com', type: 'verify', name: 'Verification Admin' },
    ];

    for (const acc of adminAccounts) {
      const exists = await db.get(`SELECT id FROM users WHERE email = ?`, [acc.email]);
      if (!exists) {
        console.log(`🔐 Seeding Admin: ${acc.email} (${acc.type})`);
        const hash = bcrypt.hashSync('admin123', 10);
        await db.run(
          `INSERT INTO users (name, email, password_hash, role, admin_type, status)
           VALUES (?, ?, ?, 'admin', ?, 'approved')`,
          [acc.name, acc.email, hash, acc.type]
        );
      } else {
        // Enforce role, type, and approved status for these emails
        await db.run(
          `UPDATE users SET role = 'admin', admin_type = ?, status = 'approved' WHERE email = ?`,
          [acc.type, acc.email]
        );
      }
    }

    // Seed demo worker if none exists
    const workerCount = await db.get(`SELECT COUNT(*) as count FROM users WHERE role = 'worker'`);
    if (workerCount.count === 0 && colNames.includes('platform_id')) {
      console.log('🌱 Seeding demo worker account (hebe@mail.com)...');
      const workerHash = bcrypt.hashSync('demo123', 10);
      try {
        await db.run(
          `INSERT OR IGNORE INTO users (name, email, password_hash, role, status, platform, city, zone, daily_income, platform_id, platform_registration_number)
           VALUES ('Hebe John', 'hebe@mail.com', ?, 'worker', 'approved', 'Amazon', 'Chennai', 'A4', 1400, 'AMZ-1000', 'AMZ-REG-1000')`,
          [workerHash]
        );
      } catch (insertError: any) {
        console.error('❌ Demo seeding failed:', insertError.message);
      }
    }
    // ────────────────────────────────────────────────────────────────────

    console.log('✅ SQLite database schema synchronized');
  } catch (error: any) {
    console.error('❌ Database Initialization Fatal Error:', error.message);
  }
};
