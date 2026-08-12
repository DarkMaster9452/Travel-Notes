"use client";

import * as React from "react";

import { QuestImage } from "@/components/quest/quest-image";
import {
  DURATION_LABEL,
  type CatalogueEntry,
  type DurationBucket,
} from "@/lib/quest/catalogue";
import { DIFFICULTY_LABEL } from "@/lib/quest/taxonomy";
import { cn, formatDistance } from "@/lib/utils";

/**
 * Browsable table of the places the generator draws from, with the filters
 * from the dashboard mock. Filtering happens in memory: the catalogue is a few
 * dozen static rows, so a round trip per keystroke would be pure latency.
 */

const DIFFICULTY_CHIP: Record<string, string> = {
  EASY: "bg-moss/15 text-moss",
  MODERATE: "bg-ember/15 text-ember",
  HARD: "bg-ember/25 text-ember",
  EXPERT: "bg-ink/15 text-ink",
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
  limit,
  compact = false,
}: {
  entries: CatalogueEntry[];
  countries: string[];
  difficulties: string[];
  durations: DurationBucket[];
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

        <div className="relative min-w-[12rem] flex-1">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search quests..."
            aria-label="Search the quest database"
            className="h-10 w-full rounded-sm border border-ink/15 bg-paper pl-3 pr-9 text-sm text-ink placeholder:text-stone/70 focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/25"
          />
          <span
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone"
            aria-hidden="true"
          >
            <SearchGlyph />
          </span>
        </div>
      </div>

      {/* Rows */}
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-stone">
          Nothing matches those filters. Try widening the search.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-ink/10">
          {rows.map((entry) => (
            <li
              key={entry.id}
              className="grid grid-cols-[3.5rem_1fr] items-center gap-4 py-3 sm:grid-cols-[3.5rem_minmax(0,14rem)_auto_1fr]"
            >
              <div className="relative aspect-square overflow-hidden rounded-sm">
                <QuestImage
                  src={entry.coverImage}
                  alt=""
                  palette={entry.palette}
                  sizes="56px"
                  zoomOnHover={false}
                />
              </div>

              <div className="min-w-0">
                <p className="truncate font-display text-lg font-extrabold">{entry.name}</p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-stone">
                  <PinGlyph />
                  {entry.country}
                </p>
              </div>

              <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-1">
                <Chip className={DIFFICULTY_CHIP[entry.topDifficulty] ?? "bg-ink/10 text-ink"}>
                  {DIFFICULTY_LABEL[entry.topDifficulty]}
                </Chip>
                <Chip className="bg-ink/8 text-stone">{DURATION_LABEL[entry.duration]}</Chip>
                {!compact && (
                  <Chip className="bg-ink/8 text-stone">
                    {formatDistance(entry.distanceBand[0])}–{formatDistance(entry.distanceBand[1])}
                  </Chip>
                )}
              </div>

              <p className="col-span-2 line-clamp-2 text-sm text-stone sm:col-span-1 sm:line-clamp-1">
                {entry.description}
              </p>
            </li>
          ))}
        </ul>
      )}

      {limit && filtered.length > rows.length && (
        <p className="mt-4 text-xs text-stone">
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
        "inline-flex shrink-0 items-center rounded-sm px-2 py-1 text-[0.625rem] font-semibold tracking-wide",
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
        className="h-10 appearance-none rounded-sm border border-ink/15 bg-paper pl-3 pr-8 text-sm text-ink focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/25"
      >
        <option value="all">{label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-stone"
        aria-hidden="true"
      >
        <ChevronGlyph />
      </span>
    </label>
  );
}

const glyph = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function SearchGlyph() {
  return (
    <svg {...glyph} width={16} height={16}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function ChevronGlyph() {
  return (
    <svg {...glyph} width={14} height={14}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function PinGlyph() {
  return (
    <svg {...glyph} width={12} height={12}>
      <path d="M12 21s6.5-5.7 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 15.3 12 21 12 21z" />
      <circle cx="12" cy="10.5" r="2.2" />
    </svg>
  );
}
