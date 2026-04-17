/**
 * GPS Simulation Engine for GigShield Hackathon Demo
 */

export interface LocationPoint {
    lat: number;
    lng: number;
    timestamp: number;
    isMocked: boolean;
}

/**
 * Generates realistic or spoofed GPS history
 */
export const generateLocationHistory = (isSpoofed: boolean, baseLat: number = 13.0827, baseLng: number = 80.2707): LocationPoint[] => {
    const history: LocationPoint[] = [];
    const now = Date.now();

    if (!isSpoofed) {
        // CASE 1: Normal Mode (Realistic movement)
        for (let i = 0; i < 5; i++) {
            history.push({
                lat: baseLat + (i * 0.0001), // Small movement
                lng: baseLng + (i * 0.0001),
                timestamp: now - ((5 - i) * 5000), // 5s intervals
                isMocked: false
            });
        }
    } else {
        // CASE 2: Attack Mode (Spoofing)
        // Point 1: Near base
        history.push({
            lat: baseLat,
            lng: baseLng,
            timestamp: now - 15000,
            isMocked: true
        });

        // Point 2: Sudden Jump (Teleportation)
        history.push({
            lat: baseLat + 2.5, // ~250km jump
            lng: baseLng + 1.2,
            timestamp: now - 10000,
            isMocked: true
        });

        // Point 3: Random far point
        history.push({
            lat: 18.5204, // Pune?
            lng: 73.8567,
            timestamp: now - 5000,
            isMocked: true
        });

        // Point 4: Back to base (Impossible speed)
        history.push({
            lat: baseLat,
            lng: baseLng,
            timestamp: now,
            isMocked: true
        });
    }

    return history;
};
