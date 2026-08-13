import { getImage } from "@/lib/images";
import { LOCATIONS, type LocationEntry } from "@/lib/quest/locations";
import { titleCase } from "@/lib/utils";

/**
 * The browsable view of the generator's raw material.
 *
 * Every row here is a place the engine can send you, described by the band it
 * supports rather than a fixed route — which is why a row carries a distance
 * *range* and a set of difficulties instead of one of each. Nothing is
 * persisted: the catalogue is the `LOCATIONS` table projected for display, so
 * it can never disagree with what generation actually draws from.
 */

export type DurationBucket = "half-day" | "full-day" | "multi-day";

export const DURATION_LABEL: Record<DurationBucket, string> = {
  "half-day": "Half-day",
  "full-day": "Full-day",
  "multi-day": "Multi-day",
};

export type CatalogueEntry = {
  id: string;
  name: string;
  region: string;
  country: string;
  description: string;
  difficulties: LocationEntry["difficulties"];
  /** Hardest difficulty the terrain supports — what the row chip shows. */
  topDifficulty: LocationEntry["difficulties"][number];
  distanceBand: [number, number];
  duration: DurationBucket;
  terrain: string[];
  features: string[];
  coverImage: string;
  palette: readonly [string, string, string];
};

/**
 * Naismith's rule on the top of the distance band, matching how the engine
 * derives duration, so the bucket a row advertises is one the generator can
 * actually produce for that place.
 */
function durationFor(location: LocationEntry): DurationBucket {
  const [, maxKm] = location.distanceBand;
  const [, maxUp] = location.elevationBand;
  const technical = location.terrain.some((t) => t === "gorge" || t === "rocks") ? 1.12 : 1;
  const minutes = (maxKm * 12 + (maxUp / 100) * 10) * technical;
  if (minutes <= 240) return "half-day";
  if (minutes <= 480) return "full-day";
  return "multi-day";
}

function toEntry(location: LocationEntry): CatalogueEntry {
  const image = getImage(location.imageKeys[0]);
  return {
    id: location.id,
    name: location.name,
    region: location.region,
    country: location.country,
    // `character` is written as a clause to be dropped into prose, so it needs
    // a capital letter and a full stop to stand alone in a table cell.
    description: `${location.character.charAt(0).toUpperCase()}${location.character.slice(1)}.`,
    difficulties: location.difficulties,
    topDifficulty: location.difficulties[location.difficulties.length - 1]!,
    distanceBand: location.distanceBand,
    duration: durationFor(location),
    terrain: location.terrain,
    features: location.features,
    coverImage: image.src,
    palette: image.palette,
  };
}

export function getCatalogue(): CatalogueEntry[] {
  return LOCATIONS.map(toEntry).sort((a, b) => a.name.localeCompare(b.name));
}

/** Distinct filter values, derived from the catalogue so they can't go stale. */
export function getCatalogueFilters(entries: CatalogueEntry[]) {
  const countries = [...new Set(entries.map((e) => e.country))].sort();
  const difficulties = [...new Set(entries.flatMap((e) => e.difficulties))];
  const durations = [...new Set(entries.map((e) => e.duration))];
  return { countries, difficulties, durations };
}

export function terrainSummary(entry: CatalogueEntry): string {
  return entry.terrain.slice(0, 3).map(titleCase).join(" · ");
}
