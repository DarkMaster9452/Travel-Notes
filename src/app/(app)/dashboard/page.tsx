import type { Metadata } from "next";
import Link from "next/link";

import { Countdown } from "@/components/app/countdown";
import { IssueQuestButton } from "@/components/app/issue-quest";
import { CountUp, Reveal } from "@/components/app/motion";
import { PlanChip } from "@/components/app/plan-mark";
import { QuestSheet } from "@/components/app/quest-sheet";
import {
  Eyebrow,
  IconApproved,
  IconArrowRight,
  IconClock,
  Panel,
  PanelHead,
  Tag,
} from "@/components/field";
import { requireClient } from "@/lib/auth/guards";
import { CAPABILITY_COPY, headlineCapabilities } from "@/lib/config";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import { FEATURED_BONUS, getLeaderboard } from "@/lib/leaderboard";
import { stagger } from "@/lib/motion";
import { glanceFeaturedSlot, type FeaturedGlance } from "@/lib/quest/slot";
import { getUserStats } from "@/lib/quest/service";
import { formatDate, formatRelativeDate } from "@/lib/utils";
import { toQuestSummary } from "@/types/quest";

export const metadata: Metadata = { title: "Today" };
export const dynamic = "force-dynamic";

/**
 * Today.
 *
 * A dashboard rather than a landing card: what you have done, what is on the
 * clock, and what is waiting on somebody else.
 *
 * The two shared quests lead it, side by side and both carrying their
 * deadline. That is the product's whole cadence — everybody on the same quest
 * inside the same window — and it used to be advertised here as one dark
 * banner and one small panel in a side column, which reads as "one headline
 * and one afterthought" rather than as two obligations with clocks running.
 *
 * Nothing here writes. Glancing at the dashboard is not accepting a quest, so
 * the featured slots are read without being materialised — see
 * `glanceFeaturedSlot`.
 */
export default async function TodayPage() {
  const user = await requireClient();

  const [entitlement, stats, monthly, weekly, current, monthBoard, weekBoard, pending, recent] =
    await Promise.all([
      getEntitlement(user.id),
      getUserStats(user.id),
      glanceFeaturedSlot(user.id, "month"),
      glanceFeaturedSlot(user.id, "week"),
      db.questHistory.findFirst({
        where: { userId: user.id, completed: false },
        orderBy: { generatedAt: "desc" },
        include: { quest: true },
      }),
      getLeaderboard("MONTHLY"),
      getLeaderboard("WEEKLY"),
      db.submission.count({ where: { userId: user.id, status: "PENDING" } }),
      db.questHistory.findMany({
        where: { userId: user.id, completed: true },
        orderBy: { completedAt: "desc" },
        take: 4,
        select: {
          questId: true,
          completedAt: true,
          quest: { select: { title: true, region: true, distance: true, difficulty: true } },
        },
      }),
    ]);

  const firstName = user.name.split(" ")[0] || user.name;
  const quest = current ? toQuestSummary(current.quest, { generatedAt: current.generatedAt }) : null;

  const monthRow = monthBoard.rows.find((row) => row.userId === user.id) ?? null;
  const weekRow = weekBoard.rows.find((row) => row.userId === user.id) ?? null;

  // The one sentence the page opens with, chosen by what is actually urgent.
  const outstanding = [monthly, weekly].filter(
    (slot) => slot.featured && !slot.closed && slot.status === "NONE",
  ).length;

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
            {outstanding === 2
              ? "Both shared quests are open and neither is filed. They do not roll over."
              : outstanding === 1
                ? "One shared quest is still unfiled, and its window is closing."
                : pending > 0
                  ? `Everything is filed. ${pending} ${pending === 1 ? "submission is" : "submissions are"} waiting on a reader.`
                  : "Both shared quests are filed. Anything else you do is yours to choose."}
          </p>
        </div>
        <PlanChip plan={entitlement.plan} />
      </Reveal>

      {/* What you have done. The four figures the whole product is measured in,
          plus where they put you on this month's board. */}
      <Reveal className="mb-5">
        <dl className="today-figures">
          <Figure label="Logged" value={stats.completedCount} />
          <Figure label="Kilometres" value={Math.round(stats.kmExplored)} />
          <Figure label="Metres up" value={Math.round(stats.elevation)} />
          <Figure label="Regions" value={stats.regions} />
          <Figure
            label="This month"
            value={monthRow?.score ?? 0}
            foot={monthRow ? `#${monthRow.rank} on the board` : "Nothing scored yet"}
            href="/leaderboard?period=MONTHLY"
          />
          <Figure
            label="This week"
            value={weekRow?.score ?? 0}
            foot={weekRow ? `#${weekRow.rank} on the board` : "Nothing scored yet"}
            href="/leaderboard?period=WEEKLY"
          />
        </dl>
      </Reveal>

      {/* What is ahead. Two obligations, two clocks, side by side. */}
      <div className="ahead-grid">
        <Reveal delay={stagger(0)}>
          <SlotCard
            slot={monthly}
            period="month"
            href="/monthly"
            kicker="The big one"
            emphasis
          />
        </Reveal>
        <Reveal delay={stagger(1)}>
          <SlotCard slot={weekly} period="week" href="/weekly" kicker="Alongside it" />
        </Reveal>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_1fr] lg:items-start">
        <Reveal delay={stagger(2)}>
          {quest ? (
            <QuestSheet
              quest={quest}
              href={`/quests/${quest.id}`}
              issuedAt={`Issued ${formatDate(current!.generatedAt)}`}
            />
          ) : (
            <Panel flush>
              <PanelHead title="Nothing in your hand" aside={<Tag tone="ghost">Optional</Tag>} />
              <div className="flex flex-col items-start gap-4 px-5 py-5">
                <p className="text-[14.5px] leading-[1.6] text-ink-2">
                  Beyond the two shared quests, you can be issued one of your own — somewhere you
                  have not been sent before. It stays open until you log it, and once you have, it
                  never comes back.
                </p>
                <div className="flex flex-wrap gap-3">
                  <IssueQuestButton disabled={!entitlement.canUnlock} />
                  <Link href="/quests" className="btn btn-ghost">
                    Browse the database
                    <IconArrowRight />
                  </Link>
                </div>
              </div>
            </Panel>
          )}
        </Reveal>

        <div className="flex flex-col gap-5">
          <Reveal delay={stagger(3)}>
            <Panel flush className={entitlement.isSubscribed ? "member-panel" : undefined}>
              <PanelHead
                title="Waiting on us"
                aside={
                  pending > 0 ? (
                    <Tag tone="warm">{`${pending} in review`}</Tag>
                  ) : (
                    <Tag tone="ghost">Nothing pending</Tag>
                  )
                }
              />
              <div className="px-5 py-4">
                {pending > 0 ? (
                  <p className="text-[14.5px] leading-[1.55] text-ink-2">
                    A human reads every one. It counts from the moment they do —{" "}
                    <Link href="/submissions" className="underline">
                      see where yours has got to
                    </Link>
                    .
                  </p>
                ) : (
                  <p className="text-[14.5px] leading-[1.55] text-ink-2">
                    Nothing filed and unread. Proof goes in from a quest page or straight off a
                    card in the database.
                  </p>
                )}
              </div>
              <div className="border-t border-dashed border-line px-5 py-4">
                {entitlement.isSubscribed ? (
                  <MemberLine
                    planName={entitlement.definition.name}
                    lines={headlineCapabilities(entitlement.definition).map(
                      (capability) => CAPABILITY_COPY[capability].title,
                    )}
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

          {/* What you did, most recent first. Four is enough to recognise the
              shape of a month without turning the dashboard into history. */}
          <Reveal delay={stagger(4)}>
            <Panel flush>
              <PanelHead
                title="Lately"
                aside={
                  <Link href="/history" className="btn btn-ghost btn-sm">
                    All of it
                  </Link>
                }
              />
              {recent.length === 0 ? (
                <p className="chart-empty">Nothing logged yet. The first one is the hard one.</p>
              ) : (
                <ul className="today-recent">
                  {recent.map((entry) => (
                    <li key={entry.questId}>
                      <IconApproved />
                      <span>
                        <Link href={`/quests/${entry.questId}`}>{entry.quest.title}</Link>
                        <em>
                          {entry.quest.region} · {entry.quest.distance.toFixed(1)} km
                        </em>
                      </span>
                      <span className="meta">
                        {entry.completedAt ? formatRelativeDate(entry.completedAt) : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </Reveal>
        </div>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* The two shared quests                                                       */
/* -------------------------------------------------------------------------- */

/**
 * One cadence, advertised.
 *
 * Everything a decision needs and nothing else: what it is, what it costs in
 * effort, what it is worth on the board, how long is left, and whether this
 * account has already answered it.
 */
function SlotCard({
  slot,
  period,
  href,
  kicker,
  emphasis,
}: {
  slot: FeaturedGlance;
  period: "week" | "month";
  href: string;
  kicker: string;
  emphasis?: boolean;
}) {
  const bonus = FEATURED_BONUS[period === "week" ? "WEEKLY" : "MONTHLY"];
  const name = period === "week" ? "weekly" : "monthly";

  if (!slot.featured) {
    return (
      <div className={`ahead${emphasis ? " is-lead" : ""} is-empty`}>
        <span className="ahead-kicker">{kicker}</span>
        <h2>No {name} placed.</h2>
        <p className="ahead-blurb">
          We couldn&apos;t put one inside your range and difficulty. Widen either in settings and
          it turns up.
        </p>
        <Link href="/profile" className="ahead-cta">
          Open settings
          <IconArrowRight />
        </Link>
      </div>
    );
  }

  const quest = slot.featured.summary;
  const done = slot.status === "APPROVED" || slot.status === "PENDING";

  return (
    <Link href={href} className={`ahead${emphasis ? " is-lead" : ""}${done ? " is-done" : ""}`}>
      <div className="ahead-head">
        <span className="ahead-kicker">{kicker}</span>
        {done ? (
          <Tag tone={emphasis ? "inverse" : "pine"}>
            {slot.status === "APPROVED" ? "Approved" : "Filed"}
          </Tag>
        ) : (
          <Tag tone={emphasis ? "inverse" : "warm"}>{`+${bonus} points`}</Tag>
        )}
      </div>

      <h2>{quest.title}</h2>
      <p className="ahead-where">
        {quest.location} · {quest.region}
      </p>

      <div className="ahead-facts">
        <span>{quest.distance.toFixed(1)} km</span>
        <span>{Math.round(quest.elevationGain)} m ↑</span>
        <span>{quest.difficulty}</span>
      </div>

      <div className="ahead-clock">
        <span className="ahead-clock-icon" aria-hidden="true">
          {done ? <IconApproved /> : <IconClock />}
        </span>
        {slot.closed ? (
          <b>The log is closed.</b>
        ) : done ? (
          <b>Filed. Nothing else is needed.</b>
        ) : (
          <>
            <b>Closes in</b>
            <Countdown to={slot.closesAt.toISOString()} className="ahead-countdown" />
          </>
        )}
      </div>

      <span className="ahead-cta">
        {done ? `Open the ${name}` : slot.closed ? "See what it was" : `Log the ${name}`}
        <IconArrowRight />
      </span>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * One figure in the band.
 *
 * A `dl` may only contain `dt`, `dd` and `div`, so a linked cell is a div with
 * the anchor stretched across it rather than an anchor wrapping the pair. The
 * label stays the accessible name of the link, which is why the anchor carries
 * it rather than being empty.
 */
function Figure({
  label,
  value,
  foot,
  href,
}: {
  label: string;
  value: number;
  foot?: string;
  href?: string;
}) {
  return (
    <div className={`today-figure${href ? " is-link" : ""}`}>
      <dt>{label}</dt>
      <dd>
        <CountUp value={value} />
      </dd>
      {foot && <span>{foot}</span>}
      {href && (
        <Link href={href} className="today-figure-hit">
          <span className="sr-only">{`${label} — open the board`}</span>
        </Link>
      )}
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
      <p className="credits">All {allowance} free quests used.</p>
      <Link href="/upgrade" className="btn btn-primary btn-sm">
        See the plans
      </Link>
    </div>
  );
}
