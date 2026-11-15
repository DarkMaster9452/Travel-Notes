import "server-only";

import type { Quest } from "@prisma/client";

import { slotFor, type Slot } from "@/lib/admin/schedule";
import { db } from "@/lib/db";

/**
 * What the public pages show of the live product.
 *
 * The landing page opens on the real monthly quest, and the weekly section
 * shows real quests from the database — never invented ones. Only published
 * quests are read, and nothing about any member.
 */
export type LandingMonthly = {
  quest: Quest;
  /** The slot the quest is (or was) booked into; null when it is only an example. */
  slot: Slot | null;
  /** True when that slot is the current month, so its clock is running. */
  live: boolean;
  closesAt: Date | null;
};

/**
 * This month's booked quest; failing that the most recent monthly that has
 * run; failing that the newest published quest, shown as an example.
 */
export async function getLandingMonthly(now = new Date()): Promise<LandingMonthly | null> {
  const slot = slotFor("MONTHLY", now);

  const booked =
    (await db.questSchedule.findUnique({
      where: { period_slotKey: { period: "MONTHLY", slotKey: slot.key } },
      include: { quest: true },
    })) ??
    (await db.questSchedule.findFirst({
      where: { period: "MONTHLY", openAt: { lte: now } },
      orderBy: { openAt: "desc" },
      include: { quest: true },
    }));

  if (booked?.quest.published) {
    const live = booked.slotKey === slot.key;
    return {
      quest: booked.quest,
      slot: live ? slot : slotFor("MONTHLY", booked.openAt),
      live,
      closesAt: live ? booked.closeAt : null,
    };
  }

  const example = await db.quest.findFirst({ where: { published: true }, orderBy: { createdAt: "desc" } });
  return example ? { quest: example, slot: null, live: false, closesAt: null } : null;
}

/**
 * Quests for the weekly section: the ones booked as weeklies most recently,
 * topped up from the rest of the published database. Never the monthly, which
 * has its own hero, and never two with the same photograph.
 */
export async function getLandingWeeklies(excludeQuestId: string | null, count = 3, now = new Date()): Promise<Quest[]> {
  const booked = await db.questSchedule.findMany({
    where: { period: "WEEKLY", openAt: { lte: now }, quest: { published: true } },
    orderBy: { openAt: "desc" },
    take: count * 3,
    include: { quest: true },
  });

  const picked: Quest[] = [];
  const photos = new Set<string>();
  const take = (quest: Quest) => {
    if (picked.length >= count || quest.id === excludeQuestId) return;
    if (picked.some((entry) => entry.id === quest.id)) return;
    if (quest.coverImage && photos.has(quest.coverImage)) return;
    if (quest.coverImage) photos.add(quest.coverImage);
    picked.push(quest);
  };

  booked.forEach((entry) => take(entry.quest));

  if (picked.length < count) {
    const rest = await db.quest.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 24,
    });
    rest.forEach(take);
  }

  return picked;
}
