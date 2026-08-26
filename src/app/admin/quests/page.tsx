import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";

import { SqFilterBar, SqParamSearch, SqParamSelect } from "@/components/sq/controls";
import { Bar, EmptyState, PageHeader, StatGrid, StatTile, Tag } from "@/components/sq/ui";
import { getDifficultySplit, getTopLocations } from "@/lib/admin/stats";
import { requireRank } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Quests · Admin" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 40;
const WHEN = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "2-digit" });
const GRADES = ["EASY", "MODERATE", "HARD", "EXPERT"] as const;

/**
 * The catalogue, from behind the desk.
 *
 * Spread matters more than volume here — the engine's claim is that it does
 * not repeat itself, and the two panels under the figures are what let
 * somebody check that claim rather than take it. The list is the whole
 * catalogue, filtered, with the editor one click away from every row.
 */
export default async function AdminQuestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; grade?: string; state?: string; page?: string }>;
}) {
  await requireRank("WRITER");
  const params = await searchParams;

  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const search = (params.q ?? "").trim();
  const grade = params.grade ?? "all";
  const state = params.state ?? "all";

  const where: Prisma.QuestWhereInput = {};
  if (grade !== "all") where.difficulty = grade as (typeof GRADES)[number];
  if (state === "published") where.published = true;
  if (state === "draft") where.published = false;
  if (state === "booked") where.schedules = { some: {} };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
      { region: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, quests, counts, grades, locations] = await Promise.all([
    db.quest.count({ where }),
    db.quest.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        number: true,
        title: true,
        location: true,
        region: true,
        difficulty: true,
        distance: true,
        elevationGain: true,
        published: true,
        createdAt: true,
        _count: { select: { history: true, schedules: true } },
      },
    }),
    Promise.all([
      db.quest.count(),
      db.quest.count({ where: { published: true } }),
      db.quest.groupBy({ by: ["region"], _count: { _all: true } }),
      db.questSchedule.count(),
    ]),
    getDifficultySplit(),
    getTopLocations(6),
  ]);

  const [all, published, regions, booked] = counts;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const gradeMax = Math.max(1, ...grades.map((entry) => entry.value));
  const locationMax = Math.max(1, ...locations.map((entry) => entry.value));

  return (
    <>
      <PageHeader
        kicker="The engine"
        title="Quests"
        lede="What has come out of the engine, and how widely it has spread. Spread matters more than volume — the claim is that it never repeats itself."
        right={
          <Link href="/admin/quests/new" className="sq-btn sq-btn-primary" style={{ background: "var(--pine)" }}>
            Write a quest
          </Link>
        }
      />

      <StatGrid>
        <StatTile label="In the catalogue" count={all} countId="quests-all" index={0} />
        <StatTile label="Published" count={published} countId="quests-published" index={1} />
        <StatTile label="Drafts" count={all - published} countId="quests-drafts" index={2} />
        <StatTile label="Regions covered" count={regions.length} countId="quests-regions" index={3} />
        <StatTile label="Slots booked" count={booked} countId="quests-booked" index={4} />
      </StatGrid>

      <section className="sq-grid" style={{ marginTop: 16, gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
        <article className="sq-card sq-pad-sm">
          <h3 className="sq-h2" style={{ fontSize: 17, marginBottom: 12 }}>
            Grades handed out
          </h3>
          <ul style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {grades.map((entry, index) => (
              <li
                key={entry.key}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px minmax(0,1fr) 52px",
                  gap: 12,
                  alignItems: "center",
                  fontSize: 13,
                }}
              >
                <span>{entry.label}</span>
                <Bar
                  pct={(entry.value / gradeMax) * 100}
                  fill={["var(--color-accent-300)", "var(--color-accent-400)", "var(--moss)", "var(--pine)"][index]}
                />
                <b className="sq-mono" style={{ fontWeight: 500, fontSize: 12, textAlign: "right" }}>
                  {entry.value}
                </b>
              </li>
            ))}
          </ul>
        </article>

        <article className="sq-tinted sq-pad-sm">
          <h3 className="sq-h2" style={{ fontSize: 17, marginBottom: 12 }}>
            Busiest trailheads
          </h3>
          {locations.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--ink-3)" }}>Nothing has been issued yet.</p>
          ) : (
            <ul style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {locations.map((entry) => (
                <li
                  key={entry.label}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(80px,110px) minmax(0,1fr) 44px",
                    gap: 12,
                    alignItems: "center",
                    fontSize: 13,
                  }}
                >
                  <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {entry.label}
                  </span>
                  <Bar pct={(entry.value / locationMax) * 100} />
                  <b className="sq-mono" style={{ fontWeight: 500, fontSize: 12, textAlign: "right" }}>
                    {entry.value}
                  </b>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <div style={{ marginTop: 16 }}>
        <SqFilterBar>
          <SqParamSearch name="q" value={search} label="Find" placeholder="Title, trailhead or region" />
          <SqParamSelect
            name="grade"
            value={grade}
            label="Grade"
            options={[
              { value: "all", label: "Any grade" },
              ...GRADES.map((value) => ({ value, label: value.charAt(0) + value.slice(1).toLowerCase() })),
            ]}
          />
          <SqParamSelect
            name="state"
            value={state}
            label="State"
            options={[
              { value: "all", label: "Everything" },
              { value: "published", label: "Published" },
              { value: "draft", label: "Drafts" },
              { value: "booked", label: "Booked into a slot" },
            ]}
          />
        </SqFilterBar>
      </div>

      <section className="sq-card" style={{ overflow: "hidden" }}>
        <div className="sq-section-head sq-rule-head">
          <h2 className="sq-h2" style={{ fontSize: 19 }}>
            Latest written
          </h2>
          <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
            {quests.length} of {total.toLocaleString("en-GB")}
          </span>
        </div>

        {quests.length === 0 ? (
          <div style={{ padding: 26 }}>
            <EmptyState
              glyph="map"
              title="No quest matches that"
              body="Clear a filter, or write one."
              action={
                <Link href="/admin/quests/new" className="sq-btn sq-btn-primary sq-btn-sm">
                  Write a quest
                </Link>
              }
            />
          </div>
        ) : (
          <ul className="sq-stagger">
            {quests.map((quest, index) => (
              <li key={quest.id} style={{ ["--i" as string]: index }}>
                <Link
                  href={`/admin/quests/${quest.id}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto minmax(0,1fr) auto auto auto auto",
                    gap: 16,
                    alignItems: "center",
                    padding: "13px 22px",
                    borderTop: "1px solid var(--line-2)",
                    color: "var(--color-text)",
                  }}
                >
                  <span className="sq-mono" style={{ fontSize: 10.5, whiteSpace: "nowrap", color: "var(--ink-3)" }}>
                    {quest.number ? `№ ${String(quest.number).padStart(4, "0")}` : "—"}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <b style={{ display: "block", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 16 }}>
                      {quest.title}
                    </b>
                    <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
                      {quest.location} · {quest.region} · issued to {quest._count.history}
                    </span>
                  </span>
                  <span className="sq-mono" style={{ fontSize: 11, whiteSpace: "nowrap", color: "var(--ink-2)" }}>
                    {quest.distance.toFixed(1)} km · {quest.elevationGain} m
                  </span>
                  <Tag tone={quest.difficulty === "HARD" || quest.difficulty === "EXPERT" ? "stamp" : "green"} small>
                    {quest.difficulty}
                  </Tag>
                  {quest.published ? (
                    quest._count.schedules > 0 ? (
                      <Tag small>BOOKED</Tag>
                    ) : (
                      <span />
                    )
                  ) : (
                    <Tag tone="stamp" small>
                      DRAFT
                    </Tag>
                  )}
                  <span className="sq-mono" style={{ fontSize: 10.5, whiteSpace: "nowrap", color: "var(--ink-3)" }}>
                    {WHEN.format(quest.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
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

function href(params: Record<string, string | undefined>, page: number): string {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "page") next.set(key, value);
  }
  next.set("page", String(page));
  return `/admin/quests?${next.toString()}`;
}
