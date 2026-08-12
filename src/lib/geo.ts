/**
 * Small offline gazetteer + distance maths.
 *
 * Onboarding resolves a typed home town to coordinates locally rather than
 * calling a geocoding API: no third-party key, no request on the critical
 * signup path, and travel estimates that work offline. Unknown towns simply
 * fall back to region-level estimates.
 */

export type Place = { name: string; region: string; latitude: number; longitude: number };

export const PLACES: Place[] = [
  { name: "Bratislava", region: "Bratislavský kraj", latitude: 48.1486, longitude: 17.1077 },
  { name: "Košice", region: "Košický kraj", latitude: 48.7164, longitude: 21.2611 },
  { name: "Žilina", region: "Žilinský kraj", latitude: 49.2231, longitude: 18.7394 },
  { name: "Banská Bystrica", region: "Banskobystrický kraj", latitude: 48.7395, longitude: 19.1533 },
  { name: "Nitra", region: "Nitriansky kraj", latitude: 48.3069, longitude: 18.0864 },
  { name: "Prešov", region: "Prešovský kraj", latitude: 48.9985, longitude: 21.2339 },
  { name: "Trnava", region: "Trnavský kraj", latitude: 48.3774, longitude: 17.5872 },
  { name: "Trenčín", region: "Trenčiansky kraj", latitude: 48.8945, longitude: 18.0444 },
  { name: "Martin", region: "Žilinský kraj", latitude: 49.0655, longitude: 18.9219 },
  { name: "Poprad", region: "Prešovský kraj", latitude: 49.0558, longitude: 20.2978 },
  { name: "Zvolen", region: "Banskobystrický kraj", latitude: 48.5748, longitude: 19.1263 },
  { name: "Ružomberok", region: "Žilinský kraj", latitude: 49.0785, longitude: 19.3082 },
  { name: "Liptovský Mikuláš", region: "Žilinský kraj", latitude: 49.0808, longitude: 19.6194 },
  { name: "Považská Bystrica", region: "Trenčiansky kraj", latitude: 49.1206, longitude: 18.4239 },
  { name: "Čadca", region: "Žilinský kraj", latitude: 49.4353, longitude: 18.7889 },
  { name: "Dolný Kubín", region: "Žilinský kraj", latitude: 49.2094, longitude: 19.2989 },
  { name: "Banská Štiavnica", region: "Banskobystrický kraj", latitude: 48.4589, longitude: 18.8944 },
  { name: "Levoča", region: "Prešovský kraj", latitude: 49.0219, longitude: 20.5897 },
  { name: "Spišská Nová Ves", region: "Košický kraj", latitude: 48.9439, longitude: 20.5619 },
  { name: "Humenné", region: "Prešovský kraj", latitude: 48.9339, longitude: 21.9081 },
  { name: "Michalovce", region: "Košický kraj", latitude: 48.7544, longitude: 21.9194 },
  { name: "Bardejov", region: "Prešovský kraj", latitude: 49.2917, longitude: 21.2761 },
  { name: "Rožňava", region: "Košický kraj", latitude: 48.6608, longitude: 20.5322 },
  { name: "Lučenec", region: "Banskobystrický kraj", latitude: 48.3319, longitude: 19.6672 },
  { name: "Rimavská Sobota", region: "Banskobystrický kraj", latitude: 48.3806, longitude: 20.0222 },
  { name: "Prievidza", region: "Trenčiansky kraj", latitude: 48.7714, longitude: 18.6247 },
  { name: "Piešťany", region: "Trnavský kraj", latitude: 48.5944, longitude: 17.8264 },
  { name: "Nové Zámky", region: "Nitriansky kraj", latitude: 47.9861, longitude: 18.1614 },
  { name: "Komárno", region: "Nitriansky kraj", latitude: 47.7639, longitude: 18.1289 },
  { name: "Senica", region: "Trnavský kraj", latitude: 48.6800, longitude: 17.3667 },
  { name: "Kysucké Nové Mesto", region: "Žilinský kraj", latitude: 49.3011, longitude: 18.7864 },
  { name: "Brezno", region: "Banskobystrický kraj", latitude: 48.8042, longitude: 19.6394 },
  { name: "Stará Ľubovňa", region: "Prešovský kraj", latitude: 49.2989, longitude: 20.6889 },
  { name: "Snina", region: "Prešovský kraj", latitude: 48.9878, longitude: 22.1508 },
  { name: "Vranov nad Topľou", region: "Prešovský kraj", latitude: 48.8875, longitude: 21.6844 },
  { name: "Topoľčany", region: "Nitriansky kraj", latitude: 48.5606, longitude: 18.1747 },
  { name: "Zlaté Moravce", region: "Nitriansky kraj", latitude: 48.3853, longitude: 18.3986 },
  { name: "Malacky", region: "Bratislavský kraj", latitude: 48.4361, longitude: 17.0222 },
  { name: "Pezinok", region: "Bratislavský kraj", latitude: 48.2894, longitude: 17.2669 },
  { name: "Skalica", region: "Trnavský kraj", latitude: 48.8447, longitude: 17.2264 },
  { name: "Ilava", region: "Trenčiansky kraj", latitude: 48.9975, longitude: 18.2350 },
  { name: "Púchov", region: "Trenčiansky kraj", latitude: 49.1236, longitude: 18.3264 },
  { name: "Námestovo", region: "Žilinský kraj", latitude: 49.4078, longitude: 19.4808 },
  { name: "Tvrdošín", region: "Žilinský kraj", latitude: 49.3364, longitude: 19.5556 },
  { name: "Kežmarok", region: "Prešovský kraj", latitude: 49.1358, longitude: 20.4308 },
  { name: "Detva", region: "Banskobystrický kraj", latitude: 48.5589, longitude: 19.4189 },
  { name: "Krupina", region: "Banskobystrický kraj", latitude: 48.3550, longitude: 19.0653 },
  { name: "Žiar nad Hronom", region: "Banskobystrický kraj", latitude: 48.5906, longitude: 18.8514 },
  { name: "Nové Mesto nad Váhom", region: "Trenčiansky kraj", latitude: 48.7569, longitude: 17.8306 },
  { name: "Partizánske", region: "Trenčiansky kraj", latitude: 48.6272, longitude: 18.3767 },
  { name: "Vienna", region: "Austria", latitude: 48.2082, longitude: 16.3738 },
  { name: "Brno", region: "Czechia", latitude: 49.1951, longitude: 16.6068 },
  { name: "Ostrava", region: "Czechia", latitude: 49.8209, longitude: 18.2625 },
  { name: "Kraków", region: "Poland", latitude: 50.0647, longitude: 19.9450 },
  { name: "Budapest", region: "Hungary", latitude: 47.4979, longitude: 19.0402 },
];

function normalise(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Best-effort lookup for a typed place name. */
export function findPlace(query: string): Place | null {
  if (!query.trim()) return null;
  const q = normalise(query);
  const exact = PLACES.find((p) => normalise(p.name) === q);
  if (exact) return exact;
  const prefix = PLACES.find((p) => normalise(p.name).startsWith(q));
  if (prefix) return prefix;
  return PLACES.find((p) => normalise(p.name).includes(q) || q.includes(normalise(p.name))) ?? null;
}

export function searchPlaces(query: string, limit = 6): Place[] {
  const q = normalise(query);
  if (!q) return PLACES.slice(0, limit);
  return PLACES.filter((p) => normalise(p.name).includes(q) || normalise(p.region).includes(q)).slice(0, limit);
}

/** Great-circle distance in kilometres. */
export function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Straight-line distance underestimates road distance; 1.28 is the usual
 * detour factor for mountain regions.
 */
export const ROAD_DETOUR_FACTOR = 1.28;

export function mapsUrl(latitude: number, longitude: number, label?: string): string {
  const query = encodeURIComponent(label ? `${label} ${latitude},${longitude}` : `${latitude},${longitude}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
