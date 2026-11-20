import type { Metadata } from "next";
import { Receipt } from "lucide-react";

import { PortalButton } from "@/components/app/plan-actions";
import { Pane } from "@/components/app/pane";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { requireClient } from "@/lib/auth/guards";
import { listInvoices } from "@/lib/billing";
import { isPaddleEnabled } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import { getReader } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getReader()).t.settings.items.invoices };
}
export const dynamic = "force-dynamic";

/** Paddle's record, read live. Nothing here is a copy kept on our side. */
export default async function InvoicesSettingsPage() {
  const user = await requireClient();
  const { t, locale } = await getReader(user.id);
  const enabled = isPaddleEnabled();
  const invoices = enabled ? await listInvoices(user.id) : [];

  return (
    <Pane
      title={t.settings.items.invoices}
      action={enabled ? <PortalButton label={t.panes.invoices.openPortal} /> : undefined}
    >
      {invoices.length === 0 ? (
        <EmptyState icon={Receipt} title={enabled ? t.panes.invoices.none : t.panes.invoices.notConfigured}>
          {enabled ? t.panes.invoices.noneBody : t.panes.invoices.notConfiguredBody}
        </EmptyState>
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {invoices.map((invoice) => (
            <li key={invoice.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-body-sm">
              <span className="w-28 shrink-0 tabular-nums text-muted">{formatDate(locale, invoice.date)}</span>
              <span className="min-w-0 flex-1">
                {invoice.href ? (
                  <a href={invoice.href} target="_blank" rel="noreferrer noopener" className="text-primary underline underline-offset-2">
                    {invoice.what}
                  </a>
                ) : (
                  invoice.what
                )}
              </span>
              <Badge tone={invoice.state === "paid" || invoice.state === "completed" ? "success" : "warning"} size="sm">
                {invoice.state === "paid" || invoice.state === "completed"
                  ? t.app.settingsPane.invoices.paid
                  : t.app.settingsPane.invoices.open}
              </Badge>
              <b className="shrink-0 font-semibold tabular-nums">{invoice.amount}</b>
            </li>
          ))}
        </ul>
      )}
    </Pane>
  );
}
