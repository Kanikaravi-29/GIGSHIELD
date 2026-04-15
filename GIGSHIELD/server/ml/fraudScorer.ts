/**
 * Fraud Scoring Engine (Phase 3 AI Integration)
 * 
 * This module calculates a unified 0-100 risk score for individual claims
 * based on multiple weighted risk signals.
 */

interface FraudFactors {
    isGpsSpoofed: boolean;
    recentClaimsCount: number;
    incomeRatio: number;
    isDeviceCompromised?: boolean;
}

export const calculateClaimFraudScore = (factors: FraudFactors): number => {
    let score = 0;

    // Signal 1: GPS Spoofing (Critical - Weight: 50)
    // If GPS is spoofed, it's an immediate high risk
    if (factors.isGpsSpoofed) {
        score += 50;
    }

    // Signal 2: Claim Velocity (Weight: 25)
    // Frequency of claims in the last 24 hours
    // 0 claims = 0 points, 10+ claims = 25 points
    const velocityScore = Math.min(25, (factors.recentClaimsCount / 10) * 25);
    score += velocityScore;

    // Signal 3: Income Ratio Anomaly (Weight: 25)
    // If payout is > 150% of daily income, it's suspicious
    // Ratio 1.0 = 0 points, Ratio 2.0+ = 25 points
    if (factors.incomeRatio > 1) {
        const ratioExcess = Math.max(0, factors.incomeRatio - 1);
        const ratioScore = Math.min(25, ratioExcess * 25);
        score += ratioScore;
    }

    // Baseline natural risk (Random noise 0-5 to simulate variations)
    const noise = Math.floor(Math.random() * 5);
    score += noise;

    return Math.min(100, Math.round(score));
};

export const getRiskLabel = (score: number): string => {
    if (score > 70) return 'High';
    if (score > 35) return 'Medium';
    return 'Low';
};
