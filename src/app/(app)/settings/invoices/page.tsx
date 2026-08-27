import type { Metadata } from "next";

import { SqPortalButton } from "@/components/sq/plan-actions";
import { EmptyState } from "@/components/sq/ui";
import { requireClient } from "@/lib/auth/guards";
import { getT } from "@/lib/i18n/server";
import { listInvoices } from "@/lib/billing";
import { isPaddleEnabled } from "@/lib/env";

export const metadata: Metadata = { title: "Invoices" };
export const dynamic = "force-dynamic";

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** Paddle's record, read live. Nothing here is a copy kept on our side. */
export default async function InvoicesSettingsPage() {
  const user = await requireClient();
  const t = await getT(user.id);
  const invoices = isPaddleEnabled() ? await listInvoices(user.id) : [];

  return (
    <section className="sq-card" style={{ overflow: "hidden" }}>
      <div className="sq-section-head sq-rule-head">
        <h2 className="sq-h2" style={{ fontSize: 19 }}>
          Invoices
        </h2>
        {isPaddleEnabled() ? <SqPortalButton label={t.panes.invoices.openPortal} /> : null}
      </div>

      {invoices.length === 0 ? (
        <div style={{ padding: 26 }}>
          <EmptyState
            glyph="coin"
            title={isPaddleEnabled() ? t.panes.invoices.none : t.panes.invoices.notConfigured}
            body={
              isPaddleEnabled()
                ? t.panes.invoices.noneBody
                : t.panes.invoices.notConfiguredBody
            }
          />
        </div>
      ) : (
        <ul>
          {invoices.map((invoice) => (
            <li
              key={invoice.id}
              style={{
                display: "grid",
                gridTemplateColumns: "auto minmax(0,1fr) auto auto",
                gap: 12,
                alignItems: "center",
                padding: "13px 22px",
                borderTop: "1px solid var(--line-2)",
                fontSize: 13.5,
              }}
            >
              <span className="sq-mono" style={{ fontSize: 12, whiteSpace: "nowrap", color: "var(--ink-2)" }}>
                {DATE.format(invoice.date)}
              </span>
              <span style={{ minWidth: 0 }}>
                {invoice.href ? (
                  <a href={invoice.href} target="_blank" rel="noreferrer noopener">
                    {invoice.what}
                  </a>
                ) : (
                  invoice.what
                )}
              </span>
              <span
                className="sq-mono"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  color: invoice.state === "paid" ? "var(--moss)" : "var(--signal)",
                }}
              >
                {invoice.state}
              </span>
              <b className="sq-mono" style={{ fontWeight: 500, whiteSpace: "nowrap" }}>
                {invoice.amount}
              </b>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
