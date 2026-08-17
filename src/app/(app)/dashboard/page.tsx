import type { Metadata } from "next";
import Link from "next/link";

import { IssueQuestButton } from "@/components/app/issue-quest";
import { CountUp, Reveal } from "@/components/app/motion";
import { PlanChip } from "@/components/app/plan-mark";
import { stagger } from "@/lib/motion";
import { QuestSheet } from "@/components/app/quest-sheet";
import {
  EmptyState,
  Eyebrow,
  IconArrowRight,
  IconLock,
  Panel,
  PanelHead,
  Tag,
} from "@/components/field";
import { requireClient } from "@/lib/auth/guards";
import { CAPABILITY_COPY } from "@/lib/config";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import { getFeaturedQuests } from "@/lib/quest/featured";
import { getUserStats } from "@/lib/quest/service";
import { toQuestSummary } from "@/types/quest";

export const metadata: Metadata = { title: "Today" };

/**
 * Today.
 *
 * One quest in hand, the shared weekly and monthly beneath it, and what the
 * account has done so far. No feed and nothing to browse — the landing page
 * promises exactly one decision, and this is it.
 */
export default async function TodayPage() {
  const user = await requireClient();

  const [entitlement, stats, featured, current] = await Promise.all([
    getEntitlement(user.id),
    getUserStats(user.id),
    getFeaturedQuests(user.id),
    db.questHistory.findFirst({
      where: { userId: user.id, completed: false },
      orderBy: { generatedAt: "desc" },
      include: { quest: true },
    }),
  ]);

  const firstName = user.name.split(" ")[0] || user.name;
  const quest = current ? toQuestSummary(current.quest, { generatedAt: current.generatedAt }) : null;

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>
            {new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" })
              .format(new Date())
              .toUpperCase()}
          </Eyebrow>
          <h1>Morning, {firstName}.</h1>
          <p>
            {quest
              ? "One quest is open. It stays open until you log it."
              : "Nothing issued yet. That's on us — take one."}
          </p>
        </div>
        {quest ? (
          <Link href={`/quests/${quest.id}`} className="btn btn-primary">
            Open the quest
            <IconArrowRight />
          </Link>
        ) : (
          <IssueQuestButton disabled={!entitlement.canUnlock} />
        )}
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr] lg:items-start">
        <Reveal delay={stagger(0)}>
          {quest ? (
            <QuestSheet
              quest={quest}
              href={`/quests/${quest.id}`}
              issuedAt={`Issued ${new Intl.DateTimeFormat("en-GB", {
                day: "numeric",
                month: "short",
              }).format(current!.generatedAt)}`}
            />
          ) : (
            <EmptyState
              icon={<IconLock />}
              title="Nothing issued yet."
              action={<IssueQuestButton disabled={!entitlement.canUnlock} />}
            >
              That&apos;s on us, not you. Take one and it is yours until you log it — and once you
              have, it never comes back.
            </EmptyState>
          )}
        </Reveal>

        <div className="flex flex-col gap-5">
          <Reveal delay={stagger(1)}>
            <Panel flush className={entitlement.isSubscribed ? "member-panel" : undefined}>
              <PanelHead title="Your log" aside={<PlanChip plan={entitlement.plan} />} />
              <dl className="grid grid-cols-2 gap-px bg-line">
                <Figure label="Logged" value={stats.completedCount} />
                <Figure label="Regions" value={stats.regions} />
                <Figure label="Kilometres" value={Math.round(stats.kmExplored)} />
                <Figure label="Metres up" value={Math.round(stats.elevation)} />
              </dl>
              <div className="border-t border-dashed border-line px-5 py-4">
                {entitlement.isSubscribed ? (
                  <MemberLine
                    planName={entitlement.definition.name}
                    lines={entitlement.definition.capabilities
                      .slice(0, 3)
                      .map((capability) => CAPABILITY_COPY[capability].title)}
                  />
                ) : (
                  <FreeAllowance
                    remaining={entitlement.freeQuestsRemaining}
                    allowance={entitlement.freeQuestAllowance}
                  />
                )}
              </div>
            </Panel>
          </Reveal>

          {featured.map((item, index) => (
            <Reveal key={item.key} delay={stagger(index + 2)}>
              <Panel flush>
                <PanelHead
                  title={periodLabel(item.period, item.key)}
                  aside={<Tag tone={item.period === "week" ? "pine" : "warm"}>Everyone</Tag>}
                />
                <div className="px-5 py-5">
                  <span className="qc-loc">{item.summary.region}</span>
                  <h3 className="mt-2 font-serif text-[19px] font-semibold leading-[1.2] tracking-[-0.02em]">
                    <Link href={item.period === "week" ? "/weekly" : "/monthly"}>
                      {item.summary.title}
                    </Link>
                  </h3>
                  <p className="mt-3 flex flex-wrap gap-4 font-mono text-[11px] text-ink-2">
                    <span>{item.summary.distance.toFixed(1)} km</span>
                    <span>{Math.round(item.summary.elevationGain)} m ↑</span>
                  </p>
                </div>
              </Panel>
            </Reveal>
          ))}
        </div>
      </div>
    </>
  );
}

/** "2026-W33" → "Week 33"; "2026-08" → "August". */
function periodLabel(period: "week" | "month", key: string): string {
  if (period === "week") return `Week ${key.split("-W")[1] ?? key}`;
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return key;
  return new Intl.DateTimeFormat("en-GB", { month: "long" }).format(new Date(year, month - 1, 1));
}

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card px-5 py-4">
      <dt className="meta">{label}</dt>
      <dd className="mt-1 font-mono text-[22px] font-bold tracking-[-0.02em]">
        <CountUp value={value} />
      </dd>
    </div>
  );
}

/**
 * The membership, restated on the page a member sees most.
 *
 * The counter it replaces was the most-looked-at number on this panel while the
 * account was free; leaving a blank space where it used to be is how a
 * subscription starts to feel like nothing happened. So the space keeps its
 * weight and says what was bought instead.
 */
function MemberLine({ planName, lines }: { planName: string; lines: string[] }) {
  return (
    <div className="member-line">
      <span className="member-line-mark" aria-hidden="true" />
      <p>
        <b>{planName}</b>
        {lines.map((line, index) => (
          <span key={line} className="tick-in" style={{ animationDelay: `${index * 90}ms` }}>
            {line}
          </span>
        ))}
      </p>
    </div>
  );
}

/** The free wall, stated plainly rather than sold. */
function FreeAllowance({ remaining, allowance }: { remaining: number; allowance: number }) {
  if (remaining > 0) {
    return (
      <p className="credits">
        Free quests left: <b>{remaining}</b>
        <span className="dots">
          {Array.from({ length: allowance }, (_, index) => (
            <i key={index} className={index < remaining ? undefined : "spent"} />
          ))}
        </span>
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="credits">All three free quests used.</p>
      <Link href="/upgrade" className="btn btn-primary btn-sm">
        See the plans
      </Link>
    </div>
  );
}
