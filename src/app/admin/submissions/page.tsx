import type { Metadata } from "next";
import Link from "next/link";

import { StatGrid } from "@/components/admin/stat-grid";
import { Reveal } from "@/components/app/motion";
import { SubmissionsTable } from "@/components/admin/submissions-table";
import { Eyebrow, Panel, PanelHead, Tag } from "@/components/field";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { stagger } from "@/lib/motion";

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
        user: { select: { id: true, name: true, email: true } },
        quest: {
          select: {
            id: true,
            title: true,
            location: true,
            region: true,
            difficulty: true,
            distance: true,
            elevationGain: true,
            duration: true,
          },
        },
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
          <Eyebrow>The record</Eyebrow>
          <h1>Submissions.</h1>
          <p>What people filed, and what was decided. Open any one to read it and change the verdict.</p>
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

          <SubmissionsTable
            rows={rows.map((row) => ({
              id: row.id,
              status: row.status,
              note: row.note,
              photos: row.photos,
              stravaUrl: row.stravaUrl,
              distance: row.distance,
              elevation: row.elevation,
              movingTime: row.movingTime,
              retreated: row.retreated,
              reviewNote: row.reviewNote,
              reviewedAt: row.reviewedAt?.toISOString() ?? null,
              reviewedBy: row.reviewedBy?.name ?? null,
              createdAt: row.createdAt.toISOString(),
              author: { id: row.user.id, name: row.user.name, email: row.user.email },
              quest: row.quest,
            }))}
          />
        </Panel>
      </Reveal>
    </>
  );
}
