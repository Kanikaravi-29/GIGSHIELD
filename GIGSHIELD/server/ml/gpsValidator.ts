/**
 * GPS Validator Module (Phase 3 AI/ML Anti-Spoofing Integration)
 * 
 * This module simulates a machine learning model that detects GPS spoofing
 * and unrealistic location jumps (teleportation) in gig worker delivery routes.
 */

// Helper to calculate distance between two coordinates in km (Haversine formula)
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export interface LocationPoint {
    lat: number;
    lng: number;
    timestamp: string; // ISO string
}

export interface GPSAnalysisResult {
    isSpoofed: boolean;
    fraudRisk: string;
    confidenceScore: number;
    anomalyDetails: string[];
}

export const analyzeGPSContinuity = (locationHistory: LocationPoint[]): GPSAnalysisResult => {
    // If no history, we can't verify GPS integrity, so we flag it as Medium Risk
    if (!locationHistory || locationHistory.length < 2) {
        return {
            isSpoofed: false,
            fraudRisk: 'Medium', // Lack of data is suspicious but not proof of spoofing
            confidenceScore: 0.5,
            anomalyDetails: ['Insufficient location history for ML analysis']
        };
    }

    let isSpoofed = false;
    let anomalies: string[] = [];
    let maxSpeed = 0;

    for (let i = 1; i < locationHistory.length; i++) {
        const p1 = locationHistory[i - 1];
        const p2 = locationHistory[i];

        const distKm = getDistance(p1.lat, p1.lng, p2.lat, p2.lng);
        const timeDiffMs = new Date(p2.timestamp).getTime() - new Date(p1.timestamp).getTime();
        const timeDiffHours = timeDiffMs / (1000 * 60 * 60);

        // Calculate speed (km/h)
        const speedKph = timeDiffHours > 0 ? distKm / timeDiffHours : 0;
        
        if (speedKph > maxSpeed) {
            maxSpeed = speedKph;
        }

        // Rule 1: Impossible Speed (Teleportation)
        // A delivery worker travelling over 120 km/h in a city is highly anomalous
        if (speedKph > 120) {
            isSpoofed = true;
            anomalies.push(`Anomaly: Unrealistic travel speed detected (${Math.round(speedKph)} km/h)`);
        }

        // Rule 2: Sudden large distance jumps
        // Jumping more than 50km between two adjacent pings in a delivery session is unnatural
        if (distKm > 50) {
            isSpoofed = true;
            anomalies.push(`Anomaly: Sudden location jump of ${Math.round(distKm)} km detected`);
        }
    }

    const confidenceScore = isSpoofed ? 0.98 : 0.85; // High confidence if spoofing detected
    const fraudRisk = isSpoofed ? 'High' : 'Low';

    return {
        isSpoofed,
        fraudRisk,
        confidenceScore,
        anomalyDetails: anomalies.length > 0 ? anomalies : ['No anomalies detected. Travel route is continuous.']
    };
};
