import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";

import { SqFilterBar, SqParamSearch, SqParamSelect } from "@/components/sq/controls";
import { Avatar, EmptyState, PageHeader, StatGrid, StatTile, Tag } from "@/components/sq/ui";
import { slotKeyLabel } from "@/lib/admin/schedule";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Submissions · Admin" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "2-digit" });

/**
 * The record, and only the record.
 *
 * There are no verdict controls on this screen, deliberately: deciding happens
 * in the deck, in the order the queue deals, and a table where a reader could
 * pick out one row to approve would quietly undo the whole point of that
 * order. This is where you come to look something up afterwards.
 */
export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; cadence?: string; page?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const search = (params.q ?? "").trim();
  const status = params.status ?? "all";
  const cadence = params.cadence ?? "all";

  const where: Prisma.SubmissionWhereInput = {};
  if (status !== "all") where.status = status as "PENDING" | "APPROVED" | "REJECTED";
  if (cadence === "none") where.period = null;
  else if (cadence !== "all") where.period = cadence as "WEEKLY" | "MONTHLY";
  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { quest: { title: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [total, rows, counts] = await Promise.all([
    db.submission.count({ where }),
    db.submission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
        retreated: true,
        period: true,
        slotKey: true,
        photos: true,
        stravaUrl: true,
        distance: true,
        elevation: true,
        user: { select: { id: true, name: true } },
        quest: { select: { id: true, title: true, region: true, difficulty: true } },
        reviewedBy: { select: { name: true } },
      },
    }),
    Promise.all([
      db.submission.count({ where: { status: "PENDING" } }),
      db.submission.count({ where: { status: "APPROVED" } }),
      db.submission.count({ where: { status: "REJECTED" } }),
      db.submission.count({ where: { retreated: true } }),
    ]),
  ]);

  const [pending, approved, rejected, retreats] = counts;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader
        kicker="The record"
        title="Submissions"
        lede="Everything ever filed. No verdicts are given here — deciding happens in the deck, in the order the queue deals."
        right={
          <Link href="/admin/review" className="sq-btn sq-btn-primary" style={{ background: "var(--pine)" }}>
            Open the review deck
          </Link>
        }
      />

      <StatGrid>
        <StatTile label="Waiting" count={pending} countId="subs-pending" index={0} />
        <StatTile label="Approved" count={approved} countId="subs-approved" index={1} />
        <StatTile label="Sent back" count={rejected} countId="subs-rejected" index={2} />
        <StatTile label="Retreats" count={retreats} countId="subs-retreats" index={3} />
      </StatGrid>

      <div style={{ marginTop: 16 }}>
        <SqFilterBar>
          <SqParamSearch name="q" value={search} label="Find" placeholder="Person or quest" />
          <SqParamSelect
            name="status"
            value={status}
            label="Verdict"
            options={[
              { value: "all", label: "Any" },
              { value: "PENDING", label: "Waiting" },
              { value: "APPROVED", label: "Approved" },
              { value: "REJECTED", label: "Sent back" },
            ]}
          />
          <SqParamSelect
            name="cadence"
            value={cadence}
            label="Cadence"
            options={[
              { value: "all", label: "Any" },
              { value: "MONTHLY", label: "Monthly" },
              { value: "WEEKLY", label: "Weekly" },
              { value: "none", label: "Off-cadence" },
            ]}
          />
        </SqFilterBar>
      </div>

      <section className="sq-card" style={{ overflow: "hidden" }}>
        <div className="sq-section-head sq-rule-head">
          <h2 className="sq-h2" style={{ fontSize: 19 }}>
            Filed
          </h2>
          <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
            {rows.length} of {total.toLocaleString("en-GB")}
          </span>
        </div>

        {rows.length === 0 ? (
          <div style={{ padding: 26 }}>
            <EmptyState glyph="inbox" title="Nothing matches that" body="Clear a filter and try again." />
          </div>
        ) : (
          <div className="sq-scroll-x">
            <table className="sq-table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: 22 }}>Who</th>
                  <th>Quest</th>
                  <th>Cadence</th>
                  <th>Figures</th>
                  <th>Evidence</th>
                  <th>Verdict</th>
                  <th style={{ paddingRight: 22 }}>Read</th>
                </tr>
              </thead>
              <tbody className="sq-stagger">
                {rows.map((row, index) => (
                  <tr key={row.id} style={{ ["--i" as string]: index }}>
                    <td style={{ paddingLeft: 22 }}>
                      <Link
                        href={`/admin/users/${row.user.id}`}
                        style={{ display: "flex", alignItems: "center", gap: 9, color: "var(--color-text)" }}
                      >
                        <Avatar name={row.user.name} size={26} square />
                        <span>{row.user.name}</span>
                      </Link>
                    </td>
                    <td>
                      <Link href={`/quests/${row.quest.id}`} style={{ color: "var(--color-text)" }}>
                        {row.quest.title}
                      </Link>
                      <span className="sq-mono" style={{ display: "block", fontSize: 10, color: "var(--ink-3)" }}>
                        {row.quest.region} · {row.quest.difficulty}
                        {row.retreated ? " · retreat" : ""}
                      </span>
                    </td>
                    <td className="sq-table-num">
                      {row.period ? slotKeyLabel(row.period, row.slotKey ?? "") : "—"}
                    </td>
                    <td className="sq-table-num">
                      {row.distance != null ? `${row.distance.toFixed(1)} km` : "—"}
                      {row.elevation != null ? ` · ${row.elevation} m` : ""}
                    </td>
                    <td className="sq-table-num">
                      {row.photos.length} {row.photos.length === 1 ? "photo" : "photos"}
                      {row.stravaUrl ? " · Strava" : ""}
                    </td>
                    <td>
                      <Tag
                        tone={row.status === "APPROVED" ? "green" : row.status === "REJECTED" ? "stamp" : "plain"}
                        small
                      >
                        {row.status}
                      </Tag>
                    </td>
                    <td className="sq-table-num" style={{ paddingRight: 22, color: "var(--ink-3)" }}>
                      {row.reviewedAt
                        ? `${DATE.format(row.reviewedAt)}${row.reviewedBy ? ` · ${firstName(row.reviewedBy.name)}` : ""}`
                        : `filed ${DATE.format(row.createdAt)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {pages > 1 ? (
        <nav style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 18 }} aria-label="Pages">
          {page > 1 ? (
            <Link className="sq-btn sq-btn-ghost sq-btn-sm" href={href(params, page - 1)}>
              ← Newer
            </Link>
          ) : null}
          <span className="sq-mono" style={{ alignSelf: "center", fontSize: 11, color: "var(--ink-3)" }}>
            {page} of {pages}
          </span>
          {page < pages ? (
            <Link className="sq-btn sq-btn-ghost sq-btn-sm" href={href(params, page + 1)}>
              Older →
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

function href(params: Record<string, string | undefined>, page: number): string {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "page") next.set(key, value);
  }
  next.set("page", String(page));
  return `/admin/submissions?${next.toString()}`;
}
