import type { Medal, SchedulePeriod } from "@prisma/client";
import Link from "next/link";

import { Reveal } from "@/components/app/motion";
import { Avatar, IconArrowRight, Sticker, Tag } from "@/components/field";
import { medalLabel, type LeaderboardRow } from "@/lib/leaderboard";
import { cn } from "@/lib/utils";

/**
 * You, at the top of the board.
 *
 * The leaderboard used to open on somebody else's medal. That is the wrong
 * first thing to read: the question anybody arrives with is "where am I", and
 * a page that answers it four scrolls down has made a scoreboard out of what
 * should be a standing.
 *
 * So this is the header — your profile, your figures for the slot, and the one
 * actionable number on the page: how few points would take the place above.
 * It doubles as the way into your own profile, which is otherwise buried in
 * settings.
 */
export type Standing = {
  name: string;
  /** Null when there is no published profile to open. */
  handle: string | null;
  /** True when a profile exists but is switched off — worth prompting about. */
  hidden: boolean;
  row: LeaderboardRow | null;
  period: SchedulePeriod;
  label: string;
  live: boolean;
  /** Everything they have ever won, newest metal first. */
  medals: { id: string; medal: Medal; sticker: string; label: string }[];
  lifetime: { logged: number; km: number; up: number };
};

export function StandingCard({ standing }: { standing: Standing }) {
  const { row, live } = standing;
  const cadence = standing.period === "WEEKLY" ? "week" : "month";

  return (
    <Reveal className="mb-5">
      <div className="standing">
        <div className="standing-who">
          <Avatar name={standing.name} className="standing-av" />
          <div>
            <b>{standing.name}</b>
            {standing.handle ? (
              <Link href={`/people/${standing.handle}`} className="standing-handle">
                @{standing.handle}
                <IconArrowRight />
              </Link>
            ) : (
              <Link href="/profile/public" className="standing-handle">
                {standing.hidden ? "Your profile is hidden" : "Set up your profile"}
                <IconArrowRight />
              </Link>
            )}
          </div>
        </div>

        <div className="standing-rank">
          {row ? (
            <>
              <span className="standing-place">
                <em>#</em>
                {row.rank}
              </span>
              <span className="meta">
                {row.score} points · {row.quests} {row.quests === 1 ? "quest" : "quests"} this{" "}
                {cadence}
              </span>
              {live && row.toOvertake > 0 ? (
                <Tag tone="warm">{`${row.toOvertake} more takes ${row.rank - 1 === 0 ? "the lead" : `#${row.rank - 1}`}`}</Tag>
              ) : live && row.rank === 1 ? (
                <Tag tone="pine">Leading — hold it</Tag>
              ) : row.medal ? (
                <Tag tone="pine">{`${medalLabel(row.medal)} · ${standing.label}`}</Tag>
              ) : null}
            </>
          ) : (
            <>
              <span className="standing-place is-empty">—</span>
              <span className="meta">Nothing approved this {cadence} yet</span>
              <Link href={`/${cadence === "week" ? "weekly" : "monthly"}`} className="btn btn-signal btn-sm">
                Take the {cadence === "week" ? "weekly" : "monthly"}
              </Link>
            </>
          )}
        </div>

        <dl className="standing-figures">
          <Figure label="Logged" value={String(standing.lifetime.logged)} />
          <Figure label="Kilometres" value={String(standing.lifetime.km)} />
          <Figure label="Metres up" value={String(standing.lifetime.up)} />
          <Figure label="Medals" value={String(standing.medals.length)} />
        </dl>

        {standing.medals.length > 0 && (
          <div className="standing-medals">
            {standing.medals.slice(0, 6).map((award) => (
              <Sticker
                key={award.id}
                achievementKey={award.sticker}
                className={cn("medal", "standing-medal")}
                title={`${medalLabel(award.medal)} — ${award.label}`}
              />
            ))}
            {standing.medals.length > 6 && (
              <Link href="/achievements" className="meta standing-more">
                +{standing.medals.length - 6} more
              </Link>
            )}
          </div>
        )}
      </div>
    </Reveal>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
