import "server-only";

import type { ProfileAccent } from "@prisma/client";

import { getActivityGrid, type ActivityGrid } from "@/lib/activity";
import type { Locale } from "@/lib/i18n";
import { db } from "@/lib/db";
import { getAchievements } from "@/lib/achievements";
import { planIdFromRecord } from "@/lib/config";
import { countryForStoredLocation } from "@/lib/geo";
import { getUserStats } from "@/lib/quest/service";
import { LIVE_STATUSES } from "@/lib/admin/stats";

/**
 * Public profiles.
 *
 * The rule this file exists to enforce, in one place: a profile is visible to
 * a signed-in account when it is published, and to its owner always. Every
 * read goes through here so that rule is written once rather than re-derived
 * at each page, which is how somebody's unpublished page ends up on a
 * directory listing.
 *
 * What is *on* a published profile is a second question with its own answer:
 * each section is a switch the owner sets, and a section switched off is not
 * fetched, not just not rendered. Nothing about photographs, figures or
 * stickers leaves the database for a profile that has turned them off.
 */

/** How the social handles become links. Built here, never pasted whole. */
export const SOCIAL_HOSTS = {
  instagram: "https://instagram.com/",
  facebook: "https://facebook.com/",
  strava: "https://www.strava.com/athletes/",
} as const;

export type SocialKey = keyof typeof SOCIAL_HOSTS;

/**
 * A handle somebody typed, reduced to what can safely sit in a URL.
 *
 * Not a general slugifier: it is deliberately strict, because this string is
 * both a path segment and the thing that makes two people distinguishable.
 * Accented letters are folded rather than dropped, so "Ľuboš" becomes "lubos"
 * instead of "s".
 */
export function normaliseHandle(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

/** A social handle, with the decoration people paste around it stripped off. */
export function normaliseSocial(input: string): string {
  return input
    .trim()
    .replace(/^https?:\/\/(www\.)?(instagram|facebook|strava)\.com\/(athletes\/)?/i, "")
    .replace(/^@/, "")
    .replace(/\/+$/, "")
    .slice(0, 60);
}

/**
 * A handle nobody else has.
 *
 * Falls back to the account id when a name reduces to nothing at all — an
 * account called "陳" would otherwise get an empty handle, and a profile with
 * no address is not a profile.
 */
export async function uniqueHandle(preferred: string, userId: string): Promise<string> {
  const base = normaliseHandle(preferred) || `walker-${userId.slice(-6)}`;

  for (let attempt = 0; attempt < 40; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const taken = await db.profile.findUnique({
      where: { handle: candidate },
      select: { userId: true },
    });
    if (!taken || taken.userId === userId) return candidate;
  }
  return `${base}-${userId.slice(-6)}`;
}

export type ProfileActivity = {
  id: string;
  questId: string;
  title: string;
  location: string;
  region: string;
  loggedAt: Date;
  note: string;
  photos: string[];
  distance: number | null;
  elevation: number | null;
  movingTime: number | null;
  retreated: boolean;
  /** For the quest's own mark, so an activity is recognisable at a glance. */
  tags: string[];
};

/** One month of the year strip. */
export type ProfileMonth = {
  key: string;
  /** "Aug" — the strip is read as a shape, not as a table. */
  short: string;
  /** "August 2026", for the tooltip. */
  label: string;
  count: number;
};

export type PublicProfile = {
  handle: string;
  published: boolean;
  name: string;
  headline: string | null;
  bio: string | null;
  accent: ProfileAccent;
  socials: { key: SocialKey; handle: string; href: string }[];
  country: string | null;
  joinedAt: Date;
  stats: { logged: number; km: number; up: number; regions: number; countries: number } | null;
  stickers: { id: string; label: string; sticker: string }[];
  activities: ProfileActivity[];
  /** The last twelve months, oldest first. Still read by the directory. */
  months: ProfileMonth[];
  /**
   * A year of days, when the owner has left the grid switched on.
   *
   * Its own switch rather than riding on `showActivities`, because it says
   * something different: how often somebody is *here*, not what ground they
   * covered. Null when it is off, and then not fetched at all.
   */
  activityGrid: ActivityGrid | null;
  /** True when the reader is looking at their own page. */
  isSelf: boolean;
};

/**
 * One profile, as the reader is allowed to see it.
 *
 * Returns null for a handle that does not exist *and* for one that exists but
 * is not published — the two are deliberately indistinguishable from outside,
 * so the directory cannot be used to confirm that somebody has an account.
 */
export async function getPublicProfile(
  handle: string,
  readerId: string,
  /** The *reader's* language, not the profile owner's — they may differ. */
  locale: Locale = "en",
): Promise<PublicProfile | null> {
  const profile = await db.profile.findUnique({
    where: { handle },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          preferences: { select: { homeLocation: true } },
          subscription: { select: { plan: true, status: true } },
        },
      },
    },
  });

  if (!profile) return null;

  const isSelf = profile.userId === readerId;
  if (!profile.published && !isSelf) return null;

  const country = profile.showCountry
    ? (countryForStoredLocation(profile.user.preferences?.homeLocation)?.name ?? null)
    : null;

  const stats = profile.showStats ? await getUserStats(profile.userId) : null;

  // Stickers are derived, so the revocations have to come with them or a badge
  // an admin took back would come straight back on somebody's public page.
  const stickers: PublicProfile["stickers"] = [];
  if (profile.showStickers) {
    const [sheetStats, revocations] = await Promise.all([
      stats ? Promise.resolve(stats) : getUserStats(profile.userId),
      db.achievementRevocation.findMany({
        where: { userId: profile.userId },
        select: { achievementId: true },
      }),
    ]);
    const live =
      profile.user.subscription &&
      LIVE_STATUSES.includes(profile.user.subscription.status as "ACTIVE");
    const plan = live ? (profile.user.subscription?.plan ?? "FREE") : "FREE";

    for (const achievement of getAchievements(
      sheetStats,
      planIdFromRecord(plan),
      revocations.map((row) => row.achievementId),
    )) {
      if (achievement.earned) {
        stickers.push({
          id: achievement.id,
          label: achievement.label,
          sticker: achievement.sticker,
        });
      }
    }
  }

  const [activities, months] = profile.showActivities
    ? await Promise.all([getProfileActivities(profile.userId), getProfileMonths(profile.userId)])
    : [[] as ProfileActivity[], [] as ProfileMonth[]];

  // Not fetched when it is off, matching how every other section here behaves:
  // a switch turned off means the data does not leave the database.
  const activityGrid = profile.showActivityGrid
    ? await getActivityGrid(profile.userId, new Date(), locale)
    : null;

  const socials: PublicProfile["socials"] = [];
  for (const key of ["instagram", "facebook", "strava"] as const) {
    const value = profile[key];
    if (value) socials.push({ key, handle: value, href: `${SOCIAL_HOSTS[key]}${value}` });
  }

  return {
    handle: profile.handle,
    published: profile.published,
    name: profile.displayName?.trim() || profile.user.name,
    headline: profile.headline,
    bio: profile.bio,
    accent: profile.accent,
    socials,
    country,
    joinedAt: profile.user.createdAt,
    stats: stats
      ? {
          logged: stats.completedCount,
          km: Math.round(stats.kmExplored),
          up: Math.round(stats.elevation),
          regions: stats.regions,
          countries: stats.countries,
        }
      : null,
    stickers,
    activities,
    months,
    activityGrid,
    isSelf,
  };
}

/**
 * The feed.
 *
 * Approved submissions only. A pending one is a claim nobody has checked and a
 * declined one is a claim that did not hold up; neither belongs on a page
 * whose whole purpose is to be believed by a stranger.
 */
export async function getProfileActivities(
  userId: string,
  take = 20,
): Promise<ProfileActivity[]> {
  const rows = await db.submission.findMany({
    where: { userId, status: "APPROVED" },
    orderBy: { reviewedAt: "desc" },
    take,
    select: {
      id: true,
      questId: true,
      note: true,
      photos: true,
      distance: true,
      elevation: true,
      movingTime: true,
      retreated: true,
      reviewedAt: true,
      createdAt: true,
      quest: {
        select: { title: true, location: true, region: true, terrain: true, features: true },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    questId: row.questId,
    title: row.quest.title,
    location: row.quest.location,
    region: row.quest.region,
    loggedAt: row.reviewedAt ?? row.createdAt,
    note: row.note,
    photos: row.photos,
    distance: row.distance,
    elevation: row.elevation,
    movingTime: row.movingTime,
    retreated: row.retreated,
    tags: [...row.quest.terrain, ...row.quest.features],
  }));
}

/**
 * When somebody actually walked, by month.
 *
 * Twelve months whether or not they are all full, because the shape of a year
 * is the point: a strip that skipped the empty months would show a keen
 * walker and a lapsed one as the same picture.
 *
 * Approved submissions only, on the same reasoning as the feed — this is a
 * public claim about somebody's year, so it counts only what a reader passed.
 */
export async function getProfileMonths(
  userId: string,
  now = new Date(),
): Promise<ProfileMonth[]> {
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));

  const rows = await db.submission.findMany({
    where: {
      userId,
      status: "APPROVED",
      OR: [{ startedAt: { gte: from } }, { startedAt: null, createdAt: { gte: from } }],
    },
    select: { startedAt: true, createdAt: true },
  });

  const counts = new Map<string, number>();
  for (const row of rows) {
    const when = row.startedAt ?? row.createdAt;
    const key = `${when.getUTCFullYear()}-${String(when.getUTCMonth() + 1).padStart(2, "0")}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const short = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });
  const long = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

  const months: ProfileMonth[] = [];
  for (let offset = 0; offset < 12; offset += 1) {
    const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + offset, 1));
    const key = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`;
    months.push({
      key,
      short: short.format(cursor),
      label: long.format(cursor),
      count: counts.get(key) ?? 0,
    });
  }
  return months;
}

export type DirectoryEntry = {
  handle: string;
  name: string;
  headline: string | null;
  accent: ProfileAccent;
  country: string | null;
  logged: number;
};

/**
 * Everybody who has published one.
 *
 * Ordered by how much they have logged rather than by when they joined: the
 * question somebody is asking here is "who might I walk with", and a page with
 * nothing on it does not answer it.
 */
export async function getDirectory(take = 60): Promise<DirectoryEntry[]> {
  const rows = await db.profile.findMany({
    where: { published: true },
    take,
    select: {
      handle: true,
      displayName: true,
      headline: true,
      accent: true,
      showCountry: true,
      user: {
        select: {
          name: true,
          preferences: { select: { homeLocation: true } },
          history: { where: { completed: true }, select: { id: true } },
        },
      },
    },
  });

  return rows
    .map((row) => ({
      handle: row.handle,
      name: row.displayName?.trim() || row.user.name,
      headline: row.headline,
      accent: row.accent,
      country: row.showCountry
        ? (countryForStoredLocation(row.user.preferences?.homeLocation)?.name ?? null)
        : null,
      logged: row.user.history.length,
    }))
    .sort((a, b) => b.logged - a.logged || a.name.localeCompare(b.name));
}
