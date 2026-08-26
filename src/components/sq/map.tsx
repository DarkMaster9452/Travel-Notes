"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useRef, useState } from "react";

import { useReducedMotion } from "@/components/sq/motion";

export type MapPoint = {
  lat: number;
  lng: number;
  label: string;
  /** `start` and `summit` are drawn differently; `stop` is a plain trailhead. */
  kind?: "start" | "summit" | "stop";
  href?: string;
};

/**
 * A real Leaflet map on OpenStreetMap tiles.
 *
 * Loaded lazily and only in the browser — Leaflet touches `window` at import
 * time, so it cannot be part of the server bundle. The container fades in when
 * the tiles have actually finished loading rather than when the widget mounts,
 * which is the difference between a map appearing and a grey box appearing.
 *
 * The route between two points draws itself once, on first view. Satellite
 * imagery is not used anywhere: there is no provider for it.
 */
export function SqMap({
  points,
  height = 176,
  zoom,
  interactive = true,
  drawRoute = true,
  className = "",
  style,
}: {
  points: MapPoint[];
  height?: number;
  zoom?: number;
  interactive?: boolean;
  drawRoute?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const holder = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const reduced = useReducedMotion();

  // The effect depends on the *values* in `points`, not on the array's
  // identity. Without this the map is torn down and rebuilt on every render of
  // the parent — which, inside the quest editor, means on every keystroke.
  const signature = JSON.stringify(points);

  useEffect(() => {
    const element = holder.current;
    if (!element || points.length === 0) return;

    let map: import("leaflet").Map | null = null;
    let cancelled = false;

    void (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !holder.current) return;

      map = L.map(element, {
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: false,
        doubleClickZoom: interactive,
        touchZoom: interactive,
        keyboard: interactive,
        attributionControl: true,
      });

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: "© OpenStreetMap",
      })
        .on("load", () => setReady(true))
        .addTo(map);

      for (const point of points) {
        const summit = point.kind === "summit";
        const marker = L.circleMarker([point.lat, point.lng], {
          radius: summit ? 8 : 6,
          color: summit ? "#c4481b" : "#1e3b2c",
          fillColor: summit ? "#e8622f" : "#3a6047",
          fillOpacity: 1,
          weight: 2,
        }).addTo(map);
        marker.bindTooltip(point.label, { direction: "top", offset: [0, -6] });
        if (point.href) {
          marker.on("click", () => {
            window.location.href = point.href as string;
          });
        }
      }

      if (drawRoute && points.length > 1) {
        const line = L.polyline(
          points.map((point) => [point.lat, point.lng] as [number, number]),
          { color: "#1e3b2c", weight: 2.6, opacity: 0.85, dashArray: undefined },
        ).addTo(map);

        const path = (line as unknown as { _path?: SVGPathElement })._path;
        if (path && !reduced) {
          const length = path.getTotalLength();
          path.style.setProperty("--len", String(length));
          path.classList.add("sq-map-route");
        }
      }

      if (points.length === 1) {
        map.setView([points[0].lat, points[0].lng], zoom ?? 12);
      } else {
        map.fitBounds(
          L.latLngBounds(points.map((point) => [point.lat, point.lng] as [number, number])),
          { padding: [28, 28], maxZoom: zoom ?? 14 },
        );
      }

      // Tiles sometimes come from cache and never fire `load`; don't hold the
      // fade hostage to an event that has already happened.
      window.setTimeout(() => setReady(true), 1200);
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `signature` stands in for `points` by value; see above
  }, [signature, zoom, interactive, drawRoute, reduced]);

  if (points.length === 0) {
    return (
      <div
        className={`sq-map ${className}`}
        data-ready="1"
        style={{ height, display: "grid", placeItems: "center", ...style }}
      >
        <span className="sq-kicker-sm">No coordinates on file</span>
      </div>
    );
  }

  return (
    <div
      ref={holder}
      className={`sq-map ${className}`}
      data-ready={ready ? "1" : "0"}
      style={{ height, ...style }}
      role="img"
      aria-label={
        points.length > 1
          ? `Map from ${points[0].label} to ${points[points.length - 1].label}`
          : `Map of ${points[0].label}`
      }
    />
  );
}
