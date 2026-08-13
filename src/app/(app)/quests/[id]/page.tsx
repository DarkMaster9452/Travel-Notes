import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { UnlockCelebration } from "@/components/app/unlock-celebration";
import { CompleteQuestButton, SaveQuestButton } from "@/components/quest/quest-actions";
import { QuestImage } from "@/components/quest/quest-image";
import { RouteMap, type Waypoint } from "@/components/quest/route-map";
import { Button } from "@/components/ui/button";
import { Kicker } from "@/components/ui/primitives";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { mapsUrl } from "@/lib/geo";
import { paletteForSrc } from "@/lib/images";
import { LOCATIONS } from "@/lib/quest/locations";
import { getQuestForUser } from "@/lib/quest/service";
import { DIFFICULTY_LABEL, tagLabel } from "@/lib/quest/taxonomy";
import {
  formatDate,
  formatDistance,
  formatDuration,
  formatTravelTime,
  questNumber,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await requireOnboardedUser();
  const { id } = await params;
  const result = await getQuestForUser(id, user.id);
  return { title: result ? result.quest.title : "Quest" };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function QuestDetailPage({ params, searchParams }: Props) {
  const user = await requireOnboardedUser();
  const { id } = await params;
  const { new: isNew } = await searchParams;

  const result = await getQuestForUser(id, user.id);
  if (!result) notFound();

  const { quest, isSaved, isCompleted, generatedAt, owned } = result;
  const routeData = (quest.routeData ?? {}) as {
    waypoints?: Waypoint[];
    timing?: string;
    locationId?: string;
  };
  const waypoints = routeData.waypoints ?? [];
  const catalogEntry = LOCATIONS.find((entry) => entry.id === routeData.locationId);
  const bestMonths = catalogEntry?.bestMonths.map((m) => MONTHS[m - 1]).join(" · ") ?? "Year-round";

  return (
    <main className="pb-16">
      {/* ---- Hero ------------------------------------------------------ */}
      <header className="relative min-h-[70svh] overflow-hidden bg-ink sm:min-h-[80svh]">
        <QuestImage
          src={quest.coverImage}
          alt={quest.title}
          palette={paletteForSrc(quest.coverImage)}
          priority
          sizes="100vw"
          zoomOnHover={false}
          className={isNew ? "animate-reveal" : undefined}
        />
        <div className="scrim absolute inset-0" aria-hidden="true" />

        <div className="relative flex min-h-[70svh] flex-col justify-between p-5 sm:min-h-[80svh] sm:p-10">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/dashboard"
              className="kicker text-paper/70 transition-colors hover:text-paper"
            >
              ← Back
            </Link>
            <span className="kicker border border-paper/40 px-2 py-1 text-paper/85">
              {DIFFICULTY_LABEL[quest.difficulty]}
            </span>
          </div>

          <div>
            {isNew && (
              <p className="kicker animate-fade mb-4 inline-block bg-ember px-2 py-1 text-paper">
                Fresh quest
              </p>
            )}

            <Kicker className="text-paper/70">{questNumber(quest.number)}</Kicker>

            <h1 className="display-lg animate-rise mt-4 max-w-[16ch] text-paper">{quest.title}</h1>

            <p className="mt-5 max-w-lg font-serif text-xl leading-snug font-medium text-paper/80 italic sm:text-2xl">
              {quest.subtitle}
            </p>

            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-4 border-t border-paper/25 pt-6 text-paper">
              <HeroStat label="Distance" value={formatDistance(quest.distance)} />
              <HeroStat label="Time" value={formatDuration(quest.duration)} />
              <HeroStat label="Ascent" value={`+${quest.elevationGain} m`} />
              <HeroStat label="Difficulty" value={DIFFICULTY_LABEL[quest.difficulty]} />
              {quest.travelTime != null && (
                <HeroStat label="Travel" value={formatTravelTime(quest.travelTime) ?? "—"} />
              )}
            </dl>
          </div>
        </div>
      </header>

      {/* ---- Actions --------------------------------------------------- */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center gap-3 border-b border-ink/12 bg-paper/95 px-5 py-4 backdrop-blur-sm sm:px-10">
        <Button asChild variant="primary" size="lg">
          <a href={mapsUrl(quest.latitude, quest.longitude, quest.location)} target="_blank" rel="noopener noreferrer">
            Start · open in maps →
          </a>
        </Button>

        {owned && (
          <>
            <SaveQuestButton questId={quest.id} initialSaved={isSaved} />
            <CompleteQuestButton
              questId={quest.id}
              questTitle={quest.title}
              initialCompleted={isCompleted}
            />
          </>
        )}
      </div>

      {owned && (
        <Suspense fallback={null}>
          <UnlockCelebration questTitle={quest.title} />
        </Suspense>
      )}

      <div className="mx-auto grid max-w-[90rem] gap-12 px-5 py-14 sm:px-10 lg:grid-cols-[1.4fr_1fr]">
        {/* ---- Left column -------------------------------------------- */}
        <div className="space-y-12">
          <section>
            <Kicker>The objective</Kicker>
            <p className="mt-5 font-display text-3xl leading-tight font-extrabold uppercase sm:text-4xl">
              {quest.objective}
            </p>

            {quest.bonus && (
              <div className="mt-8 border-l-2 border-ember pl-5">
                <Kicker className="text-ember">Bonus</Kicker>
                <p className="mt-3 text-lg leading-relaxed">{quest.bonus}</p>
              </div>
            )}
          </section>

          <section className="border-t border-ink/12 pt-10">
            <Kicker>The place</Kicker>
            <h2 className="display-md mt-4">{quest.location}</h2>
            <p className="mt-2 text-sm text-stone">
              {quest.region}, {quest.country}
            </p>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/80">{quest.description}</p>

            <div className="mt-8 flex flex-wrap gap-2">
              {[...new Set([...quest.terrain, ...quest.features])].slice(0, 8).map((tag) => (
                <span key={tag} className="border border-ink/20 px-3 py-1.5 text-xs tracking-wide uppercase">
                  {tagLabel(tag)}
                </span>
              ))}
            </div>
          </section>

          {waypoints.length > 1 && (
            <section className="border-t border-ink/12 pt-10">
              <Kicker>Route sketch</Kicker>
              <RouteMap waypoints={waypoints} className="mt-5" />
              <p className="mt-4 text-xs text-stone">
                A schematic, not a navigation track. Follow the marked trail on the ground and carry
                a proper map for the area.
              </p>
            </section>
          )}
        </div>

        {/* ---- Right column ------------------------------------------- */}
        <aside className="space-y-10">
          <section className="bg-ink p-6 text-paper sm:p-8">
            <Kicker className="text-paper/50">Conditions</Kicker>
            <p className="mt-4 text-sm leading-relaxed text-paper/80">
              {routeData.timing === "sunset"
                ? "Timed for the end of the day — check today's sunset before you set off."
                : routeData.timing === "sunrise"
                  ? "An early start. Check first light for your date, and dress for the cold hour before it."
                  : "No fixed window. Daylight is the only real constraint."}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-paper/60">
              Live weather isn&apos;t connected yet. Check the forecast for the trailhead before you
              commit to the drive.
            </p>
            <Button asChild variant="outlineLight" size="sm" className="mt-6">
              <a
                href={`https://www.windy.com/?${quest.latitude},${quest.longitude},11`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Check forecast
              </a>
            </Button>
          </section>

          <section>
            <Kicker>Safety</Kicker>
            <p className="mt-4 text-sm leading-relaxed text-stone">{quest.safetyNotes}</p>
          </section>

          <section className="border-t border-ink/12 pt-8">
            <Kicker>Details</Kicker>
            <dl className="mt-4 space-y-3 text-sm">
              <DetailRow label="Generated" value={formatDate(generatedAt)} />
              <DetailRow label="Mood" value={quest.mood ?? "—"} />
              <DetailRow label="Best months" value={bestMonths} />
              <DetailRow
                label="Coordinates"
                value={`${quest.latitude.toFixed(4)}, ${quest.longitude.toFixed(4)}`}
              />
              {isCompleted && <DetailRow label="Status" value="Completed" />}
            </dl>
          </section>
        </aside>
      </div>
    </main>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="kicker text-paper/50">{label}</dt>
      <dd className="mt-1 font-display text-2xl font-extrabold uppercase tabular-nums sm:text-3xl">
        {value}
      </dd>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-ink/10 pb-3">
      <dt className="text-stone">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
