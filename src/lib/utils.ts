import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 195 → "3h 15m", 45 → "45m" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** 8.72 → "8.7 km" (English) or "8,7 km" (Slovak). */
export function formatDistance(km: number, locale: string = "sk"): string {
  const value = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(km);
  return `${value} km`;
}

export function formatElevation(metres: number): string {
  return `+${Math.round(metres)} m`;
}

export function formatTravelTime(minutes: number | null | undefined): string | null {
  if (minutes == null) return null;
  return `${Math.round(minutes)} min from you`;
}

export function formatDate(date: Date | string, locale: string = "sk"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** "QUEST #07" */
export function questNumber(n: number | null | undefined): string {
  if (n == null) return "QUEST";
  return `QUEST #${String(n).padStart(2, "0")}`;
}

export function titleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function pluralise(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
