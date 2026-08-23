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
  QuestArt,
  Tag,
} from "@/components/field";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { stagger } from "@/lib/motion";
import { EMPTY_CADENCE, getQuestCadences } from "@/lib/quest/cadence";

export const metadata: Metadata = { title: "The database" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 60;

/* -------------------------------------------------------------------------- */
/* Filters                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Three controls, and no more.
 *
 * This page had seven: cadence, grade, length band, "yours", sort, region and
 * a search box, stacked five rows deep above the quests. Every one of them was
 * defensible on its own and together they were a database admin's console
 * sitting on top of what is meant to be a shelf of things you might go and do.
 *
 * What survived is what somebody browsing actually asks: *is it hard*, *have I
 * done it*, and *where was that one called…*. Everything else — how long, which
 * region, whether it was once a monthly — is on the card, which is where you
 * were going to look anyway.
 */
const GRADES = [
  { key: "any", label: "Any grade" },
  { key: "EASY", label: "Easy" },
  { key: "MODERATE", label: "Moderate" },
  { key: "HARD", label: "Hard" },
  { key: "EXPERT", label: "Expert" },
] as const;

const SHOW = [
  { key: "todo", label: "Still to do" },
  { key: "all", label: "Everything" },
  { key: "done", label: "Logged" },
] as const;

type Grade = (typeof GRADES)[number]["key"];
type Show = (typeof SHOW)[number]["key"];

type Filters = { q: string; grade: Grade; show: Show };

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
  if (next.grade !== "any") params.set("grade", next.grade);
  if (next.show !== "todo") params.set("show", next.show);
  const query = params.toString();
  return query ? `/quests?${query}` : "/quests";
}

const GRADE_TONE = (grade: string) =>
  grade === "EXPERT" || grade === "HARD" ? ("warm" as const) : ("pine" as const);

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Everything you could go and do.
 *
 * The quest in your hand is still assigned rather than chosen — that has not
 * changed. What this is, is the shelf: every quest we have written, open to
 * read and open to log, because somebody who walked a route on Saturday needs
 * to be able to find it and file it on Sunday.
 *
 * Nothing private is here. A quest generated for one account is that account's
 * and appears in nobody else's list.
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
    grade: pick(GRADES, single("grade"), "any"),
    show: pick(SHOW, single("show"), "todo"),
  };

  /** The catalogue: published, authored quests. Never anybody's own copy. */
  const visible: Prisma.QuestWhereInput = { published: true, isShowcase: true };

  const done: Prisma.QuestWhereInput = {
    submissions: { some: { userId: user.id, status: "APPROVED" } },
  };

  const where: Prisma.QuestWhereInput = {
    ...visible,
    ...(filters.show === "done" ? done : filters.show === "todo" ? { NOT: done } : {}),
    ...(filters.grade === "any" ? {} : { difficulty: filters.grade }),
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
  };

  const [quests, matching, total, loggedCount] = await Promise.all([
    db.quest.findMany({
      where,
      // Hardest last: a shelf that opens on the expert routes is a shelf that
      // reads as a wall. No sort control — there is one sensible order.
      orderBy: [{ difficulty: "asc" }, { distance: "asc" }],
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        subtitle: true,
        location: true,
        region: true,
        difficulty: true,
        distance: true,
        elevationGain: true,
        duration: true,
        coverImage: true,
        terrain: true,
        features: true,
        submissions: { where: { userId: user.id }, select: { status: true }, take: 1 },
      },
    }),
    db.quest.count({ where }),
    db.quest.count({ where: visible }),
    db.quest.count({ where: { ...visible, ...done } }),
  ]);

  const cadences = await getQuestCadences(quests.map((quest) => quest.id));
  const filtering = filters.q !== "" || filters.grade !== "any" || filters.show !== "todo";

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>Everything we have written</Eyebrow>
          <h1>The database.</h1>
          <p>
            {total} quests, open to read and open to log — you don&apos;t have to be issued one to
            file proof you did it.
          </p>
        </div>
        <div className="qdb-count">
          <b>{loggedCount}</b>
          <span>of {total} logged</span>
        </div>
      </Reveal>

      <Reveal className="qdb-bar">
        <form method="get" action="/quests" className="qdb-search">
          <label className="sr-only" htmlFor="quest-search">
            Search the database
          </label>
          <IconPin />
          <input
            id="quest-search"
            name="q"
            defaultValue={filters.q}
            className="input"
            placeholder="A place, a region, a title…"
          />
          {filters.grade !== "any" && <input type="hidden" name="grade" value={filters.grade} />}
          {filters.show !== "todo" && <input type="hidden" name="show" value={filters.show} />}
          <button type="submit" className="btn btn-primary btn-sm">
            Search
          </button>
        </form>

        <nav className="qdb-chips" aria-label="Grade">
          {GRADES.map((grade) => (
            <Link
              key={grade.key}
              href={href(filters, { grade: grade.key })}
              aria-current={grade.key === filters.grade ? "page" : undefined}
              scroll={false}
            >
              {grade.label}
            </Link>
          ))}
        </nav>

        <nav className="qdb-chips" aria-label="Show">
          {SHOW.map((option) => (
            <Link
              key={option.key}
              href={href(filters, { show: option.key })}
              aria-current={option.key === filters.show ? "page" : undefined}
              scroll={false}
            >
              {option.label}
            </Link>
          ))}
        </nav>
      </Reveal>

      {quests.length === 0 ? (
        <Reveal>
          <EmptyState
            icon={<IconMap />}
            title={
              filters.show === "todo" && !filtering
                ? "You have logged every one of them."
                : "Nothing matches that."
            }
            action={
              filtering ? (
                <Link href="/quests" className="btn btn-ghost">
                  Clear the filters
                </Link>
              ) : undefined
            }
          >
            {filters.show === "todo" && !filtering
              ? "There is nothing left on the shelf. More get written — the weekly and the monthly keep coming either way."
              : "Loosen a filter, or clear them and start from the whole shelf."}
          </EmptyState>
        </Reveal>
      ) : (
        <div className="qdb-grid">
          {quests.map((quest, index) => {
            const cadence = cadences.get(quest.id) ?? EMPTY_CADENCE;
            const status = quest.submissions[0]?.status ?? "NONE";

            return (
              <Reveal key={quest.id} delay={stagger(index, 4)}>
                <article className={`qdb-card${status === "APPROVED" ? " is-logged" : ""}`}>
                  <Link href={`/quests/${quest.id}`} className="qdb-cover-link" tabIndex={-1}>
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

                    <span className="qdb-cover-tags">
                      {cadence.isLive && <Tag tone="warm">Live now</Tag>}
                      {!cadence.isLive && cadence.hasBeenMonthly && (
                        <Tag tone="warm">Was the monthly</Tag>
                      )}
                      {!cadence.isLive && !cadence.hasBeenMonthly && cadence.hasBeenWeekly && (
                        <Tag tone="pine">Was the weekly</Tag>
                      )}
                      {status === "APPROVED" && <Tag tone="pine">Logged</Tag>}
                      {status === "PENDING" && <Tag tone="ghost">In review</Tag>}
                    </span>
                  </Link>

                  <div className="qdb-body">
                    <span className="qdb-where">
                      <IconPin />
                      {quest.location} · {quest.region}
                    </span>

                    <h2 className="qdb-title">
                      <Link href={`/quests/${quest.id}`}>{quest.title}</Link>
                    </h2>

                    <p className="qdb-desc">{quest.subtitle}</p>

                    <div className="qdb-facts">
                      <Tag tone={GRADE_TONE(quest.difficulty)}>{quest.difficulty}</Tag>
                      <span>{quest.distance.toFixed(1)} km</span>
                      <span>{Math.round(quest.elevationGain)} m ↑</span>
                      <span>{(quest.duration / 60).toFixed(1)} h</span>
                    </div>

                    <div className="qdb-foot">
                      <Link href={`/quests/${quest.id}`} className="btn btn-ghost btn-sm">
                        Read it
                        <IconArrowRight />
                      </Link>
                      <SubmitProofButton
                        questId={quest.id}
                        status={status}
                        label="Log it"
                        className="btn btn-signal btn-sm"
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
          Showing {quests.length} of {matching}. Search for a place to narrow it down.
        </p>
      )}
    </>
  );
}
