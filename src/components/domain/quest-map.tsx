"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useRef, useState } from "react";

import { useT } from "@/components/i18n";
import { cn } from "@/lib/utils";

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
 * time, so it cannot be part of the server bundle. The map fades in when the
 * tiles have actually finished loading rather than when the widget mounts,
 * which is the difference between a map appearing and a grey box appearing.
 *
 * Marker and route colours are read from the Trail tokens on the element, so
 * they follow the theme. The height and radius come from `className`.
 */
export function QuestMap({
  points,
  zoom,
  interactive = true,
  drawRoute = true,
  className,
}: {
  points: MapPoint[];
  zoom?: number;
  interactive?: boolean;
  drawRoute?: boolean;
  className?: string;
}) {
  const t = useT();
  const holder = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  // The effect depends on the *values* in `points`, not on the array's
  // identity, or the map would be rebuilt on every render of the parent.
  const signature = JSON.stringify(points);

  useEffect(() => {
    const element = holder.current;
    if (!element || points.length === 0) return;

    let map: import("leaflet").Map | null = null;
    let cancelled = false;

    void (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !holder.current) return;

      const tokens = getComputedStyle(element);
      const token = (name: string) => tokens.getPropertyValue(name).trim();
      const ink = token("--sq-brand");
      const paper = token("--sq-surface");

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

      if (drawRoute && points.length > 1) {
        L.polyline(
          points.map((point) => [point.lat, point.lng] as [number, number]),
          { color: ink, weight: 3, opacity: 0.9 },
        ).addTo(map);
      }

      for (const point of points) {
        // The destination is a filled disc; where you start is a ring.
        const summit = point.kind === "summit";
        const marker = L.circleMarker([point.lat, point.lng], {
          radius: summit ? 9 : 7,
          color: ink,
          fillColor: summit ? ink : paper,
          fillOpacity: 1,
          weight: 3,
        }).addTo(map);
        marker.bindTooltip(point.label, { direction: "top", offset: [0, -8] });
        if (point.href) {
          marker.on("click", () => {
            window.location.href = point.href as string;
          });
        }
      }

      if (points.length === 1) {
        map.setView([points[0].lat, points[0].lng], zoom ?? 12);
      } else {
        map.fitBounds(
          L.latLngBounds(points.map((point) => [point.lat, point.lng] as [number, number])),
          { padding: [32, 32], maxZoom: zoom ?? 14 },
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
  }, [signature, zoom, interactive, drawRoute]);

  if (points.length === 0) {
    return (
      <div className={cn("grid place-items-center bg-surface-sunken text-caption text-subtle", className)}>
        {t.app.quest.noCoordinates}
      </div>
    );
  }

  return (
    <div className={cn("isolate overflow-hidden bg-surface-sunken", className)}>
      <div
        ref={holder}
        role="img"
        aria-label={
          points.length > 1
            ? t.app.quest.mapFromTo(points[0].label, points[points.length - 1].label)
            : t.app.quest.mapOf(points[0].label)
        }
        className={cn("size-full transition-opacity duration-slow", ready ? "opacity-100" : "opacity-0")}
      />
    </div>
  );
}
