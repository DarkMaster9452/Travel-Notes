"use client";

import * as React from "react";

import { UnlockQuestButton } from "@/components/app/unlock-actions";
import { QuestImage } from "@/components/quest/quest-image";
import { IconChevronDown, IconPin, IconSearch } from "@/components/ui/icons";
import {
  DURATION_LABEL,
  type CatalogueEntry,
  type DurationBucket,
} from "@/lib/quest/catalogue";
import { DIFFICULTY_LABEL } from "@/lib/quest/taxonomy";
import { cn, formatDistance } from "@/lib/utils";

/**
 * Browsable table of the places a quest can send you, with the filters from the
 * dashboard mock. Filtering happens in memory: the catalogue is a few dozen
 * static rows, so a round trip per keystroke would be pure latency.
 *
 * Difficulty chips use the ordinal green ramp — one hue, light→dark — so the
 * colour carries the ordering instead of four unrelated hues that a reader has
 * to learn.
 */

const DIFFICULTY_CHIP: Record<string, string> = {
  EASY: "bg-grade-1/25 text-grade-4",
  MODERATE: "bg-grade-2/25 text-grade-4",
  HARD: "bg-grade-3/25 text-grade-4",
  EXPERT: "bg-grade-4/25 text-grade-4",
};

/** Accent-insensitive compare, so "zilina" still finds "Žilina". */
function normalise(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function QuestDatabase({
  entries,
  countries,
  difficulties,
  durations,
  canUnlock,
  limit,
  compact = false,
}: {
  entries: CatalogueEntry[];
  countries: string[];
  difficulties: string[];
  durations: DurationBucket[];
  canUnlock: boolean;
  /** Cap the rows shown — the dashboard preview passes a small number. */
  limit?: number;
  compact?: boolean;
}) {
  const [country, setCountry] = React.useState("all");
  const [difficulty, setDifficulty] = React.useState("all");
  const [duration, setDuration] = React.useState("all");
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = normalise(query);
    return entries.filter((entry) => {
      if (country !== "all" && entry.country !== country) return false;
      if (difficulty !== "all" && !entry.difficulties.includes(difficulty as never)) return false;
      if (duration !== "all" && entry.duration !== duration) return false;
      if (!q) return true;
      return (
        normalise(entry.name).includes(q) ||
        normalise(entry.region).includes(q) ||
        normalise(entry.description).includes(q) ||
        entry.terrain.some((t) => normalise(t).includes(q)) ||
        entry.features.some((f) => normalise(f).includes(q))
      );
    });
  }, [entries, country, difficulty, duration, query]);

  const rows = limit ? filtered.slice(0, limit) : filtered;

  return (
    <div className="flex flex-col">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          label="All Countries"
          value={country}
          onChange={setCountry}
          options={countries.map((c) => ({ value: c, label: c }))}
        />
        <Select
          label="All Difficulties"
          value={difficulty}
          onChange={setDifficulty}
          options={difficulties.map((d) => ({
            value: d,
            label: DIFFICULTY_LABEL[d as keyof typeof DIFFICULTY_LABEL] ?? d,
          }))}
        />
        <Select
          label="All Durations"
          value={duration}
          onChange={setDuration}
          options={durations.map((d) => ({ value: d, label: DURATION_LABEL[d] }))}
        />

        <div className="relative min-w-[11rem] flex-1">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search quests..."
            aria-label="Search the quest database"
            className="h-10 w-full rounded-lg border border-line bg-card pl-3 pr-9 text-sm text-ink placeholder:text-muted/80 focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
          />
          <span
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden="true"
          >
            <IconSearch size={16} />
          </span>
        </div>
      </div>

      {/* Rows */}
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted">
          Nothing matches those filters. Try widening the search.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {rows.map((entry) => (
            <li
              key={entry.id}
              className="grid grid-cols-[3.5rem_1fr] items-center gap-x-4 gap-y-2 py-3 sm:grid-cols-[3.5rem_minmax(0,12rem)_auto_1fr_auto]"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                <QuestImage
                  src={entry.coverImage}
                  alt=""
                  palette={entry.palette}
                  sizes="56px"
                  zoomOnHover={false}
                />
              </div>

              <div className="min-w-0">
                <p className="truncate font-display text-base font-extrabold">{entry.name}</p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
                  <IconPin size={12} />
                  {entry.country}
                </p>
              </div>

              <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-1">
                <Chip className={DIFFICULTY_CHIP[entry.topDifficulty] ?? "bg-ink/10 text-ink"}>
                  {DIFFICULTY_LABEL[entry.topDifficulty]}
                </Chip>
                <Chip className="bg-ink/6 text-muted">{DURATION_LABEL[entry.duration]}</Chip>
                {!compact && (
                  <Chip className="bg-ink/6 text-muted">
                    {formatDistance(entry.distanceBand[0])}–{formatDistance(entry.distanceBand[1])}
                  </Chip>
                )}
              </div>

              <p className="col-span-2 line-clamp-2 text-sm text-muted sm:col-span-1 sm:line-clamp-1">
                {entry.description}
              </p>

              <div className="col-span-2 justify-self-end sm:col-span-1">
                <UnlockQuestButton locationId={entry.id} disabled={!canUnlock} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {limit && filtered.length > rows.length && (
        <p className="mt-4 text-xs text-muted">
          Showing {rows.length} of {filtered.length} places.
        </p>
      )}
    </div>
  );
}

function Chip({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-2 py-1 text-[0.625rem] font-semibold tracking-wide",
        className,
      )}
    >
      {children}
    </span>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 appearance-none rounded-lg border border-line bg-card pl-3 pr-8 text-sm text-ink focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
      >
        <option value="all">{label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted"
        aria-hidden="true"
      >
        <IconChevronDown size={14} />
      </span>
    </label>
  );
}
