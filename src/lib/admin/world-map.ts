import { geoNaturalEarth1, geoPath, type GeoProjection } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";

import worldTopology from "world-atlas/countries-110m.json";

/**
 * The admin locations map, projected once on the server.
 *
 * `d3-geo` and the topojson data never reach the browser: a Server Component
 * computes the country outlines and each quest's pixel position here, and the
 * client only receives plain path strings and coordinates to draw. That is
 * the difference between a ~2KB script and a map library in the bundle.
 */

export const MAP_WIDTH = 960;
export const MAP_HEIGHT = 500;

let projection: GeoProjection | null = null;
let countryPaths: string[] | null = null;

function ensureBuilt() {
  if (projection && countryPaths) return;

  const topology = worldTopology as unknown as Topology;
  const collection = feature(
    topology,
    topology.objects.countries as GeometryCollection,
  );

  projection = geoNaturalEarth1().fitSize([MAP_WIDTH, MAP_HEIGHT], collection);
  const path = geoPath(projection);
  countryPaths = collection.features
    .map((f) => path(f))
    .filter((d): d is string => Boolean(d));
}

/** The filled outline of every country, as SVG path `d` strings. */
export function getCountryPaths(): string[] {
  ensureBuilt();
  return countryPaths!;
}

/** A lat/lng pair projected to the map's pixel space, or `null` off-map. */
export function projectPoint(lat: number, lng: number): [number, number] | null {
  ensureBuilt();
  const projected = projection!([lng, lat]);
  return projected ? [projected[0], projected[1]] : null;
}
