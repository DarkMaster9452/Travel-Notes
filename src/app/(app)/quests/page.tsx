import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { ArrowLeft, ArrowRight, Check, Lock, SearchX } from "lucide-react";

import { FilterBar, ParamSearch, ParamSelect } from "@/components/app/filters";
import { PaidChip } from "@/components/app/locked";
import { MonthlyHero, QuestCard, QuestGrid, toTrailQuest } from "@/components/domain/trail";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { PageHeader, PageStack } from "@/components/ui/page";
import { slotFor } from "@/lib/admin/schedule";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import type { Locale } from "@/lib/i18n";
import { formatNumber, tagFor } from "@/lib/i18n/format";
import { getReader } from "@/lib/i18n/server";
import { slotTitle } from "@/lib/quest/labels";
import { glanceFeaturedSlot } from "@/lib/quest/slot";
import { TRAIL_MARKS, isTrailMark } from "@/lib/trail-marks";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getReader()).t.nav.quests };
}
export const dynamic = "force-dynamic";

const GRADES = ["EASY", "MODERATE", "HARD", "EXPERT"] as const;
const PAGE_SIZE = 40;

/**
 * Everything the engine has ever written.
 *
 * A member can file proof against anything published here, not only against
 * what was issued to them — somebody who walked a route on Saturday should be
 * able to log it on Sunday. So the page's job is to be findable: region,
 * difficulty, trail mark and cadence (design/DESIGN-SYSTEM.md §12), all in the
 * URL so a filtered view can be sent to somebody else and survive the back
 * button. `month` is still honoured in the URL, though it has no control.
 *
 * Rows this account holds are marked rather than filtered to the top. Where a
 * quest sits in the list is a fact about the catalogue; whether it is yours is
 * a fact about you, and the two should not be confused with each other.
 */
export default async function QuestDatabasePage({
  searchParams,
}: {
  searchParams: Promise<{
    region?: string;
    grade?: string;
    mark?: string;
    cadence?: string;
    month?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const user = await requireClient();
  const params = await searchParams;

  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const grade = GRADES.includes((params.grade ?? "") as (typeof GRADES)[number]) ? params.grade : "all";
  const region = params.region ?? "all";
  const cadence = params.cadence ?? "all";
  const month = params.month ?? "all";
  const mark = params.mark && isTrailMark(params.mark) ? params.mark : "all";
  const search = (params.q ?? "").trim();

  const now = new Date();
  const [entitlement, reader, monthly] = await Promise.all([
    getEntitlement(user.id),
    getReader(user.id),
    glanceFeaturedSlot(user.id, "month", now),
  ]);
  const { t, locale, units } = reader;

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
  if (mark !== "all") where.trailMarks = { has: mark };
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

  const [total, quests, regions, mine] = await Promise.all([
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
        duration: true,
        coverImage: true,
        trailMarks: true,
        features: true,
        travelTime: true,
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
  ]);

  const held = new Map(mine.map((row) => [row.questId, row.completed]));
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <PageStack>
      <div>
        <PageHeader
          title={t.questsPage.title}
          lede={t.questsPage.lede}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{t.questsPage.count(formatNumber(locale, total))}</Badge>
              {reach === "home" ? <PaidChip plan="explorer" /> : null}
            </div>
          }
        />

        {/* The monthly quest sits above the catalogue, never inside it (§6.4). */}
        {monthly.featured && !monthly.closed ? (
          <MonthlyHero
            quest={toTrailQuest(monthly.featured.summary, t)}
            t={t}
            locale={locale}
            units={units}
            monthLabel={slotTitle(slotFor("MONTHLY", now), locale, t)}
            closesAt={monthly.closesAt}
            lede={monthly.featured.summary.subtitle}
            primary={{ label: t.trail.join, href: "/monthly" }}
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-4">
        {reach === "home" ? (
          <Alert tone="info">{t.questsPage.homeOnly(home?.homeLocation ?? t.questsPage.yourCountry)}</Alert>
        ) : null}

        <FilterBar>
          <ParamSearch name="q" value={search} label={t.questsPage.find} placeholder={t.questsPage.findPlaceholder} />
          <ParamSelect
            name="region"
            value={region}
            label={t.questsPage.region}
            options={[
              { value: "all", label: t.questsPage.everyRegion },
              ...regions.map((row) => ({ value: row.region, label: row.region })),
            ]}
          />
          <ParamSelect
            name="grade"
            value={grade ?? "all"}
            label={t.questsPage.grade}
            options={[
              { value: "all", label: t.questsPage.anyGrade },
              ...GRADES.map((value) => ({ value, label: t.trail.difficulty[value] })),
            ]}
          />
          <ParamSelect
            name="mark"
            value={mark}
            label={t.app.quest.mark}
            options={[
              { value: "all", label: t.app.quest.anyMark },
              ...TRAIL_MARKS.map((value) => ({ value, label: t.trail.marks[value] })),
            ]}
          />
          <ParamSelect
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
        </FilterBar>

        {quests.length === 0 ? (
          <Card>
            <EmptyState
              icon={SearchX}
              title={t.questsPage.noMatch}
              action={
                <ButtonLink href="/quests" variant="secondary">
                  {t.questsPage.clearFilters}
                </ButtonLink>
              }
            >
              {t.questsPage.noMatchBody}
            </EmptyState>
          </Card>
        ) : (
          <QuestGrid>
            {quests.map((quest) => {
              const status = held.get(quest.id);
              return (
                <QuestCard
                  key={quest.id}
                  quest={toTrailQuest(quest, t)}
                  t={t}
                  locale={locale}
                  units={units}
                  href={`/quests/${quest.id}`}
                  period={quest.schedules[0]?.period === "WEEKLY" ? "WEEKLY" : null}
                  foot={
                    <>
                      {status ? (
                        <Badge tone="success" icon={Check}>
                          {t.app.quest.done}
                        </Badge>
                      ) : status === false ? (
                        <Badge tone="primary">{t.app.quest.yours}</Badge>
                      ) : (
                        <span>{t.trail.notStarted}</span>
                      )}
                      <span className="inline-flex items-center gap-1 font-medium text-text">
                        {t.trail.detail}
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </span>
                    </>
                  }
                />
              );
            })}
          </QuestGrid>
        )}

        {pages > 1 ? (
          <nav className="flex items-center justify-center gap-3" aria-label={t.common.pages}>
            {page > 1 ? (
              <ButtonLink variant="secondary" size="sm" href={pageHref(params, page - 1)}>
                <ArrowLeft aria-hidden="true" />
                {t.app.quest.newer}
              </ButtonLink>
            ) : null}
            <span className="text-caption tabular-nums text-muted">{t.questsPage.page(page, pages)}</span>
            {page < pages ? (
              <ButtonLink variant="secondary" size="sm" href={pageHref(params, page + 1)}>
                {t.app.quest.older}
                <ArrowRight aria-hidden="true" />
              </ButtonLink>
            ) : null}
          </nav>
        ) : null}
      </div>
    </PageStack>
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
