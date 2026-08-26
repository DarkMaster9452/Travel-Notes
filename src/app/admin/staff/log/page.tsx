import type { Metadata } from "next";
import Link from "next/link";

import { SqParamSelect } from "@/components/sq/controls";
import { EmptyState, PageHeader } from "@/components/sq/ui";
import { getAuditActions, getAuditLog } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Write log · Admin" };
export const dynamic = "force-dynamic";

const WHEN = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/**
 * The whole write log.
 *
 * Filterable by action, because the question is almost always "who changed
 * this kind of thing" rather than "what happened next". Reads are absent by
 * design — see `lib/admin/audit`.
 */
export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const action = params.action && params.action !== "all" ? params.action : undefined;

  const [entries, actions] = await Promise.all([getAuditLog(200, action), getAuditActions()]);

  return (
    <>
      <PageHeader
        kicker="Done from the panel"
        title="Write log"
        lede="Every write, with the account that made it. Reads are not logged — a record of who looked at what would bury the changes that matter."
        right={
          <Link href="/admin/staff" className="sq-btn sq-btn-ghost">
            Back to Staff settings
          </Link>
        }
      />

      <div
        className="sq-tinted"
        style={{ display: "flex", gap: 14, alignItems: "flex-end", padding: "16px 18px", marginBottom: 16 }}
      >
        <SqParamSelect
          name="action"
          value={action ?? "all"}
          label="Action"
          options={[
            { value: "all", label: "Everything" },
            ...actions.map((value) => ({ value, label: value })),
          ]}
        />
      </div>

      <section className="sq-card" style={{ overflow: "hidden" }}>
        {entries.length === 0 ? (
          <div style={{ padding: 26 }}>
            <EmptyState
              glyph="book"
              title="Nothing logged"
              body="The log fills as the panel is used. Nothing has been written under that filter."
            />
          </div>
        ) : (
          <ul className="sq-stagger">
            {entries.map((entry, index) => (
              <li
                key={entry.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "150px minmax(0,1fr) auto",
                  gap: 14,
                  alignItems: "baseline",
                  padding: "13px 22px",
                  borderTop: index === 0 ? "0" : "1px solid var(--line-2)",
                  ["--i" as string]: index,
                }}
              >
                <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--signal)" }}>
                  {entry.action}
                </span>
                <span style={{ minWidth: 0, fontSize: 13.5, lineHeight: 1.5 }}>
                  <b style={{ fontWeight: 600 }}>{entry.subject}</b>
                  {entry.detail ? (
                    <span style={{ display: "block", fontSize: 12.5, color: "var(--ink-3)" }}>
                      {entry.detail}
                    </span>
                  ) : null}
                </span>
                <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
                  {entry.actor} · {WHEN.format(entry.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
