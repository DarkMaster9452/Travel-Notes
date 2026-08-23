import type { SchedulePeriod } from "@prisma/client";
import Link from "next/link";

import { Reveal } from "@/components/app/motion";
import { Panel, PanelHead, Sticker, Tag } from "@/components/field";
import type { Leaderboard } from "@/lib/leaderboard";
import { medalLabel, medalSticker, SCORING_NOTES } from "@/lib/leaderboard";
import { stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * One board.
 *
 * Usernames and scores, and nothing else about anybody: no email, no plan, no
 * avatar. A leaderboard is a public document by definition, and the least it
 * can carry is the least it should.
 *
 * The top three are drawn as the stickers they earn rather than as rows with
 * a coloured number, because that is what a finish actually gets you here —
 * and the six designs are distinct, so a weekly gold is never mistaken for a
 * monthly one.
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
  slots: { key: string; label: string; state: "past" | "live" | "future" }[];
}) {
  const podium = board.rows.filter((row) => row.medal !== null).slice(0, 3);
  const rest = board.rows.filter((row) => !podium.some((entry) => entry.userId === row.userId));
  const you = viewerId ? board.rows.find((row) => row.userId === viewerId) : undefined;

  return (
    <>
      <Reveal className="mb-5">
        <Panel flush>
          <PanelHead
            title={`${board.label} · ${board.dates}`}
            aside={
              <Tag tone={board.state === "live" ? "warm" : "ghost"}>
                {board.state === "live" ? "Open now" : board.sealed ? "Sealed" : "Closed"}
              </Tag>
            }
          />

          <div className="admin-filters">
            <nav aria-label="Slot">
              {slots.map((slot) => (
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
            <p className="meta">
              {board.rows.length} {board.rows.length === 1 ? "person" : "people"} scored
            </p>
          </div>

          {board.rows.length === 0 ? (
            <p className="chart-empty">
              Nothing approved in this window yet. The first logged quest opens the board.
            </p>
          ) : (
            <>
              {podium.length > 0 && (
                <div className="podium">
                  {podium.map((row) => (
                    <div
                      key={row.userId}
                      className={cn("podium-place", row.userId === viewerId && "is-you")}
                    >
                      {/* The metal is the sticker's own ink, carried by the
                          artwork rather than applied here — see the note in
                          `components/field/sticker.tsx`. */}
                      <Sticker
                        achievementKey={medalSticker(board.period, row.medal!)}
                        className="medal"
                        title={`${medalLabel(row.medal!)} — ${board.label}`}
                      />
                      <b>{row.username}</b>
                      <span className="podium-score">{row.score}</span>
                      <span className="meta">
                        {row.quests} {row.quests === 1 ? "quest" : "quests"}
                        {row.tookFeatured ? " · took the featured one" : ""}
                      </span>
                    </div>
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
                      <b className="board-name">{row.username}</b>
                      {row.tookFeatured && <Tag tone="ghost">Featured</Tag>}
                      <span className="board-quests">
                        {row.quests} {row.quests === 1 ? "quest" : "quests"}
                      </span>
                      <span className="board-score">{row.score}</span>
                    </Reveal>
                  ))}
                </ul>
              )}
            </>
          )}
        </Panel>
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        {you && (
          <Reveal delay={stagger(0)}>
            <Panel flush>
              <PanelHead title="Where you are" aside={<Tag tone="pine">{`#${you.rank}`}</Tag>} />
              <div className="px-5 py-5">
                <p className="text-[15px] leading-[1.6] text-ink-2">
                  <b className="text-ink">{you.score} points</b> from {you.quests}{" "}
                  {you.quests === 1 ? "approved quest" : "approved quests"} this{" "}
                  {board.period === "WEEKLY" ? "week" : "month"}
                  {you.medal ? ` — ${medalLabel(you.medal).toLowerCase()} place.` : "."}
                </p>
                {!you.tookFeatured && board.state === "live" && (
                  <p className="note">
                    The featured quest for this slot is still open, and it carries the biggest
                    single bonus on the board.
                  </p>
                )}
              </div>
            </Panel>
          </Reveal>
        )}

        <Reveal delay={stagger(1)}>
          <Panel flush>
            <PanelHead title="How the score works" />
            <ul className="cadence-list">
              {SCORING_NOTES.map((note, index) => (
                <li key={note}>
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  {note}
                </li>
              ))}
            </ul>
            <p className="note">
              The top three of a closed board keep their places for good — a verdict changed
              afterwards moves the points, never the medal.
            </p>
          </Panel>
        </Reveal>
      </div>
    </>
  );
}
