import type { Metadata } from "next";
import Link from "next/link";

import { SqStaffControls } from "@/components/sq/staff-controls";
import { Glyph } from "@/components/sq/icons";
import { Avatar, PageHeader, StatGrid, StatTile, Tag } from "@/components/sq/ui";
import {
  canOpen,
  PANEL_TABS,
  ROLE_LABEL,
  STAFF_ROLES,
  type StaffRole,
} from "@/lib/admin/access";
import { getAuditLog } from "@/lib/admin/audit";
import { requireRank } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Panel access · Admin" };
export const dynamic = "force-dynamic";

const WHEN = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/**
 * Who holds the keys.
 *
 * Owner-only, guarded on the server rather than hidden in the rail: a screen
 * that can end somebody's session has to refuse the request, not merely omit
 * the link. Which tabs each role can open is read from the same table the
 * guard reads, so the matrix on this page cannot drift from what is enforced.
 */
export default async function PanelAccessPage() {
  // Readable by an admin — knowing who holds a key is part of running the
  // desk. Acting on one is the owner's, and every control below says which.
  const me = await requireRank("ADMIN");
  const isOwner = me.role === "OWNER";

  const [staff, sessions, log] = await Promise.all([
    db.user.findMany({
      where: { role: { in: [...STAFF_ROLES] } },
      orderBy: [{ role: "desc" }, { name: "asc" }],
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    db.session.findMany({
      where: { expiresAt: { gt: new Date() }, user: { role: { in: [...STAFF_ROLES] } } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        user: { select: { id: true, name: true, role: true } },
      },
    }),
    getAuditLog(10),
  ]);

  const owners = staff.filter((person) => person.role === "OWNER").length;

  return (
    <>
      <PageHeader
        kicker="Keys to the panel"
        title="Panel access"
        lede={
          isOwner
            ? "Which tabs each role can open, which sessions are live right now, and what has been done from them."
            : "Which tabs each role can open, which sessions are live right now, and what has been done from them. Taking a role away is the owner's."
        }
        right={
          <Link href="/admin/staff" className="sq-btn sq-btn-ghost">
            Staff settings
          </Link>
        }
      />

      <StatGrid>
        <StatTile label="At the desk" count={staff.length} index={0} />
        <StatTile label="Owners" count={owners} index={1} />
        <StatTile label="Live panel sessions" count={sessions.length} index={2} />
        <StatTile label="Tabs" count={PANEL_TABS.length} index={3} />
      </StatGrid>

      <section className="sq-card" style={{ marginTop: 16, overflow: "hidden" }}>
        <div className="sq-section-head sq-rule-head">
          <h2 className="sq-h2" style={{ fontSize: 19 }}>
            Tabs by role
          </h2>
          <span className="sq-kicker-sm" style={{ fontSize: 10 }}>
            Owner sees everything
          </span>
        </div>
        <div className="sq-scroll-x" style={{ margin: 0, padding: 0 }}>
          <table className="sq-table" style={{ minWidth: 620 }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: 22, paddingTop: 12 }}>Tab</th>
                <th>What it is</th>
                {STAFF_ROLES.map((role, index) => (
                  <th
                    key={role}
                    style={{
                      textAlign: "center",
                      paddingRight: index === STAFF_ROLES.length - 1 ? 22 : undefined,
                    }}
                  >
                    {ROLE_LABEL[role]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PANEL_TABS.map((tab) => (
                <tr key={tab.href}>
                  <td style={{ paddingLeft: 22 }}>
                    {canOpen(me.role, tab) ? (
                      <Link href={tab.href} style={{ color: "var(--color-text)", fontWeight: 600 }}>
                        {tab.label}
                      </Link>
                    ) : (
                      <span style={{ fontWeight: 600, color: "var(--ink-3)" }}>{tab.label}</span>
                    )}
                  </td>
                  <td style={{ color: "var(--ink-2)" }}>{tab.what}</td>
                  {STAFF_ROLES.map((role: StaffRole, index) => (
                    <td
                      key={role}
                      style={{
                        textAlign: "center",
                        paddingRight: index === STAFF_ROLES.length - 1 ? 22 : undefined,
                      }}
                    >
                      <Mark on={canOpen(role, tab)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="sq-card" style={{ marginTop: 16, overflow: "hidden" }}>
        <div className="sq-section-head sq-rule-head">
          <h2 className="sq-h2" style={{ fontSize: 19 }}>
            Who holds a key
          </h2>
          <span className="sq-kicker-sm" style={{ fontSize: 10 }}>
            Revoke is instant
          </span>
        </div>
        <ul className="sq-stagger">
          {staff.map((person, index) => (
            <li
              key={person.id}
              style={{
                display: "grid",
                gridTemplateColumns: "auto minmax(0,1fr) auto auto",
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
                  {person.email} · since {WHEN.format(person.createdAt)}
                </span>
              </span>
              <Tag tone={person.role === "OWNER" ? "stamp" : "plain"} small>
                {ROLE_LABEL[person.role].toUpperCase()}
              </Tag>
              <SqStaffControls
                userId={person.id}
                name={person.name}
                isSelf={person.id === me.id}
                lastOwner={person.role === "OWNER" && owners <= 1}
                canRevoke={isOwner}
              />
            </li>
          ))}
        </ul>
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
          <b>Owners are made at a database prompt.</b> Readers, writers and admins are invited
          from Staff settings and can be revoked here; nothing in the panel mints an owner, because
          a panel that could is one compromised session away from making an attacker permanent.
          Use <code className="sq-mono" style={{ fontSize: 11.5 }}>npm run staff:grant</code>.
        </p>
      </section>

      <section className="sq-grid sq-grid-fit-md" style={{ marginTop: 16, alignItems: "start" }}>
        <article className="sq-card" style={{ overflow: "hidden" }}>
          <div className="sq-section-head sq-rule-head">
            <h2 className="sq-h2" style={{ fontSize: 19 }}>
              Live sessions
            </h2>
            <span className="sq-kicker-sm" style={{ fontSize: 10 }}>
              Panel accounts only
            </span>
          </div>
          {sessions.length === 0 ? (
            <p style={{ padding: "16px 22px", fontSize: 13, color: "var(--ink-3)" }}>
              Nobody is signed in to the panel.
            </p>
          ) : (
            <ul>
              {sessions.map((session) => (
                <li
                  key={session.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0,1fr) auto auto",
                    gap: 12,
                    alignItems: "center",
                    padding: "12px 22px",
                    borderTop: "1px solid var(--line-2)",
                    fontSize: 13,
                  }}
                >
                  <span style={{ minWidth: 0 }}>{session.user.name}</span>
                  <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
                    opened {WHEN.format(session.createdAt)}
                  </span>
                  <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
                    ends {WHEN.format(session.expiresAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="sq-card" style={{ overflow: "hidden" }}>
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
              Nothing yet.
            </p>
          ) : (
            <ul>
              {log.map((entry) => (
                <li
                  key={entry.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0,1fr) auto",
                    gap: 12,
                    alignItems: "baseline",
                    padding: "12px 22px",
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
                    {entry.actor} · {WHEN.format(entry.at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </>
  );
}

function Mark({ on }: { on: boolean }) {
  return on ? (
    <span style={{ color: "var(--moss)" }}>
      <Glyph name="check" size={15} strokeWidth={2.4} />
    </span>
  ) : (
    <span className="sq-mono" style={{ color: "var(--ink-3)", fontSize: 12 }}>
      —
    </span>
  );
}
