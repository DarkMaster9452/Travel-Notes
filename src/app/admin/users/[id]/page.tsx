import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { AccountControls } from "@/components/admin/account-controls";
import { Reveal } from "@/components/app/motion";
import { StatGrid } from "@/components/admin/stat-grid";
import {
  Avatar,
  Eyebrow,
  IconApproved,
  IconArrowRight,
  IconCheck,
  IconCompass,
  IconCross,
  IconLock,
  IconMap,
  Panel,
  PanelHead,
  Tag,
} from "@/components/field";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { LIVE_STATUSES } from "@/lib/admin/stats";
import { getAchievements } from "@/lib/achievements";
import { planIdFromRecord } from "@/lib/config";
import { getUserStats } from "@/lib/quest/service";
import { AccountStickers } from "@/components/admin/account-stickers";
import { stagger } from "@/lib/motion";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Account · Admin" };
export const dynamic = "force-dynamic";

type TimelineKind = "issued" | "completed" | "filed" | "approved" | "rejected" | "session";

type TimelineEntry = {
  id: string;
  at: Date;
  kind: TimelineKind;
  title: string;
  detail?: string;
};

const TIMELINE_ICON: Record<TimelineKind, React.ComponentType<{ className?: string }>> = {
  issued: IconMap,
  completed: IconApproved,
  filed: IconCompass,
  approved: IconCheck,
  rejected: IconCross,
  session: IconLock,
};

/**
 * One account, in full: the same controls the list's quick-edit modal has,
 * plus the thing a modal can't hold — everything this account has actually
 * done. Built from the tables that already exist rather than a separate
 * audit log, because a log that only starts recording the day it's added
 * would be empty for every account that matters right now.
 */
const LOG_FILTERS = [
  { key: "all", label: "Everything", kinds: null },
  { key: "quests", label: "Quests", kinds: ["issued", "completed"] },
  { key: "proof", label: "Proof", kinds: ["filed", "approved", "rejected"] },
  { key: "access", label: "Sign-ins", kinds: ["session"] },
] as const;

export default async function AccountDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ log?: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;
  const { log: rawLog } = await searchParams;
  const logFilter =
    LOG_FILTERS.find((filter) => filter.key === rawLog) ?? LOG_FILTERS[0];

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      freeQuestsUsed: true,
      createdAt: true,
      subscription: { select: { plan: true, status: true, cancelAtPeriodEnd: true } },
      _count: { select: { sessions: true, history: true, submissions: true } },
    },
  });
  if (!user) notFound();

  const [history, submissions, sessions, adminCount, stats, revocations] = await Promise.all([
    db.questHistory.findMany({
      where: { userId: id },
      orderBy: { generatedAt: "desc" },
      take: 100,
      select: {
        id: true,
        generatedAt: true,
        completed: true,
        completedAt: true,
        quest: { select: { title: true, location: true } },
      },
    }),
    db.submission.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        createdAt: true,
        status: true,
        reviewedAt: true,
        reviewNote: true,
        reviewedBy: { select: { name: true } },
        quest: { select: { title: true } },
      },
    }),
    db.session.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, createdAt: true, expiresAt: true },
    }),
    db.user.count({ where: { role: "ADMIN" } }),
    getUserStats(id),
    db.achievementRevocation.findMany({
      where: { userId: id },
      select: { achievementId: true },
    }),
  ]);


  const timeline: TimelineEntry[] = [];
  for (const row of history) {
    timeline.push({
      id: `${row.id}-issued`,
      at: row.generatedAt,
      kind: "issued",
      title: `Issued "${row.quest.title}"`,
      detail: row.quest.location,
    });
    if (row.completed && row.completedAt) {
      timeline.push({
        id: `${row.id}-completed`,
        at: row.completedAt,
        kind: "completed",
        title: `Completed "${row.quest.title}"`,
      });
    }
  }
  for (const row of submissions) {
    timeline.push({
      id: `${row.id}-filed`,
      at: row.createdAt,
      kind: "filed",
      title: `Filed proof for "${row.quest.title}"`,
    });
    if (row.reviewedAt && row.status !== "PENDING") {
      timeline.push({
        id: `${row.id}-reviewed`,
        at: row.reviewedAt,
        kind: row.status === "APPROVED" ? "approved" : "rejected",
        title: `Submission ${row.status === "APPROVED" ? "approved" : "declined"}${
          row.reviewedBy ? ` by ${row.reviewedBy.name}` : ""
        }`,
        detail: row.reviewNote ?? undefined,
      });
    }
  }
  for (const row of sessions) {
    timeline.push({
      id: `${row.id}-session`,
      at: row.createdAt,
      kind: "session",
      title: "Signed in",
      detail: `Active until ${formatDate(row.expiresAt)}`,
    });
  }
  timeline.sort((a, b) => b.at.getTime() - a.at.getTime());

  // Filtered after assembly rather than in the queries: the log is built from
  // four tables, and filtering each one separately would mean four more round
  // trips to answer a question the page already has the data for.
  const shown = logFilter.kinds
    ? timeline.filter((entry) => (logFilter.kinds as readonly string[]).includes(entry.kind))
    : timeline;

  const live = user.subscription && LIVE_STATUSES.includes(user.subscription.status as "ACTIVE");
  const plan = live ? (user.subscription?.plan ?? "FREE") : "FREE";

  // The sheet as this account actually sees it: gated by their plan, minus
  // anything an admin has taken back.
  const stickers = getAchievements(
    stats,
    planIdFromRecord(plan),
    revocations.map((row) => row.achievementId),
  );

  const isSelf = user.id === admin.id;
  const isLastAdmin = user.role === "ADMIN" && adminCount <= 1;
  const canDelete = !isSelf && !isLastAdmin;
  const blockedReason = isSelf
    ? "You can't delete the account you're signed in as."
    : isLastAdmin
      ? "That's the last admin — the panel would lock everyone out."
      : undefined;

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Link href="/admin/users" className="meta inline-flex items-center gap-1.5 mb-2">
            <IconArrowRight className="rotate-180 size-3" /> All accounts
          </Link>
          <Eyebrow>Account</Eyebrow>
          <h1>{user.name}.</h1>
          <p>{user.email}</p>
        </div>
      </Reveal>

      <Reveal className="mb-5">
        <Panel className="flex flex-wrap items-center gap-4">
          <Avatar name={user.name} className="size-12 rounded-[13px] text-[15px]" />
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone={live ? "pine" : "ghost"}>{plan}</Tag>
            {user.subscription?.cancelAtPeriodEnd && <Tag tone="warm">Cancelling</Tag>}
            {user.role === "ADMIN" && <Tag tone="warm">Admin</Tag>}
          </div>
          <span className="meta ml-auto">Joined {formatDate(user.createdAt)}</span>
          <span className="meta">{user._count.history} issued</span>
          <span className="meta">{user._count.submissions} filed</span>
          <span className="meta">{user._count.sessions} active session{user._count.sessions === 1 ? "" : "s"}</span>
        </Panel>
      </Reveal>

      <Reveal delay={stagger(0)} className="mb-5">
        <StatGrid
          items={[
            { label: "Issued", value: user._count.history },
            { label: "Logged", value: stats.completedCount },
            { label: "Kilometres", value: Math.round(stats.kmExplored) },
            { label: "Metres up", value: Math.round(stats.elevation) },
            {
              label: "Regions",
              value: stats.regions,
              foot: `${stats.countries} ${stats.countries === 1 ? "country" : "countries"}`,
            },
            {
              label: "Stickers",
              value: stickers.filter((sticker) => sticker.earned).length,
              foot: `${user._count.submissions} filed`,
            },
          ]}
        />
      </Reveal>

      <Reveal delay={stagger(1)} className="mb-5">
        <Panel flush>
          <PanelHead
            title="Stickers"
            aside={<Tag tone="ghost">{stickers.filter((s) => s.earned).length} earned</Tag>}
          />
          <AccountStickers userId={user.id} stickers={stickers.map((sticker) => ({
            id: sticker.id,
            label: sticker.label,
            description: sticker.description,
            sticker: sticker.sticker,
            earned: sticker.earned,
            planLocked: sticker.planLocked,
            revoked: sticker.revoked,
            progressLabel: sticker.progressLabel,
          }))} />
        </Panel>
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,360px)_1fr]">
        <Reveal delay={stagger(1)}>
          <Panel>
            <PanelHead title="Controls" />
            <div className="mt-4">
              <AccountControls
                user={{
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  role: user.role,
                  plan,
                  freeQuestsUsed: user.freeQuestsUsed,
                  sessions: user._count.sessions,
                }}
                canDelete={canDelete}
                blockedReason={blockedReason}
              />
            </div>
          </Panel>
        </Reveal>

        <Reveal delay={stagger(2)}>
          <Panel flush>
            <PanelHead title="Activity" aside={<Tag tone="ghost">{shown.length}</Tag>} />

            <div className="admin-filters">
              <nav aria-label="Filter the log">
                {LOG_FILTERS.map((filter) => (
                  <Link
                    key={filter.key}
                    href={`/admin/users/${user.id}?log=${filter.key}`}
                    aria-current={filter.key === logFilter.key ? "page" : undefined}
                    scroll={false}
                  >
                    {filter.label}
                  </Link>
                ))}
              </nav>
              <p className="meta">{timeline.length} in total</p>
            </div>
            {shown.length === 0 ? (
              <p className="chart-empty">Nothing yet.</p>
            ) : (
              <ul className="account-timeline">
                {shown.map((entry) => {
                  const Icon = TIMELINE_ICON[entry.kind];
                  return (
                    <li key={entry.id} className={`account-timeline-item is-${entry.kind}`}>
                      <span className="account-timeline-icon">
                        <Icon />
                      </span>
                      <span className="account-timeline-body">
                        <b>{entry.title}</b>
                        {entry.detail && <span>{entry.detail}</span>}
                      </span>
                      <span className="account-timeline-when">{formatDate(entry.at)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </Reveal>
      </div>
    </>
  );
}
