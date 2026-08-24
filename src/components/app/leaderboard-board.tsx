import type { SchedulePeriod } from "@prisma/client";
import Link from "next/link";

import { Reveal } from "@/components/app/motion";
import { Avatar, Panel, PanelHead, Sticker, Tag } from "@/components/field";
import type { Leaderboard, LeaderboardRow } from "@/lib/leaderboard";
import { medalLabel, medalSticker, SCORING_NOTES } from "@/lib/leaderboard";
import { stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * One board, as a race.
 *
 * It used to be a list: three medals in a row, everybody else underneath, and
 * no way to tell whether you were three points off the lead or three hundred.
 * A leaderboard that does not answer "how far off am I, and what would it take
 * to move up" is a results table, and a results table for a week that has not
 * finished yet is not interesting to anybody.
 *
 * So: the podium is a podium — second, first, third, at three heights, the way
 * one looks — and every row carries the two numbers that make it a contest.
 * `behindLeader` is the shape of the field. `toOvertake` is the only number
 * that changes what somebody does this weekend.
 *
 * Names link to profiles where there is one to link to. What the board itself
 * carries is still only a name and a score: a leaderboard is a public document
 * by definition, and the least it can say is the least it should.
 */
export function LeaderboardBoard({
  board,
  viewerId,
  hrefFor,
  slots,
}: {
  board: Leaderboard;
  /** Highlights the viewer's own row. Omitted in the admin panel. */
  viewerId?: string;
  /** Builds the link to another slot of the same cadence. */
  hrefFor: (period: SchedulePeriod, slotKey: string) => string;
  /** The live slot first, then progressively older ones. */
  slots: { key: string; label: string; state: "past" | "live" | "future" }[];
}) {
  const podium = board.rows.filter((row) => row.medal !== null).slice(0, 3);
  const rest = board.rows.filter((row) => !podium.some((entry) => entry.userId === row.userId));
  const live = board.state === "live";

  // Second, first, third. The middle column is the tallest, which is what
  // makes it read as a podium at a glance rather than as three equal cards.
  const order = [podium[1], podium[0], podium[2]].filter(Boolean) as LeaderboardRow[];

  // The live slot is always `slots[0]` — `pastSlots` deals the current one
  // first and gets progressively older. Everything after it is history, and
  // history is not what this page opens on: a row of eight past months was
  // the first thing anybody saw, ahead of the board it was for. It is one
  // click away instead, in a disclosure that opens itself when a past slot is
  // the one actually being viewed, so a shared link to July still lands
  // showing where July came from.
  const [current, ...past] = slots;
  const onPastSlot = board.slotKey !== current?.key;

  return (
    <>
      <Reveal className="mb-5">
        <Panel flush>
          <PanelHead
            title={`${board.label} · ${board.dates}`}
            aside={
              <Tag tone={live ? "warm" : "ghost"}>
                {live ? "Open now" : board.sealed ? "Sealed" : "Closed"}
              </Tag>
            }
          />

          <div className="board-toolbar">
            <p className="meta">
              {board.rows.length} {board.rows.length === 1 ? "contender" : "contenders"}
            </p>
            {past.length > 0 && (
              <details className="board-past" open={onPastSlot}>
                <summary>Past boards</summary>
                <nav aria-label="Past slots" className="board-past-nav">
                  {past.map((slot) => (
                    <Link
                      key={slot.key}
                      href={hrefFor(board.period, slot.key)}
                      aria-current={slot.key === board.slotKey ? "page" : undefined}
                      scroll={false}
                    >
                      {slot.label}
                    </Link>
                  ))}
                </nav>
              </details>
            )}
          </div>

          {board.rows.length === 0 ? (
            <p className="chart-empty">
              Nothing approved in this window yet. The first logged quest takes the lead.
            </p>
          ) : (
            <>
              {order.length > 0 && (
                <div className={cn("podium", order.length < 3 && "is-short")}>
                  {order.map((row) => (
                    <PodiumPlace
                      key={row.userId}
                      row={row}
                      period={board.period}
                      label={board.label}
                      isYou={row.userId === viewerId}
                      provisional={live}
                    />
                  ))}
                </div>
              )}

              {rest.length > 0 && (
                <ul className="board-rows">
                  {rest.map((row, index) => (
                    <Reveal
                      as="li"
                      key={row.userId}
                      delay={stagger(index, 5)}
                      className={cn(row.userId === viewerId && "is-you")}
                    >
                      <span className="board-rank">{row.rank}</span>
                      <Avatar name={row.username} className="board-av" />
                      <span className="board-who">
                        <b>
                          <Name row={row} />
                        </b>
                        <span>
                          {row.quests} {row.quests === 1 ? "quest" : "quests"}
                          {row.tookFeatured ? " · took the featured one" : ""}
                        </span>
                      </span>
                      {live && row.toOvertake > 0 && (
                        <span className="board-gap" title="Points needed to take the place above">
                          +{row.toOvertake} to climb
                        </span>
                      )}
                      <span className="board-score">{row.score}</span>
                    </Reveal>
                  ))}
                </ul>
              )}
            </>
          )}
        </Panel>
      </Reveal>

      <Reveal>
        <details className="score-notes">
          <summary>How the score works</summary>
          <ul className="cadence-list">
            {SCORING_NOTES.map((note, index) => (
              <li key={note}>
                <b>{String(index + 1).padStart(2, "0")}</b>
                {note}
              </li>
            ))}
            <li>
              <b>05</b>
              The top three of a closed board keep their places for good — a verdict changed
              afterwards moves the points, never the medal.
            </li>
          </ul>
        </details>
      </Reveal>
    </>
  );
}

/** A name, linked to its profile where the person has published one. */
function Name({ row }: { row: LeaderboardRow }) {
  if (!row.handle) return <>{row.username}</>;
  return (
    <Link href={`/people/${row.handle}`} className="board-link">
      {row.username}
    </Link>
  );
}

function PodiumPlace({
  row,
  period,
  label,
  isYou,
  provisional,
}: {
  row: LeaderboardRow;
  period: SchedulePeriod;
  label: string;
  isYou: boolean;
  provisional: boolean;
}) {
  const place = row.rank;
  return (
    <div className={cn("podium-place", `is-${place}`, isYou && "is-you")}>
      {/* The metal is the sticker's own ink, carried by the artwork rather
          than applied here — see the note in `components/field/sticker.tsx`. */}
      <Sticker
        achievementKey={medalSticker(period, row.medal!)}
        className="medal"
        title={`${medalLabel(row.medal!)} — ${label}`}
      />
      <b className="podium-name">
        <Name row={row} />
      </b>
      <span className="podium-score">{row.score}</span>
      <span className="meta">
        {row.quests} {row.quests === 1 ? "quest" : "quests"}
      </span>
      {row.behindLeader > 0 && <span className="podium-gap">−{row.behindLeader} off the lead</span>}
      {/* A podium on an open board is a snapshot, and saying so is the
          difference between a standing and a promise. */}
      <span className={cn("podium-step", provisional && "is-provisional")}>
        {provisional ? `${place}${ordinal(place)} · so far` : `${place}${ordinal(place)}`}
      </span>
    </div>
  );
}

function ordinal(place: number): string {
  return place === 1 ? "st" : place === 2 ? "nd" : place === 3 ? "rd" : "th";
}
