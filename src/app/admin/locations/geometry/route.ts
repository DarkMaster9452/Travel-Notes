import { NextResponse } from "next/server";

import { buildCountryPaths, MAP_HEIGHT, MAP_WIDTH } from "@/lib/admin/world-map";

export const runtime = "nodejs";

/**
 * The detailed country outlines, fetched rather than embedded.
 *
 * The 110m geometry the page renders inline is ~150KB of path data — fine to
 * ship with the HTML, and coarse enough that zooming into one country shows
 * you a polygon with six sides. The 50m set looks right at that zoom but is
 * over a megabyte, which is far too much to put in the RSC payload of every
 * page load.
 *
 * So it comes from here instead: fetched once when the map mounts, cached
 * hard, and shared by every admin. The response is derived entirely from a
 * file in `node_modules` and can never differ between requests, which is what
 * makes `immutable` honest rather than optimistic.
 */
export async function GET() {
  const paths = buildCountryPaths("50m");

  return NextResponse.json(
    { width: MAP_WIDTH, height: MAP_HEIGHT, paths },
    {
      headers: {
        "cache-control": "public, max-age=31536000, immutable",
        // Same projection, same source file, same output — so a conditional
        // request can be answered without re-serialising a megabyte.
        etag: `"countries-50m-${MAP_WIDTH}x${MAP_HEIGHT}"`,
      },
    },
  );
}
