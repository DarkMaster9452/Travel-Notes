"use server";

import { revalidatePath } from "next/cache";

import { getAchievements } from "@/lib/achievements";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { LOCATIONS } from "@/lib/quest/locations";
import { getUserStats, unlockQuestForUser } from "@/lib/quest/service";
import { questIdSchema } from "@/lib/validation";

/**
 * The two things a signed-in account can do to a quest: be issued one, and log
 * one. There is no saving and no browsing — you do not pick the hike, it is
 * assigned, which is the whole premise.
 */

export type IssueState =
  | { ok: true; questId: string; title: string }
  | { ok: false; message: string }
  | undefined;

/** Paths whose content changes when a quest is issued or logged. */
const QUEST_PATHS = ["/dashboard", "/history", "/achievements"];

function revalidateQuestPaths(questId?: string) {
  for (const path of QUEST_PATHS) revalidatePath(path);
  if (questId) revalidatePath(`/quests/${questId}`);
}

/**
 * Issue a quest.
 *
 * Somewhere the account has not been sent is preferred — that is the promise
 * the landing page makes, and it is why accounts exist — but someone who has
 * worked through the whole catalogue still gets a quest rather than an error.
 *
 * Every guard that matters (entitlement, rate limit, quota) lives in
 * `unlockQuestForUser`, on the server, reading database state.
 */
export async function issueQuestAction(): Promise<IssueState> {
  const user = await requireClient();

  const visited = await db.questHistory.findMany({
    where: { userId: user.id },
    select: { quest: { select: { location: true } } },
  });
  const seen = new Set(visited.map((entry) => entry.quest.location));

  const unseen = LOCATIONS.filter((location) => !seen.has(location.name));
  const pool = unseen.length > 0 ? unseen : LOCATIONS;
  const pick = pool[Math.floor(Math.random() * pool.length)]!;

  const outcome = await unlockQuestForUser(user.id, pick.id);
  if (!outcome.ok) return { ok: false, message: outcome.message };

  revalidateQuestPaths(outcome.quest.id);
  return { ok: true, questId: outcome.quest.id, title: outcome.quest.title };
}

export type LogResult = {
  ok: boolean;
  completed?: boolean;
  error?: string;
  /** Stickers that unlocked because of this log. */
  unlocked?: { id: string; label: string; description: string }[];
};

/**
 * Log a quest as done, or take the log back.
 *
 * Ownership runs through `quest_history`: without a row linking this account
 * to this quest, the action refuses, so another account's quest id changes
 * nothing.
 */
export async function logQuestAction(rawQuestId: string): Promise<LogResult> {
  const user = await requireClient();
  const parsed = questIdSchema.safeParse(rawQuestId);
  if (!parsed.success) return { ok: false, error: "Unknown quest." };
  const questId = parsed.data;

  const history = await db.questHistory.findUnique({
    where: { userId_questId: { userId: user.id, questId } },
    select: { id: true, completed: true },
  });
  if (!history) return { ok: false, error: "That quest isn't yours." };

  // Snapshot what was already earned, so the difference afterwards is exactly
  // what this log unlocked. Recomputing thresholds by hand here would drift
  // from the achievement definitions the moment either side changed.
  const before = new Set(
    getAchievements(await getUserStats(user.id))
      .filter((achievement) => achievement.earned)
      .map((achievement) => achievement.id),
  );

  const completed = !history.completed;
  await db.questHistory.update({
    where: { id: history.id },
    data: { completed, completedAt: completed ? new Date() : null },
  });

  const unlocked = completed
    ? getAchievements(await getUserStats(user.id))
        .filter((achievement) => achievement.earned && !before.has(achievement.id))
        .map(({ id, label, description }) => ({ id, label, description }))
    : [];

  revalidateQuestPaths(questId);
  return { ok: true, completed, unlocked };
}
