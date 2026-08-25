import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SqAccountEditor } from "@/components/sq/account-editor";
import { Avatar, PageHeader, StatGrid, StatTile, Tag } from "@/components/sq/ui";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const LIVE = ["ACTIVE", "TRIALING", "PAST_DUE"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await db.user.findUnique({ where: { id }, select: { name: true } });
  return { title: `${user?.name ?? "Account"} · Admin` };
}

/**
 * One account.
 *
 * The record a support message is actually about: who they are, what they
 * hold, what they have filed and how the plan got to be what it is. The
 * editable half is deliberately one panel rather than scattered controls —
 * everything an admin can change about an account changes together, in one
 * write, with one confirmation.
 */
export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    include: {
      subscription: true,
      profile: { select: { handle: true, published: true } },
      preferences: { select: { homeLocation: true } },
      strava: { select: { athleteName: true, athleteId: true, createdAt: true } },
      _count: { select: { history: true, submissions: true, sessions: true } },
    },
  });
  if (!user) notFound();

  const [submissions, approved, history] = await Promise.all([
    db.submission.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
        retreated: true,
        period: true,
        slotKey: true,
        quest: { select: { id: true, title: true, region: true } },
      },
    }),
    db.submission.count({ where: { userId: id, status: "APPROVED" } }),
    db.questHistory.count({ where: { userId: id, completed: true } }),
  ]);

  const live = user.subscription && LIVE.includes(user.subscription.status);

  return (
    <>
      <PageHeader
        kicker={`Account · joined ${DATE.format(user.createdAt)}`}
        title={user.name}
        lede={user.email}
        right={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Avatar name={user.name} size={48} />
            {user.role === "ADMIN" ? <Tag small>STAFF</Tag> : null}
            {user.profile?.published ? (
              <Link href={`/people/${user.profile.handle}`} className="sq-btn sq-btn-ghost sq-btn-sm">
                Public page
              </Link>
            ) : null}
          </div>
        }
      />

      <StatGrid>
        <StatTile label="Quests issued" count={user._count.history} index={0} />
        <StatTile label="Walked" count={history} index={1} />
        <StatTile label="Filed" count={user._count.submissions} index={2} />
        <StatTile label="Approved" count={approved} index={3} />
        <StatTile label="Live sessions" count={user._count.sessions} index={4} />
      </StatGrid>

      <section className="sq-grid sq-grid-fit-md" style={{ marginTop: 16, alignItems: "start" }}>
        <SqAccountEditor
          account={{
            id: user.id,
            name: user.name,
            email: user.email,
            plan: live ? user.subscription!.plan : "FREE",
            freeQuestsUsed: user.freeQuestsUsed,
            theme: user.theme,
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <article className="sq-card-flat">
            <div style={{ padding: "15px 22px", borderBottom: "1px solid var(--line-2)" }}>
              <h2 className="sq-h2">Plan history</h2>
            </div>
            <ul>
              {user.subscription ? (
                [
                  { k: "Plan", v: user.subscription.plan },
                  { k: "Status", v: user.subscription.status },
                  {
                    k: "Period",
                    v:
                      user.subscription.currentPeriodStart && user.subscription.currentPeriodEnd
                        ? `${DATE.format(user.subscription.currentPeriodStart)} – ${DATE.format(user.subscription.currentPeriodEnd)}`
                        : "—",
                  },
                  { k: "Cancelling", v: user.subscription.cancelAtPeriodEnd ? "At period end" : "No" },
                  { k: "Stripe customer", v: user.subscription.stripeCustomerId ?? "—" },
                  { k: "Opened", v: DATE.format(user.subscription.createdAt) },
                ].map((row) => (
                  <li key={row.k} style={rowStyle}>
                    <span className="sq-kicker-sm" style={{ fontSize: 10 }}>
                      {row.k}
                    </span>
                    <b className="sq-mono" style={{ fontWeight: 500, fontSize: 12, textAlign: "right" }}>
                      {row.v}
                    </b>
                  </li>
                ))
              ) : (
                <li style={{ padding: "14px 22px", fontSize: 13, color: "var(--ink-3)" }}>
                  No subscription row — this account is on free.
                </li>
              )}
            </ul>
          </article>

          <article className="sq-card-flat">
            <div style={{ padding: "15px 22px", borderBottom: "1px solid var(--line-2)" }}>
              <h2 className="sq-h2">Connections</h2>
            </div>
            <ul>
              <li style={rowStyle}>
                <span className="sq-kicker-sm" style={{ fontSize: 10 }}>
                  Country
                </span>
                <b className="sq-mono" style={{ fontWeight: 500, fontSize: 12 }}>
                  {user.preferences?.homeLocation ?? "—"}
                </b>
              </li>
              <li style={rowStyle}>
                <span className="sq-kicker-sm" style={{ fontSize: 10 }}>
                  Strava
                </span>
                <b className="sq-mono" style={{ fontWeight: 500, fontSize: 12 }}>
                  {user.strava ? (user.strava.athleteName ?? user.strava.athleteId) : "Not connected"}
                </b>
              </li>
              <li style={rowStyle}>
                <span className="sq-kicker-sm" style={{ fontSize: 10 }}>
                  Public page
                </span>
                <b className="sq-mono" style={{ fontWeight: 500, fontSize: 12 }}>
                  {user.profile ? (user.profile.published ? `@${user.profile.handle}` : "Unpublished") : "None"}
                </b>
              </li>
            </ul>
          </article>
        </div>
      </section>

      <section className="sq-card" style={{ marginTop: 16, overflow: "hidden" }}>
        <div className="sq-section-head sq-rule-head">
          <h2 className="sq-h2" style={{ fontSize: 19 }}>
            What they have filed
          </h2>
          <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
            Latest {submissions.length}
          </span>
        </div>
        {submissions.length === 0 ? (
          <p style={{ padding: "16px 22px", fontSize: 13, color: "var(--ink-3)" }}>
            Nothing filed yet.
          </p>
        ) : (
          <ul className="sq-stagger">
            {submissions.map((entry, index) => (
              <li
                key={entry.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) auto auto auto",
                  gap: 14,
                  alignItems: "center",
                  padding: "13px 22px",
                  borderTop: "1px solid var(--line-2)",
                  ["--i" as string]: index,
                }}
              >
                <span style={{ minWidth: 0 }}>
                  <Link href={`/quests/${entry.quest.id}`} style={{ color: "var(--color-text)" }}>
                    <b style={{ display: "block", fontSize: 14.5, fontWeight: 600 }}>{entry.quest.title}</b>
                  </Link>
                  <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
                    {entry.quest.region}
                    {entry.period ? ` · ${entry.period.toLowerCase()} ${entry.slotKey ?? ""}` : ""}
                    {entry.retreated ? " · retreat" : ""}
                  </span>
                </span>
                <Tag
                  tone={entry.status === "APPROVED" ? "green" : entry.status === "REJECTED" ? "stamp" : "plain"}
                  small
                >
                  {entry.status}
                </Tag>
                <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
                  filed {DATE.format(entry.createdAt)}
                </span>
                <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
                  {entry.reviewedAt ? `read ${DATE.format(entry.reviewedAt)}` : "unread"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "12px 22px",
  borderTop: "1px solid var(--line-2)",
};
