"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { moveTrailheadAction } from "@/app/admin/actions";
import { SqMap } from "@/components/sq/map";
import { useToast } from "@/components/sq/toast";

export type TrailheadQuest = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  parkingName: string | null;
  parkingLat: number | null;
  parkingLng: number | null;
};

/**
 * Move a trailhead, or rename it.
 *
 * The map is the confirmation: type coordinates and the pin moves, so a digit
 * dropped is a mistake you can see rather than one somebody drives to. The
 * warning about how many quests a change touches is on the button, not in a
 * dialog afterwards.
 */
export function SqTrailheadEditor({
  location,
  quests,
}: {
  location: string;
  quests: TrailheadQuest[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState(location);
  const [lat, setLat] = useState(String(quests[0]?.latitude ?? ""));
  const [lng, setLng] = useState(String(quests[0]?.longitude ?? ""));
  const [move, setMove] = useState(false);
  const [pending, start] = useTransition();

  const valid = lat !== "" && lng !== "" && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));

  return (
    <section className="sq-card" style={{ overflow: "hidden" }}>
      <div className="sq-section-head sq-rule-head">
        <h2 className="sq-h2" style={{ fontSize: 19 }}>
          The pin
        </h2>
        <span className="sq-kicker-sm" style={{ fontSize: 10 }}>
          {quests.length} {quests.length === 1 ? "quest" : "quests"} stand here
        </span>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!valid) return;
          start(() => {
            void moveTrailheadAction({
              location,
              name: name.trim(),
              latitude: Number(lat),
              longitude: Number(lng),
              moveCoordinates: move,
            }).then((result) => {
              toast(result.message ?? (result.ok ? "Saved." : "That would not save."), result.ok ? "plain" : "stamp");
              if (result.ok) router.refresh();
            });
          });
        }}
      >
        <div style={{ padding: "18px 22px", display: "grid", gap: 14 }}>
          <label className="sq-field">
            <span className="sq-label">Trailhead name</span>
            <input className="sq-input" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <label className="sq-field">
              <span className="sq-label">Latitude</span>
              <input className="sq-input" value={lat} onChange={(event) => setLat(event.target.value)} />
            </label>
            <label className="sq-field">
              <span className="sq-label">Longitude</span>
              <input className="sq-input" value={lng} onChange={(event) => setLng(event.target.value)} />
            </label>
          </div>

          {valid ? (
            <SqMap
              points={[
                { lat: Number(lat), lng: Number(lng), label: name || location, kind: "summit" },
                ...quests
                  .filter((quest) => quest.parkingLat != null && quest.parkingLng != null)
                  .map((quest) => ({
                    lat: quest.parkingLat as number,
                    lng: quest.parkingLng as number,
                    label: quest.parkingName ?? "Car park",
                    kind: "start" as const,
                  })),
              ]}
              height={260}
              drawRoute={false}
            />
          ) : (
            <p className="sq-hint">Type coordinates and the map will show what you have written.</p>
          )}

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
              lineHeight: 1.5,
              color: "var(--ink-2)",
            }}
          >
            <input type="checkbox" checked={move} onChange={(event) => setMove(event.target.checked)} />
            Move the coordinates too — otherwise only the name changes.
          </label>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            padding: "14px 22px",
            borderTop: "1px solid var(--line-2)",
            background: "var(--paper-2)",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>
            This writes to all {quests.length} {quests.length === 1 ? "quest" : "quests"} at this trailhead.
          </span>
          <button type="submit" className="sq-btn sq-btn-primary sq-btn-sm" disabled={pending || !valid}>
            {pending ? "Saving…" : "Save the trailhead"}
          </button>
        </div>
      </form>
    </section>
  );
}
