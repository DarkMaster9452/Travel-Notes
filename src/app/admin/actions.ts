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
  if (submission.status !== "PENDING") {
    return { ok: false, message: "Someone already reviewed that one." };
  }

  await db.$transaction([
    db.submission.update({
      where: { id: submissionId },
      data: {
        status: approve ? "APPROVED" : "REJECTED",
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
  return { ok: true };
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
});

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
      coverImage: "",
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
