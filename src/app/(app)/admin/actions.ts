"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { syncAchievements } from "@/lib/stopa/data";
import { fieldErrors, questSchema, reviewSchema } from "@/lib/validation";

export type AdminState = { errors?: Record<string, string>; ok?: boolean } | undefined;

/**
 * Approve or reject a submission, with an optional reply.
 *
 * Approval is the only path that awards points, and the award shares a
 * transaction with the status change so a crash can't credit points twice or
 * leave an approved submission unpaid. Re-reviewing an already-decided
 * submission is refused rather than re-crediting.
 */
export async function reviewSubmissionAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const admin = await requireAdmin();

  const parsed = reviewSchema.safeParse({
    submissionId: formData.get("submissionId"),
    decision: formData.get("decision"),
    note: formData.get("note") ?? "",
    notePublic: formData.get("notePublic") ? "on" : "off",
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { submissionId, decision, note, notePublic } = parsed.data;

  const submission = await db.submission.findUnique({
    where: { id: submissionId },
    include: { quest: { select: { points: true } } },
  });

  if (!submission) return { errors: { form: "notFound" } };
  if (submission.status !== "PENDING") return { errors: { form: "alreadyReviewed" } };

  const approved = decision === "APPROVE";
  const award = approved ? submission.quest.points : 0;

  await db.$transaction(async (tx) => {
    // Guard against two admins reviewing the same submission at once: the
    // update only matches while the row is still PENDING.
    const updated = await tx.submission.updateMany({
      where: { id: submission.id, status: "PENDING" },
      data: {
        status: approved ? "APPROVED" : "REJECTED",
        adminNote: note ? note : null,
        adminNotePublic: notePublic === "on",
        pointsAwarded: award,
        reviewedAt: new Date(),
        reviewedById: admin.id,
      },
    });

    if (updated.count === 1 && award > 0) {
      await tx.user.update({
        where: { id: submission.userId },
        data: { points: { increment: award } },
      });
    }
  });

  if (approved) await syncAchievements(submission.userId);

  revalidatePath("/admin");
  revalidatePath("/home");
  revalidatePath("/leaderboard");
  revalidatePath("/profile");
  return { ok: true };
}

/** Create next week's challenge. */
export async function createQuestAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const admin = await requireAdmin();

  const parsed = questSchema.safeParse({
    title: formData.get("title"),
    location: formData.get("location"),
    region: formData.get("region"),
    description: formData.get("description"),
    category: formData.get("category"),
    points: formData.get("points"),
    publishedAt: formData.get("publishedAt"),
    closesAt: formData.get("closesAt"),
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const input = parsed.data;

  const publishedAt = new Date(input.publishedAt);
  const closesAt = new Date(input.closesAt);

  if (Number.isNaN(publishedAt.getTime()) || Number.isNaN(closesAt.getTime())) {
    return { errors: { form: "dates" } };
  }
  if (closesAt <= publishedAt) return { errors: { closesAt: "order" } };

  await db.weeklyQuest.create({
    data: {
      title: input.title,
      location: input.location,
      region: input.region,
      description: input.description,
      category: input.category as never,
      points: input.points,
      publishedAt,
      closesAt,
      createdById: admin.id,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/home");
  return { ok: true };
}
