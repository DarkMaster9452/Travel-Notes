"use client";

import * as React from "react";

import { IconMarker } from "@/components/field";
import { cn } from "@/lib/utils";

export type MapPoint = {
  slug: string;
  location: string;
  region: string;
  country: string;
  x: number;
  y: number;
  count: number;
};

type Cluster = {
  key: string;
  x: number;
  y: number;
  count: number;
  items: MapPoint[];
};

type View = { x: number; y: number; w: number; h: number };

const MIN_SCALE = 1;
/** One wheel notch, or one press of the zoom buttons. */
const STEP = 1.4;
/**
 * Deep enough to pull apart peaks a few kilometres apart. The old ceiling of
 * 40× bottomed out while a Slovak range was still a single smudge, which is
 * what "can't zoom enough" meant.
 */
const MAX_SCALE = 400;
/** Points closer than this on screen merge into one pin. */
const CLUSTER_PX = 13;

/** Greedy single-link clustering by on-screen distance. */
function clusterPoints(points: MapPoint[], scale: number): Cluster[] {
  const threshold = CLUSTER_PX / scale;
  const used = new Array(points.length).fill(false);
  const clusters: Cluster[] = [];

  for (let i = 0; i < points.length; i++) {
    if (used[i]) continue;
    const group = [points[i]];
    used[i] = true;
    for (let j = i + 1; j < points.length; j++) {
      if (used[j]) continue;
      if (Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y) <= threshold) {
        group.push(points[j]);
        used[j] = true;
      }
    }
    clusters.push({
      key: group.map((p) => p.slug).join("+"),
      x: group.reduce((sum, p) => sum + p.x, 0) / group.length,
      y: group.reduce((sum, p) => sum + p.y, 0) / group.length,
      count: group.reduce((sum, p) => sum + p.count, 0),
      items: group,
    });
  }
  return clusters;
}

/**
 * The world, with a pin per place a quest has sent someone.
 *
 * Countries are static path strings computed on the server. The page ships
 * the coarse set so the map is there immediately, then this fetches the
 * detailed one and swaps it in — zooming into a country used to show a
 * six-sided polygon, because 110m geometry is drawn for a world view and
 * nothing closer.
 *
 * Clicking a lone pin opens that place: the quests set there, and the
 * submissions people have filed against them. Clicking a cluster zooms in
 * and lists what is underneath, because at world scale two mountains in the
 * same range are a few pixels apart no matter how far you are allowed to
 * zoom.
 */
export function LocationsMap({
  width,
  height,
  countryPaths,
  points,
  onOpen,
}: {
  width: number;
  height: number;
  countryPaths: string[];
  points: MapPoint[];
  /** Opens the detail sheet for a place. */
  onOpen: (slug: string) => void;
}) {
  const [active, setActive] = React.useState<string | null>(null);
  const [view, setView] = React.useState<View>({ x: 0, y: 0, w: width, h: height });
  const [picker, setPicker] = React.useState<MapPoint[] | null>(null);
  const [detailed, setDetailed] = React.useState<string[] | null>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const dragRef = React.useRef<{ x: number; y: number; moved: boolean; view: View } | null>(null);
  const [dragging, setDragging] = React.useState(false);

  const scale = width / view.w;
  const clusters = React.useMemo(() => clusterPoints(points, scale), [points, scale]);
  const maxCount = Math.max(1, ...clusters.map((c) => c.count));
  const activeCluster = clusters.find((c) => c.key === active) ?? null;

  // The detailed coastline, fetched once and cached hard by the browser.
  // Failure is not worth surfacing: the coarse outline is already drawn and
  // the map stays usable, it just stays blocky.
  React.useEffect(() => {
    let cancelled = false;
    fetch("/admin/locations/geometry")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { paths?: string[] } | null) => {
        if (!cancelled && data?.paths?.length) setDetailed(data.paths);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const clampView = React.useCallback(
    (next: View): View => {
      const w = Math.min(width / MIN_SCALE, Math.max(width / MAX_SCALE, next.w));
      const h = w * (height / width);
      return {
        w,
        h,
        x: Math.min(width - w, Math.max(0, next.x)),
        y: Math.min(height - h, Math.max(0, next.y)),
      };
    },
    [width, height],
  );

  const zoomAt = React.useCallback(
    (factor: number, cx: number, cy: number) => {
      setView((current) => {
        const w = current.w / factor;
        const h = current.h / factor;
        return clampView({
          w,
          h,
          x: cx - ((cx - current.x) * w) / current.w,
          y: cy - ((cy - current.y) * h) / current.h,
        });
      });
    },
    [clampView],
  );

  // Wheel-zoom needs a non-passive listener to call preventDefault — React's
  // synthetic onWheel is passive and can't stop the page scrolling under it.
  React.useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = svg.getBoundingClientRect();
      const px = view.x + ((event.clientX - rect.left) / rect.width) * view.w;
      const py = view.y + ((event.clientY - rect.top) / rect.height) * view.h;
      zoomAt(event.deltaY < 0 ? STEP : 1 / STEP, px, py);
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [view, zoomAt]);

  function onPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if ((event.target as Element).closest(".world-map-pin")) return;
    setPicker(null);
    dragRef.current = { x: event.clientX, y: event.clientY, moved: false, view };
    setDragging(true);
    (event.target as Element).setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const drag = dragRef.current;
    if (!drag || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    if (Math.abs(event.clientX - drag.x) > 2 || Math.abs(event.clientY - drag.y) > 2) {
      drag.moved = true;
    }
    setView(
      clampView({
        ...drag.view,
        x: drag.view.x - ((event.clientX - drag.x) / rect.width) * drag.view.w,
        y: drag.view.y - ((event.clientY - drag.y) / rect.height) * drag.view.h,
      }),
    );
  }

  function endDrag() {
    dragRef.current = null;
    setDragging(false);
  }

  const zoomedIn = view.w < width - 0.5;
  const paths = detailed ?? countryPaths;

  return (
    <div className="world-map-wrap">
      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        role="img"
        aria-label="World map of quest locations"
        className={cn("world-map", dragging && "dragging")}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
      >
        <g className="world-map-land">
          {paths.map((d, index) => (
            <path key={index} d={d} />
          ))}
        </g>

        <g className="world-map-pins">
          {clusters.map((cluster) => {
            // Pins keep a constant *screen* size: dividing by the scale is
            // what stops a zoomed-in map being three enormous blobs.
            const radius = (3 + (cluster.count / maxCount) * 3.5) / scale;
            const isActive = active === cluster.key;
            const isGroup = cluster.items.length > 1;
            const solo = cluster.items[0];

            const hover = {
              onPointerEnter: () => setActive(cluster.key),
              onPointerLeave: () =>
                setActive((current) => (current === cluster.key ? null : current)),
              onFocus: () => setActive(cluster.key),
              onBlur: () => setActive((current) => (current === cluster.key ? null : current)),
            };

            const open = () => {
              if (dragRef.current?.moved) return;
              if (isGroup) {
                zoomAt(4, cluster.x, cluster.y);
                setPicker(cluster.items);
              } else {
                setPicker(null);
                onOpen(solo.slug);
              }
            };

            return (
              <g
                key={cluster.key}
                className={cn("world-map-pin", isGroup && "world-map-cluster", isActive && "active")}
                role="button"
                tabIndex={0}
                aria-label={
                  isGroup
                    ? `${cluster.items.length} places here — press to zoom in`
                    : `${solo.location}, ${solo.region} — ${solo.count} quest${solo.count === 1 ? "" : "s"}`
                }
                onClick={open}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    open();
                  }
                }}
                {...hover}
              >
                <circle
                  cx={cluster.x}
                  cy={cluster.y}
                  r={radius + 5 / scale}
                  className="world-map-pin-halo"
                />
                <circle cx={cluster.x} cy={cluster.y} r={radius} className="world-map-pin-dot" />
                {isGroup && (
                  <text
                    x={cluster.x}
                    y={cluster.y}
                    dy="0.35em"
                    className="world-map-cluster-count"
                    style={{ fontSize: 7 / scale }}
                  >
                    {cluster.items.length}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      <div className="world-map-controls">
        <button
          type="button"
          onClick={() => zoomAt(STEP, view.x + view.w / 2, view.y + view.h / 2)}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => zoomAt(1 / STEP, view.x + view.w / 2, view.y + view.h / 2)}
          aria-label="Zoom out"
        >
          −
        </button>
        {zoomedIn && (
          <button
            type="button"
            onClick={() => setView({ x: 0, y: 0, w: width, h: height })}
            className="world-map-reset"
            aria-label="Reset view"
          >
            Reset
          </button>
        )}
      </div>

      {zoomedIn && <span className="world-map-scale">{Math.round(scale)}×</span>}

      {picker && (
        <div className="world-map-picker">
          <div className="world-map-picker-head">
            <span>{picker.length} places here</span>
            <button type="button" onClick={() => setPicker(null)} aria-label="Close">
              ×
            </button>
          </div>
          <ul className="world-map-picker-list">
            {picker.map((point) => (
              <li key={point.slug}>
                <button
                  type="button"
                  onClick={() => {
                    setPicker(null);
                    onOpen(point.slug);
                  }}
                >
                  <b>{point.location}</b>
                  <span>{point.region}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeCluster && !picker && (
        <div
          className="world-map-tooltip"
          style={{
            left: `${((activeCluster.x - view.x) / view.w) * 100}%`,
            top: `${((activeCluster.y - view.y) / view.h) * 100}%`,
          }}
        >
          {activeCluster.items.length === 1 ? (
            <>
              <b>
                <IconMarker className="world-map-tooltip-icon" />
                {activeCluster.items[0].location}
              </b>
              <span>
                {activeCluster.items[0].region}, {activeCluster.items[0].country}
              </span>
              <span className="world-map-tooltip-count">
                {activeCluster.count} quest{activeCluster.count === 1 ? "" : "s"} · click to open
              </span>
            </>
          ) : (
            <>
              <b>
                <IconMarker className="world-map-tooltip-icon" />
                {activeCluster.items.length} places
              </b>
              <span>{activeCluster.items.map((p) => p.location).slice(0, 4).join(", ")}</span>
              <span className="world-map-tooltip-count">Click to zoom in</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
