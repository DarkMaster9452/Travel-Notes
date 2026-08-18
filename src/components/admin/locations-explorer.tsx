"use client";

import * as React from "react";

import { getPlaceDetailAction, type PlaceDetail } from "@/app/admin/actions";
import { LocationsMap, type MapPoint } from "@/components/admin/locations-map";
import { Modal, Tag } from "@/components/field";
import { formatRelativeDate } from "@/lib/utils";

const STATUS_TONE = {
  PENDING: "ghost",
  APPROVED: "pine",
  REJECTED: "warm",
} as const;

const STATUS_LABEL = {
  PENDING: "In review",
  APPROVED: "Approved",
  REJECTED: "Declined",
} as const;

/**
 * The map, plus the sheet that opens when you press a pin.
 *
 * The map used to be a picture with a link under it: clicking a place jumped
 * to a table row that said how many quests were there and nothing else. This
 * opens the actual thing — every quest set at that place, and what people
 * have filed against it — so the map answers a question instead of pointing
 * at the answer.
 *
 * The detail is fetched on press rather than shipped with the page: carrying
 * every quest and submission for every place would outweigh the map itself,
 * and almost none of it is ever opened.
 */
export function LocationsExplorer({
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
  const [open, setOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<PlaceDetail | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  const bySlug = React.useMemo(
    () => new Map(points.map((point) => [point.slug, point])),
    [points],
  );

  async function openPlace(slug: string) {
    const point = bySlug.get(slug);
    if (!point) return;

    setOpen(true);
    setDetail(null);
    setFailed(false);
    setLoading(true);

    const result = await getPlaceDetailAction(point.location).catch(() => null);
    setLoading(false);
    if (result) setDetail(result);
    else setFailed(true);
  }

  return (
    <>
      <LocationsMap
        width={width}
        height={height}
        countryPaths={countryPaths}
        points={points}
        onOpen={openPlace}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={detail ? detail.location : "Loading…"}
        description={detail ? `${detail.region} · ${detail.country}` : undefined}
        className="place-sheet"
      >
        {loading && <p className="chart-empty">Loading…</p>}
        {failed && <p className="chart-empty">Couldn&apos;t load that place.</p>}

        {detail && (
          <div className="place-quests">
            {detail.quests.map((quest) => (
              <article key={quest.id} className="place-quest">
                <header>
                  <div>
                    <b>{quest.title}</b>
                    <span>{quest.subtitle}</span>
                  </div>
                  <div className="place-quest-tags">
                    <Tag tone={quest.published ? "pine" : "ghost"}>
                      {quest.published ? "Published" : "Draft"}
                    </Tag>
                    <Tag tone="ghost">{quest.difficulty}</Tag>
                  </div>
                </header>

                {quest.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element -- admin-only, arbitrary remote host
                  <img src={quest.coverImage} alt="" className="place-quest-cover" />
                )}

                <p className="place-quest-objective">{quest.objective}</p>

                <dl className="place-quest-figures">
                  <div>
                    <dt>Distance</dt>
                    <dd>{quest.distance.toFixed(1)} km</dd>
                  </div>
                  <div>
                    <dt>Ascent</dt>
                    <dd>{quest.elevationGain} m</dd>
                  </div>
                  <div>
                    <dt>Time</dt>
                    <dd>{Math.round(quest.duration / 60)} h</dd>
                  </div>
                  <div>
                    <dt>Issued</dt>
                    <dd>{quest.issued}</dd>
                  </div>
                  <div>
                    <dt>Logged</dt>
                    <dd>{quest.completed}</dd>
                  </div>
                </dl>

                <div className="place-subs">
                  <p className="meta">
                    {quest.submissions.length === 0
                      ? "Nothing filed against this one yet"
                      : `${quest.submissions.length} submission${quest.submissions.length === 1 ? "" : "s"}`}
                  </p>

                  {quest.submissions.map((submission) => (
                    <div key={submission.id} className="place-sub">
                      <div className="place-sub-head">
                        <b>{submission.author}</b>
                        <Tag tone={STATUS_TONE[submission.status]}>
                          {STATUS_LABEL[submission.status]}
                        </Tag>
                      </div>
                      <p>{submission.note}</p>
                      <div className="place-sub-meta">
                        {submission.distance != null && <span>{submission.distance.toFixed(1)} km</span>}
                        {submission.elevation != null && <span>{submission.elevation} m ↑</span>}
                        {submission.photos.length > 0 && (
                          <span>
                            {submission.photos.length} photo
                            {submission.photos.length === 1 ? "" : "s"}
                          </span>
                        )}
                        <span>{formatRelativeDate(submission.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
