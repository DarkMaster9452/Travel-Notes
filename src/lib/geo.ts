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

/* -------------------------------------------------------------------------- */
/* Countries                                                                   */
/* -------------------------------------------------------------------------- */

export type Country = {
  /** ISO 3166-1 alpha-2, used as the stored value. */
  code: string;
  name: string;
  /** A point near the middle of the country. Quests are measured from here. */
  latitude: number;
  longitude: number;
  europe: boolean;
};

/**
 * Where an account says it is.
 *
 * Settings used to ask for a town, a difficulty, a time budget and a travel
 * radius before the generator would say anything. It asks for a country now
 * and nothing else: the rest were decisions the product exists to take off
 * you, and a town was more precision than a quest catalogue at this scale can
 * honour anyway.
 *
 * The coordinates are a rough national centre, not a home address — the
 * safety notice promises no addresses and no exact coordinates, and choosing
 * a country rather than a street is what keeps that true by construction.
 *
 * `europe` drives the plan gate: Explorer reaches this set, Ultra reaches all
 * of it.
 */
export const COUNTRIES: Country[] = [
  { code: "SK", name: "Slovakia", latitude: 48.669, longitude: 19.699, europe: true },
  { code: "CZ", name: "Czechia", latitude: 49.817, longitude: 15.473, europe: true },
  { code: "AT", name: "Austria", latitude: 47.516, longitude: 14.550, europe: true },
  { code: "PL", name: "Poland", latitude: 51.919, longitude: 19.145, europe: true },
  { code: "HU", name: "Hungary", latitude: 47.162, longitude: 19.503, europe: true },
  { code: "DE", name: "Germany", latitude: 51.166, longitude: 10.452, europe: true },
  { code: "CH", name: "Switzerland", latitude: 46.818, longitude: 8.228, europe: true },
  { code: "IT", name: "Italy", latitude: 41.872, longitude: 12.567, europe: true },
  { code: "SI", name: "Slovenia", latitude: 46.151, longitude: 14.995, europe: true },
  { code: "HR", name: "Croatia", latitude: 45.100, longitude: 15.200, europe: true },
  { code: "RO", name: "Romania", latitude: 45.943, longitude: 24.967, europe: true },
  { code: "BG", name: "Bulgaria", latitude: 42.733, longitude: 25.486, europe: true },
  { code: "RS", name: "Serbia", latitude: 44.017, longitude: 21.006, europe: true },
  { code: "FR", name: "France", latitude: 46.228, longitude: 2.214, europe: true },
  { code: "ES", name: "Spain", latitude: 40.464, longitude: -3.749, europe: true },
  { code: "PT", name: "Portugal", latitude: 39.400, longitude: -8.224, europe: true },
  { code: "GB", name: "United Kingdom", latitude: 55.378, longitude: -3.436, europe: true },
  { code: "IE", name: "Ireland", latitude: 53.413, longitude: -8.244, europe: true },
  { code: "NL", name: "Netherlands", latitude: 52.133, longitude: 5.291, europe: true },
  { code: "BE", name: "Belgium", latitude: 50.503, longitude: 4.470, europe: true },
  { code: "NO", name: "Norway", latitude: 60.472, longitude: 8.469, europe: true },
  { code: "SE", name: "Sweden", latitude: 60.128, longitude: 18.644, europe: true },
  { code: "FI", name: "Finland", latitude: 61.924, longitude: 25.748, europe: true },
  { code: "DK", name: "Denmark", latitude: 56.264, longitude: 9.502, europe: true },
  { code: "IS", name: "Iceland", latitude: 64.963, longitude: -19.021, europe: true },
  { code: "GR", name: "Greece", latitude: 39.074, longitude: 21.824, europe: true },
  { code: "UA", name: "Ukraine", latitude: 48.379, longitude: 31.166, europe: true },

  { code: "US", name: "United States", latitude: 39.828, longitude: -98.579, europe: false },
  { code: "CA", name: "Canada", latitude: 56.130, longitude: -106.347, europe: false },
  { code: "MX", name: "Mexico", latitude: 23.635, longitude: -102.553, europe: false },
  { code: "AR", name: "Argentina", latitude: -38.416, longitude: -63.617, europe: false },
  { code: "CL", name: "Chile", latitude: -35.675, longitude: -71.543, europe: false },
  { code: "BR", name: "Brazil", latitude: -14.235, longitude: -51.925, europe: false },
  { code: "PE", name: "Peru", latitude: -9.190, longitude: -75.015, europe: false },
  { code: "NZ", name: "New Zealand", latitude: -40.900, longitude: 174.886, europe: false },
  { code: "AU", name: "Australia", latitude: -25.274, longitude: 133.775, europe: false },
  { code: "JP", name: "Japan", latitude: 36.205, longitude: 138.253, europe: false },
  { code: "NP", name: "Nepal", latitude: 28.394, longitude: 84.124, europe: false },
  { code: "ZA", name: "South Africa", latitude: -30.559, longitude: 22.937, europe: false },
  { code: "MA", name: "Morocco", latitude: 31.792, longitude: -7.093, europe: false },
];

/** Native and common names, so a stored "Slovensko" or "Deutschland" resolves. */
const COUNTRY_ALIASES: Record<string, string> = {
  slovensko: "SK",
  cesko: "CZ",
  ceska_republika: "CZ",
  osterreich: "AT",
  polska: "PL",
  magyarorszag: "HU",
  deutschland: "DE",
  schweiz: "CH",
  suisse: "CH",
  italia: "IT",
  slovenija: "SI",
  hrvatska: "HR",
  romania: "RO",
  balgariya: "BG",
  srbija: "RS",
  espana: "ES",
  uk: "GB",
  britain: "GB",
  "great britain": "GB",
  eire: "IE",
  nederland: "NL",
  belgie: "BE",
  norge: "NO",
  sverige: "SE",
  suomi: "FI",
  danmark: "DK",
  island: "IS",
  ellada: "GR",
  greece: "GR",
  ukrayina: "UA",
  usa: "US",
  america: "US",
  "united states of america": "US",
};

export function findCountry(nameOrCode: string): Country | null {
  const q = normalise(nameOrCode);
  if (!q) return null;
  const direct = COUNTRIES.find((c) => normalise(c.code) === q || normalise(c.name) === q);
  if (direct) return direct;

  const aliased = COUNTRY_ALIASES[q] ?? COUNTRY_ALIASES[q.replace(/\s+/g, "_")];
  return aliased ? (COUNTRIES.find((c) => c.code === aliased) ?? null) : null;
}

/**
 * Resolve whatever is stored in `homeLocation` to a country.
 *
 * Accounts created before the chooser existed hold a *town* there, because
 * settings used to ask for one. Rather than migrate the column and guess at
 * rows we can't resolve, the town is mapped through the places gazetteer to
 * its region and from there to a country — so an old account opens the
 * settings page with the right thing already selected instead of an empty
 * picker that silently loses where it set out from.
 */
export function countryForStoredLocation(stored: string | null | undefined): Country | null {
  if (!stored) return null;

  const direct = findCountry(stored);
  if (direct) return direct;

  const place = findPlace(stored);
  if (!place) return null;

  // Slovak regions are all "<something> kraj"; the foreign entries in the
  // gazetteer carry their country as the region outright.
  if (/kraj$/i.test(place.region)) return findCountry("SK");
  return findCountry(place.region);
}

/** The countries a plan is allowed to set out from. */
export function countriesFor(canGoWorldwide: boolean): Country[] {
  return canGoWorldwide ? COUNTRIES : COUNTRIES.filter((c) => c.europe);
}
