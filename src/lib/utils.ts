import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * `tailwind-merge` only knows Tailwind's own scale names. The Trail tokens
 * (design/tokens.css) add their own, and without being told about them it
 * reads `text-body` as a text *colour* and drops it against `text-primary-fg`,
 * or the other way round. Every custom name is registered here, so a later
 * class replaces an earlier one only when they really set the same thing.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["display-xl", "display", "h1", "h2", "h3", "h4", "body-lg", "body", "body-sm", "caption", "overline"],
      radius: ["xs", "control", "card", "dialog", "pill"],
      shadow: ["1", "2", "3"],
      ease: ["standard", "enter", "exit"],
      animate: ["fade-in", "rise-in", "pop-in"],
      container: [
        "marketing",
        "app",
        "admin",
        "text",
        "form",
        "narrow",
        "dialog-sm",
        "dialog-md",
        "dialog-lg",
      ],
    },
    classGroups: {
      duration: [{ duration: ["fast", "base", "slow"] }],
      z: [{ z: ["sticky", "nav", "dropdown", "overlay", "modal", "toast", "tooltip"] }],
    },
  },
});

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

/** 8.72 → "8.7 km" */
export function formatDistance(km: number): string {
  return `${km >= 10 ? Math.round(km * 10) / 10 : km.toFixed(1)} km`;
}

export function formatElevation(metres: number): string {
  return `+${Math.round(metres)} m`;
}

export function formatTravelTime(minutes: number | null | undefined): string | null {
  if (minutes == null) return null;
  return `${Math.round(minutes)} min from you`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
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

/** "3 days ago" for recent items, falling back to a date once that stops helping. */
export function formatRelativeDate(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  const days = Math.floor((Date.now() - value.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return formatDate(value);
}

/** "Malá Fatra" → "mala-fatra" — a stable id for anchors, shared between a
 * marker and the row it points at. */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
