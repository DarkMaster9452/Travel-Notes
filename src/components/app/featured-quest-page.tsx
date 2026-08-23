import Link from "next/link";

import { ProgressBar, Reveal } from "@/components/app/motion";
import { stagger } from "@/lib/motion";
import { QuestSheet } from "@/components/app/quest-sheet";
import { SubmitProofButton } from "@/components/app/submit-proof";
import { EmptyState, Eyebrow, IconLock, IconShield, Panel, PanelHead, Tag } from "@/components/field";
import type { FeaturedQuest } from "@/lib/quest/featured";
import { FEATURED_BONUS } from "@/lib/leaderboard";
import { formatDate } from "@/lib/utils";

/**
 * The shared weekly and monthly quest.
 *
 * Both periods render identically because they are the same idea at two
 * cadences: one quest, the same one for everybody, with a window that closes.
 * The counters are what make it shared — you are looking at the same document
 * as everyone else, and at how many of them have logged it.
 *
 * Proof is filed from here rather than only from a quest page, because these
 * two are the quests the product actually asks people to do. A submission
 * filed here is stamped with the slot, which is what puts it at the front of
 * the review queue and what carries the bonus onto the leaderboard.
 */
export function FeaturedQuestPage({
  featured,
  period,
  label,
  eyebrow,
  closesAt,
  blurb,
  /** Filed and approved across the whole community. Null for a generated one. */
  counters,
  proof,
}: {
  featured: FeaturedQuest | null;
  period: "week" | "month";
  label: string;
  eyebrow: string;
  closesAt: Date;
  blurb: string;
  counters?: { filed: number; approved: number } | null;
  proof: { status: "NONE" | "PENDING" | "APPROVED" | "REJECTED"; reviewNote: string | null };
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

  const share = counters && counters.filed > 0 ? counters.approved / counters.filed : 0;
  const bonus = FEATURED_BONUS[period === "week" ? "WEEKLY" : "MONTHLY"];

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1>{featured.summary.title}</h1>
          <p>{blurb}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Tag tone="ghost">Closes {formatDate(closesAt)}</Tag>
          <SubmitProofButton
            featuredPeriod={period}
            status={proof.status}
            label={`Log the ${period === "week" ? "weekly" : "monthly"}`}
          />
        </div>
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <Reveal delay={stagger(0)}>
          <QuestSheet quest={featured.summary} issuedAt={label} seal={null} />
        </Reveal>

        <div className="flex flex-col gap-5">
          <Reveal delay={stagger(1)}>
            <Panel flush>
              <PanelHead
                title="On the board"
                aside={<Tag tone="warm">{`+${bonus} points`}</Tag>}
              />
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
            <Reveal delay={stagger(2)}>
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

          {proof.status === "REJECTED" && (
            <Reveal delay={stagger(3)}>
              <div className="safety mt-0" style={{ borderColor: "rgba(196,72,27,.4)" }}>
                <IconShield />
                <p>
                  <b>Proof declined.</b>{" "}
                  {proof.reviewNote ??
                    "Usually a missing photo rather than a suspicion — file it again with more to go on."}
                </p>
              </div>
            </Reveal>
          )}

          <Reveal delay={stagger(4)}>
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
              </ul>
            </Panel>
          </Reveal>
        </div>
      </div>
    </>
  );
}
