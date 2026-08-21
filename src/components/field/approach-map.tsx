import { cn } from "@/lib/utils";
import {
  TILE_SIZE,
  bearingLabel,
  distanceMetres,
  fittingZoom,
  formatDistance,
  toTile,
  type Point,
} from "@/lib/quest/approach";

/**
 * Where to leave the car, on a map.
 *
 * Plain OpenStreetMap tiles as ordinary images — no map library, no API key,
 * no JavaScript. A slippy map would let you drag, and dragging is not what
 * anybody does with this: you look at where the car park is relative to the
 * road and the start, and then you close it. Making it static costs the reader
 * nothing and costs the bundle nothing.
 *
 * The tiles come from a third party. If they fail to load — offline, blocked,
 * tile server down — the frame underneath still shows both pins in the right
 * places relative to each other, with the distance and bearing written out, so
 * the card degrades into the schematic it would otherwise have been rather
 * than into an empty box.
 *
 * Attribution is required by OpenStreetMap's terms and is not optional
 * decoration; it stays in the corner of every instance.
 */
/** Past this, the car park and the start are two different journeys. */
const WALKABLE_METRES = 6000;

export function ApproachMap({
  parking,
  start,
  width = 3,
  height = 2,
  className,
}: {
  parking: Point;
  /** The quest itself, when it is somewhere other than the car park. */
  start?: Point | null;
  /** Tiles across and down. Three by two is a card; more is a page. */
  width?: number;
  height?: number;
  className?: string;
}) {
  const pixelWidth = width * TILE_SIZE;
  const pixelHeight = height * TILE_SIZE;

  // A start more than a few kilometres from the car park is not an approach,
  // it is a second drive — almost always a coordinate typed wrong. Framing
  // both would zoom out until neither is legible, so the car park wins and the
  // footer says the two are not near each other rather than drawing a lie.
  const rawApart = start ? distanceMetres(parking, start) : 0;
  const walkable = start && rawApart <= WALKABLE_METRES ? start : null;

  const zoom = fittingZoom(parking, walkable, pixelWidth);

  // Centre on the midpoint when there are two pins, so neither is crowded out.
  const centre: Point = walkable
    ? { lat: (parking.lat + walkable.lat) / 2, lng: (parking.lng + walkable.lng) / 2 }
    : parking;

  const centreTile = toTile(centre, zoom);
  // Top-left tile index, and how far the centre sits into the grid.
  const originX = centreTile.x - width / 2;
  const originY = centreTile.y - height / 2;

  const tiles: { key: string; x: number; y: number; left: number; top: number }[] = [];
  const scale = 2 ** zoom;
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const x = Math.floor(originX) + column;
      const y = Math.floor(originY) + row;
      if (y < 0 || y >= scale) continue;
      tiles.push({
        key: `${x}-${y}`,
        // Wrap round the antimeridian rather than asking for a tile that
        // does not exist.
        x: ((x % scale) + scale) % scale,
        y,
        left: (Math.floor(originX) + column - originX) * TILE_SIZE,
        top: (Math.floor(originY) + row - originY) * TILE_SIZE,
      });
    }
  }

  const place = (point: Point) => {
    const tile = toTile(point, zoom);
    return {
      left: `${((tile.x - originX) / width) * 100}%`,
      top: `${((tile.y - originY) / height) * 100}%`,
    };
  };

  const apart = rawApart;

  return (
    <div className={cn("approach", className)}>
      <div
        className="approach-frame"
        style={{ aspectRatio: `${pixelWidth} / ${pixelHeight}` }}
      >
        <div className="approach-tiles">
          {tiles.map((tile) => (
            /* eslint-disable-next-line @next/next/no-img-element -- a tile
               server, not an asset this build knows about. */
            <img
              key={tile.key}
              src={`https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png`}
              alt=""
              width={TILE_SIZE}
              height={TILE_SIZE}
              loading="lazy"
              style={{
                left: `${(tile.left / pixelWidth) * 100}%`,
                top: `${(tile.top / pixelHeight) * 100}%`,
                width: `${(TILE_SIZE / pixelWidth) * 100}%`,
                height: `${(TILE_SIZE / pixelHeight) * 100}%`,
              }}
            />
          ))}
        </div>

        {walkable && (
          <span className="approach-pin is-start" style={place(walkable)}>
            <i />
            <b>Start</b>
          </span>
        )}
        <span className="approach-pin is-parking" style={place(parking)}>
          <i />
          <b>Park</b>
        </span>

        <span className="approach-credit">
          ©{" "}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
            OpenStreetMap
          </a>
        </span>
      </div>

      <p className="approach-foot">
        {walkable && apart > 40 ? (
          <>
            <b>{formatDistance(apart)}</b> on foot from the car park, heading{" "}
            <b>{bearingLabel(parking, walkable)}</b>.
          </>
        ) : start && apart > WALKABLE_METRES ? (
          <>
            The start is <b>{formatDistance(apart)}</b> away — this is where to leave the car, not
            where the route begins.
          </>
        ) : (
          <>The car park is the start.</>
        )}{" "}
        <a
          href={`https://www.openstreetmap.org/?mlat=${parking.lat}&mlon=${parking.lng}#map=16/${parking.lat}/${parking.lng}`}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Open the map
        </a>
        {" · "}
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${parking.lat},${parking.lng}`}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Directions
        </a>
      </p>
    </div>
  );
}
