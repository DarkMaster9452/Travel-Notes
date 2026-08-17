import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { AccountControls } from "@/components/admin/account-controls";
import { Reveal } from "@/components/app/motion";
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
export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;

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

  const [history, submissions, sessions, adminCount] = await Promise.all([
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

  const live = user.subscription && LIVE_STATUSES.includes(user.subscription.status as "ACTIVE");
  const plan = live ? (user.subscription?.plan ?? "FREE") : "FREE";

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
            <PanelHead title="Activity" aside={<Tag tone="ghost">{timeline.length}</Tag>} />
            {timeline.length === 0 ? (
              <p className="chart-empty">Nothing yet.</p>
            ) : (
              <ul className="account-timeline">
                {timeline.map((entry) => {
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
