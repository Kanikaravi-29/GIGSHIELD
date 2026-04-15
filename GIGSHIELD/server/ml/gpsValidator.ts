export interface LocationPoint {
    lat: number;
    lng: number;
    timestamp: number;
}

export const analyzeGPSContinuity = (history: LocationPoint[]) => {
    if (!history || history.length < 2) return { isSpoofed: false };

    const R = 6371e3; // Earth radius in meters
    let isSpoofed = false;
    let anomalyDetails = '';

    for (let i = 1; i < history.length; i++) {
        const p1 = history[i - 1];
        const p2 = history[i];

        const dLat = (p2.lat - p1.lat) * Math.PI / 180;
        const dLng = (p2.lng - p1.lng) * Math.PI / 180;

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // meters

        const timeDiffSecs = (p2.timestamp - p1.timestamp) / 1000;
        const speedKmph = (distance / timeDiffSecs) * 3.6;

        // If moving faster than 150 km/h, flag as teleportation/spoofed
        if (speedKmph > 150) {
            isSpoofed = true;
            anomalyDetails = `Impossible speed detected: ${Math.round(speedKmph)} km/h`;
            break;
        }
    }

    return { isSpoofed, anomalyDetails };
};
