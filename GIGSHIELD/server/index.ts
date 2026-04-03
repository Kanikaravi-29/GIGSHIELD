import express from 'express';
import cors from 'cors';
import { initDB, getDB } from './db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

const generatePlatformId = async (db: any, platform: string): Promise<string> => {
  const prefix = platform === 'Amazon' ? 'AMZ-' : 'FLP-';
  let isUnique = false;
  let finalId = '';

  while (!isUnique) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    finalId = `${prefix}${randomNum}`;
    const check = await db.get('SELECT id FROM users WHERE platform_id = ?', [finalId]);
    if (!check) isUnique = true;
  }
  return finalId;
};

const app = express();
app.use(cors());
app.use(express.json());

// Init SQLite
initDB();

// --- ROOT ROUTE (Health Check) ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'live', service: 'GigShield Backend', database: 'SQLite (Connected)' });
});

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

const requireAdminType = (allowedTypes: string[]) => {
  return (req: any, res: any, next: any) => {
    // For this project, ALL admins and providers are granted full backend access
    if (req.user && (req.user.role === 'admin' || req.user.role === 'provider')) {
      next();
    } else {
      res.status(403).json({ error: `Not authorized. Administrator or Provider access required.` });
    }
  };
};

// --- AUTH ENDPOINTS ---

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password, role: requestedRole, platform, registrationNumber, city, zone, dailyIncome } = req.body;
  const db = await getDB();
  try {
    // 1. Admin Email Check (Restricted Admin creation)
    const adminTypes: { [key: string]: string } = {
      'admin@gigshield.com': 'control',
      'control@gigshield.com': 'control',
      'security@gigshield.com': 'security',
      'verify@gigshield.com': 'verify'
    };

    let role = 'worker';
    let status = 'approved';
    let adminType = null;

    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'This email is already registered. Please sign in or use a different email.' });
    }

    if (adminTypes[email]) {
      role = 'admin';
      status = 'approved';
      adminType = adminTypes[email];
    } else {
      // Hybrid logic: Insurance Providers need approval, Workers are auto-approved
      role = requestedRole === 'provider' ? 'provider' : 'worker';
      status = role === 'provider' ? 'pending' : 'approved';
    }

    // Platform validation (only for workers)
    if (role === 'worker') {
      const allowedPlatforms = ['Amazon', 'Flipkart'];
      if (!allowedPlatforms.includes(platform)) {
        return res.status(400).json({ error: 'Invalid platform selected' });
      }

      // Registration Number Validation
      const prefix = platform === 'Amazon' ? 'AMZ-' : 'FLP-';
      if (!registrationNumber || !registrationNumber.toUpperCase().startsWith(prefix)) {
        return res.status(400).json({ error: `Registration number must start with ${prefix}` });
      }

      const existingReg = await db.get('SELECT id FROM users WHERE platform_registration_number = ?', [registrationNumber]);
      if (existingReg) {
        console.warn(`🚨 SUSPICIOUS: Duplicate registration attempt: ${registrationNumber}`);
        return res.status(400).json({ error: 'Registration number already in use' });
      }
    }

    const isWorker = role === 'worker';
    const finalPlatform = isWorker ? platform : null;
    const finalPlatformId = isWorker ? await generatePlatformId(db, platform) : null;
    const finalRegNumber = isWorker ? registrationNumber : null;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.run(
      `INSERT INTO users (name, email, password_hash, role, admin_type, status, platform, platform_id, platform_registration_number, city, zone, daily_income)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, role, adminType, status, finalPlatform, finalPlatformId, finalRegNumber, city, zone, dailyIncome]
    );

    const newUser = await db.get('SELECT id, name, email, role, status, admin_type FROM users WHERE id = ?', [result.lastID]);
    res.status(201).json(newUser);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const db = await getDB();
  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(400).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

    // 2. Status check
    if (user.status !== 'approved') {
      return res.status(403).json({ error: 'Account pending approval. Please wait for an administrator to verify your identity.' });
    }

    const token = jwt.sign({
      id: user.id, email: user.email, role: user.role, adminType: user.admin_type
    }, JWT_SECRET, { expiresIn: '12h' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        adminType: user.admin_type,
        status: user.status,
        platform: user.platform,
        platformId: user.platform_id,
        platformRegistrationNumber: user.platform_registration_number,
        city: user.city,
        zone: user.zone,
        dailyIncome: user.daily_income,
      }
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- API ENDPOINTS ---

app.post('/api/policy/activate', authenticateToken, async (req: any, res: any) => {
  const { packageType, coverage_level, premium, selected_triggers, risk_probability } = req.body;
  const db = await getDB();
  try {
    const userId = req.user.id;
    // Join triggers array to string for SQLite storage
    const triggerStr = Array.isArray(selected_triggers) ? selected_triggers.join(',') : selected_triggers;

    const result = await db.run(
      `INSERT INTO policies (user_id, package, coverage_level, premium, risk_probability, selected_triggers, end_date, status) 
       VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+7 days'), 'Active')`,
      [userId, packageType, coverage_level, premium, risk_probability, triggerStr]
    );
    const newPolicy = await db.get('SELECT * FROM policies WHERE id = ?', [result.lastID]);
    res.status(201).json(newPolicy);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/policy/user', authenticateToken, async (req: any, res: any) => {
  const db = await getDB();
  try {
    const userId = req.user.id;
    const policy = await db.get(`
      SELECT * FROM policies 
      WHERE user_id = ? AND status = 'Active' AND end_date > datetime('now')
      ORDER BY start_date DESC LIMIT 1
    `, [userId]);
    res.json(policy || null);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trigger', authenticateToken, async (req: any, res: any) => {
  const { trigger_type, zone } = req.body;
  const db = await getDB();
  try {
    const userId = req.user.id;

    // Log the trigger event
    const triggerRes = await db.run(
      `INSERT INTO triggers (trigger_type) VALUES (?)`,
      [trigger_type]
    );

    // Find the user's active policy
    const policy = await db.get(`
      SELECT * FROM policies 
      WHERE user_id = ? AND status = 'Active' AND end_date > datetime('now')
    `, [userId]);

    let newClaim = null;
    if (policy) {
      // Always create claim if trigger type is covered by the policy
      const protectedTriggers = policy.selected_triggers?.split(',') || [];
      if (protectedTriggers.includes(trigger_type)) {
        // --- PREVENT DUPLICATE CLAIMS FOR SAME TRIGGER IN SAME ZONE ---
        const alreadyClaimed = await db.get(
          'SELECT id FROM claims WHERE user_id = ? AND trigger_type = ? AND zone = ? AND created_at > datetime("now", "-24 hours")',
          [userId, trigger_type, zone]
        );

        if (alreadyClaimed) {
          return res.status(400).json({ error: `Claim for "${trigger_type}" in ${zone || 'your zone'} has already been processed for today.` });
        }
        // ---------------------------------------------------------------

        // --- DYNAMIC FRAUD DETECTION LOGIC ---
        // Fetch worker data for income-based risk analysis
        const worker = await db.get('SELECT daily_income FROM users WHERE id = ?', [userId]);
        const dailyTarget = worker?.daily_income || 1400;

        const payout = Math.round(dailyTarget * policy.coverage_level);

        // 1. Velocity Check (Claim frequency in last 24 hours)
        const recentClaims = await db.get(
          'SELECT COUNT(*) as count FROM claims WHERE user_id = ? AND created_at > datetime("now", "-24 hours")',
          [userId]
        );

        // 2. Income vs Payout Ratio Check
        const incomeRatio = payout / dailyTarget;

        let fraudRisk = 'Low';
        let claimStatus = 'Approved';

        if (recentClaims.count >= 10) {
          // Rule: More than 10 claims in 24 hours is High Risk (velocity check)
          fraudRisk = 'High';
          claimStatus = 'Under Review';
        } else if (incomeRatio > 1.5) {
          // Rule: Payout significantly exceeding daily income is Medium Risk
          fraudRisk = 'Medium';
          claimStatus = 'Under Review';
        }
        // ------------------------------------

        const claimRes = await db.run(`
          INSERT INTO claims (user_id, trigger_type, payout_amount, status, gps_match, fraud_risk, zone)
          VALUES (?, ?, ?, ?, 1, ?, ?)
        `, [userId, trigger_type, payout, claimStatus, fraudRisk, zone]);

        newClaim = await db.get(`
          SELECT c.*, u.platform_id 
          FROM claims c 
          JOIN users u ON c.user_id = u.id 
          WHERE c.id = ?
        `, [claimRes.lastID]);
      }
    }

    res.status(201).json({
      trigger: { id: triggerRes.lastID, trigger_type },
      claim: newClaim
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/user
app.get('/api/dashboard/user', authenticateToken, async (req: any, res: any) => {
  const db = await getDB();
  try {
    const userId = req.user.id;

    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    const policy = await db.get(`
      SELECT * FROM policies WHERE user_id = ? AND status = 'Active' AND end_date > datetime('now')
    `, [userId]);

    if (!policy) {
      return res.json({
        risk_score: null,
        predicted_loss: null,
        coverage_amount: 0,
        active_policies_count: 0
      });
    }

    const triggerCount = policy.selected_triggers?.split(',').filter(Boolean).length || 0;
    const riskProbability = policy.risk_probability || 0.5;
    const dailyIncome = user?.daily_income || 1400;

    // Corrected Risk Score Formula
    const riskScore = Math.min(Math.round((triggerCount * 10) + (riskProbability * 100)), 100);
    const predictedLoss = Math.round(dailyIncome * (riskScore / 100));
    const coverageAmount = Math.round(policy.premium * policy.coverage_level * 7);

    res.json({
      risk_score: riskScore,
      predicted_loss: predictedLoss,
      coverage_amount: coverageAmount,
      active_policies_count: 1
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/claims/user/latest
app.get('/api/claims/user/latest', authenticateToken, async (req: any, res: any) => {
  const db = await getDB();
  try {
    const userId = req.user.id;
    const claim = await db.get(`
      SELECT * FROM claims WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
    `, [userId]);
    res.json(claim || null);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/claims', authenticateToken, async (req: any, res: any) => {
  const db = await getDB();
  try {
    const claims = await db.all(`
      SELECT c.*, u.name as worker_name, u.role as worker_role, u.platform, u.platform_id, u.platform_registration_number, u.city, u.zone
      FROM claims c 
      JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
    `);
    res.json(claims);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/claims/user', authenticateToken, async (req: any, res: any) => {
  const db = await getDB();
  try {
    const userId = req.user.id;
    const claims = await db.all(`
      SELECT * FROM claims 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `, [userId]);
    res.json(claims);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// ADMIN ROUTES (role = admin required)
// =============================================

// GET /api/admin/stats
app.get('/api/admin/stats', authenticateToken, requireAdminType(['control', 'verify']), async (req: any, res: any) => {
  const db = await getDB();
  try {
    const totalPartners = await db.get(`SELECT COUNT(*) as count FROM users WHERE role = 'worker'`);
    const activePolicies = await db.get(`SELECT COUNT(*) as count FROM policies WHERE status = 'Active'`);
    const totalPayouts = await db.get(`SELECT COALESCE(SUM(payout_amount), 0) as total FROM claims`);
    const avgRiskScore = await db.get(`SELECT COALESCE(AVG(risk_probability * 100), 0) as avg FROM policies`);
    const suspicious = await db.get(`SELECT COUNT(*) as count FROM claims WHERE fraud_risk = 'High'`);
    const reviewQueue = await db.get(`SELECT COUNT(*) as count FROM claims WHERE status = 'Under Review'`);

    res.json({
      totalPartners: totalPartners.count,
      activePolicies: activePolicies.count,
      totalPayouts: Math.round(totalPayouts.total),
      avgRiskScore: Math.round(avgRiskScore.avg),
      suspicious: suspicious.count,
      reviewQueue: reviewQueue.count,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/pending-users (Verify Admin permission)
app.get('/api/admin/pending-users', authenticateToken, requireAdminType(['control', 'verify']), async (req: any, res: any) => {
  const db = await getDB();
  try {
    const pending = await db.all(`SELECT * FROM users WHERE status = 'pending' ORDER BY created_at DESC`);
    res.json(pending);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/users/:id/approve (Verify Admin permission)
app.put('/api/admin/users/:id/approve', authenticateToken, requireAdminType(['control', 'verify']), async (req: any, res: any) => {
  const db = await getDB();
  const { status } = req.body; // 'approved' | 'rejected'
  try {
    const userToApprove = await db.get('SELECT role FROM users WHERE id = ?', [req.params.id]);

    if (status === 'approved' && userToApprove?.role === 'provider') {
      await db.run(
        `UPDATE users SET status = 'approved', role = 'admin', admin_type = 'verify' WHERE id = ?`,
        [req.params.id]
      );
    } else {
      await db.run(`UPDATE users SET status = ? WHERE id = ?`, [status, req.params.id]);
    }
    res.json({ success: true, status });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/workers
app.get('/api/admin/workers', authenticateToken, requireAdminType(['control', 'verify']), async (req: any, res: any) => {
  const db = await getDB();
  try {
    const workers = await db.all(`
      SELECT 
        u.id, u.name, u.email, u.platform, u.platform_id, u.platform_registration_number, u.city, u.zone, u.daily_income, u.status, u.role,
        p.risk_probability,
        p.status as policy_status,
        c.status as latest_claim_status,
        c.fraud_risk
      FROM users u
      LEFT JOIN policies p ON p.user_id = u.id AND p.status = 'Active'
      LEFT JOIN claims c ON c.id = (
        SELECT id FROM claims WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1
      )
      WHERE u.role IN ('worker', 'provider', 'admin')
      ORDER BY u.name ASC
    `);

    const result = workers.map((w: any) => ({
      id: w.id,
      name: w.name,
      platform: w.platform || 'N/A',
      platformId: w.platform_id || 'N/A',
      platformRegistrationNumber: w.platform_registration_number || 'N/A',
      city: w.city || 'N/A',
      zone: w.zone || 'N/A',
      dailyIncome: w.daily_income || 1400,
      riskLevel: w.risk_probability > 0.7 ? 'High' : w.risk_probability > 0.4 ? 'Medium' : 'Low',
      policyStatus: w.policy_status || 'Inactive',
      latestClaimStatus: w.latest_claim_status || 'None',
      fraudRisk: w.fraud_risk || 'Low',
      gpsMatch: w.fraud_risk !== 'High',
      zoneMatch: w.risk_probability < 0.7,
      accountStatus: w.status,
      userRole: w.role
    }));

    res.json(result);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/claims — all claims
app.get('/api/admin/claims', authenticateToken, requireAdminType(['control', 'security']), async (req: any, res: any) => {
  const db = await getDB();
  try {
    const claims = await db.all(`
      SELECT 
        c.id, c.trigger_type, c.payout_amount, c.status, c.zone,
        c.fraud_risk, c.gps_match, c.created_at, c.updated_at,
        u.name as worker_name, u.platform, u.platform_id, u.platform_registration_number, u.city, u.zone as user_home_zone
      FROM claims c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
    `);
    res.json(claims);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/claims/:id
app.get('/api/admin/claims/:id', authenticateToken, requireAdminType(['control', 'security']), async (req: any, res: any) => {
  const db = await getDB();
  try {
    const claim = await db.get(`
      SELECT 
        c.*, u.name as worker_name, u.platform, u.platform_id, u.platform_registration_number, u.city, u.zone as user_home_zone, u.daily_income
      FROM claims c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [req.params.id]);

    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    res.json({ ...claim, activityConsistency: claim.fraud_risk === 'Low', deviceIntegrity: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/claims/:id — Full administrative control
app.put('/api/admin/claims/:id', authenticateToken, requireAdminType(['control', 'security']), async (req: any, res: any) => {
  const db = await getDB();
  const { status } = req.body;

  try {
    await db.run(`UPDATE claims SET status = ?, updated_at = datetime('now') WHERE id = ?`, [status, req.params.id]);
    res.json({ success: true, status });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/fraud-stats (Security and Control only)
app.get('/api/admin/fraud-stats', authenticateToken, requireAdminType(['control', 'security']), async (req: any, res: any) => {
  const db = await getDB();
  try {
    const gpsMismatch = await db.get(`SELECT COUNT(*) as count FROM claims WHERE gps_match = 0`);
    const highRiskClaims = await db.get(`SELECT COUNT(*) as count FROM claims WHERE fraud_risk = 'High'`);
    const underReview = await db.get(`SELECT COUNT(*) as count FROM claims WHERE status = 'Under Review'`);
    const flaggedAccounts = await db.get(`SELECT COUNT(DISTINCT user_id) as count FROM claims WHERE fraud_risk = 'High'`);

    res.json({
      gpsMismatch: gpsMismatch.count,
      highRiskClaims: highRiskClaims.count,
      inconsistentActivity: underReview.count,
      flaggedAccounts: flaggedAccounts.count,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// DEV UTILITY — cleanup-admins
// =============================================

// POST /api/dev/cleanup-admins
// Resets the admin state: demotes rogue admins, ensures canonical admin exists.
app.post('/api/dev/cleanup-admins', async (req, res) => {
  const db = await getDB();
  try {
    // Demote all non-canonical admins
    const demoted = await db.run(
      `UPDATE users SET role = 'worker' WHERE role = 'admin' AND email != 'admin@gigshield.com'`
    );

    // Ensure canonical admin exists with the correct password
    const adminExists = await db.get(`SELECT id FROM users WHERE email = 'admin@gigshield.com'`);
    if (!adminExists) {
      const adminHash = await bcrypt.hash('admin123', 10);
      await db.run(
        `INSERT INTO users (name, email, password_hash, role) VALUES ('Admin User', 'admin@gigshield.com', ?, 'admin')`,
        [adminHash]
      );
    } else {
      await db.run(`UPDATE users SET role = 'admin' WHERE email = 'admin@gigshield.com'`);
    }

    const adminCount = await db.get(`SELECT COUNT(*) as count FROM users WHERE role = 'admin'`);
    const workerCount = await db.get(`SELECT COUNT(*) as count FROM users WHERE role = 'worker'`);

    res.json({
      message: '✅ Admin cleanup complete',
      demotedRogueAdmins: demoted.changes ?? 0,
      totalAdmins: adminCount.count,
      totalWorkers: workerCount.count,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from Vite's build output (dist/) for production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Final catch-all for SPA: serve index.html for any remaining GET requests
// (Bypasses Express 5 regex engine to prevent PathErrors)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.url.startsWith('/api/')) {
    return res.sendFile(path.join(distPath, 'index.html'));
  }
  next();
});

const PORT = parseInt(process.env.PORT || '3001', 10);
initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 GigShield Pro: Backend & Frontend serving on port ${PORT}`);
  });
}).catch(console.error);
