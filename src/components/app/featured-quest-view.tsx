import Link from "next/link";

import { QuestImage } from "@/components/quest/quest-image";
import { RouteMap } from "@/components/quest/route-map";
import { Button } from "@/components/ui/button";
import { Kicker } from "@/components/ui/primitives";
import { mapsUrl } from "@/lib/geo";
import type { FeaturedQuest } from "@/lib/quest/featured";
import { DIFFICULTY_LABEL, tagLabel } from "@/lib/quest/taxonomy";
import { formatDistance, formatDuration, formatTravelTime } from "@/lib/utils";

/**
 * Full read of a featured (weekly or monthly) quest.
 *
 * These quests are generated deterministically and never stored, so there is no
 * row to link to — the page renders the whole thing inline instead of routing
 * through /quests/[id]. Saving or completing one means generating it for real,
 * which is what the CTA at the bottom is for.
 */
export function FeaturedQuestView({
  featured,
  label,
  resetsCopy,
}: {
  featured: FeaturedQuest;
  label: string;
  resetsCopy: string;
}) {
  const { quest, summary } = featured;
  const waypoints = quest.routeData.waypoints.map((point) => ({
    lat: point.lat,
    lng: point.lng,
    label: point.label,
  }));

  return (
    <main className="pb-16">
      {/* ---- Hero ------------------------------------------------------- */}
      <header className="relative min-h-[52svh] overflow-hidden bg-ink sm:min-h-[60svh]">
        <QuestImage
          src={summary.coverImage}
          alt={quest.title}
          palette={summary.palette}
          priority
          sizes="100vw"
          zoomOnHover={false}
        />
        <div className="scrim absolute inset-0" aria-hidden="true" />

        <div className="relative flex min-h-[52svh] flex-col justify-end p-5 sm:min-h-[60svh] sm:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="kicker bg-ember px-2 py-1 text-paper">{label}</span>
            <span className="kicker border border-paper/40 px-2 py-1 text-paper/85">
              {DIFFICULTY_LABEL[quest.difficulty]}
            </span>
          </div>

          <h1 className="display-lg mt-5 max-w-[16ch] text-paper">{quest.title}</h1>

          <p className="mt-4 max-w-lg font-serif text-xl leading-snug font-medium text-paper/80 italic sm:text-2xl">
            {quest.subtitle}
          </p>

          <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-4 border-t border-paper/25 pt-6 text-paper">
            <HeroStat label="Distance" value={formatDistance(quest.distance)} />
            <HeroStat label="Time" value={formatDuration(quest.duration)} />
            <HeroStat label="Ascent" value={`+${quest.elevationGain} m`} />
            {quest.travelTime != null && (
              <HeroStat label="Travel" value={formatTravelTime(quest.travelTime) ?? "—"} />
            )}
          </dl>
        </div>
      </header>

      {/* ---- Actions ---------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-3 border-b border-ink/12 bg-paper px-5 py-4 sm:px-10">
        <Button asChild variant="primary" size="lg">
          <a
            href={mapsUrl(quest.latitude, quest.longitude, quest.location)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in maps →
          </a>
        </Button>
        <p className="text-xs text-stone">{resetsCopy}</p>
      </div>

      <div className="mx-auto grid max-w-[90rem] gap-12 px-5 py-12 sm:px-10 lg:grid-cols-[1.4fr_1fr]">
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
                <span
                  key={tag}
                  className="border border-ink/20 px-3 py-1.5 text-xs tracking-wide uppercase"
                >
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

        <aside className="space-y-10">
          <section className="bg-ink p-6 text-paper sm:p-8">
            <Kicker className="text-paper/50">Want this one for keeps?</Kicker>
            <p className="mt-4 text-sm leading-relaxed text-paper/80">
              Featured quests are a free look at what the generator makes. Generate your own to save
              it, mark it complete and have it counted in your stats.
            </p>
            <Button asChild variant="outlineLight" size="sm" className="mt-6">
              <Link href="/dashboard">Generate my own →</Link>
            </Button>
          </section>

          <section>
            <Kicker>Safety</Kicker>
            <p className="mt-4 text-sm leading-relaxed text-stone">{quest.safetyNotes}</p>
          </section>
        </aside>
      </div>
    </main>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="kicker text-paper/55">{label}</dt>
      <dd className="mt-1 font-display text-2xl font-extrabold uppercase tabular-nums sm:text-3xl">
        {value}
      </dd>
    </div>
  );
}
