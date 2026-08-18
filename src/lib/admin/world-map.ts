import { geoNaturalEarth1, geoPath, type GeoProjection } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";

import world110m from "world-atlas/countries-110m.json";

/**
 * The admin locations map, projected once on the server.
 *
 * `d3-geo` and the topojson data never reach the browser: the projection and
 * the country outlines are computed here, and the client only receives plain
 * path strings and pixel coordinates to draw. That is the difference between
 * a ~2KB script and a map library in the bundle.
 *
 * Two resolutions, for two different jobs:
 *
 *   110m  ~150KB of path data. Embedded in the page, so the map is there on
 *         first paint. Fine at world scale, visibly polygonal once you zoom.
 *   50m   over a megabyte. Far too much for an RSC payload, so it is served
 *         from `/admin/locations/geometry` and swapped in once fetched.
 *
 * Both use the same projection fitted to the same box, so a pin computed
 * against one lands in the right place on the other and the swap is invisible
 * apart from the coastline getting finer.
 */

export const MAP_WIDTH = 960;
export const MAP_HEIGHT = 500;

/** Sub-pixel precision at this size; the extra digits are pure payload. */
const COORD_DIGITS = 1;

let projection: GeoProjection | null = null;
let basePaths: string[] | null = null;

function collectionFrom(topology: Topology) {
  return feature(topology, topology.objects.countries as GeometryCollection);
}

function ensureBuilt() {
  if (projection && basePaths) return;

  const collection = collectionFrom(world110m as unknown as Topology);
  projection = geoNaturalEarth1().fitSize([MAP_WIDTH, MAP_HEIGHT], collection);

  basePaths = renderPaths(collection, projection);
}

function renderPaths(
  collection: ReturnType<typeof collectionFrom>,
  fitted: GeoProjection,
): string[] {
  const path = geoPath(fitted).digits(COORD_DIGITS);
  return collection.features.map((f) => path(f)).filter((d): d is string => Boolean(d));
}

/** The outline of every country at the resolution embedded in the page. */
export function getCountryPaths(): string[] {
  ensureBuilt();
  return basePaths!;
}

/**
 * Build outlines at a given resolution against the *same* fitted projection
 * as the embedded set, so the two are interchangeable.
 *
 * Only called from the geometry route. The heavy topojson file is required
 * lazily so importing this module from a page doesn't pull a megabyte into
 * that page's server bundle.
 */
export function buildCountryPaths(resolution: "50m" | "10m"): string[] {
  ensureBuilt();
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy by design; see above
  const topology = require(`world-atlas/countries-${resolution}.json`) as Topology;
  return renderPaths(collectionFrom(topology), projection!);
}

/** A lat/lng pair projected to the map's pixel space, or `null` off-map. */
export function projectPoint(lat: number, lng: number): [number, number] | null {
  ensureBuilt();
  const projected = projection!([lng, lat]);
  return projected ? [projected[0], projected[1]] : null;
}
