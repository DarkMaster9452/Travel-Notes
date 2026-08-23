import type { Prisma } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";

import { StatGrid } from "@/components/admin/stat-grid";
import { Reveal } from "@/components/app/motion";
import { SubmissionsTable } from "@/components/admin/submissions-table";
import { Eyebrow, Panel, PanelHead, Tag } from "@/components/field";
import { slotKeyLabel } from "@/lib/admin/schedule";
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

/** The second axis: what cadence it was filed against, if any. */
const CADENCES = [
  { key: "any", label: "Any cadence" },
  { key: "monthly", label: "Monthly" },
  { key: "weekly", label: "Weekly" },
  { key: "none", label: "Off-cadence" },
] as const;

const CADENCE_WHERE = {
  any: {},
  monthly: { period: "MONTHLY" as const },
  weekly: { period: "WEEKLY" as const },
  none: { period: null },
} satisfies Record<(typeof CADENCES)[number]["key"], Prisma.SubmissionWhereInput>;

function isCadence(value: string | undefined): value is (typeof CADENCES)[number]["key"] {
  return CADENCES.some((item) => item.key === value);
}

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
  searchParams: Promise<{ filter?: string; cadence?: string }>;
}) {
  await requireAdmin();
  const { filter = "all", cadence: rawCadence } = await searchParams;
  const cadence = isCadence(rawCadence) ? rawCadence : "any";

  const status =
    filter === "pending"
      ? { status: "PENDING" as const }
      : filter === "approved"
        ? { status: "APPROVED" as const }
        : filter === "rejected"
          ? { status: "REJECTED" as const }
          : {};

  const where: Prisma.SubmissionWhereInput = { ...status, ...CADENCE_WHERE[cadence] };

  const [rows, pending, approved, rejected, cadenced] = await Promise.all([
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
    db.submission.count({ where: { period: { not: null } } }),
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
            {
              label: "Weekly / monthly",
              value: cadenced,
              foot: "Filed against a slot",
            },
          ]}
        />
      </Reveal>

      <Reveal delay={stagger(1)}>
        <Panel flush>
          <PanelHead title="Filed" aside={<Tag tone="ghost">{rows.length} shown</Tag>} />

          <div className="admin-filters">
            <nav aria-label="Verdict">
              {FILTERS.map((item) => (
                <Link
                  key={item.key}
                  href={`/admin/submissions?filter=${item.key}&cadence=${cadence}`}
                  aria-current={item.key === filter ? "page" : undefined}
                  scroll={false}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <nav aria-label="Cadence">
              {CADENCES.map((item) => (
                <Link
                  key={item.key}
                  href={`/admin/submissions?filter=${filter}&cadence=${item.key}`}
                  aria-current={item.key === cadence ? "page" : undefined}
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
              cadence: row.period
                ? {
                    period: row.period,
                    label: slotKeyLabel(row.period, row.slotKey ?? ""),
                  }
                : null,
              author: { id: row.user.id, name: row.user.name, email: row.user.email },
              quest: row.quest,
            }))}
          />
        </Panel>
      </Reveal>
    </>
  );
}
