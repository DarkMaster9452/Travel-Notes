"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { slotFromKey } from "@/lib/admin/schedule";

/**
 * Everything the panel writes.
 *
 * Every action re-checks the role against the database rather than trusting
 * that the caller reached an admin page — a server action is a public endpoint,
 * and the layout guard does not run for it.
 */

export type AdminResult = { ok: boolean; message?: string };

/* -------------------------------------------------------------------------- */
/* Reviewing submissions                                                       */
/* -------------------------------------------------------------------------- */

const verdictSchema = z.object({
  submissionId: z.string().trim().min(1).max(60),
  approve: z.boolean(),
  note: z.string().trim().max(500).optional(),
});

/**
 * Approve or decline one submission.
 *
 * Approving is what marks the quest done — the customer's log button records
 * that they *say* they went, and this records that somebody checked. So the
 * two writes happen together: a submission approved without the history row
 * following it would leave a quest that is verified and yet not complete.
 */
export async function reviewSubmissionAction(input: {
  submissionId: string;
  approve: boolean;
  note?: string;
}): Promise<AdminResult> {
  const admin = await requireAdmin();
  const parsed = verdictSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "That submission id looks wrong." };

  const { submissionId, approve, note } = parsed.data;

  const submission = await db.submission.findUnique({
    where: { id: submissionId },
    select: { id: true, userId: true, questId: true, status: true },
  });
  if (!submission) return { ok: false, message: "That submission is gone." };

  // A decided submission can be decided again. Reviewers are people and the
  // deck is fast, so an approval pressed by mistake used to be permanent —
  // the customer's history said they had done a quest they had not. What is
  // refused is re-recording the verdict it already has, which would only
  // rewrite the timestamp and make the audit trail lie about when it was
  // judged.
  const next = approve ? "APPROVED" : "REJECTED";
  if (submission.status === next) {
    return { ok: false, message: `That one is already ${approve ? "approved" : "declined"}.` };
  }

  await db.$transaction([
    db.submission.update({
      where: { id: submissionId },
      data: {
        status: next,
        reviewedById: admin.id,
        reviewedAt: new Date(),
        reviewNote: note || null,
      },
    }),
    db.questHistory.updateMany({
      where: { userId: submission.userId, questId: submission.questId },
      data: approve
        ? { completed: true, completedAt: new Date() }
        : { completed: false, completedAt: null },
    }),
  ]);

  revalidatePath("/admin/review");
  revalidatePath("/admin/submissions");
  revalidatePath("/admin");
  // The person who filed it sees the verdict on their own page, so that has
  // to be stale too — otherwise a reversed decision shows only on our side.
  revalidatePath("/submissions");
  return {
    ok: true,
    message:
      submission.status === "PENDING"
        ? undefined
        : `Changed from ${submission.status.toLowerCase()} to ${next.toLowerCase()}.`,
  };
}

/* -------------------------------------------------------------------------- */
/* Accounts                                                                    */
/* -------------------------------------------------------------------------- */

const accountSchema = z.object({
  userId: z.string().trim().min(1).max(60),
  role: z.enum(["USER", "ADMIN"]),
  plan: z.enum(["FREE", "EXPLORER", "ULTRA"]),
  freeQuestsUsed: z.coerce.number().int().min(0).max(99),
});

/**
 * Set one account's role and plan.
 *
 * The plan is written as a real subscription row rather than a flag, so the
 * gating matrix keeps reading from one place — `getEntitlement` cannot tell the
 * difference between a plan an admin granted and one Stripe did, which is the
 * point: there is no second definition of "is this account paid".
 */
export async function updateAccountAction(formData: FormData): Promise<AdminResult> {
  const admin = await requireAdmin();

  const parsed = accountSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
    plan: formData.get("plan"),
    freeQuestsUsed: formData.get("freeQuestsUsed"),
  });
  if (!parsed.success) return { ok: false, message: "Those values don't look right." };

  const { userId, role, plan, freeQuestsUsed } = parsed.data;

  // An admin demoting themselves would lock the panel behind an account that
  // can no longer open it. Refuse rather than strand them.
  if (userId === admin.id && role !== "ADMIN") {
    return { ok: false, message: "You can't remove your own admin role." };
  }

  await db.user.update({ where: { id: userId }, data: { role, freeQuestsUsed } });

  if (plan === "FREE") {
    await db.subscription.deleteMany({ where: { userId } });
  } else {
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
    const values = {
      plan,
      status: "ACTIVE" as const,
      cancelAtPeriodEnd: false,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    };
    await db.subscription.upsert({
      where: { userId },
      update: values,
      create: { userId, ...values },
    });
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { ok: true };
}

/** Sign an account out everywhere by dropping its sessions. */
export async function revokeSessionsAction(userId: string): Promise<AdminResult> {
  await requireAdmin();
  const { count } = await db.session.deleteMany({ where: { userId } });
  revalidatePath("/admin/users");
  return { ok: true, message: `${count} session${count === 1 ? "" : "s"} ended.` };
}

/**
 * Delete an account, and everything that hangs off it — sessions, quest
 * history, submissions, saved quests, preferences, its subscription.
 * Everywhere else it was only ever referenced (a submission someone else
 * filed that this account reviewed) the reference is nulled, not cascaded:
 * one account's deletion must not erase another account's evidence.
 *
 * Refused in exactly the two cases that would strand the panel itself: an
 * admin cannot delete their own signed-in account, and the last remaining
 * admin cannot be deleted by anyone (including another admin), because there
 * would be nobody left who could open this page to undo it.
 */
export async function deleteAccountAction(userId: string): Promise<AdminResult> {
  const admin = await requireAdmin();

  if (userId === admin.id) {
    return { ok: false, message: "You can't delete the account you're signed in as." };
  }

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true },
  });
  if (!target) return { ok: false, message: "That account is already gone." };

  if (target.role === "ADMIN") {
    const otherAdmins = await db.user.count({ where: { role: "ADMIN", id: { not: userId } } });
    if (otherAdmins === 0) {
      return { ok: false, message: "That's the last admin — the panel would lock everyone out." };
    }
  }

  await db.user.delete({ where: { id: userId } });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { ok: true, message: `${target.name}'s account was deleted.` };
}

/* -------------------------------------------------------------------------- */
/* Quests                                                                      */
/* -------------------------------------------------------------------------- */

const questSchema = z.object({
  title: z.string().trim().min(3, "Give it a title.").max(120),
  subtitle: z.string().trim().min(3, "One line under the title.").max(160),
  objective: z.string().trim().min(10, "What has to actually happen?").max(600),
  description: z.string().trim().min(10, "Describe the day.").max(2000),
  bonus: z.string().trim().max(400).optional(),
  safetyNotes: z.string().trim().max(600).optional(),
  category: z.string().trim().max(40).optional(),
  location: z.string().trim().min(2, "Where?").max(80),
  region: z.string().trim().min(2, "Which region?").max(80),
  country: z.string().trim().min(2).max(60),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  distance: z.coerce.number().min(0.1).max(500),
  elevationGain: z.coerce.number().int().min(0).max(20000),
  duration: z.coerce.number().int().min(10).max(10080),
  difficulty: z.enum(["EASY", "MODERATE", "HARD", "EXPERT"]),
  published: z.coerce.boolean().optional(),
  coverImage: z.string().trim().url("That needs to be a full https:// link.").max(500).optional().or(z.literal("")),

  // Getting there. Optional throughout: a start with no car park is an
  // ordinary start, and the reader's page shows nothing rather than a panel
  // with holes in it.
  parkingName: z.string().trim().max(120).optional().or(z.literal("")),
  parkingLat: z.coerce.number().min(-90).max(90).optional().or(z.literal("")),
  parkingLng: z.coerce.number().min(-180).max(180).optional().or(z.literal("")),
  parkingNote: z.string().trim().max(300).optional().or(z.literal("")),
  approachTime: z.coerce.number().int().min(0).max(600).optional().or(z.literal("")),
  transitNote: z.string().trim().max(300).optional().or(z.literal("")),
});

/** An empty form field is "not set", not zero. */
function optionalNumber(value: number | "" | undefined): number | null {
  return typeof value === "number" ? value : null;
}

export type QuestFormState =
  | { ok: true; questId: string }
  | { ok: false; errors: Record<string, string> }
  | undefined;

/**
 * Create a quest.
 *
 * Quests are authored by admins and by nobody else — there is no generator
 * path into this table. The signature is what the anti-repetition rule reads,
 * so it is derived here from the defining fields rather than left blank.
 */
export async function createQuestAction(
  _prev: QuestFormState,
  formData: FormData,
): Promise<QuestFormState> {
  await requireAdmin();

  const parsed = questSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      errors[key] ??= issue.message;
    }
    return { ok: false, errors };
  }

  const q = parsed.data;
  const signature = [q.location, q.difficulty, Math.round(q.distance), q.region]
    .join("|")
    .toLowerCase();

  const quest = await db.quest.create({
    data: {
      title: q.title,
      subtitle: q.subtitle,
      objective: q.objective,
      description: q.description,
      bonus: q.bonus || null,
      safetyNotes: q.safetyNotes || null,
      category: q.category || null,
      location: q.location,
      region: q.region,
      country: q.country,
      latitude: q.latitude,
      longitude: q.longitude,
      distance: q.distance,
      elevationGain: q.elevationGain,
      duration: q.duration,
      difficulty: q.difficulty,
      coverImage: q.coverImage || "",
      parkingName: q.parkingName || null,
      // Only a complete pair is worth storing: one coordinate on its own
      // cannot be drawn and would fail the reader's "is there parking" check
      // in a way that depends on which half was filled in.
      parkingLat:
        typeof q.parkingLat === "number" && typeof q.parkingLng === "number" ? q.parkingLat : null,
      parkingLng:
        typeof q.parkingLat === "number" && typeof q.parkingLng === "number" ? q.parkingLng : null,
      parkingNote: q.parkingNote || null,
      approachTime: optionalNumber(q.approachTime),
      transitNote: q.transitNote || null,
      signature,
      isShowcase: true,
      published: q.published ?? true,
    },
    select: { id: true },
  });

  revalidatePath("/admin/quests");
  revalidatePath("/admin");
  return { ok: true, questId: quest.id };
}

/** Publish or unpublish. An unpublished quest can no longer be issued. */
export async function toggleQuestPublishedAction(questId: string): Promise<AdminResult> {
  await requireAdmin();
  const quest = await db.quest.findUnique({
    where: { id: questId },
    select: { published: true },
  });
  if (!quest) return { ok: false, message: "That quest is gone." };

  await db.quest.update({ where: { id: questId }, data: { published: !quest.published } });
  revalidatePath("/admin/quests");
  return { ok: true, message: quest.published ? "Unpublished." : "Published." };
}

/**
 * Delete a quest.
 *
 * Refused once anybody has been issued it — deleting it would take their
 * history with it through the cascade, and a log that can vanish is not a log.
 * Unpublish instead, which is what the message says.
 */
export async function deleteQuestAction(questId: string): Promise<AdminResult> {
  await requireAdmin();

  const issued = await db.questHistory.count({ where: { questId } });
  if (issued > 0) {
    return {
      ok: false,
      message: `Issued to ${issued} ${issued === 1 ? "person" : "people"} — unpublish it instead.`,
    };
  }

  await db.quest.delete({ where: { id: questId } });
  revalidatePath("/admin/quests");
  return { ok: true, message: "Quest deleted." };
}

/* -------------------------------------------------------------------------- */
/* Scheduling                                                                  */
/* -------------------------------------------------------------------------- */

const scheduleSchema = z.object({
  period: z.enum(["WEEKLY", "MONTHLY"]),
  slotKey: z.string().trim().min(4).max(12),
  questId: z.string().trim().min(1).max(60),
  audience: z.enum(["FREE", "EXPLORER", "ULTRA"]),
});

/**
 * Book a quest into a week or a month.
 *
 * The instants are derived from the slot key on the server (`slotFromKey`),
 * never taken from the form: the product promises Monday 06:00 and the 1st at
 * 06:00, so those are computed, not submitted. A client that posts its own
 * `openAt` is ignored, because there is no `openAt` field to post.
 *
 * Creating into an occupied slot is refused — one quest per slot is the whole
 * point, and the unique index would refuse it anyway. Changing which quest
 * fills a slot is `updateScheduleAction`, which is a different intent and
 * reads as one at the call site.
 */
export async function createScheduleAction(formData: FormData): Promise<AdminResult> {
  const admin = await requireAdmin();

  const parsed = scheduleSchema.safeParse({
    period: formData.get("period"),
    slotKey: formData.get("slotKey"),
    questId: formData.get("questId"),
    audience: formData.get("audience") ?? "FREE",
  });
  if (!parsed.success) return { ok: false, message: "Those values don't look right." };

  const { period, slotKey, questId, audience } = parsed.data;

  const slot = slotFromKey(period, slotKey);
  if (!slot) return { ok: false, message: "That isn't a slot on the calendar." };

  const quest = await db.quest.findUnique({
    where: { id: questId },
    select: { id: true, published: true },
  });
  if (!quest) return { ok: false, message: "That quest is gone." };
  if (!quest.published) {
    return { ok: false, message: "Publish the quest before scheduling it." };
  }

  const taken = await db.questSchedule.findUnique({
    where: { period_slotKey: { period, slotKey } },
    select: { id: true },
  });
  if (taken) {
    return { ok: false, message: "That slot already has a quest — edit it instead." };
  }

  await db.questSchedule.create({
    data: {
      period,
      slotKey,
      questId,
      audience,
      openAt: slot.openAt,
      closeAt: slot.closeAt,
      createdById: admin.id,
    },
  });

  revalidatePath("/admin/schedule");
  return { ok: true, message: `Booked into ${slotKey}.` };
}

/** Change which quest fills a slot, or who can see it. The slot itself is
 *  fixed: moving a quest to a different week is a delete and a create. */
export async function updateScheduleAction(formData: FormData): Promise<AdminResult> {
  await requireAdmin();

  const parsed = z
    .object({
      id: z.string().trim().min(1).max(60),
      questId: z.string().trim().min(1).max(60),
      audience: z.enum(["FREE", "EXPLORER", "ULTRA"]),
    })
    .safeParse({
      id: formData.get("id"),
      questId: formData.get("questId"),
      audience: formData.get("audience") ?? "FREE",
    });
  if (!parsed.success) return { ok: false, message: "Those values don't look right." };

  const quest = await db.quest.findUnique({
    where: { id: parsed.data.questId },
    select: { published: true },
  });
  if (!quest) return { ok: false, message: "That quest is gone." };
  if (!quest.published) return { ok: false, message: "Publish the quest before scheduling it." };

  const slot = await db.questSchedule.findUnique({
    where: { id: parsed.data.id },
    select: { closeAt: true },
  });
  if (!slot) return { ok: false, message: "That slot is gone." };
  if (slot.closeAt.getTime() <= Date.now()) {
    return { ok: false, message: "That slot has closed — it can't be changed." };
  }

  await db.questSchedule.update({
    where: { id: parsed.data.id },
    data: { questId: parsed.data.questId, audience: parsed.data.audience },
  });

  revalidatePath("/admin/schedule");
  return { ok: true, message: "Slot updated." };
}

/**
 * Clear a slot.
 *
 * Refused only once the slot has *closed*. A live slot can still be cleared:
 * the current period is the one an admin most often needs to correct, and
 * refusing it meant a mistake made on the 1st stood for a month. A closed
 * slot is history, and history is not an edit surface.
 */
export async function unscheduleAction(id: string): Promise<AdminResult> {
  await requireAdmin();

  const existing = await db.questSchedule.findUnique({
    where: { id },
    select: { closeAt: true, slotKey: true },
  });
  if (!existing) return { ok: false, message: "That slot is already clear." };

  if (existing.closeAt.getTime() <= Date.now()) {
    return { ok: false, message: "That slot has closed — it can't be changed." };
  }

  await db.questSchedule.delete({ where: { id } });
  revalidatePath("/admin/schedule");
  return { ok: true, message: `${existing.slotKey} cleared.` };
}

/* -------------------------------------------------------------------------- */
/* Reads for the map                                                           */
/* -------------------------------------------------------------------------- */

export type PlaceQuest = {
  id: string;
  title: string;
  subtitle: string;
  objective: string;
  difficulty: string;
  distance: number;
  elevationGain: number;
  duration: number;
  published: boolean;
  category: string | null;
  coverImage: string | null;
  issued: number;
  completed: number;
  submissions: {
    id: string;
    author: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    note: string;
    photos: string[];
    distance: number | null;
    elevation: number | null;
    createdAt: string;
  }[];
};

export type PlaceDetail = {
  location: string;
  region: string;
  country: string;
  quests: PlaceQuest[];
};

/**
 * Everything about one place, for the map's detail sheet.
 *
 * Fetched on demand rather than shipped with the map: a panel that carries
 * every quest and every submission for two hundred places would dwarf the
 * geometry it sits next to, and almost none of it is ever opened.
 */
export async function getPlaceDetailAction(location: string): Promise<PlaceDetail | null> {
  await requireAdmin();

  const quests = await db.quest.findMany({
    where: { location },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      subtitle: true,
      objective: true,
      difficulty: true,
      distance: true,
      elevationGain: true,
      duration: true,
      published: true,
      category: true,
      coverImage: true,
      region: true,
      country: true,
      _count: { select: { history: true } },
      history: { where: { completed: true }, select: { id: true } },
      submissions: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          status: true,
          note: true,
          photos: true,
          distance: true,
          elevation: true,
          createdAt: true,
          user: { select: { name: true } },
        },
      },
    },
  });

  if (quests.length === 0) return null;

  return {
    location,
    region: quests[0].region,
    country: quests[0].country,
    quests: quests.map((quest) => ({
      id: quest.id,
      title: quest.title,
      subtitle: quest.subtitle,
      objective: quest.objective,
      difficulty: quest.difficulty,
      distance: quest.distance,
      elevationGain: quest.elevationGain,
      duration: quest.duration,
      published: quest.published,
      category: quest.category,
      coverImage: quest.coverImage || null,
      issued: quest._count.history,
      completed: quest.history.length,
      submissions: quest.submissions.map((s) => ({
        id: s.id,
        author: s.user.name,
        status: s.status,
        note: s.note,
        photos: s.photos,
        distance: s.distance,
        elevation: s.elevation,
        createdAt: s.createdAt.toISOString(),
      })),
    })),
  };
}

/* -------------------------------------------------------------------------- */
/* Stickers                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Take a sticker back from an account.
 *
 * Achievements are derived from quest history, so there is nothing to delete —
 * this records an exception the sheet checks. Usually needed because the
 * history behind the badge turned out to be wrong (a submission approved by
 * mistake, since reversed), and the badge would otherwise stand on evidence
 * that no longer exists.
 */
export async function revokeStickerAction(
  userId: string,
  achievementId: string,
  reason?: string,
): Promise<AdminResult> {
  const admin = await requireAdmin();

  const parsed = z
    .object({
      userId: z.string().trim().min(1).max(60),
      achievementId: z.string().trim().min(1).max(60),
      reason: z.string().trim().max(300).optional(),
    })
    .safeParse({ userId, achievementId, reason });
  if (!parsed.success) return { ok: false, message: "Those values don't look right." };

  await db.achievementRevocation.upsert({
    where: {
      userId_achievementId: {
        userId: parsed.data.userId,
        achievementId: parsed.data.achievementId,
      },
    },
    update: { reason: parsed.data.reason || null, revokedById: admin.id },
    create: {
      userId: parsed.data.userId,
      achievementId: parsed.data.achievementId,
      reason: parsed.data.reason || null,
      revokedById: admin.id,
    },
  });

  revalidatePath(`/admin/users/${parsed.data.userId}`);
  revalidatePath("/achievements");
  return { ok: true, message: "Sticker withdrawn." };
}

/** Give it back. Deleting the exception is all it takes — the sheet
 *  recomputes from history the moment the revocation is gone. */
export async function restoreStickerAction(
  userId: string,
  achievementId: string,
): Promise<AdminResult> {
  await requireAdmin();

  await db.achievementRevocation
    .delete({ where: { userId_achievementId: { userId, achievementId } } })
    .catch(() => undefined);

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/achievements");
  return { ok: true, message: "Sticker restored." };
}
