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
/** How far in a click of the zoom-in button, or one wheel notch, goes. */
const STEP = 1.35;
const MAX_SCALE = 40;
/** Points within this many screen pixels of each other merge into one pin.
 * Slovak quests often sit a few kilometres apart in the same range, which is
 * still a handful of pixels apart at any sane map zoom — a cluster with a
 * count is the honest way to show that, the way any real map does. */
const CLUSTER_PX = 15;

/** Greedy single-link clustering by on-screen distance, recomputed as the
 * view changes so pins split apart the further in an admin zooms. */
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
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      if (Math.hypot(dx, dy) <= threshold) {
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
 * The world, drawn once, with a pin per place a quest has sent someone.
 *
 * The countries are a static path list computed on the server — this
 * component only ever draws them and reacts to the pointer. Clicking a lone
 * pin jumps to that row in the table below via its id, the same trick a
 * table of contents uses, so there is no state to keep in sync between the
 * map and the table. Clicking a cluster zooms in on it instead — the same
 * two-step every map does, because at a world scale two mountains in the
 * same range are a few pixels apart no matter how far you're allowed to zoom.
 */
export function LocationsMap({
  width,
  height,
  countryPaths,
  points,
}: {
  width: number;
  height: number;
  countryPaths: string[];
  points: MapPoint[];
}) {
  const [active, setActive] = React.useState<string | null>(null);
  const [view, setView] = React.useState<View>({ x: 0, y: 0, w: width, h: height });
  const [picker, setPicker] = React.useState<MapPoint[] | null>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const dragRef = React.useRef<{ x: number; y: number; moved: boolean; view: View } | null>(null);
  const [dragging, setDragging] = React.useState(false);

  const scale = width / view.w;
  const clusters = React.useMemo(() => clusterPoints(points, scale), [points, scale]);
  const maxCount = Math.max(1, ...clusters.map((c) => c.count));
  const activeCluster = clusters.find((c) => c.key === active) ?? null;

  const clampView = React.useCallback(
    (next: View): View => {
      const w = Math.min(width / MIN_SCALE, Math.max(width / MAX_SCALE, next.w));
      const h = w * (height / width);
      const x = Math.min(width - w, Math.max(0, next.x));
      const y = Math.min(height - h, Math.max(0, next.y));
      return { x, y, w, h };
    },
    [width, height],
  );

  const zoomAt = React.useCallback(
    (factor: number, cx: number, cy: number) => {
      setView((current) => {
        const w = current.w / factor;
        const h = current.h / factor;
        const x = cx - ((cx - current.x) * w) / current.w;
        const y = cy - ((cy - current.y) * h) / current.h;
        return clampView({ x, y, w, h });
      });
    },
    [clampView],
  );

  // Wheel-zoom needs a non-passive listener to call preventDefault — React's
  // synthetic onWheel is passive by default and can't stop the page under it
  // from scrolling while the cursor is over the map.
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
    const dx = ((event.clientX - drag.x) / rect.width) * drag.view.w;
    const dy = ((event.clientY - drag.y) / rect.height) * drag.view.h;
    if (Math.abs(event.clientX - drag.x) > 2 || Math.abs(event.clientY - drag.y) > 2) {
      drag.moved = true;
    }
    setView(clampView({ ...drag.view, x: drag.view.x - dx, y: drag.view.y - dy }));
  }

  function endDrag() {
    dragRef.current = null;
    setDragging(false);
  }

  function reset() {
    setView({ x: 0, y: 0, w: width, h: height });
  }

  const zoomedIn = view.w < width - 0.5;

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
          {countryPaths.map((d, index) => (
            <path key={index} d={d} />
          ))}
        </g>

        <g className="world-map-pins">
          {clusters.map((cluster) => {
            const radius = (4 + (cluster.count / maxCount) * 6) / scale;
            const isActive = active === cluster.key;
            const isGroup = cluster.items.length > 1;
            const solo = cluster.items[0];

            const shared = {
              onPointerEnter: () => setActive(cluster.key),
              onPointerLeave: () =>
                setActive((current) => (current === cluster.key ? null : current)),
              onFocus: () => setActive(cluster.key),
              onBlur: () => setActive((current) => (current === cluster.key ? null : current)),
            };

            if (isGroup) {
              return (
                <g
                  key={cluster.key}
                  className={cn("world-map-pin world-map-cluster", isActive && "active")}
                  role="button"
                  tabIndex={0}
                  aria-label={`${cluster.items.length} places here, ${cluster.count} quests — press to zoom in and list them`}
                  onClick={() => {
                    zoomAt(4, cluster.x, cluster.y);
                    setPicker(cluster.items);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      zoomAt(4, cluster.x, cluster.y);
                      setPicker(cluster.items);
                    }
                  }}
                  {...shared}
                >
                  <circle
                    cx={cluster.x}
                    cy={cluster.y}
                    r={radius + 8 / scale}
                    className="world-map-pin-halo"
                  />
                  <circle cx={cluster.x} cy={cluster.y} r={radius + 2 / scale} className="world-map-pin-dot" />
                  <text
                    x={cluster.x}
                    y={cluster.y}
                    dy="0.35em"
                    className="world-map-cluster-count"
                    style={{ fontSize: 9 / scale }}
                  >
                    {cluster.items.length}
                  </text>
                </g>
              );
            }

            return (
              <a
                key={cluster.key}
                href={`#${solo.slug}`}
                className={cn("world-map-pin", isActive && "active")}
                aria-label={`${solo.location}, ${solo.region} — ${solo.count} quest${solo.count === 1 ? "" : "s"}`}
                onClick={(event) => {
                  if (dragRef.current?.moved) event.preventDefault();
                  else setPicker(null);
                }}
                {...shared}
              >
                <circle
                  cx={cluster.x}
                  cy={cluster.y}
                  r={radius + 6 / scale}
                  className="world-map-pin-halo"
                />
                <circle cx={cluster.x} cy={cluster.y} r={radius} className="world-map-pin-dot" />
              </a>
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
          <button type="button" onClick={reset} className="world-map-reset" aria-label="Reset view">
            Reset
          </button>
        )}
      </div>

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
                <a href={`#${point.slug}`} onClick={() => setPicker(null)}>
                  <b>{point.location}</b>
                  <span>{point.region}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeCluster && (
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
                {activeCluster.count} quest{activeCluster.count === 1 ? "" : "s"}
              </span>
            </>
          ) : (
            <>
              <b>
                <IconMarker className="world-map-tooltip-icon" />
                {activeCluster.items.length} places
              </b>
              <span>{activeCluster.items.map((p) => p.location).slice(0, 4).join(", ")}</span>
              <span className="world-map-tooltip-count">Click to zoom in and list them</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
