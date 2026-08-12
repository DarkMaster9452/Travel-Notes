import "server-only";

import { db } from "@/lib/db";
import {
  DIFFICULTY_WEIGHT,
  difficultyFromWeight,
  evaluateAchievements,
  type DifficultyId,
} from "@/lib/gamification";

/**
 * Reads for the game surfaces.
 *
 * Only approved submissions are ever public: the feed, the crowd-sourced
 * difficulty and the leaderboard all filter on APPROVED, so a pending or
 * rejected photo is visible to nobody but its author and the admins.
 */

/** The challenge that is live right now, if any. */
export async function getActiveQuest() {
  const now = new Date();
  return db.weeklyQuest.findFirst({
    where: { publishedAt: { lte: now }, closesAt: { gt: now } },
    orderBy: { publishedAt: "desc" },
  });
}

export async function getQuestById(id: string) {
  return db.weeklyQuest.findUnique({ where: { id } });
}

/** Crowd-sourced difficulty for a quest, from approved reports only. */
export async function getQuestDifficulty(questId: string) {
  const rows = await db.submission.findMany({
    where: { questId, status: "APPROVED" },
    select: { difficulty: true },
  });

  if (rows.length === 0) return null;

  const average =
    rows.reduce((sum, r) => sum + DIFFICULTY_WEIGHT[r.difficulty as DifficultyId], 0) / rows.length;

  return { count: rows.length, average, difficulty: difficultyFromWeight(average) };
}

export async function getMySubmission(userId: string, questId: string) {
  return db.submission.findUnique({
    where: { userId_questId: { userId, questId } },
  });
}

/** A user's own trails, newest first — includes pending and rejected. */
export async function getMySubmissions(userId: string, take = 20) {
  return db.submission.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    include: { quest: true },
  });
}

/** Approved quests the user could compare a new hike against. */
export async function getComparableQuests(userId: string) {
  const rows = await db.submission.findMany({
    where: { userId, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { quest: { select: { id: true, title: true } } },
  });
  return rows.map((r) => r.quest);
}

/** The public feed: approved submissions with reactions and comments. */
export async function getFeed(take = 20) {
  return db.submission.findMany({
    where: { status: "APPROVED" },
    orderBy: { reviewedAt: "desc" },
    take,
    include: {
      user: { select: { id: true, name: true } },
      quest: { select: { id: true, title: true, category: true, location: true } },
      reactions: { select: { emoji: true, userId: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        take: 20,
        include: { user: { select: { id: true, name: true, role: true } } },
      },
    },
  });
}

export async function getLeaderboard(take = 50) {
  return db.user.findMany({
    where: { points: { gt: 0 } },
    orderBy: [{ points: "desc" }, { createdAt: "asc" }],
    take,
    select: { id: true, name: true, points: true },
  });
}

/** 1-based rank. Ties resolve by earlier signup, matching the leaderboard. */
export async function getRank(userId: string): Promise<number | null> {
  const me = await db.user.findUnique({
    where: { id: userId },
    select: { points: true, createdAt: true },
  });
  if (!me || me.points <= 0) return null;

  const ahead = await db.user.count({
    where: {
      OR: [
        { points: { gt: me.points } },
        { points: me.points, createdAt: { lt: me.createdAt } },
      ],
    },
  });

  return ahead + 1;
}

export type PlayerStats = {
  points: number;
  approvedQuests: number;
  byCategory: Record<string, number>;
};

export async function getPlayerStats(userId: string): Promise<PlayerStats> {
  const [user, approved] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { points: true } }),
    db.submission.findMany({
      where: { userId, status: "APPROVED" },
      select: { quest: { select: { category: true } } },
    }),
  ]);

  const byCategory: Record<string, number> = {};
  for (const row of approved) {
    byCategory[row.quest.category] = (byCategory[row.quest.category] ?? 0) + 1;
  }

  return { points: user?.points ?? 0, approvedQuests: approved.length, byCategory };
}

/**
 * Persist any achievement the user has newly earned.
 *
 * Called after an approval. `createMany` with `skipDuplicates` leans on the
 * unique index, so concurrent approvals can't double-award the same badge.
 */
export async function syncAchievements(userId: string): Promise<string[]> {
  const stats = await getPlayerStats(userId);
  const earned = evaluateAchievements(stats)
    .filter((p) => p.unlocked)
    .map((p) => p.achievement.id);

  if (earned.length === 0) return [];

  const existing = await db.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true },
  });
  const have = new Set(existing.map((e) => e.achievementId));
  const fresh = earned.filter((id) => !have.has(id));

  if (fresh.length > 0) {
    await db.userAchievement.createMany({
      data: fresh.map((achievementId) => ({ userId, achievementId })),
      skipDuplicates: true,
    });
  }

  return fresh;
}

export async function getUnlockedAchievements(userId: string) {
  const rows = await db.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true, unlockedAt: true },
  });
  return new Map(rows.map((r) => [r.achievementId, r.unlockedAt]));
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export async function getPendingSubmissions() {
  return db.submission.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      quest: { select: { id: true, title: true, points: true, category: true } },
    },
  });
}

export async function getAllQuests(take = 30) {
  return db.weeklyQuest.findMany({
    orderBy: { publishedAt: "desc" },
    take,
    include: { _count: { select: { submissions: true } } },
  });
}
