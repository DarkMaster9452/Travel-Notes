import type { Locale } from "@/lib/i18n";
import { formatNumber } from "@/lib/i18n/format";

/**
 * Distances, heights and durations, in the reader's units.
 *
 * Quests are written in kilometres and metres and stored that way. Imperial is
 * a display choice (`DisplaySettings.units`): the figure is converted here, at
 * the moment it is shown, and nothing is ever stored twice.
 */
export type Units = "METRIC" | "IMPERIAL";

const MILES_PER_KM = 0.621371;
const FEET_PER_METRE = 3.28084;

/** 12.4 → "12,4 km" · "7.7 mi" */
export function formatDistance(locale: Locale, km: number, units: Units = "METRIC"): string {
  if (units === "IMPERIAL") {
    return `${formatNumber(locale, Math.round(km * MILES_PER_KM * 10) / 10)} mi`;
  }
  return `${formatNumber(locale, Math.round(km * 10) / 10)} km`;
}

/** 820 → "820 m" · "2,690 ft" */
export function formatHeight(locale: Locale, metres: number, units: Units = "METRIC"): string {
  if (units === "IMPERIAL") {
    return `${formatNumber(locale, Math.round((metres * FEET_PER_METRE) / 10) * 10)} ft`;
  }
  return `${formatNumber(locale, Math.round(metres))} m`;
}

/** 270 → "4 h 30" · 45 → "45 min". The same in every language. */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}
