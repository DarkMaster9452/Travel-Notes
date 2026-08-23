import type { Prisma } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/app/motion";
import { SubmitProofButton } from "@/components/app/submit-proof";
import {
  EmptyState,
  Eyebrow,
  IconArrowRight,
  IconMap,
  IconPin,
  Panel,
  PanelHead,
  QuestArt,
  Tag,
} from "@/components/field";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { stagger } from "@/lib/motion";
import { EMPTY_CADENCE, getQuestCadences, questIdsWithCadence } from "@/lib/quest/cadence";

export const metadata: Metadata = { title: "The database" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 48;

/* -------------------------------------------------------------------------- */
/* Filters                                                                     */
/* -------------------------------------------------------------------------- */

const CADENCES = [
  { key: "any", label: "Everything" },
  { key: "featured", label: "Has been featured" },
  { key: "monthly", label: "Been a monthly" },
  { key: "weekly", label: "Been a weekly" },
  { key: "never", label: "Never featured" },
] as const;

const GRADES = [
  { key: "any", label: "Any grade" },
  { key: "EASY", label: "Easy" },
  { key: "MODERATE", label: "Moderate" },
  { key: "HARD", label: "Hard" },
  { key: "EXPERT", label: "Expert" },
] as const;

const LENGTHS = [
  { key: "any", label: "Any length", min: 0, max: 10_000 },
  { key: "short", label: "Under 8 km", min: 0, max: 8 },
  { key: "half", label: "8–15 km", min: 8, max: 15 },
  { key: "long", label: "15–25 km", min: 15, max: 25 },
  { key: "epic", label: "25 km +", min: 25, max: 10_000 },
] as const;

const MINE = [
  { key: "any", label: "All quests" },
  { key: "todo", label: "Not logged yet" },
  { key: "filed", label: "Waiting on review" },
  { key: "logged", label: "Logged" },
] as const;

const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "title", label: "A–Z" },
  { key: "longest", label: "Longest" },
  { key: "shortest", label: "Shortest" },
  { key: "steepest", label: "Steepest" },
] as const;

type Cadence = (typeof CADENCES)[number]["key"];
type Grade = (typeof GRADES)[number]["key"];
type Length = (typeof LENGTHS)[number]["key"];
type Mine = (typeof MINE)[number]["key"];
type Sort = (typeof SORTS)[number]["key"];

type Filters = {
  q: string;
  cadence: Cadence;
  grade: Grade;
  length: Length;
  mine: Mine;
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

function href(filters: Filters, change: Partial<Filters>): string {
  const next = { ...filters, ...change };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.cadence !== "any") params.set("cadence", next.cadence);
  if (next.grade !== "any") params.set("grade", next.grade);
  if (next.length !== "any") params.set("length", next.length);
  if (next.mine !== "any") params.set("mine", next.mine);
  if (next.sort !== "newest") params.set("sort", next.sort);
  if (next.region) params.set("region", next.region);
  const query = params.toString();
  return query ? `/quests?${query}` : "/quests";
}

const ORDER_BY: Record<Sort, Prisma.QuestOrderByWithRelationInput> = {
  newest: { createdAt: "desc" },
  title: { title: "asc" },
  longest: { distance: "desc" },
  shortest: { distance: "asc" },
  steepest: { elevationGain: "desc" },
};

const GRADE_TONE = (grade: string) =>
  grade === "EXPERT" || grade === "HARD" ? ("warm" as const) : ("pine" as const);

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The whole catalogue, open to browse.
 *
 * For most of this product's life there was nothing to browse on purpose: you
 * were issued a quest and that was the decision made for you. That still holds
 * for the quest in your hand — but it never held for the *record*. Somebody
 * who walked a route on Saturday needs to find it and log it, and somebody
 * planning next month wants to see what is out there. Hiding the table did not
 * make the product more focused, it just made those two things impossible.
 *
 * So: everything published, filterable, and loggable from the card. What is
 * not here is anything private — a quest generated for one account is that
 * account's, and never appears in anybody else's list.
 */
export default async function QuestDatabasePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireClient();

  const params = await searchParams;
  const single = (key: string) => (typeof params[key] === "string" ? params[key] : undefined);

  const filters: Filters = {
    q: (single("q") ?? "").trim().slice(0, 80),
    cadence: pick(CADENCES, single("cadence"), "any"),
    grade: pick(GRADES, single("grade"), "any"),
    length: pick(LENGTHS, single("length"), "any"),
    mine: pick(MINE, single("mine"), "any"),
    sort: pick(SORTS, single("sort"), "newest"),
    region: (single("region") ?? "").trim().slice(0, 60),
  };

  const band = LENGTHS.find((item) => item.key === filters.length)!;

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

  /** The catalogue: published, authored quests. Never anybody's own copy. */
  const visible: Prisma.QuestWhereInput = { published: true, isShowcase: true };

  const mineWhere: Prisma.QuestWhereInput =
    filters.mine === "logged"
      ? { submissions: { some: { userId: user.id, status: "APPROVED" } } }
      : filters.mine === "filed"
        ? { submissions: { some: { userId: user.id, status: "PENDING" } } }
        : filters.mine === "todo"
          ? { NOT: { submissions: { some: { userId: user.id, status: "APPROVED" } } } }
          : {};

  const where: Prisma.QuestWhereInput = {
    ...visible,
    ...mineWhere,
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
    ...(filters.length === "any" ? {} : { distance: { gte: band.min, lt: band.max } }),
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
        title: true,
        subtitle: true,
        objective: true,
        location: true,
        region: true,
        country: true,
        difficulty: true,
        distance: true,
        elevationGain: true,
        duration: true,
        category: true,
        coverImage: true,
        terrain: true,
        features: true,
        submissions: { where: { userId: user.id }, select: { status: true }, take: 1 },
      },
    }),
    db.quest.count({ where }),
    db.quest.count({ where: visible }),
    db.quest.groupBy({
      by: ["region"],
      where: visible,
      _count: { _all: true },
      orderBy: { region: "asc" },
    }),
  ]);

  const cadences = await getQuestCadences(quests.map((quest) => quest.id));

  const rows: readonly {
    key: string;
    label: string;
    options: readonly { key: string; label: string }[];
    current: string;
    change: (key: string) => Partial<Filters>;
  }[] = [
    {
      key: "cadence",
      label: "Cadence",
      options: CADENCES,
      current: filters.cadence,
      change: (key) => ({ cadence: key as Cadence }),
    },
    {
      key: "grade",
      label: "Grade",
      options: GRADES,
      current: filters.grade,
      change: (key) => ({ grade: key as Grade }),
    },
    {
      key: "length",
      label: "Length",
      options: LENGTHS,
      current: filters.length,
      change: (key) => ({ length: key as Length }),
    },
    {
      key: "mine",
      label: "Yours",
      options: MINE,
      current: filters.mine,
      change: (key) => ({ mine: key as Mine }),
    },
    {
      key: "sort",
      label: "Order",
      options: SORTS,
      current: filters.sort,
      change: (key) => ({ sort: key as Sort }),
    },
  ];

  const filtered = matching !== total || filters.q !== "" || filters.region !== "";

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>Every quest we have written</Eyebrow>
          <h1>The database.</h1>
          <p>
            {total} quests, open to browse and open to log — you don&apos;t have to be issued one
            to file proof you did it. Weekly and monthly quests are marked, with the week or month
            they ran.
          </p>
        </div>
        <Tag tone="ghost">{filtered ? `${matching} of ${total}` : `${total} quests`}</Tag>
      </Reveal>

      <Reveal className="mb-5">
        <Panel flush className="qdb-filters">
          <PanelHead
            title="Filters"
            aside={
              filtered ? (
                <Link href="/quests" className="btn btn-ghost btn-sm">
                  Clear
                </Link>
              ) : (
                <Tag tone="ghost">{`${quests.length} shown`}</Tag>
              )
            }
          />

          <form className="qdb-search" method="get" action="/quests">
            <label className="sr-only" htmlFor="quest-search">
              Search the database
            </label>
            <input
              id="quest-search"
              name="q"
              defaultValue={filters.q}
              className="input"
              placeholder="A place, a region, a title…"
            />
            {filters.cadence !== "any" && (
              <input type="hidden" name="cadence" value={filters.cadence} />
            )}
            {filters.grade !== "any" && <input type="hidden" name="grade" value={filters.grade} />}
            {filters.length !== "any" && (
              <input type="hidden" name="length" value={filters.length} />
            )}
            {filters.mine !== "any" && <input type="hidden" name="mine" value={filters.mine} />}
            {filters.sort !== "newest" && <input type="hidden" name="sort" value={filters.sort} />}
            {filters.region && <input type="hidden" name="region" value={filters.region} />}
            <button type="submit" className="btn btn-primary btn-sm">
              Search
            </button>
          </form>

          {rows.map((row) => (
            <div key={row.key} className="qdb-filter-row">
              <b>{row.label}</b>
              <nav aria-label={row.label}>
                {row.options.map((option) => (
                  <Link
                    key={option.key}
                    href={href(filters, row.change(option.key))}
                    aria-current={option.key === row.current ? "page" : undefined}
                    scroll={false}
                  >
                    {option.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}

          <div className="qdb-filter-row">
            <b>Region</b>
            <nav aria-label="Region">
              <Link
                href={href(filters, { region: "" })}
                aria-current={filters.region === "" ? "page" : undefined}
                scroll={false}
              >
                Anywhere
              </Link>
              {regions.map((row) => (
                <Link
                  key={row.region}
                  href={href(filters, { region: row.region })}
                  aria-current={row.region === filters.region ? "page" : undefined}
                  scroll={false}
                >
                  {row.region}
                  <em>{row._count._all}</em>
                </Link>
              ))}
            </nav>
          </div>
        </Panel>
      </Reveal>

      {quests.length === 0 ? (
        <Reveal>
          <EmptyState icon={<IconMap />} title="Nothing matches that.">
            Loosen a filter — or clear them all and start from the whole table.
          </EmptyState>
        </Reveal>
      ) : (
        <div className="qdb-grid">
          {quests.map((quest, index) => {
            const cadence = cadences.get(quest.id) ?? EMPTY_CADENCE;
            const status = quest.submissions[0]?.status ?? "NONE";

            return (
              <Reveal key={quest.id} delay={stagger(index, 5)}>
                <article className="qdb-card">
                  {quest.coverImage ? (
                    /* An arbitrary remote host an admin pasted, not a domain
                       known at build time — so not `next/image`. */
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="qdb-cover" src={quest.coverImage} alt="" loading="lazy" />
                  ) : (
                    /* No photograph: the quest's own mark takes the space,
                       the same as on its page. It says nothing about the
                       place, which is why it is safe where a picture of
                       somewhere real would be a claim we cannot make. */
                    <QuestArt
                      seed={quest.id}
                      tags={[...quest.terrain, ...quest.features]}
                      variant="band"
                      className="qdb-cover"
                    />
                  )}

                  <div className="qdb-body">
                    <div className="qdb-tags">
                      {cadence.isLive && <Tag tone="warm">Live now</Tag>}
                      {cadence.hasBeenMonthly && (
                        <Tag tone="warm">
                          Monthly{cadence.monthlyRuns > 1 ? ` ×${cadence.monthlyRuns}` : ""}
                        </Tag>
                      )}
                      {cadence.hasBeenWeekly && (
                        <Tag tone="pine">
                          Weekly{cadence.weeklyRuns > 1 ? ` ×${cadence.weeklyRuns}` : ""}
                        </Tag>
                      )}
                      <Tag tone={GRADE_TONE(quest.difficulty)}>{quest.difficulty}</Tag>
                      {status === "APPROVED" && <Tag tone="pine">Logged</Tag>}
                      {status === "PENDING" && <Tag tone="ghost">In review</Tag>}
                    </div>

                    <span className="qdb-where">
                      <IconPin />
                      {quest.location} · {quest.region}
                    </span>

                    <h2 className="qdb-title">
                      <Link href={`/quests/${quest.id}`}>{quest.title}</Link>
                    </h2>

                    {/* The cadence sentence leads the description when there
                        is one: "this was the monthly in September" is the most
                        interesting thing about a quest that has been one. */}
                    <p className="qdb-desc">
                      {cadence.line && <b>{cadence.line} </b>}
                      {quest.subtitle}
                    </p>

                    <dl className="qdb-stats">
                      <div>
                        <dt>Distance</dt>
                        <dd>{quest.distance.toFixed(1)} km</dd>
                      </div>
                      <div>
                        <dt>Ascent</dt>
                        <dd>{Math.round(quest.elevationGain)} m</dd>
                      </div>
                      <div>
                        <dt>Time</dt>
                        <dd>{(quest.duration / 60).toFixed(1)} h</dd>
                      </div>
                    </dl>

                    <div className="qdb-foot">
                      <Link href={`/quests/${quest.id}`} className="btn btn-ghost btn-sm">
                        Read it
                        <IconArrowRight />
                      </Link>
                      <SubmitProofButton
                        questId={quest.id}
                        status={status}
                        label="Log it"
                        className="btn-sm"
                      />
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      )}

      {matching > quests.length && (
        <p className="note mt-5 text-center">
          Showing the first {quests.length} of {matching}. Narrow the filters to see the rest.
        </p>
      )}
    </>
  );
}
