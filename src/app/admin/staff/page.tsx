import type { Metadata } from "next";
import Link from "next/link";

import { SqInviteRow, SqInviteStaff } from "@/components/sq/invite-staff";
import { Avatar, PageHeader, StatGrid, StatTile, Tag } from "@/components/sq/ui";
import {
  atLeast,
  invitableBy,
  ROLE_LABEL,
  ROLE_MATRIX,
  ROLE_NOTES,
  STAFF_ROLES,
} from "@/lib/admin/access";
import { getAuditLog } from "@/lib/admin/audit";
import { listInvites } from "@/lib/admin/invites";
import { getDeskStatus } from "@/lib/admin/stats";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Staff settings · Admin" };
export const dynamic = "force-dynamic";

const WHEN = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * The desk itself.
 *
 * Who reads proof, what each role may do, and what has been done from the
 * panel. Readable by anybody at the desk — knowing who your colleagues are is
 * not a privilege — while the controls appear only for the ranks that may use
 * them.
 */
export default async function StaffSettingsPage() {
  const me = await requireAdmin();
  const canInvite = atLeast(me.role, "ADMIN");

  // One instant for the whole render, so the "signed in" column and the
  // week's figures cannot disagree about what time it is.
  const now = new Date();

  const [desk, staff, invites, log, decidedThisWeek, waits] = await Promise.all([
    getDeskStatus(),
    db.user.findMany({
      where: { role: { in: [...STAFF_ROLES] } },
      orderBy: [{ role: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { reviewed: true } },
        sessions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true, expiresAt: true },
        },
      },
    }),
    listInvites(),
    getAuditLog(6),
    db.submission.count({
      where: { reviewedAt: { gte: new Date(now.getTime() - WEEK_MS) } },
    }),
    db.submission.findMany({
      where: { reviewedAt: { not: null } },
      orderBy: { reviewedAt: "desc" },
      take: 200,
      select: { createdAt: true, reviewedAt: true },
    }),
  ]);

  const counts = new Map<string, number>();
  for (const person of staff) counts.set(person.role, (counts.get(person.role) ?? 0) + 1);
  const composition = STAFF_ROLES.filter((role) => counts.get(role))
    .map((role) => `${counts.get(role)} ${ROLE_LABEL[role].toLowerCase()}${counts.get(role) === 1 ? "" : "s"}`)
    .join(" · ");

  const soonest = invites.filter((invite) => !invite.expired)[0] ?? null;

  return (
    <>
      <PageHeader
        kicker="The desk itself"
        title="Staff settings"
        lede={
          me.role === "OWNER"
            ? "Who reads proof, who writes quests, and who can change either. You are the owner — the only account that can take another's role away."
            : `Who reads proof, who writes quests, and what has been done from the panel. You are ${ROLE_LABEL[me.role].toLowerCase()}.`
        }
        right={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {atLeast(me.role, "ADMIN") ? (
              <>
                <Link href="/admin/users" className="sq-btn sq-btn-ghost">
                  Manage users
                </Link>
                <Link href="/admin/access" className="sq-btn sq-btn-ghost">
                  Panel access
                </Link>
              </>
            ) : null}
            {canInvite ? (
              <SqInviteStaff
                roles={invitableBy(me.role).map((role) => ({
                  value: role,
                  label: ROLE_LABEL[role],
                  what: ROLE_NOTES.find((note) => note.role === role)?.what ?? "",
                }))}
              />
            ) : null}
          </div>
        }
      />

      <StatGrid>
        <StatTile
          label="Staff accounts"
          count={staff.length}
          countId="staff-count"
          note={composition}
          index={0}
        />
        <StatTile
          label="Read this week"
          count={decidedThisWeek}
          countId="staff-read-week"
          note="Across the desk"
          index={1}
        />
        <StatTile label="Median wait" value={medianWait(waits)} note="Filed to decided" index={2} />
        <StatTile
          label="Waiting on a reader"
          count={desk.pending}
          countId="staff-pending"
          note={desk.oldestWaitDays === null ? "Nothing waiting" : `Oldest ${desk.oldestWaitDays}d`}
          index={3}
        />
        <StatTile
          label="Open invitations"
          count={invites.length}
          countId="staff-invites"
          note={soonest ? `Next expires ${DAY.format(soonest.expiresAt)}` : "None outstanding"}
          index={4}
        />
      </StatGrid>

      <section className="sq-card" style={{ marginTop: 16, overflow: "hidden" }}>
        <div className="sq-section-head sq-rule-head">
          <h2 className="sq-h2" style={{ fontSize: 19 }}>
            The desk
          </h2>
          <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
            {staff.length + invites.length} {staff.length + invites.length === 1 ? "account" : "accounts"}
          </span>
        </div>

        <ul className="sq-stagger">
          {staff.map((person, index) => {
            const session = person.sessions[0];
            const live = session ? session.expiresAt.getTime() > now.getTime() : false;
            return (
              <li key={person.id} className="sq-desk-row" style={{ ["--i" as string]: index }}>
                <Avatar name={person.name} size={34} square />
                <span style={{ minWidth: 0 }}>
                  <b style={{ display: "block", fontSize: 14.5, fontWeight: 600 }}>{person.name}</b>
                  <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
                    {person.email}
                  </span>
                </span>
                <Tag tone={person.role === "OWNER" ? "stamp" : "plain"} small>
                  {ROLE_LABEL[person.role].toUpperCase()}
                </Tag>
                <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
                  {person._count.reviewed} read
                </span>
                <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
                  {person.id === me.id ? "now" : live ? "signed in" : session ? WHEN.format(session.createdAt) : "never"}
                </span>
                <span style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  {person.id === me.id ? (
                    <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
                      You
                    </span>
                  ) : atLeast(me.role, "ADMIN") ? (
                    <Link href={`/admin/users/${person.id}`} style={{ fontSize: 12.5 }}>
                      Manage
                    </Link>
                  ) : null}
                </span>
              </li>
            );
          })}

          {invites.map((invite, index) => (
            <li
              key={invite.id}
              className="sq-desk-row"
              style={{ ["--i" as string]: staff.length + index, background: "var(--paper-2)" }}
            >
              <Avatar name={invite.email} size={34} square />
              <span style={{ minWidth: 0 }}>
                <b style={{ display: "block", fontSize: 14.5, fontWeight: 600 }}>{invite.email}</b>
                <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
                  invited by {invite.invitedBy ?? "somebody since deleted"}
                </span>
              </span>
              <Tag tone={invite.expired ? "stamp" : "plain"} small>
                {invite.expired ? "EXPIRED" : "INVITED"}
              </Tag>
              <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
                as {ROLE_LABEL[invite.role].toLowerCase()}
              </span>
              <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
                {invite.expired ? "expired" : `until ${DAY.format(invite.expiresAt)}`}
              </span>
              <span>
                {canInvite ? <SqInviteRow email={invite.email} link={invite.link} /> : null}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="sq-grid sq-grid-fit-md" style={{ marginTop: 16, alignItems: "start" }}>
        <article className="sq-tinted sq-pad-sm">
          <h2 className="sq-h2" style={{ fontSize: 19, marginBottom: 6 }}>
            What each role may do
          </h2>
          <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)", marginBottom: 14 }}>
            Roles are additive. A reader cannot reach anything a writer can.
          </p>
          <ul>
            {ROLE_NOTES.map((note) => (
              <li
                key={note.role}
                style={{
                  display: "grid",
                  gridTemplateColumns: "78px minmax(0,1fr)",
                  gap: 14,
                  alignItems: "baseline",
                  padding: "12px 0",
                  borderTop: "1px solid var(--line-2)",
                }}
              >
                <span
                  className="sq-mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: note.role === "OWNER" ? "var(--signal)" : "var(--moss)",
                  }}
                >
                  {ROLE_LABEL[note.role]}
                </span>
                <span style={{ fontSize: 13, lineHeight: 1.55 }}>{note.what}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="sq-card sq-pad-sm">
          <h2 className="sq-h2" style={{ fontSize: 19, marginBottom: 10 }}>
            Promotion still needs a psql prompt
          </h2>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--ink-2)", marginBottom: 16 }}>
            An owner can invite and revoke from here, but making somebody an <b>owner</b> is done in
            the database by a human — <code className="sq-mono" style={{ fontSize: 11.5 }}>npm run staff:grant</code>.
            A panel that can mint owners is one compromised session away from making an attacker
            permanent.
          </p>
          <ul>
            {log.map((entry) => (
              <li
                key={entry.id}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "9px 0",
                  borderTop: "1px solid var(--line-2)",
                  fontSize: 13,
                }}
              >
                <span style={{ minWidth: 0 }}>
                  <span className="sq-mono" style={{ fontSize: 10, color: "var(--signal)" }}>
                    {entry.action}
                  </span>{" "}
                  {entry.subject}
                </span>
                <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
                  {DAY.format(entry.at)}
                </span>
              </li>
            ))}
            {log.length === 0 ? (
              <li style={{ padding: "9px 0", borderTop: "1px solid var(--line-2)", fontSize: 13, color: "var(--ink-3)" }}>
                Nothing has been written from the panel yet.
              </li>
            ) : null}
          </ul>
          <Link href="/admin/staff/log" style={{ display: "inline-block", marginTop: 14, fontSize: 12.5 }}>
            The whole log →
          </Link>
        </article>
      </section>

      <section className="sq-card" style={{ marginTop: 16, overflow: "hidden" }}>
        <div className="sq-section-head sq-rule-head">
          <h2 className="sq-h2" style={{ fontSize: 19 }}>
            The matrix, in full
          </h2>
          <span className="sq-kicker-sm" style={{ fontSize: 10 }}>
            Lowest role that can
          </span>
        </div>
        <ul>
          {ROLE_MATRIX.map((row) => (
            <li
              key={row.label}
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 14,
                padding: "11px 22px",
                borderTop: "1px solid var(--line-2)",
                fontSize: 13.5,
              }}
            >
              <span>{row.label}</span>
              <span
                className="sq-mono"
                style={{
                  fontSize: 10.5,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  color: row.detail ? "var(--signal)" : "var(--ink-2)",
                }}
              >
                {row.detail ?? ROLE_LABEL[row.needs]}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

/**
 * How long the middle submission waited, filed to decided.
 *
 * The median rather than the mean, because one submission that sat over a
 * holiday would drag an average into saying something untrue about every
 * other day at the desk.
 */
function medianWait(rows: { createdAt: Date; reviewedAt: Date | null }[]): string {
  const hours = rows
    .filter((row): row is { createdAt: Date; reviewedAt: Date } => row.reviewedAt !== null)
    .map((row) => (row.reviewedAt.getTime() - row.createdAt.getTime()) / 3_600_000)
    .sort((a, b) => a - b);

  if (hours.length === 0) return "—";

  const middle = hours[Math.floor(hours.length / 2)];
  if (middle < 1) return "<1h";
  if (middle < 48) return `${Math.round(middle)}h`;
  return `${Math.round(middle / 24)}d`;
}
