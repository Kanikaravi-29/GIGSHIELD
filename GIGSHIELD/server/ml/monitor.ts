import { getDB } from '../db.js';
import { predictNext7Days } from './forecastEngine.js';

/**
 * GigShield Autonomous Disruption Monitor
 * 
 * This engine runs in the background and automatically triggers claims 
 * when the AI Forecast detects a real-time disruption event.
 */

export const startAutonomousMonitor = () => {
    console.log('📡 GigShield AI: Autonomous Disruption Monitor ACTIVE');

    setInterval(async () => {
        const db = await getDB();
        
        try {
            // 1. Get current claims and run a mini-forecast for "Now"
            const allClaims = await db.all('SELECT payout_amount, created_at FROM claims');
            const forecast = await predictNext7Days(allClaims);
            
            // Check if "Today" (first day of forecast) has a high risk score
            const todayRisk = forecast[0]; 
            
            if (todayRisk.riskScore > 80) {
                console.log(`⚠️ AI DETECTED CRITICAL DISRUPTION: ${todayRisk.events}`);
                
                // 2. Find all workers with an ACTIVE policy who haven't had a claim in the last 12 hours
                const activePolicies = await db.all(`
                    SELECT p.*, u.name, u.email 
                    FROM policies p 
                    JOIN users u ON p.user_id = u.id 
                    WHERE p.status = 'Active'
                `);

                for (const policy of activePolicies) {
                    // Check for recent claims to prevent duplicates
                    const recentClaim = await db.get(
                        'SELECT id FROM claims WHERE user_id = ? AND created_at > datetime("now", "-12 hours")',
                        [policy.user_id]
                    );

                    if (!recentClaim) {
                        console.log(`🤖 AUTO-TRIGGER: Creating claim for ${policy.name} due to ${todayRisk.events}`);
                        
                        await db.run(`
                            INSERT INTO claims (
                                user_id, trigger_type, status, payout_amount, 
                                fraud_score, fraud_risk, gps_match, zone, 
                                created_at
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
                            [
                                policy.user_id, 
                                'AI-Triggered', 
                                'Under Review', 
                                1400, 
                                95, 
                                'Low',
                                1,
                                'A4'
                            ]
                        );
                    }
                }
            }
        } catch (err) {
            console.error('❌ Monitor Error:', err);
        }
    }, 30000); // Check every 30 seconds for demo purposes
};
