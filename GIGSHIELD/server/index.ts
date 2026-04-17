import express from 'express';
import cors from 'cors';
import { initDB, getDB } from './db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_ekuUcHA0UOfU6z',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'KTu5xQhLEEo0FaKC0uHz2bwW',
});
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { analyzeGPSContinuity, LocationPoint } from './ml/gpsValidator.js';
import { calculateClaimFraudScore, getRiskLabel, trainFraudModelFromDB, loadModel } from './ml/fraudScorer.js';
import { predictNext7Days, calculatePredictiveLossRatio } from './ml/forecastEngine.js';
import { startAutonomousMonitor } from './ml/monitor.js';
import { startAutonomousMonitor } from './ml/monitor.js';

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

    // 2. Status check
    if (user.status !== 'approved' && user.role === 'worker') {
      return res.status(403).json({ error: 'Account pending approval. Please wait for an administrator to verify your identity.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

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
  const { trigger_type, zone, locationHistory, hardwareData } = req.body;
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

        const workerData = await db.get('SELECT city, zone, daily_income FROM users WHERE id = ?', [userId]);
        const payout = Math.round((workerData?.daily_income || 1400) * policy.coverage_level);

        const recentClaims = await db.get(
          'SELECT COUNT(*) as count FROM claims WHERE user_id = ? AND created_at > datetime("now", "-24 hours")',
          [userId]
        );
        const incomeRatio = payout / (workerData?.daily_income || 1400);

        // ============================================================
        // 🛰️ GPS FRAUD DETECTION ENGINE
        // ============================================================
        const registeredCity = workerData.city;
        const gpsHistory = locationHistory || [];

        console.log(`[GPS] Registered city: "${registeredCity}" | Points received: ${gpsHistory.length}`);
        if (gpsHistory.length > 0) {
          console.log(`[GPS] Point[0]: lat=${gpsHistory[0].lat}, lng=${gpsHistory[0].lng}`);
        }

        const gpsAnalysis = analyzeGPSContinuity(gpsHistory, registeredCity);
        console.log(`[GPS] Flag=${gpsAnalysis.gpsFlag} | riskScore=${gpsAnalysis.riskScore} | withinCity=${gpsAnalysis.isWithinCity}`);
        if (gpsAnalysis.details.length) console.log(`[GPS] ${gpsAnalysis.details.join(' | ')}`);

        // Pass GPS signals into fraud scorer
        const fraudScore = await calculateClaimFraudScore({
          isSpoofed: gpsAnalysis.isSpoofed,
          isMocked: gpsAnalysis.hasHardwareMock,
          gpsFlag: gpsAnalysis.gpsFlag,
          riskScore: gpsAnalysis.riskScore,
          recentClaimsCount: recentClaims.count,
          incomeRatio
        }, hardwareData);

        const fraudStatus = getRiskLabel(fraudScore);
        const gpsValid = gpsAnalysis.gpsFlag === 'VALID' ? 1 : 0;

        // Final decision — purely score-driven
        let claimStatus: string;
        if (fraudScore <= 30) claimStatus = 'Approved';
        else if (fraudScore >= 71) claimStatus = 'Rejected';
        else claimStatus = 'Under Review';

        console.log(`[DECISION] city="${registeredCity}" gps="${gpsAnalysis.gpsFlag}" score=${fraudScore} risk=${fraudStatus} → "${claimStatus}"`);

        const claimRes = await db.run(`
          INSERT INTO claims (user_id, trigger_type, payout_amount, status, gps_match, fraud_risk, zone, fraud_score, fraud_status, gps_valid)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [userId, trigger_type, payout, claimStatus, gpsValid, fraudStatus, zone, fraudScore, fraudStatus, gpsValid]);


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

app.post('/api/claims/:id/payout', authenticateToken, async (req: any, res: any) => {
  const db = await getDB();
  try {
    const claim = await db.get('SELECT * FROM claims WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!claim) return res.status(404).json({ error: 'Claim not found or access denied.' });

    if (claim.status !== 'Approved') {
      return res.status(400).json({ error: 'Only approved claims can be paid out.' });
    }

    // Simulate Payment Gateway Delay
    await new Promise(resolve => setTimeout(resolve, 800));

    await db.run(`UPDATE claims SET status = 'Paid', updated_at = datetime('now') WHERE id = ?`, [req.params.id]);

    res.json({
      success: true,
      transaction_id: `rzp_test_${Math.random().toString(36).substr(2, 9)}`,
      payout_amount: claim.payout_amount,
      status: 'Paid',
      message: 'Instant payout processed successfully.'
    });
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
    const totalPayouts = await db.get(`SELECT SUM(payout_amount) as total FROM claims WHERE status = 'Approved'`);
    const activePolicies = await db.get(`SELECT COUNT(*) as count FROM policies WHERE status = 'Active'`);
    const suspiciousCount = await db.get(`SELECT COUNT(*) as count FROM claims WHERE fraud_risk = 'High'`);
    const reviewQueue = await db.get(`SELECT COUNT(*) as count FROM claims WHERE status = 'Under Review'`);
    const allClaims = await db.all('SELECT payout_amount, fraud_score, status FROM claims');

    // 🧠 AI FEATURE: Predictive Loss Ratio
    const mlLossRatio = await calculatePredictiveLossRatio(allClaims, activePolicies.count || 0);

    res.json({
      totalPartners: totalPartners.count,
      activePolicies: activePolicies.count,
      totalPayouts: totalPayouts.total || 0,
      suspicious: suspiciousCount.count,
      reviewQueue: reviewQueue.count,
      mlLossRatio: mlLossRatio // Injecting the ML Result
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
        c.fraud_risk, c.fraud_score, c.gps_match, c.created_at, c.updated_at,
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

// GET /api/worker/insights (Predictive Alerts & Dynamic Pricing)
app.get('/api/worker/insights', authenticateToken, async (req: any, res: any) => {
  const db = await getDB();
  try {
    const claims = await db.all('SELECT payout_amount, created_at FROM claims');
    const forecast = await predictNext7Days(claims);

    // Find high risk days for alerts
    const alerts = forecast
      .filter((f: any) => f.riskScore > 60)
      .map((f: any) => ({
        type: 'warning',
        message: `${f.events} predicted for ${f.day}.`,
        severity: f.riskScore > 85 ? 'High' : 'Medium'
      }));

    // Calculate Dynamic Premium Tiers
    const maxRisk = Math.max(...forecast.map((f: any) => f.riskScore));
    const basePremium = 200;

    const tiers = [
      { name: 'Standard', coverage: 7000, premium: basePremium, recommended: maxRisk < 50 },
      { name: 'Gold', coverage: 10000, premium: Math.round(basePremium * 1.5), recommended: maxRisk >= 50 && maxRisk < 80 },
      { name: 'Titanium', coverage: 15000, premium: Math.round(basePremium * 2.2), recommended: maxRisk >= 80 }
    ];

    res.json({ alerts, tiers, currentRisk: maxRisk });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/worker/insights — Predictive Alerts & Premium Optimization
app.get('/api/worker/insights', authenticateToken, async (req: any, res: any) => {
  const db = await getDB();
  try {
    const claims = await db.all('SELECT payout_amount, created_at FROM claims');
    const forecast = await predictNext7Days(claims);

    const alerts = forecast
      .filter((f: any) => f.riskScore > 10) // See almost all projections
      .map((f: any) => ({
        day: f.day,
        type: 'warning',
        message: f.riskScore > 70 ? 'Critical Outage Probable.' : f.riskScore > 35 ? 'Moderate Load Predicted.' : 'Standard Demand Expected.',
        severity: f.riskScore > 70 ? 'High' : f.riskScore > 35 ? 'Medium' : 'Low',
        recommendedTier: f.riskScore > 70 ? 'Titanium' : f.riskScore > 35 ? 'Gold' : 'Standard'
      }));

    const maxRisk = Math.max(...forecast.map((f: any) => f.riskScore));
    const basePremium = 200;

    const tiers = [
      { id: 'basic', name: 'Standard', premium: basePremium, coverage: 7000, recommended: maxRisk < 50 },
      { id: 'standard', name: 'Gold', premium: Math.round(basePremium * 1.6), coverage: 10000, recommended: maxRisk >= 50 && maxRisk < 80 },
      { id: 'premium', name: 'Titanium', premium: Math.round(basePremium * 2.5), coverage: 15000, recommended: maxRisk >= 80 }
    ];

    res.json({ alerts, tiers, riskScore: maxRisk });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/claims/:id/payout — Simulated Razorpay Payout
app.post('/api/claims/:id/payout', authenticateToken, async (req: any, res: any) => {
  const db = await getDB();
  try {
    const claim = await db.get('SELECT * FROM claims WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    if (claim.status !== 'Approved') return res.status(400).json({ error: 'Claim not approved yet' });

    // Simulate Payment Gateway logic
    const transactionId = `RAZOR_TXN_${Math.random().toString(36).substring(7).toUpperCase()}`;
    await db.run(
      `UPDATE claims SET status = 'Paid', updated_at = datetime('now') WHERE id = ?`,
      [req.params.id]
    );

    res.json({
      success: true,
      transaction_id: transactionId,
      payout_amount: claim.payout_amount,
      message: 'Instant payout successful via Razorpay'
    });
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

// GET /api/admin/forecast (AI Prediction)
app.get('/api/admin/forecast', authenticateToken, requireAdminType(['control', 'security']), async (req: any, res: any) => {
  const db = await getDB();
  try {
    const claims = await db.all('SELECT payout_amount, created_at FROM claims');
    const forecast = await predictNext7Days(claims);
    res.json(forecast);
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
// =============================================
// PAYMENT & PAYOUT ROUTES (NEW)
// =============================================

// Create Razorpay order for policy purchase
app.post('/api/payment/create-order', authenticateToken, async (req: any, res: any) => {
  try {
    const { amount } = req.body; // amount in paise (e.g., 10000 = ₹100)
    const options = {
      amount: amount,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err: any) {
    console.error('Order creation failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// Verify payment signature and activate policy
app.post('/api/payment/verify', authenticateToken, async (req: any, res: any) => {
  const db = await getDB();
  const userId = req.user.id;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

  try {
    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'KTu5xQhLEEo0FaKC0uHz2bwW')
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Save payment record
    await db.run(
      `INSERT INTO payments (user_id, razorpay_order_id, razorpay_payment_id, amount, status)
       VALUES (?, ?, ?, ?, 'SUCCESS')`,
      [userId, razorpay_order_id, razorpay_payment_id, amount]
    );



    res.json({ success: true, message: 'Payment verified and policy activated' });
  } catch (err: any) {
    console.error('Payment verification failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// Trigger instant payout simulation for an approved claim
app.post('/api/payout/trigger/:claimId', authenticateToken, async (req: any, res: any) => {
  const db = await getDB();
  const { claimId } = req.params;
  const userId = req.user.id;

  try {
    // Fetch claim and verify ownership (workers can only trigger their own claims)
    const claim = await db.get(
      `SELECT * FROM claims WHERE id = ? AND user_id = ?`,
      [claimId, userId]
    );

    if (!claim) {
      return res.status(404).json({ error: 'Claim not found or access denied' });
    }

    if (claim.status !== 'Approved') {
      return res.status(400).json({ error: 'Only approved claims can be paid out' });
    }

    // Check if already paid out
    const existingPayout = await db.get(
      `SELECT id FROM payouts WHERE claim_id = ?`,
      [claimId]
    );
    if (existingPayout) {
      return res.status(400).json({ error: 'Payout already processed for this claim' });
    }

    // Simulate instant payout
    const transactionId = `SIM_${crypto.randomBytes(6).toString('hex')}`;
    await db.run(
      `INSERT INTO payouts (claim_id, user_id, amount, transaction_id, status)
       VALUES (?, ?, ?, ?, 'SUCCESS')`,
      [claimId, userId, claim.payout_amount, transactionId]
    );

    // Optionally update claim status to 'Paid'
    await db.run(`UPDATE claims SET status = 'Paid', updated_at = datetime('now') WHERE id = ?`, [claimId]);

    res.json({
      success: true,
      transaction_id: transactionId,
      amount: claim.payout_amount,
      message: 'Instant payout processed successfully',
    });
  } catch (err: any) {
    console.error('Payout trigger failed:', err);
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
initDB().then(async () => {
  // Try to load existing ML model, otherwise train from DB
  const loaded = loadModel();
  if (!loaded) {
    const db = await getDB();
    const claims = await db.all('SELECT * FROM claims');
    await trainFraudModelFromDB(claims);
  }

  // ⚡ START AUTONOMOUS AI MONITORING
  startAutonomousMonitor();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 GigShield Pro: Backend & Frontend serving on port ${PORT}`);
  });
}).catch(console.error);
