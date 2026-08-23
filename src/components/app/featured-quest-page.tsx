import Link from "next/link";

import { Countdown } from "@/components/app/countdown";
import { ProgressBar, Reveal } from "@/components/app/motion";
import { GettingThere } from "@/components/app/getting-there";
import { QuestSheet } from "@/components/app/quest-sheet";
import { SubmitProofButton, type LogDefaults } from "@/components/app/submit-proof";
import {
  EmptyState,
  Eyebrow,
  IconApproved,
  IconClock,
  IconLock,
  Panel,
  PanelHead,
  Tag,
} from "@/components/field";
import { stagger } from "@/lib/motion";
import { FEATURED_BONUS } from "@/lib/leaderboard";
import type { FeaturedQuest } from "@/lib/quest/featured";
import { formatDate, formatDuration } from "@/lib/utils";

/**
 * The shared weekly and monthly quest.
 *
 * Both periods render identically because they are the same idea at two
 * cadences: one quest, the same one for everybody, with a window that closes.
 *
 * What changed is that the window now means something. These two are not
 * optional — the whole point of a shared quest on a clock is that everybody
 * files it inside the same window — so the deadline is the loudest thing on
 * the page and the form to answer it is one click away rather than behind the
 * quest's own page. When the clock runs out the slot closes with whatever was
 * in it; there is no filing late, so there is no point pretending otherwise.
 *
 * Proof filed here is stamped with the slot, which is what puts it at the
 * front of the review queue and what carries the cadence bonus onto the
 * leaderboard — so the form posts the period rather than the quest id, and
 * the server resolves which quest that means.
 */
export type FeaturedProof = {
  status: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  reviewNote: string | null;
  filedAt: Date | null;
};

export function FeaturedQuestPage({
  featured,
  period,
  questId,
  label,
  eyebrow,
  closesAt,
  closed,
  blurb,
  proof,
  defaults,
  counters,
}: {
  featured: FeaturedQuest | null;
  period: "week" | "month";
  /** The persisted quest, once the slot has been materialised for this reader. */
  questId: string | null;
  label: string;
  eyebrow: string;
  closesAt: Date;
  /** Decided on the server against one `now` — see `lib/quest/slot`. */
  closed: boolean;
  blurb: string;
  proof: FeaturedProof;
  defaults: LogDefaults | null;
  /**
   * Filed and approved across the whole community. Null for a generated slot:
   * a quest only this account can see has no "everyone else" to count.
   */
  counters?: { filed: number; approved: number } | null;
}) {
  if (!featured) {
    return (
      <>
        <Reveal as="header" className="page-head">
          <div>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1>{label}</h1>
          </div>
        </Reveal>
        <Reveal delay={stagger(0)}>
          <EmptyState
            icon={<IconLock />}
            title="Nothing placed for this period."
            action={
              <Link href="/profile" className="btn btn-ghost">
                Open settings
              </Link>
            }
          >
            We couldn&apos;t place one inside your current range and difficulty. Widen either in
            settings and it turns up here.
          </EmptyState>
        </Reveal>
      </>
    );
  }

  const quest = featured.summary;
  const share = counters && counters.filed > 0 ? counters.approved / counters.filed : 0;
  const done = proof.status === "APPROVED" || proof.status === "PENDING";
  const bonus = FEATURED_BONUS[period === "week" ? "WEEKLY" : "MONTHLY"];

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1>{quest.title}</h1>
          <p>{blurb}</p>
        </div>
        <Tag tone={done ? "pine" : "warm"}>{done ? "Filed" : "Required"}</Tag>
      </Reveal>

      {/* The deadline, first and loudest. It is the one thing on this page
          that changes while you are reading it. */}
      <Reveal className="mb-5">
        <div className={`slot-clock${closed ? " is-closed" : ""}${done ? " is-done" : ""}`}>
          <span className="slot-clock-icon" aria-hidden="true">
            {done ? <IconApproved /> : <IconClock />}
          </span>
          <div className="slot-clock-body">
            <b>
              {closed
                ? "The log is closed."
                : done
                  ? "Filed. Nothing else is needed."
                  : "This one has to be logged."}
            </b>
            <span>
              {closed
                ? `${label} closed ${formatDate(closesAt)}.`
                : `Closes ${formatDate(closesAt)} — and it does not roll over.`}
            </span>
          </div>
          {!closed && <Countdown to={closesAt.toISOString()} className="slot-clock-time" />}
        </div>
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div className="flex flex-col gap-5">
          <Reveal delay={stagger(0)}>
            <QuestSheet quest={quest} issuedAt={label} seal={null} />
          </Reveal>

          {/* Where to leave the car — nothing at all unless an admin has
              filled it in. See `GettingThere`. */}
          <Reveal delay={stagger(1)}>
            <GettingThere quest={quest} />
          </Reveal>

        </div>

        <div className="flex flex-col gap-5">
          {/* The answer to the deadline, immediately under it in reading
              order on a narrow screen and beside it on a wide one. */}
          <Reveal delay={stagger(1)}>
            <Panel flush>
              <PanelHead title="Your log" aside={<ProofTag status={proof.status} />} />
              <div className="flex flex-col gap-4 px-5 py-5">
                {proof.status === "APPROVED" ? (
                  <p className="text-[14.5px] leading-[1.55] text-ink-2">
                    Approved and in your history. Nothing else is needed for {label.toLowerCase()}.
                  </p>
                ) : proof.status === "PENDING" ? (
                  <p className="text-[14.5px] leading-[1.55] text-ink-2">
                    Filed{proof.filedAt ? ` ${formatDate(proof.filedAt)}` : ""} and waiting on a
                    reader. You can file again if you have more to add.
                  </p>
                ) : closed ? (
                  <p className="text-[14.5px] leading-[1.55] text-ink-2">
                    The window closed with nothing in it. It is not re-issued and it does not roll
                    over — the next one opens on its own.
                  </p>
                ) : (
                  <p className="text-[14.5px] leading-[1.55] text-ink-2">
                    An account of the day and at least one photograph. A human reads it, and it
                    counts from the moment they do.
                  </p>
                )}

                {questId && !closed && (
                  <SubmitProofButton
                    featuredPeriod={period}
                    status={proof.status === "PENDING" ? "NONE" : proof.status}
                    defaults={defaults}
                    label={proof.status === "NONE" ? "File your proof" : "File it again"}
                    className="btn btn-signal"
                  />
                )}

                {proof.status === "REJECTED" && proof.reviewNote && (
                  <p className="quest-note is-warm">
                    <b>Declined — </b>
                    {proof.reviewNote}
                  </p>
                )}

                <p className="note mt-0">
                  <Link href="/submissions" className="underline">
                    Everything you have filed
                  </Link>
                </p>
              </div>
            </Panel>
          </Reveal>

          {/* The numbers the quest is asking for, so somebody can decide on
              the doorstep whether today is the day. */}
          <Reveal delay={stagger(2)}>
            <Panel flush>
              <PanelHead title="What it asks for" />
              <ul className="quest-facts">
                <Fact label="Distance" value={`${quest.distance.toFixed(1)} km`} />
                <Fact label="Ascent" value={`${quest.elevationGain} m`} />
                <Fact label="Moving time" value={formatDuration(quest.duration)} />
                {quest.travelTime != null && (
                  <Fact label="From you" value={`${Math.round(quest.travelTime)} min`} />
                )}
                <Fact label="Ground" value={quest.terrain.slice(0, 3).join(", ") || "Mixed"} />
                {quest.mood && <Fact label="Mood" value={quest.mood} />}
              </ul>
            </Panel>
          </Reveal>

          {/* What the slot is worth. The bonus is the reason the two shared
              quests are the ones to do rather than merely the ones on the
              clock, so the page says so rather than leaving it to whoever
              reads the scoring notes. */}
          <Reveal delay={stagger(3)}>
            <Panel flush>
              <PanelHead title="On the board" aside={<Tag tone="warm">{`+${bonus} points`}</Tag>} />
              <div className="px-5 py-5">
                <p className="text-[14.5px] leading-[1.6] text-ink-2">
                  Proof filed against this slot is read before everything else in the queue, and
                  carries <b className="text-ink">+{bonus}</b> on{" "}
                  {period === "week" ? "this week's" : "this month's"} leaderboard on top of what
                  the route itself is worth.
                </p>
                <Link
                  href={`/leaderboard?period=${period === "week" ? "WEEKLY" : "MONTHLY"}`}
                  className="btn btn-ghost btn-sm mt-4"
                >
                  See the board
                </Link>
              </div>
            </Panel>
          </Reveal>

          {counters && (
            <Reveal delay={stagger(4)}>
              <Panel flush>
                <PanelHead title="Everyone else" aside={<Tag>Shared</Tag>} />
                <div className="px-5 py-5">
                  <p className="font-mono text-[12px] text-ink-2">
                    <b className="text-ink">{counters.filed}</b> filed ·{" "}
                    <b className="text-ink">{counters.approved}</b> approved
                  </p>
                  <ProgressBar
                    value={share}
                    label="Share of filed proof that has been approved"
                    className="mt-3 w-full"
                  />
                  <p className="note">
                    The same objective, the same window, the same bonus — for every member.
                  </p>
                </div>
              </Panel>
            </Reveal>
          )}

          <Reveal delay={stagger(5)}>
            <Panel flush>
              <PanelHead title="How it works" />
              <ul className="flex flex-col gap-3 px-5 py-5">
                {[
                  ["MON", "The weekly drops at 06:00."],
                  ["SUN", "The log closes at 23:59."],
                  ["1st", "The monthly opens — the big one."],
                ].map(([key, text]) => (
                  <li key={key} className="flex items-baseline gap-3">
                    <span className="meta w-9 shrink-0 text-moss-2">{key}</span>
                    <span className="text-[14.5px] text-ink-2">{text}</span>
                  </li>
                ))}
                <li className="flex items-baseline gap-3">
                  <span className="meta w-9 shrink-0 text-moss-2">ALL</span>
                  <span className="text-[14.5px] text-ink-2">
                    Both are compulsory —{" "}
                    <Link href="/rules#cadence" className="underline">
                      the rules
                    </Link>
                    .
                  </span>
                </li>
              </ul>
            </Panel>
          </Reveal>
        </div>
      </div>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <li>
      <span>{label}</span>
      <b>{value}</b>
    </li>
  );
}

function ProofTag({ status }: { status: FeaturedProof["status"] }) {
  if (status === "APPROVED") return <Tag tone="pine">Approved</Tag>;
  if (status === "PENDING") return <Tag tone="ghost">In review</Tag>;
  if (status === "REJECTED") return <Tag tone="warm">Declined</Tag>;
  return <Tag tone="warm">Not filed</Tag>;
}
