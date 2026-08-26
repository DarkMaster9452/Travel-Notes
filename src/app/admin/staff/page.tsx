import type { Metadata } from "next";
import Link from "next/link";

import { Glyph } from "@/components/sq/icons";
import { Avatar, PageHeader, StatGrid, StatTile, Tag } from "@/components/sq/ui";
import { getAuditLog } from "@/lib/admin/audit";
import { ROLE_MATRIX } from "@/lib/admin/access";
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

/**
 * The desk itself.
 *
 * Who reads proof, what each role may do, who is signed in, and what has been
 * done from the panel. Everything on this page is readable by staff; only the
 * owner can act on any of it, and the acting lives on Panel access.
 */
export default async function StaffSettingsPage() {
  const me = await requireAdmin();

  const [desk, staff, sessions, log, decided] = await Promise.all([
    getDeskStatus(),
    db.user.findMany({
      where: { role: { in: ["ADMIN", "OWNER"] } },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { reviewed: true, sessions: true } },
      },
    }),
    db.session.count({ where: { expiresAt: { gt: new Date() } } }),
    getAuditLog(8),
    db.submission.count({ where: { status: { not: "PENDING" } } }),
  ]);

  const isOwner = me.role === "OWNER";

  return (
    <>
      <PageHeader
        kicker="The desk itself"
        title="Staff settings"
        lede={
          isOwner
            ? "Who reads proof, who writes quests, and who can change either. You are the owner — the only account that can take another's keys away."
            : "Who reads proof, who writes quests, and what has been done from the panel. Changing any of it is the owner's."
        }
        right={
          <Link href="/admin/access" className="sq-btn sq-btn-ghost">
            {isOwner ? "Panel access" : "Panel access (owner only)"}
          </Link>
        }
      />

      <StatGrid>
        <StatTile label="Waiting on a reader" count={desk.pending} countId="staff-pending" index={0} />
        <StatTile
          label="Oldest wait"
          value={desk.oldestWaitDays === null ? "—" : `${desk.oldestWaitDays}d`}
          index={1}
        />
        <StatTile label="Decided, all time" count={decided} countId="staff-decided" index={2} />
        <StatTile label="Staff accounts" count={staff.length} countId="staff-count" index={3} />
        <StatTile label="Live sessions" count={sessions} countId="staff-sessions" index={4} />
      </StatGrid>

      <section className="sq-card" style={{ marginTop: 16, overflow: "hidden" }}>
        <div className="sq-section-head sq-rule-head">
          <h2 className="sq-h2" style={{ fontSize: 19 }}>
            Who is at the desk
          </h2>
          <span className="sq-kicker-sm" style={{ fontSize: 10 }}>
            Owner first
          </span>
        </div>
        <ul className="sq-stagger">
          {staff.map((person, index) => (
            <li
              key={person.id}
              style={{
                display: "grid",
                gridTemplateColumns: "auto minmax(0,1fr) auto auto auto",
                gap: 14,
                alignItems: "center",
                padding: "13px 22px",
                borderTop: "1px solid var(--line-2)",
                ["--i" as string]: index,
              }}
            >
              <Avatar name={person.name} size={34} square />
              <span style={{ minWidth: 0 }}>
                <b style={{ display: "block", fontSize: 14.5, fontWeight: 600 }}>
                  {person.name}
                  {person.id === me.id ? " · you" : ""}
                </b>
                <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
                  {person.email}
                </span>
              </span>
              <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
                {person._count.reviewed} read
              </span>
              <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
                {person._count.sessions} {person._count.sessions === 1 ? "session" : "sessions"}
              </span>
              <Tag tone={person.role === "OWNER" ? "stamp" : "plain"} small>
                {person.role}
              </Tag>
            </li>
          ))}
        </ul>
      </section>

      <section className="sq-card" style={{ marginTop: 16, overflow: "hidden" }}>
        <div className="sq-section-head sq-rule-head">
          <h2 className="sq-h2" style={{ fontSize: 19 }}>
            What each role may do
          </h2>
          <span className="sq-kicker-sm" style={{ fontSize: 10 }}>
            Roles are additive
          </span>
        </div>
        <div className="sq-scroll-x" style={{ margin: 0, padding: 0 }}>
          <table className="sq-table" style={{ minWidth: 560 }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: 22, paddingTop: 12 }}>Can</th>
                <th style={{ textAlign: "center" }}>Member</th>
                <th style={{ textAlign: "center" }}>Staff</th>
                <th style={{ textAlign: "center", paddingRight: 22 }}>Owner</th>
              </tr>
            </thead>
            <tbody>
              {ROLE_MATRIX.map((row) => (
                <tr key={row.label}>
                  <td style={{ paddingLeft: 22 }}>{row.label}</td>
                  <Cell on={row.member} />
                  <Cell on={row.staff} />
                  <Cell on={row.owner} right />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p
          style={{
            padding: "14px 22px",
            borderTop: "1px solid var(--line-2)",
            background: "var(--paper-2)",
            fontSize: 12.5,
            lineHeight: 1.55,
            color: "var(--ink-2)",
          }}
        >
          <b>Granting the staff role still needs a database prompt.</b> An owner can revoke from
          Panel access, but nothing here can promote an account — a panel that could is one
          compromised session away from making an attacker permanent.
        </p>
      </section>

      <section className="sq-card" style={{ marginTop: 16, overflow: "hidden" }}>
        <div className="sq-section-head sq-rule-head">
          <h2 className="sq-h2" style={{ fontSize: 19 }}>
            Done from the panel
          </h2>
          <Link href="/admin/staff/log" style={{ fontSize: 12.5 }}>
            The whole log →
          </Link>
        </div>
        {log.length === 0 ? (
          <p style={{ padding: "16px 22px", fontSize: 13, color: "var(--ink-3)" }}>
            Nothing has been written from the panel yet.
          </p>
        ) : (
          <ul className="sq-stagger">
            {log.map((entry, index) => (
              <li
                key={entry.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto minmax(0,1fr) auto",
                  gap: 14,
                  alignItems: "center",
                  padding: "12px 22px",
                  borderTop: "1px solid var(--line-2)",
                  ["--i" as string]: index,
                }}
              >
                <span className="sq-mono" style={{ fontSize: 10, color: "var(--signal)", whiteSpace: "nowrap" }}>
                  {entry.action}
                </span>
                <span style={{ minWidth: 0, fontSize: 13.5 }}>
                  {entry.subject}
                  {entry.detail ? <span style={{ color: "var(--ink-3)" }}> · {entry.detail}</span> : null}
                </span>
                <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
                  {entry.actor} · {WHEN.format(entry.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p
          style={{
            padding: "14px 22px",
            borderTop: "1px solid var(--line-2)",
            fontSize: 12.5,
            color: "var(--ink-3)",
          }}
        >
          Every write is stamped with the account that made it. Reads are not logged.
        </p>
      </section>
    </>
  );
}

function Cell({ on, right }: { on: boolean; right?: boolean }) {
  return (
    <td style={{ textAlign: "center", paddingRight: right ? 22 : undefined }}>
      {on ? (
        <span style={{ color: "var(--moss)" }}>
          <Glyph name="check" size={15} strokeWidth={2.4} />
        </span>
      ) : (
        <span className="sq-mono" style={{ color: "var(--ink-3)", fontSize: 12 }}>
          —
        </span>
      )}
    </td>
  );
}
