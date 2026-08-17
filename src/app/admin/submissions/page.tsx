import type { Metadata } from "next";
import Link from "next/link";

import { StatGrid } from "@/components/admin/stat-grid";
import { Reveal } from "@/components/app/motion";
import { Avatar, Eyebrow, Panel, PanelHead, Tag } from "@/components/field";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { stagger } from "@/lib/motion";
import { formatRelativeDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Submissions · Admin" };
export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Declined" },
] as const;

/**
 * Every submission, decided or not.
 *
 * The deck at `/admin/review` is where the work happens; this is the record —
 * what was filed, who judged it and when. Deciding from here is deliberately
 * not possible, because a table invites approving without reading.
 */
export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await requireAdmin();
  const { filter = "all" } = await searchParams;

  const where =
    filter === "pending"
      ? { status: "PENDING" as const }
      : filter === "approved"
        ? { status: "APPROVED" as const }
        : filter === "rejected"
          ? { status: "REJECTED" as const }
          : {};

  const [rows, pending, approved, rejected] = await Promise.all([
    db.submission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { name: true } },
        quest: { select: { title: true, location: true } },
        reviewedBy: { select: { name: true } },
      },
    }),
    db.submission.count({ where: { status: "PENDING" } }),
    db.submission.count({ where: { status: "APPROVED" } }),
    db.submission.count({ where: { status: "REJECTED" } }),
  ]);

  const decided = approved + rejected;

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>📥 The record</Eyebrow>
          <h1>Submissions.</h1>
          <p>What people filed, and what was decided. Reviewing happens in the deck.</p>
        </div>
        <Link href="/admin/review" className="btn btn-signal btn-sm">
          Open review deck
        </Link>
      </Reveal>

      <Reveal delay={stagger(0)} className="mb-5">
        <StatGrid
          items={[
            { label: "Pending", value: pending },
            { label: "Approved", value: approved },
            { label: "Declined", value: rejected },
            {
              label: "Approval rate",
              value: 0,
              display: decided > 0 ? `${Math.round((approved / decided) * 100)}%` : "—",
              foot: `${decided} decided`,
            },
          ]}
        />
      </Reveal>

      <Reveal delay={stagger(1)}>
        <Panel flush>
          <PanelHead title="Filed" aside={<Tag tone="ghost">{rows.length} shown</Tag>} />

          <div className="admin-filters">
            <nav aria-label="Filter">
              {FILTERS.map((item) => (
                <Link
                  key={item.key}
                  href={`/admin/submissions?filter=${item.key}`}
                  aria-current={item.key === filter ? "page" : undefined}
                  scroll={false}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {rows.length === 0 ? (
            <p className="chart-empty">Nothing filed under that filter.</p>
          ) : (
            <ul>
              {rows.map((row, index) => (
                <Reveal
                  as="li"
                  key={row.id}
                  delay={stagger(index, 8)}
                  className="admin-row border-b border-line px-5 py-4 last:border-b-0"
                >
                  <Avatar
                    name={row.user.name}
                    className="size-9 flex-[0_0_2.25rem] rounded-[11px] text-[12px]"
                  />
                  <span className="min-w-[min(100%,15rem)] flex-1">
                    <b className="block text-[15px] font-semibold">{row.quest.title}</b>
                    <span className="meta normal-case tracking-[0.06em]">
                      {row.user.name} · {row.quest.location}
                    </span>
                  </span>
                  <span className="meta w-24 shrink-0">
                    {row.photos.length} photo{row.photos.length === 1 ? "" : "s"}
                  </span>
                  <span className="meta hidden w-28 shrink-0 md:inline">
                    {formatRelativeDate(row.createdAt)}
                  </span>
                  <span className="meta hidden w-32 shrink-0 lg:inline">
                    {row.reviewedBy ? `by ${row.reviewedBy.name}` : "—"}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {row.retreated && <Tag tone="ghost">Retreat</Tag>}
                    <Tag
                      tone={
                        row.status === "APPROVED"
                          ? "pine"
                          : row.status === "REJECTED"
                            ? "warm"
                            : "ghost"
                      }
                    >
                      {row.status}
                    </Tag>
                  </span>
                </Reveal>
              ))}
            </ul>
          )}
        </Panel>
      </Reveal>
    </>
  );
}
