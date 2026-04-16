

export interface FraudFactors {
    weatherMatch: boolean;    // Weather/Platform Trigger
    gpsConsistent: boolean;   // GPS Location Consistency
    patternMatch: boolean;    // Activity Pattern Match
    deviceIntegrity: boolean; // Device Integrity Check
}

export const calculateFraudScore = (factors: FraudFactors): number => {
    let score = 0;

    if (!factors.weatherMatch) score += 35;
    if (!factors.gpsConsistent) score += 25;
    if (!factors.patternMatch) score += 20;
    if (!factors.deviceIntegrity) score += 20;

    return Math.min(score, 100);
};