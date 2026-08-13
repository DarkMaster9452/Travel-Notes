"use server";

import { revalidatePath } from "next/cache";

import type { IconName } from "@/components/ui/icons";
import { getAchievements } from "@/lib/achievements";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getUserStats } from "@/lib/quest/service";
import { questIdSchema } from "@/lib/validation";

export type EarnedAchievement = { id: string; label: string; description: string; icon: IconName };

export type QuestActionResult = {
  ok: boolean;
  saved?: boolean;
  completed?: boolean;
  error?: string;
  /** Achievements that crossed their threshold because of this change. */
  earned?: EarnedAchievement[];
};

/**
 * Ownership check for every quest mutation.
 *
 * A quest belongs to a user through `quest_history`. Without a row there, the
 * action refuses — so passing someone else's quest id changes nothing.
 */
async function assertOwnership(userId: string, questId: string) {
  const history = await db.questHistory.findUnique({
    where: { userId_questId: { userId, questId } },
    select: { id: true, saved: true, completed: true },
  });
  return history;
}

export async function toggleSaveAction(rawQuestId: string): Promise<QuestActionResult> {
  const user = await requireOnboardedUser();
  const parsed = questIdSchema.safeParse(rawQuestId);
  if (!parsed.success) return { ok: false, error: "Unknown quest." };
  const questId = parsed.data;

  const history = await assertOwnership(user.id, questId);
  if (!history) return { ok: false, error: "That quest isn't yours." };

  const existing = await db.savedQuest.findUnique({
    where: { userId_questId: { userId: user.id, questId } },
    select: { id: true },
  });

  if (existing) {
    await db.$transaction([
      db.savedQuest.delete({ where: { id: existing.id } }),
      db.questHistory.update({ where: { id: history.id }, data: { saved: false } }),
    ]);
  } else {
    await db.$transaction([
      db.savedQuest.create({ data: { userId: user.id, questId } }),
      db.questHistory.update({ where: { id: history.id }, data: { saved: true } }),
    ]);
  }

  revalidatePath("/saved");
  revalidatePath("/dashboard");
  revalidatePath(`/quests/${questId}`);
  return { ok: true, saved: !existing };
}

export async function toggleCompleteAction(rawQuestId: string): Promise<QuestActionResult> {
  const user = await requireOnboardedUser();
  const parsed = questIdSchema.safeParse(rawQuestId);
  if (!parsed.success) return { ok: false, error: "Unknown quest." };
  const questId = parsed.data;

  const history = await assertOwnership(user.id, questId);
  if (!history) return { ok: false, error: "That quest isn't yours." };

  // Snapshot what was already earned so the difference afterwards is exactly
  // what this action unlocked — the alternative, recomputing thresholds by
  // hand here, would drift from the achievement definitions the moment either
  // side changed.
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

  const earned = completed
    ? getAchievements(await getUserStats(user.id))
        .filter((achievement) => achievement.earned && !before.has(achievement.id))
        .map(({ id, label, description, icon }) => ({ id, label, description, icon }))
    : [];

  revalidatePath("/history");
  revalidatePath("/dashboard");
  revalidatePath("/achievements");
  revalidatePath(`/quests/${questId}`);
  return { ok: true, completed, earned };
}

export async function removeSavedAction(rawQuestId: string): Promise<QuestActionResult> {
  const user = await requireOnboardedUser();
  const parsed = questIdSchema.safeParse(rawQuestId);
  if (!parsed.success) return { ok: false, error: "Unknown quest." };

  await db.savedQuest
    .delete({ where: { userId_questId: { userId: user.id, questId: parsed.data } } })
    .catch(() => undefined);
  await db.questHistory
    .updateMany({ where: { userId: user.id, questId: parsed.data }, data: { saved: false } })
    .catch(() => undefined);

  revalidatePath("/saved");
  return { ok: true, saved: false };
}
