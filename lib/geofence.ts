/**
 * Geofencing utilities for attendance validation using polygon-based geofencing
 */

// Valid attendance area polygon (corners of the allowed area)
// Coordinates are in [latitude, longitude] format
const GEOFENCE_POLYGON: [number, number][] = [
    [14.573610318912571, 121.1320435069814],
    [14.573222311086639, 121.1318238188274],
    [14.573197585998372, 121.13182038657817],
    [14.572646890524354, 121.13155630753892],
    [14.57252810049009, 121.13239591132202],
    [14.57310541395725, 121.1329594813601],
];

// Temporary allowed coordinates (e.g. for events or testing)
// [latitude, longitude, radiusInMeters]
const SPECIAL_AREAS: [number, number, number][] = [
    [14.621587, 121.088182, 100], // Temporary area requested by user
];

// Remove duplicate points
const UNIQUE_POLYGON = GEOFENCE_POLYGON.filter(
    (point, index, self) =>
        index === 0 ||
        point[0] !== self[index - 1][0] ||
        point[1] !== self[index - 1][1]
);

/**
 * Check if a point is inside a polygon using ray-casting algorithm
 * @param lat Point latitude
 * @param lon Point longitude
 * @param polygon Array of [lat, lon] coordinates defining the polygon
 * @returns true if point is inside polygon, false otherwise
 */
function isPointInPolygon(
    lat: number,
    lon: number,
    polygon: [number, number][]
): boolean {
    let inside = false;
    const n = polygon.length;

    for (let i = 0, j = n - 1; i < n; j = i++) {
        const [lat1, lon1] = polygon[i];
        const [lat2, lon2] = polygon[j];

        // Check if point is on the edge (ray crosses the edge)
        const intersect =
            lon1 > lon !== lon2 > lon &&
            lat < ((lat2 - lat1) * (lon - lon1)) / (lon2 - lon1) + lat1;

        if (intersect) inside = !inside;
    }

    return inside;
}

/**
 * Calculate distance between two points in meters using Haversine formula
 */
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Check if a scan location is within the valid geofence area
 * @param scanLat Scan latitude in degrees
 * @param scanLon Scan longitude in degrees
 * @returns Object with isWithin boolean
 */
export function isWithinGeofence(
    scanLat: number,
    scanLon: number
): { isWithin: boolean } {
    // 1. Check main campus polygon
    const inPolygon = isPointInPolygon(scanLat, scanLon, UNIQUE_POLYGON);
    if (inPolygon) return { isWithin: true };

    // 2. Check special/temporary areas
    for (const [areaLat, areaLon, radius] of SPECIAL_AREAS) {
        const distance = getDistance(scanLat, scanLon, areaLat, areaLon);
        if (distance <= radius) return { isWithin: true };
    }

    return { isWithin: false };
}

/**
 * Get the configured geofence polygon
 * @returns Array of [lat, lon] coordinates
 */
export function getGeofencePolygon(): [number, number][] {
    return UNIQUE_POLYGON;
}

/**
 * Check if geofencing is enabled
 * @returns true if geofencing is configured
 */
export function isGeofencingEnabled(): boolean {
    return UNIQUE_POLYGON.length >= 3; // Need at least 3 points for a polygon
}
