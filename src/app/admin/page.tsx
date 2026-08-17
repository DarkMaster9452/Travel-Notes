import type { Metadata } from "next";

import { CountUp, Reveal } from "@/components/app/motion";
import { stagger } from "@/lib/motion";
import { Eyebrow, Panel, PanelHead, Tag } from "@/components/field";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

/**
 * The admin overview.
 *
 * Counts only, for now: the approval queue, quest authoring, the place library
 * and reports are their own build steps. What is here is real — every figure
 * is a query, none of it is placeholder.
 */
export default async function AdminOverviewPage() {
  await requireAdmin();

  const [users, admins, subscribers, issued, logged] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "ADMIN" } }),
    db.subscription.count({ where: { status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } } }),
    db.questHistory.count(),
    db.questHistory.count({ where: { completed: true } }),
  ]);

  const figures = [
    { label: "Accounts", value: users },
    { label: "Admins", value: admins },
    { label: "Subscribers", value: subscribers },
    { label: "Quests issued", value: issued },
    { label: "Quests logged", value: logged },
  ];

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>Behind the desk</Eyebrow>
          <h1>Overview.</h1>
          <p>What the product looks like from this side. Everything here is a live count.</p>
        </div>
      </Reveal>

      <Reveal delay={stagger(0)}>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-5">
          {figures.map((figure) => (
            <div key={figure.label} className="bg-card px-5 py-5">
              <dt className="meta">{figure.label}</dt>
              <dd className="mt-1 font-mono text-[24px] font-bold tracking-[-0.02em]">
                <CountUp value={figure.value} />
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>

      <Reveal delay={stagger(1)} className="mt-5">
        <Panel flush>
          <PanelHead title="Not built yet" aside={<Tag tone="ghost">Later steps</Tag>} />
          <ul className="flex flex-col gap-3 px-5 py-5 text-[14.5px] text-ink-2">
            <li>Proof queue — approve, reject, needs-info, from the keyboard.</li>
            <li>Weekly and monthly quest authoring, one per period.</li>
            <li>The place library, reports, sticker print batches, audit log.</li>
          </ul>
        </Panel>
      </Reveal>
    </>
  );
}
