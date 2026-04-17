export interface LocationPoint {
    lat: number;
    lng: number;
    timestamp: any;
    isMocked?: boolean;
}

export interface GPSValidationResult {
    isSpoofed: boolean;
    hasSpeedAnomaly: boolean;
    hasTeleportJump: boolean;
    hasHardwareMock: boolean;
    gpsFlag: 'VALID' | 'CITY_MISMATCH' | 'SPOOFED';
    riskScore: number;
    isWithinCity: boolean;
    decisionHint: 'APPROVE' | 'UNDER_REVIEW' | 'REJECT';
    details: string[];
}

// ─── City Center Coordinates ──────────────────────────────────────────────────
const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
    chennai:    { lat: 13.0827, lng: 80.2707 },
    mumbai:     { lat: 19.0760, lng: 72.8777 },
    tirupur:    { lat: 11.1085, lng: 77.3411 },
    tiruppur:   { lat: 11.1085, lng: 77.3411 },
    coimbatore: { lat: 11.0168, lng: 76.9558 },
    delhi:      { lat: 28.6139, lng: 77.2090 },
    bangalore:  { lat: 12.9716, lng: 77.5946 },
    hyderabad:  { lat: 17.3850, lng: 78.4867 },
    kolkata:    { lat: 22.5726, lng: 88.3639 },
    pune:       { lat: 18.5204, lng: 73.8567 },
};

// If user is more than this many km from city center → CITY_MISMATCH
const CITY_RADIUS_KM = 200;

// ─── Haversine Distance (km) ──────────────────────────────────────────────────
const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── Main Validation Function ─────────────────────────────────────────────────
export const analyzeGPSContinuity = (history: LocationPoint[], userCity?: string): GPSValidationResult => {
    const result: GPSValidationResult = {
        isSpoofed:      false,
        hasSpeedAnomaly: false,
        hasTeleportJump: false,
        hasHardwareMock: false,
        gpsFlag:         'VALID',
        riskScore:       5,
        isWithinCity:    true,
        decisionHint:    'APPROVE',
        details:         [],
    };

    // ── No GPS history → cannot verify city ─────────────────────────────────
    if (!history || history.length === 0) {
        if (userCity) {
            result.gpsFlag       = 'CITY_MISMATCH';
            result.riskScore     = 31;
            result.isWithinCity  = false;
            result.decisionHint  = 'UNDER_REVIEW';
            result.details.push('No GPS data received — city cannot be verified.');
        }
        return result;
    }

    // ── 1. Hardware mock check ───────────────────────────────────────────────
    if (history.some(p => p.isMocked === true)) {
        result.hasHardwareMock = true;
        result.isSpoofed       = true;
        result.details.push('Hardware-level GPS mock flag detected.');
    }

    // ── 2. Speed & teleport checks (multi-point) ─────────────────────────────
    const R = 6371e3;
    for (let i = 1; i < history.length; i++) {
        const p1 = history[i - 1];
        const p2 = history[i];

        const dLat = (p2.lat - p1.lat) * Math.PI / 180;
        const dLng = (p2.lng - p1.lng) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
        const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const t1 = typeof p1.timestamp === 'string' ? new Date(p1.timestamp).getTime() : p1.timestamp;
        const t2 = typeof p2.timestamp === 'string' ? new Date(p2.timestamp).getTime() : p2.timestamp;
        const timeDiffSecs = (t2 - t1) / 1000;
        if (timeDiffSecs <= 0) continue;

        const speedKmph = (distance / timeDiffSecs) * 3.6;

        if (speedKmph > 200) {
            result.isSpoofed = true;
            result.details.push(`Impossible speed detected: ${Math.round(speedKmph)} km/h`);
        }
        if (distance > 10000 && timeDiffSecs < 60) {
            result.hasTeleportJump = true;
            result.isSpoofed       = true;
            result.details.push('Teleportation detected: >10km jump in <60s');
        }
    }

    // ── 3. Distance-based city validation ────────────────────────────────────
    if (userCity) {
        const key    = userCity.toLowerCase().trim();
        const center = CITY_CENTERS[key];
        const latest = history[history.length - 1];

        if (center) {
            const distKm = haversineKm(latest.lat, latest.lng, center.lat, center.lng);
            console.log(`[GEO] ${userCity} center is ${Math.round(distKm)}km away (limit: ${CITY_RADIUS_KM}km)`);

            if (distKm > CITY_RADIUS_KM) {
                result.isWithinCity = false;
                result.details.push(
                    `Location is ${Math.round(distKm)}km from ${userCity} — exceeds ${CITY_RADIUS_KM}km limit.`
                );
            } else {
                result.isWithinCity = true;
            }
        } else {
            result.isWithinCity = false;
            result.details.push(`Registered city "${userCity}" is not in the geofence registry.`);
        }
    }

    // ── 4. Final classification ───────────────────────────────────────────────
    if (result.isSpoofed) {
        result.gpsFlag      = 'SPOOFED';
        result.riskScore    = 71;
        result.decisionHint = 'REJECT';
    } else if (!result.isWithinCity) {
        result.gpsFlag      = 'CITY_MISMATCH';
        result.riskScore    = 31;
        result.decisionHint = 'UNDER_REVIEW';
    } else {
        result.gpsFlag      = 'VALID';
        result.riskScore    = 5;
        result.decisionHint = 'APPROVE';
    }

    return result;
};
