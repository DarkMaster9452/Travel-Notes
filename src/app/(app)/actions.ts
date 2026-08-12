"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { REACTIONS } from "@/lib/gamification";
import { rateLimit } from "@/lib/rate-limit";
import { commentSchema, fieldErrors, reactionSchema, submissionSchema } from "@/lib/validation";

export type SubmitState = { errors?: Record<string, string> } | undefined;

/**
 * Submit photo proof.
 *
 * Everything that decides whether this counts happens here: the rules must be
 * accepted, the challenge must still be open, and one person gets one attempt
 * per challenge (enforced by a unique index as well as this check). Points are
 * deliberately *not* awarded — that only happens on review.
 */
export async function submitProofAction(
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const user = await requireUser();

  if (!user.rulesAcceptedAt) return { errors: { form: "rulesRequired" } };

  const limit = await rateLimit(`submit:${user.id}`, 6, 60 * 60);
  if (!limit.ok) return { errors: { form: "generic" } };

  const parsed = submissionSchema.safeParse({
    questId: formData.get("questId"),
    photo: formData.get("photo"),
    caption: formData.get("caption") ?? "",
    difficulty: formData.get("difficulty"),
    comparison: formData.get("comparison"),
    comparedToQuestId: formData.get("comparedToQuestId") ?? "",
  });

  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    return { errors: { form: errors.photo ?? errors.caption ?? "generic", ...errors } };
  }

  const input = parsed.data;

  const quest = await db.weeklyQuest.findUnique({ where: { id: input.questId } });
  if (!quest) return { errors: { form: "generic" } };

  const now = new Date();
  if (quest.publishedAt > now || quest.closesAt <= now) {
    return { errors: { form: "closed" } };
  }

  const existing = await db.submission.findUnique({
    where: { userId_questId: { userId: user.id, questId: quest.id } },
    select: { id: true },
  });
  if (existing) return { errors: { form: "duplicate" } };

  try {
    await db.submission.create({
      data: {
        userId: user.id,
        questId: quest.id,
        photo: input.photo,
        caption: input.caption ? input.caption : null,
        difficulty: input.difficulty as never,
        comparison: input.comparison as never,
        comparedToQuestId: input.comparedToQuestId ? input.comparedToQuestId : null,
      },
    });
  } catch {
    // Unique violation under a race — same answer as the check above.
    return { errors: { form: "duplicate" } };
  }

  revalidatePath("/home");
  revalidatePath("/profile");
  redirect("/submit/sent");
}

/** Accept the current rules. Required before the first submission. */
export async function acceptRulesAction(): Promise<void> {
  const user = await requireUser();
  await db.user.update({
    where: { id: user.id },
    data: { rulesAcceptedAt: new Date() },
  });
  revalidatePath("/rewards");
  revalidatePath("/profile");
  revalidatePath("/submit");
}

/** Toggle a reaction on an approved submission. */
export async function toggleReactionAction(submissionId: string, emoji: string): Promise<void> {
  const user = await requireUser();

  const parsed = reactionSchema.safeParse({ submissionId, emoji });
  if (!parsed.success) return;
  if (!(REACTIONS as readonly string[]).includes(parsed.data.emoji)) return;

  // Only approved submissions are public, so only they can be reacted to.
  const submission = await db.submission.findFirst({
    where: { id: parsed.data.submissionId, status: "APPROVED" },
    select: { id: true },
  });
  if (!submission) return;

  const existing = await db.submissionReaction.findUnique({
    where: {
      submissionId_userId_emoji: {
        submissionId: submission.id,
        userId: user.id,
        emoji: parsed.data.emoji,
      },
    },
    select: { id: true },
  });

  if (existing) {
    await db.submissionReaction.delete({ where: { id: existing.id } });
  } else {
    await db.submissionReaction.create({
      data: { submissionId: submission.id, userId: user.id, emoji: parsed.data.emoji },
    });
  }

  revalidatePath("/home");
}

export type CommentState = { error?: string } | undefined;

export async function addCommentAction(
  _prev: CommentState,
  formData: FormData,
): Promise<CommentState> {
  const user = await requireUser();

  const limit = await rateLimit(`comment:${user.id}`, 20, 60 * 10);
  if (!limit.ok) return { error: "generic" };

  const parsed = commentSchema.safeParse({
    submissionId: formData.get("submissionId"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { error: "generic" };

  const submission = await db.submission.findFirst({
    where: { id: parsed.data.submissionId, status: "APPROVED" },
    select: { id: true },
  });
  if (!submission) return { error: "generic" };

  await db.submissionComment.create({
    data: { submissionId: submission.id, userId: user.id, body: parsed.data.body },
  });

  revalidatePath("/home");
  return undefined;
}
