/**
 * Getting to the start.
 *
 * Slippy-map tile arithmetic and the small amount of geometry the parking card
 * needs. Pure, so it runs on the server and the numbers arrive in the HTML.
 */

export const TILE_SIZE = 256;

export type Point = { lat: number; lng: number };

/** Web-Mercator tile coordinates, fractional so a pin can sit mid-tile. */
export function toTile(point: Point, zoom: number): { x: number; y: number } {
  const n = 2 ** zoom;
  const latRad = (point.lat * Math.PI) / 180;
  return {
    x: ((point.lng + 180) / 360) * n,
    y:
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  };
}

/** Great-circle distance in metres. Haversine — accurate enough at this scale. */
export function distanceMetres(a: Point, b: Point): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

/** Which way to walk, as somebody would say it out loud. */
export function bearingLabel(from: Point, to: Point): string {
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const degrees = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  return COMPASS[Math.round(degrees / 45) % 8]!;
}

/**
 * A zoom that fits both points comfortably inside the card.
 *
 * Capped at 16 because past that the tiles are all car-park detail and you
 * lose the road you actually turn off, and floored at 11 because a trailhead
 * shown at country scale tells you nothing at all.
 */
export function fittingZoom(a: Point, b: Point | null, widthPx: number): number {
  if (!b) return 15;
  for (let zoom = 16; zoom >= 11; zoom--) {
    const ta = toTile(a, zoom);
    const tb = toTile(b, zoom);
    const dx = Math.abs(ta.x - tb.x) * TILE_SIZE;
    const dy = Math.abs(ta.y - tb.y) * TILE_SIZE;
    // Two-thirds of the card, so neither pin ends up against an edge.
    if (dx < widthPx * 0.66 && dy < widthPx * 0.45) return zoom;
  }
  return 11;
}

/** "1.2 km" / "380 m" — whichever a person would actually say. */
export function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres / 10) * 10} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}
