import type { Metadata } from "next";
import Link from "next/link";

import { SqFilterBar, SqParamSearch, SqParamSelect } from "@/components/sq/controls";
import { LockGlyph } from "@/components/sq/icons";
import { SqPaidChip } from "@/components/sq/locked";
import { EmptyState, PageHeader, Tag } from "@/components/sq/ui";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import { formatNumber, tagFor } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n";
import { getLocale, getT } from "@/lib/i18n/server";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = { title: "Quest database" };
export const dynamic = "force-dynamic";

const GRADES = ["EASY", "MODERATE", "HARD", "EXPERT"] as const;
const PAGE_SIZE = 40;

/**
 * Everything the engine has ever written.
 *
 * A member can file proof against anything published here, not only against
 * what was issued to them — somebody who walked a route on Saturday should be
 * able to log it on Sunday. So the table's job is to be findable: region,
 * grade, cadence and month, all in the URL so a filtered view can be sent to
 * somebody else and survive the back button.
 *
 * Rows this account holds are marked rather than filtered to the top. Where a
 * quest sits in the list is a fact about the catalogue; whether it is yours is
 * a fact about you, and the two should not be confused with each other.
 */
export default async function QuestDatabasePage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; grade?: string; cadence?: string; month?: string; q?: string; page?: string }>;
}) {
  const user = await requireClient();
  const params = await searchParams;

  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const grade = GRADES.includes((params.grade ?? "") as (typeof GRADES)[number]) ? params.grade : "all";
  const region = params.region ?? "all";
  const cadence = params.cadence ?? "all";
  const month = params.month ?? "all";
  const search = (params.q ?? "").trim();

  const [entitlement, t, locale] = await Promise.all([
    getEntitlement(user.id),
    getT(user.id),
    getLocale(user.id),
  ]);

  // Range is a capability: free stops at the country somebody measures from,
  // Explorer opens Europe, Ultra opens the map. The filter still lists every
  // region — a region nobody can see is a region nobody upgrades for — but
  // picking one beyond the plan is refused and marked.
  const home = await db.userPreferences.findUnique({
    where: { userId: user.id },
    select: { homeLocation: true },
  });
  const reach = entitlement.can("worldwide")
    ? "worldwide"
    : entitlement.can("europe")
      ? "europe"
      : "home";

  const where: Prisma.QuestWhereInput = { published: true };
  if (reach === "home" && home?.homeLocation) where.country = home.homeLocation;
  if (grade !== "all") where.difficulty = grade as (typeof GRADES)[number];
  if (region !== "all") where.region = region;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
      { region: { contains: search, mode: "insensitive" } },
    ];
  }
  if (cadence !== "all") {
    where.schedules = cadence === "none" ? { none: {} } : { some: { period: cadence as "WEEKLY" | "MONTHLY" } };
  }
  if (month !== "all") {
    const from = new Date(`${month}-01T00:00:00.000Z`);
    const to = new Date(from);
    to.setUTCMonth(to.getUTCMonth() + 1);
    where.createdAt = { gte: from, lt: to };
  }

  const [total, quests, regions, mine, months] = await Promise.all([
    db.quest.count({ where }),
    db.quest.findMany({
      where,
      orderBy: [{ number: "desc" }, { createdAt: "desc" }],
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
        schedules: { select: { period: true }, take: 1 },
      },
    }),
    db.quest.findMany({
      where: { published: true },
      distinct: ["region"],
      orderBy: { region: "asc" },
      select: { region: true },
      take: 60,
    }),
    db.questHistory.findMany({
      where: { userId: user.id },
      select: { questId: true, completed: true },
    }),
    db.quest.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
      take: 400,
    }),
  ]);

  const held = new Map(mine.map((row) => [row.questId, row.completed]));
  const monthOptions = uniqueMonths(
    months.map((row) => row.createdAt),
    locale,
  );
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader
        kicker={t.questsPage.kicker}
        title={t.questsPage.title}
        lede={t.questsPage.lede}
        right={
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Tag small>{t.questsPage.count(formatNumber(locale, total))}</Tag>
            {reach === "home" ? <SqPaidChip plan="explorer" capability="europe" /> : null}
          </div>
        }
      />

      {reach === "home" ? (
        <p
          className="sq-tinted"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 18px",
            marginBottom: 16,
            fontSize: 13,
            lineHeight: 1.5,
            color: "var(--ink-2)",
          }}
        >
          <span style={{ color: "var(--ink-3)" }}>
            <LockGlyph size={14} />
          </span>
          {t.questsPage.homeOnly(home?.homeLocation ?? t.questsPage.yourCountry)}
        </p>
      ) : null}

      <SqFilterBar>
        <SqParamSearch
          name="q"
          value={search}
          label={t.questsPage.find}
          placeholder={t.questsPage.findPlaceholder}
        />
        <SqParamSelect
          name="region"
          value={region}
          label={t.questsPage.region}
          options={[
            { value: "all", label: t.questsPage.everyRegion },
            ...regions.map((row) => ({ value: row.region, label: row.region })),
          ]}
        />
        <SqParamSelect
          name="grade"
          value={grade ?? "all"}
          label={t.questsPage.grade}
          options={[
            { value: "all", label: t.questsPage.anyGrade },
            ...GRADES.map((value) => ({ value, label: title(value) })),
          ]}
        />
        <SqParamSelect
          name="cadence"
          value={cadence}
          label={t.questsPage.cadence}
          options={[
            { value: "all", label: t.questsPage.any },
            { value: "MONTHLY", label: t.questsPage.wasMonthly },
            { value: "WEEKLY", label: t.questsPage.wasWeekly },
            { value: "none", label: t.questsPage.neverBooked },
          ]}
        />
        <SqParamSelect
          name="month"
          value={month}
          label={t.questsPage.written}
          options={[{ value: "all", label: t.questsPage.anyMonth }, ...monthOptions]}
        />
      </SqFilterBar>

      <section className="sq-card" style={{ overflow: "hidden" }}>
        {quests.length === 0 ? (
          <div style={{ padding: 26 }}>
            <EmptyState
              glyph="search"
              title={t.questsPage.noMatch}
              body={t.questsPage.noMatchBody}
              action={
                <Link href="/quests" className="sq-btn sq-btn-ghost sq-btn-sm">
                  {t.questsPage.clearFilters}
                </Link>
              }
            />
          </div>
        ) : (
          <ul className="sq-stagger">
            {quests.map((quest, index) => {
              const status = held.get(quest.id);
              const hard = quest.difficulty === "HARD" || quest.difficulty === "EXPERT";
              return (
                <li key={quest.id} style={{ ["--i" as string]: index }}>
                  <Link
                    href={`/quests/${quest.id}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto minmax(0,1fr) auto auto auto",
                      gap: 14,
                      alignItems: "center",
                      padding: "13px 22px",
                      borderTop: index === 0 ? "0" : "1px solid var(--line-2)",
                      color: "var(--color-text)",
                      background: status !== undefined ? "var(--paper-2)" : "transparent",
                    }}
                  >
                    <span
                      className="sq-mono"
                      style={{ fontSize: 10.5, letterSpacing: "0.06em", whiteSpace: "nowrap", color: "var(--ink-3)" }}
                    >
                      {quest.number ? `№ ${String(quest.number).padStart(4, "0")}` : "—"}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <b style={{ display: "block", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 16 }}>
                        {quest.title}
                      </b>
                      <span
                        className="sq-mono"
                        style={{ fontSize: 10.5, letterSpacing: "0.05em", color: "var(--ink-3)" }}
                      >
                        {quest.location} · {quest.region}
                      </span>
                    </span>
                    <span className="sq-mono" style={{ fontSize: 11, whiteSpace: "nowrap", color: "var(--ink-2)" }}>
                      {quest.distance.toFixed(1)} km · {quest.elevationGain} m
                    </span>
                    <Tag tone={hard ? "stamp" : "green"} small>
                      {quest.difficulty}
                    </Tag>
                    <span
                      className="sq-mono"
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.06em",
                        whiteSpace: "nowrap",
                        color: status ? "var(--moss)" : status === false ? "var(--signal)" : "transparent",
                      }}
                    >
                      {status ? t.questsPage.done : status === false ? t.questsPage.yours : "—"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {pages > 1 ? (
        <nav
          style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 18 }}
          aria-label={t.common.pages}
        >
          {page > 1 ? (
            <Link className="sq-btn sq-btn-ghost sq-btn-sm" href={pageHref(params, page - 1)}>
              {t.questsPage.newer}
            </Link>
          ) : null}
          <span className="sq-mono" style={{ alignSelf: "center", fontSize: 11, color: "var(--ink-3)" }}>
            {t.questsPage.page(page, pages)}
          </span>
          {page < pages ? (
            <Link className="sq-btn sq-btn-ghost sq-btn-sm" href={pageHref(params, page + 1)}>
              {t.questsPage.older}
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}

function pageHref(params: Record<string, string | undefined>, page: number): string {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "page") next.set(key, value);
  }
  next.set("page", String(page));
  return `/quests?${next.toString()}`;
}

function uniqueMonths(dates: Date[], locale: Locale): { value: string; label: string }[] {
  const seen = new Map<string, string>();
  const format = new Intl.DateTimeFormat(tagFor(locale), {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  for (const date of dates) {
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    if (!seen.has(key)) seen.set(key, format.format(date));
  }
  return [...seen].map(([value, label]) => ({ value, label }));
}

function title(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}
