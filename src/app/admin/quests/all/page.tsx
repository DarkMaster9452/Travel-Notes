import type { Prisma } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";

import { QuestRowActions } from "@/components/admin/quest-row-actions";
import { Reveal } from "@/components/app/motion";
import { Eyebrow, Panel, PanelHead, Tag } from "@/components/field";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { stagger } from "@/lib/motion";
import { EMPTY_CADENCE, getQuestCadences, questIdsWithCadence } from "@/lib/quest/cadence";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "All quests · Admin" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 60;

/* -------------------------------------------------------------------------- */
/* Filters                                                                     */
/* -------------------------------------------------------------------------- */

const CADENCES = [
  { key: "any", label: "Any" },
  { key: "featured", label: "Has been featured" },
  { key: "monthly", label: "Has been monthly" },
  { key: "weekly", label: "Has been weekly" },
  { key: "never", label: "Never featured" },
] as const;

const GRADES = [
  { key: "any", label: "Any grade" },
  { key: "EASY", label: "Easy" },
  { key: "MODERATE", label: "Moderate" },
  { key: "HARD", label: "Hard" },
  { key: "EXPERT", label: "Expert" },
] as const;

const STATES = [
  { key: "any", label: "Any state" },
  { key: "published", label: "Published" },
  { key: "unpublished", label: "Unpublished" },
] as const;

const SOURCES = [
  { key: "any", label: "Any source" },
  { key: "authored", label: "Written here" },
  { key: "generated", label: "Generated" },
] as const;

const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "title", label: "A–Z" },
  { key: "distance", label: "Longest" },
  { key: "ascent", label: "Steepest" },
  { key: "issued", label: "Most issued" },
] as const;

type Cadence = (typeof CADENCES)[number]["key"];
type Grade = (typeof GRADES)[number]["key"];
type State = (typeof STATES)[number]["key"];
type Source = (typeof SOURCES)[number]["key"];
type Sort = (typeof SORTS)[number]["key"];

type Filters = {
  q: string;
  cadence: Cadence;
  grade: Grade;
  state: State;
  source: Source;
  sort: Sort;
  region: string;
};

function pick<T extends string>(
  options: readonly { key: T }[],
  value: string | undefined,
  fallback: T,
): T {
  return options.some((option) => option.key === value) ? (value as T) : fallback;
}

/** A link to this page with one filter swapped and the rest kept. */
function href(filters: Filters, change: Partial<Filters>): string {
  const next = { ...filters, ...change };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.cadence !== "any") params.set("cadence", next.cadence);
  if (next.grade !== "any") params.set("grade", next.grade);
  if (next.state !== "any") params.set("state", next.state);
  if (next.source !== "any") params.set("source", next.source);
  if (next.sort !== "newest") params.set("sort", next.sort);
  if (next.region) params.set("region", next.region);
  const query = params.toString();
  return query ? `/admin/quests/all?${query}` : "/admin/quests/all";
}

const ORDER_BY: Record<Sort, Prisma.QuestOrderByWithRelationInput> = {
  newest: { createdAt: "desc" },
  title: { title: "asc" },
  distance: { distance: "desc" },
  ascent: { elevationGain: "desc" },
  issued: { history: { _count: "desc" } },
};

/**
 * Every quest, with the filters an admin actually asks the table for.
 *
 * `/admin/quests` answers "what has the generator produced" in aggregate.
 * This answers "where is that one quest" — and, above all, whether a quest
 * has ever been the weekly or the monthly, which until now was only knowable
 * by opening the calendar and reading it slot by slot.
 *
 * Filtering runs on the server against the database rather than over a page
 * of rows in the browser: with a few hundred quests, a client-side filter is
 * a filter over whichever hundred happened to be fetched, which is worse than
 * no filter because it looks like an answer.
 */
export default async function AllQuestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const single = (key: string) => (typeof params[key] === "string" ? params[key] : undefined);

  const filters: Filters = {
    q: (single("q") ?? "").trim().slice(0, 80),
    cadence: pick(CADENCES, single("cadence"), "any"),
    grade: pick(GRADES, single("grade"), "any"),
    state: pick(STATES, single("state"), "any"),
    source: pick(SOURCES, single("source"), "any"),
    sort: pick(SORTS, single("sort"), "newest"),
    region: (single("region") ?? "").trim().slice(0, 60),
  };

  // The cadence filter is resolved to a set of ids first so that "has been a
  // weekly" means exactly what the badge on the row means — one definition,
  // not a `where` clause that can drift away from what is rendered next to it.
  const cadenceIds =
    filters.cadence === "any"
      ? null
      : await questIdsWithCadence(
          filters.cadence === "weekly"
            ? "WEEKLY"
            : filters.cadence === "monthly"
              ? "MONTHLY"
              : "ANY",
        );

  const where: Prisma.QuestWhereInput = {
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" } },
            { location: { contains: filters.q, mode: "insensitive" } },
            { region: { contains: filters.q, mode: "insensitive" } },
            { subtitle: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filters.region ? { region: filters.region } : {}),
    ...(filters.grade === "any" ? {} : { difficulty: filters.grade }),
    ...(filters.state === "any" ? {} : { published: filters.state === "published" }),
    ...(filters.source === "any" ? {} : { isShowcase: filters.source === "authored" }),
    ...(cadenceIds === null
      ? {}
      : filters.cadence === "never"
        ? { id: { notIn: cadenceIds } }
        : { id: { in: cadenceIds } }),
  };

  const [quests, matching, total, regions] = await Promise.all([
    db.quest.findMany({
      where,
      orderBy: ORDER_BY[filters.sort],
      take: PAGE_SIZE,
      select: {
        id: true,
        number: true,
        title: true,
        subtitle: true,
        description: true,
        location: true,
        region: true,
        country: true,
        difficulty: true,
        distance: true,
        elevationGain: true,
        duration: true,
        category: true,
        published: true,
        isShowcase: true,
        createdAt: true,
        _count: { select: { history: true, submissions: true } },
      },
    }),
    db.quest.count({ where }),
    db.quest.count(),
    db.quest.groupBy({ by: ["region"], _count: { _all: true }, orderBy: { region: "asc" } }),
  ]);

  const cadences = await getQuestCadences(quests.map((quest) => quest.id));

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>The catalogue</Eyebrow>
          <h1>All quests.</h1>
          <p>
            Everything in the table, filterable — including whether a quest has ever run as the
            weekly or the monthly, and when it did.
          </p>
        </div>
        <Link href="/admin/quests/new" className="btn btn-signal btn-sm">
          Write a new quest
        </Link>
      </Reveal>

      <Reveal>
        <Panel flush>
          <PanelHead
            title="Filtered"
            aside={
              <Tag tone="ghost">
                {matching === total
                  ? `${total} quests`
                  : `${matching} of ${total}`}
              </Tag>
            }
          />

          <div className="admin-filters">
            <form className="admin-search" method="get" action="/admin/quests/all">
              <label className="sr-only" htmlFor="quest-search">
                Search quests
              </label>
              <input
                id="quest-search"
                name="q"
                defaultValue={filters.q}
                className="input"
                placeholder="Title, place or region"
              />
              {/* The other filters ride along, so searching doesn't quietly
                  reset the cadence you were looking at. */}
              {filters.cadence !== "any" && (
                <input type="hidden" name="cadence" value={filters.cadence} />
              )}
              {filters.grade !== "any" && <input type="hidden" name="grade" value={filters.grade} />}
              {filters.state !== "any" && <input type="hidden" name="state" value={filters.state} />}
              {filters.source !== "any" && (
                <input type="hidden" name="source" value={filters.source} />
              )}
              {filters.sort !== "newest" && <input type="hidden" name="sort" value={filters.sort} />}
              {filters.region && <input type="hidden" name="region" value={filters.region} />}
              <button type="submit" className="btn btn-ghost btn-sm">
                Search
              </button>
            </form>

            <p className="meta">{quests.length} shown</p>
          </div>

          <div className="admin-filters">
            <nav aria-label="Cadence">
              {CADENCES.map((item) => (
                <Link
                  key={item.key}
                  href={href(filters, { cadence: item.key })}
                  aria-current={item.key === filters.cadence ? "page" : undefined}
                  scroll={false}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="admin-filters">
            <nav aria-label="Grade">
              {GRADES.map((item) => (
                <Link
                  key={item.key}
                  href={href(filters, { grade: item.key })}
                  aria-current={item.key === filters.grade ? "page" : undefined}
                  scroll={false}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <nav aria-label="Sort">
              {SORTS.map((item) => (
                <Link
                  key={item.key}
                  href={href(filters, { sort: item.key })}
                  aria-current={item.key === filters.sort ? "page" : undefined}
                  scroll={false}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="admin-filters">
            <nav aria-label="State">
              {STATES.map((item) => (
                <Link
                  key={item.key}
                  href={href(filters, { state: item.key })}
                  aria-current={item.key === filters.state ? "page" : undefined}
                  scroll={false}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <nav aria-label="Source">
              {SOURCES.map((item) => (
                <Link
                  key={item.key}
                  href={href(filters, { source: item.key })}
                  aria-current={item.key === filters.source ? "page" : undefined}
                  scroll={false}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="admin-filters">
            <nav aria-label="Region">
              <Link
                href={href(filters, { region: "" })}
                aria-current={filters.region === "" ? "page" : undefined}
                scroll={false}
              >
                All regions
              </Link>
              {regions.slice(0, 14).map((row) => (
                <Link
                  key={row.region}
                  href={href(filters, { region: row.region })}
                  aria-current={row.region === filters.region ? "page" : undefined}
                  scroll={false}
                >
                  {row.region} · {row._count._all}
                </Link>
              ))}
            </nav>
          </div>

          {quests.length === 0 ? (
            <p className="chart-empty">Nothing matches those filters.</p>
          ) : (
            <ul>
              {quests.map((quest, index) => {
                const cadence = cadences.get(quest.id) ?? EMPTY_CADENCE;
                return (
                  <Reveal
                    as="li"
                    key={quest.id}
                    delay={stagger(index, 6)}
                    className="quest-row border-b border-line px-5 py-4 last:border-b-0"
                  >
                    <div className="quest-row-main">
                      <span className="qc-id">
                        {quest.number ? `№ ${String(quest.number).padStart(4, "0")}` : "—"}
                      </span>
                      <div className="quest-row-title">
                        <b>{quest.title}</b>
                        <span className="meta normal-case tracking-[0.06em]">
                          {quest.location} · {quest.region} · {quest.country}
                        </span>
                      </div>

                      <div className="quest-row-tags">
                        {cadence.hasBeenMonthly && (
                          <Tag tone="warm">
                            Monthly
                            {cadence.monthlyRuns > 1 ? ` ×${cadence.monthlyRuns}` : ""}
                          </Tag>
                        )}
                        {cadence.hasBeenWeekly && (
                          <Tag tone="pine">
                            Weekly
                            {cadence.weeklyRuns > 1 ? ` ×${cadence.weeklyRuns}` : ""}
                          </Tag>
                        )}
                        {cadence.isLive && <Tag tone="warm">Live now</Tag>}
                        {cadence.booked.length > 0 && (
                          <Tag tone="ghost">{`${cadence.booked.length} booked`}</Tag>
                        )}
                        <Tag
                          tone={
                            quest.difficulty === "EXPERT" || quest.difficulty === "HARD"
                              ? "warm"
                              : "ghost"
                          }
                        >
                          {quest.difficulty}
                        </Tag>
                        {!quest.published && <Tag tone="ghost">Unpublished</Tag>}
                      </div>
                    </div>

                    {/* The cadence sentence sits with the description rather
                        than in a column of its own: "when was this the
                        monthly" is part of what the quest *is*, not a field
                        to scan past. */}
                    <p className="quest-row-desc">
                      {cadence.line && <b>{cadence.line} </b>}
                      {quest.subtitle}
                    </p>

                    <div className="quest-row-foot">
                      <span>{quest.distance.toFixed(1)} km</span>
                      <span>{Math.round(quest.elevationGain)} m ↑</span>
                      <span>{Math.round(quest.duration / 60)} h</span>
                      <span>{quest._count.history} issued</span>
                      <span>{quest._count.submissions} filed</span>
                      <span>{quest.isShowcase ? "Written here" : "Generated"}</span>
                      <span>{formatDate(quest.createdAt)}</span>
                      <QuestRowActions
                        questId={quest.id}
                        published={quest.published}
                        issued={quest._count.history}
                      />
                    </div>
                  </Reveal>
                );
              })}
            </ul>
          )}

          {matching > quests.length && (
            <p className="chart-empty">
              Showing the first {quests.length}. Narrow the filters to see the rest.
            </p>
          )}
        </Panel>
      </Reveal>
    </>
  );
}
