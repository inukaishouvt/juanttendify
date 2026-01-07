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
 * Check if a scan location is within the valid geofence area
 * @param scanLat Scan latitude in degrees
 * @param scanLon Scan longitude in degrees
 * @returns Object with isWithin boolean
 */
export function isWithinGeofence(
    scanLat: number,
    scanLon: number
): { isWithin: boolean } {
    const isWithin = isPointInPolygon(scanLat, scanLon, UNIQUE_POLYGON);
    return { isWithin };
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
