import { analyzeGPSContinuity } from './server/ml/gpsValidator.js';

/**
 * GigShield System Validator
 * This script simulates the backend logic to verify GPS spoofing and geofencing.
 */

const CITIES = {
    CHENNAI: { lat: [12.8, 13.2], lng: [80.0, 80.4] },
    MUMBAI: { lat: [18.8, 19.3], lng: [72.7, 73.0] },
    TIRUPUR: { lat: [10.9, 11.3], lng: [77.1, 77.5] }
};

interface TestResult {
    name: string;
    isSpoofed: boolean;
    cityMatch: boolean;
    fraudScore: number;
    status: 'Approved' | 'Rejected';
    details: string;
}

const checkCityMatch = (lat: number, lng: number, city: string) => {
    const bounds = CITIES[city.toUpperCase() as keyof typeof CITIES];
    if (!bounds) return false;
    return (lat >= bounds.lat[0] && lat <= bounds.lat[1] && lng >= bounds.lng[0] && lng <= bounds.lng[1]);
};

// Simplified Fraud Scorer (Replicates the logic in fraudScorer.ts)
const calculateMockFraudScore = (isSpoofed: boolean, isRooted: boolean, cityMatch: boolean) => {
    let score = 10; // Base score
    if (isSpoofed) score += 60;
    if (isRooted) score += 25;
    if (!cityMatch) score += 100; // City mismatch is an immediate disqualifier
    return Math.min(100, score);
};

const runSimulation = async () => {
    console.log('🚀 INITIALIZING GIGSHIELD GPS VALIDATION SUITE\n');

    const now = Date.now();
    const scenarios = [
        {
            name: "SCENARIO 1: Normal Movement (Chennai)",
            history: [
                { lat: 13.0827, lng: 80.2707, timestamp: new Date(now - 1000 * 60 * 10).toISOString() },
                { lat: 13.0830, lng: 80.2710, timestamp: now }
            ],
            userCity: "Chennai",
            isRooted: false
        },
        {
            name: "SCENARIO 2: GPS Teleportation Jump (Chennai -> Mumbai)",
            history: [
                { lat: 13.0827, lng: 80.2707, timestamp: new Date(now - 1000 * 60 * 5).toISOString() },
                { lat: 19.0760, lng: 72.8777, timestamp: now } // 1000+ km jump in 5 mins
            ],
            userCity: "Chennai",
            isRooted: false
        },
        {
            name: "SCENARIO 3: Hardware Compromise (Valid Loc + Rooted)",
            history: [
                { lat: 13.0827, lng: 80.2707, timestamp: new Date(now - 1000 * 60 * 5).toISOString() },
                { lat: 13.0829, lng: 80.2708, timestamp: now }
            ],
            userCity: "Chennai",
            isRooted: true
        },
        {
            name: "SCENARIO 4: City Mismatch (User in Chennai, GPS in Tirupur)",
            history: [
                { lat: 11.0124, lng: 77.3398, timestamp: now }
            ],
            userCity: "Chennai",
            isRooted: false
        }
    ];

    for (const s of scenarios) {
        console.log(`--- ${s.name} ---`);
        
        const latestPoint = s.history[s.history.length - 1];
        const gpsAnalysis = analyzeGPSContinuity(s.history);
        const cityMatch = checkCityMatch(latestPoint.lat, latestPoint.lng, s.userCity);
        const fraudScore = calculateMockFraudScore(gpsAnalysis.isSpoofed, s.isRooted, cityMatch);
        
        let status = (cityMatch && !gpsAnalysis.isSpoofed) ? 'Approved' : 'Rejected';

        console.log(`📍 Latest Loc: ${latestPoint.lat.toFixed(4)}, ${latestPoint.lng.toFixed(4)}`);
        console.log(`🏙️ City Match [${s.userCity}]: ${cityMatch ? '✅' : '❌'}`);
        console.log(`🚀 Spoofing Detected: ${gpsAnalysis.isSpoofed ? '🚩 YES' : 'CLEAN'}`);
        if (gpsAnalysis.isSpoofed) console.log(`   └ Details: ${gpsAnalysis.anomalyDetails}`);
        console.log(`🛡️ Hardware Integrity: ${s.isRooted ? '❌ ROOTED' : '✅ SECURE'}`);
        console.log(`🧠 AI Fraud Score: ${fraudScore}/100`);
        console.log(`⚖️ FINAL DETERMINATION: ${status}\n`);
    }
    
    console.log('✅ VALIDATION COMPLETE.');
};

runSimulation();
