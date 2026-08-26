"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin, requireOwner } from "@/lib/auth/guards";
import { recordAudit } from "@/lib/admin/audit";
import { sendVerdict } from "@/lib/email";
import { scoreEntry } from "@/lib/leaderboard";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
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

  await recordAudit({
    actorId: admin.id,
    action: approve ? "submission.approved" : "submission.declined",
    subject: submissionId,
    detail: note || null,
  });

  // The verdict is the thing the filer has been waiting for, so it is the one
  // moment worth an email. Sent after the write, never inside the transaction:
  // a mail server having a bad afternoon must not roll back an approval.
  const decided = await db.submission.findUnique({
    where: { id: submissionId },
    select: {
      userId: true,
      retreated: true,
      period: true,
      quest: { select: { title: true, difficulty: true, distance: true, elevationGain: true } },
    },
  });
  if (decided) {
    await sendVerdict(decided.userId, {
      approved: approve,
      questTitle: decided.quest.title,
      note,
      points: approve
        ? scoreEntry({
            difficulty: decided.quest.difficulty,
            distance: decided.quest.distance,
            elevationGain: decided.quest.elevationGain,
            retreated: decided.retreated,
            featuredPeriod: decided.period,
          })
        : undefined,
    });
  }

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

/**
 * Put the last verdict back in the queue.
 *
 * The deck is fast on purpose, and a fast deck needs a way back: this returns
 * a decided submission to `PENDING` and clears the reviewer, the note and the
 * timestamp, so the row reads as never-judged rather than as judged and then
 * quietly amended. The completion it may have written is undone with it —
 * a quest that counts as done because of a verdict that has been withdrawn is
 * the one inconsistency this whole flow exists to prevent.
 */
export async function undoReviewAction(submissionId: string): Promise<AdminResult> {
  const admin = await requireAdmin();

  const submission = await db.submission.findUnique({
    where: { id: submissionId },
    select: { id: true, userId: true, questId: true, status: true },
  });
  if (!submission) return { ok: false, message: "That submission is gone." };
  if (submission.status === "PENDING") return { ok: true };

  await db.$transaction([
    db.submission.update({
      where: { id: submissionId },
      data: { status: "PENDING", reviewedById: null, reviewedAt: null, reviewNote: null },
    }),
    db.questHistory.updateMany({
      where: { userId: submission.userId, questId: submission.questId },
      data: { completed: false, completedAt: null },
    }),
  ]);

  await recordAudit({ actorId: admin.id, action: "submission.reopened", subject: submissionId });

  revalidatePath("/admin/review");
  revalidatePath("/admin/submissions");
  revalidatePath("/admin");
  revalidatePath("/submissions");
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Accounts                                                                    */
/* -------------------------------------------------------------------------- */

const accountSchema = z.object({
  userId: z.string().trim().min(1).max(60),
  name: z.string().trim().min(1, "An account needs a name.").max(80),
  email: z.string().trim().toLowerCase().email("That isn't an email address.").max(160),
  plan: z.enum(["FREE", "EXPLORER", "ULTRA"]),
  freeQuestsUsed: z.coerce.number().int().min(0).max(99),
  theme: z.enum(["SYSTEM", "LIGHT", "DARK"]),
});

/**
 * Set what an account is and what it may do.
 *
 * Name and email are here as well as role, plan and allowance, because the
 * support request this panel exists to answer is usually "I typed my address
 * wrong" or "I have changed my name" — and until now the only way to fix
 * either was to delete the account and take its history with it.
 *
 * Changing an email is changing the credential somebody signs in with, so the
 * uniqueness collision is caught and reported rather than surfacing as a
 * failed write. It does not sign them out: they are the same account, and an
 * admin correcting a typo should not knock the person off mid-page. The
 * password button below is the one that does that, deliberately.
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
    name: formData.get("name"),
    email: formData.get("email"),
    plan: formData.get("plan"),
    freeQuestsUsed: formData.get("freeQuestsUsed"),
    theme: formData.get("theme") ?? "SYSTEM",
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Those values don't look right." };
  }

  const { userId, name, email, plan, freeQuestsUsed, theme } = parsed.data;

  // Roles are not written from this form. Correcting a typo in somebody's
  // email and deciding who can read proof are different acts with different
  // blast radii, and the second one lives on Panel access behind the owner
  // guard. See `revokeStaffAction` for what the panel *can* do to a role, and
  // why granting one is deliberately not it.

  const clash = await db.user.findFirst({
    where: { email, id: { not: userId } },
    select: { name: true },
  });
  if (clash) {
    return { ok: false, message: `${clash.name} already uses that email address.` };
  }

  await db.user.update({
    where: { id: userId },
    data: { name, email, freeQuestsUsed, theme },
  });

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

  await recordAudit({
    actorId: admin.id,
    action: "account.updated",
    subject: `${name} <${email}>`,
    detail: `plan ${plan}`,
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Set a new password on somebody else's account.
 *
 * There is no email in this product yet, so "I am locked out" has had no
 * answer at all. This is that answer, and it is deliberately the blunt one:
 * an admin sets a password, tells the person what it is by whatever means they
 * are already talking, and every existing session on the account is dropped so
 * anybody holding a stolen one is dropped with it.
 *
 * Refused on your own account. The account you are signed in as has a settings
 * page for this, and doing it from here would sign you out of the panel you
 * did it from.
 */
export async function setAccountPasswordAction(
  userId: string,
  password: string,
): Promise<AdminResult> {
  const admin = await requireAdmin();

  if (userId === admin.id) {
    return { ok: false, message: "Change your own password in settings — this would sign you out." };
  }

  const parsed = z
    .object({
      userId: z.string().trim().min(1).max(60),
      password: z.string().min(10, "At least ten characters.").max(200),
    })
    .safeParse({ userId, password });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "That won't do as a password." };
  }

  const target = await db.user.findUnique({ where: { id: userId }, select: { name: true } });
  if (!target) return { ok: false, message: "That account is gone." };

  // Same cost as signup, so an admin-set password is not quietly weaker to
  // crack than one somebody chose themselves.
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { passwordHash } }),
    db.session.deleteMany({ where: { userId } }),
  ]);

  revalidatePath(`/admin/users/${userId}`);
  return { ok: true, message: `${target.name} has a new password and was signed out everywhere.` };
}

/**
 * Moderate a public profile.
 *
 * Unpublishing is the whole point: a handle, a headline or a bio is free text
 * on a page anybody signed in can read, and the only tool this panel had for
 * one that should not be there was deleting the account underneath it.
 *
 * Clearing a field empties it rather than replacing it with a notice. A
 * profile that says "removed by an administrator" is a worse page than one
 * with a blank line, and it invites an argument in the next field down.
 */
export async function moderateProfileAction(
  userId: string,
  change: { published?: boolean; clearHeadline?: boolean; clearBio?: boolean },
): Promise<AdminResult> {
  await requireAdmin();

  const profile = await db.profile.findUnique({
    where: { userId },
    select: { id: true, published: true },
  });
  if (!profile) return { ok: false, message: "That account has no profile." };

  await db.profile.update({
    where: { userId },
    data: {
      ...(change.published === undefined ? {} : { published: change.published }),
      ...(change.clearHeadline ? { headline: null } : {}),
      ...(change.clearBio ? { bio: null } : {}),
    },
  });

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/people");
  return {
    ok: true,
    message:
      change.published === false
        ? "Profile hidden. It is no longer in the directory."
        : change.published === true
          ? "Profile published."
          : "Profile updated.",
  };
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
  const admin = await requireAdmin();

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

  await recordAudit({ actorId: admin.id, action: "quest.written", subject: q.title, detail: quest.id });

  revalidatePath("/admin/quests");
  revalidatePath("/admin");
  return { ok: true, questId: quest.id };
}

/** Publish or unpublish. An unpublished quest can no longer be issued. */
/**
 * Edit a quest.
 *
 * The counterpart to `createQuestAction`, on the same schema, so the two forms
 * cannot drift into accepting different things. The signature is recomputed on
 * every write: it is derived from the defining fields, and a quest whose
 * location or grade has changed is a different quest as far as the
 * anti-repetition rule is concerned.
 */
export async function updateQuestAction(
  _prev: QuestFormState,
  formData: FormData,
): Promise<QuestFormState> {
  const admin = await requireAdmin();

  const questId = String(formData.get("questId") ?? "").trim();
  if (!questId) return { ok: false, errors: { form: "Unknown quest." } };

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

  await db.quest.update({
    where: { id: questId },
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
      published: q.published ?? false,
      ...(q.coverImage ? { coverImage: q.coverImage } : {}),
      parkingName: q.parkingName || null,
      parkingLat: optionalNumber(q.parkingLat),
      parkingLng: optionalNumber(q.parkingLng),
      parkingNote: q.parkingNote || null,
      approachTime: optionalNumber(q.approachTime),
      transitNote: q.transitNote || null,
      signature,
    },
  });

  await recordAudit({ actorId: admin.id, action: "quest.updated", subject: q.title, detail: questId });

  revalidatePath("/admin/quests");
  revalidatePath(`/admin/quests/${questId}`);
  revalidatePath(`/quests/${questId}`);
  revalidatePath("/quests");
  return { ok: true, questId };
}

export async function toggleQuestPublishedAction(questId: string): Promise<AdminResult> {
  const admin = await requireAdmin();
  const quest = await db.quest.findUnique({
    where: { id: questId },
    select: { published: true },
  });
  if (!quest) return { ok: false, message: "That quest is gone." };

  await db.quest.update({ where: { id: questId }, data: { published: !quest.published } });
  await recordAudit({
    actorId: admin.id,
    action: quest.published ? "quest.unpublished" : "quest.published",
    subject: questId,
  });
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
  const admin = await requireAdmin();

  const issued = await db.questHistory.count({ where: { questId } });
  if (issued > 0) {
    return {
      ok: false,
      message: `Issued to ${issued} ${issued === 1 ? "person" : "people"} — unpublish it instead.`,
    };
  }

  await db.quest.delete({ where: { id: questId } });
  await recordAudit({ actorId: admin.id, action: "quest.deleted", subject: questId });
  revalidatePath("/admin/quests");
  return { ok: true, message: "Quest deleted." };
}

/* -------------------------------------------------------------------------- */
/* Trailheads                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Rename or move a trailhead.
 *
 * There is no places table — a location exists because a quest points at it —
 * so this writes across every quest standing at the old name. Moving the
 * coordinates is opt-in and separate from renaming: correcting a spelling and
 * correcting a pin are different mistakes, and doing both by accident is how a
 * trailhead ends up in a lake.
 */
export async function moveTrailheadAction(input: {
  location: string;
  name: string;
  latitude: number;
  longitude: number;
  moveCoordinates: boolean;
}): Promise<AdminResult> {
  const admin = await requireAdmin();

  const parsed = z
    .object({
      location: z.string().trim().min(1).max(80),
      name: z.string().trim().min(2, "A trailhead needs a name.").max(80),
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      moveCoordinates: z.boolean(),
    })
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Those values don't look right." };
  }

  const { location, name, latitude, longitude, moveCoordinates } = parsed.data;

  const updated = await db.quest.updateMany({
    where: { location },
    data: {
      location: name,
      ...(moveCoordinates ? { latitude, longitude } : {}),
    },
  });

  await recordAudit({
    actorId: admin.id,
    action: "trailhead.moved",
    subject: `${location} → ${name}`,
    detail: moveCoordinates ? `${latitude}, ${longitude}` : "name only",
  });

  revalidatePath("/admin/locations");
  revalidatePath(`/admin/locations/${slugify(name)}`);
  return {
    ok: true,
    message: `Updated ${updated.count} ${updated.count === 1 ? "quest" : "quests"}.`,
  };
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

  await recordAudit({
    actorId: admin.id,
    action: "slot.booked",
    subject: `${period} ${slotKey}`,
    detail: questId,
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

/* -------------------------------------------------------------------------- */
/* Panel access                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Take somebody's staff role away.
 *
 * The panel can revoke and it cannot grant, and that asymmetry is the whole
 * design: revoking is a thing you want to be able to do fast, from a phone, at
 * two in the morning. Granting is a thing that should require somebody at a
 * database prompt, because a panel that can promote accounts is one
 * compromised session away from making an attacker permanent.
 *
 * Owner-only, and it refuses the owner's own account and the last owner: a
 * panel nobody can open is not a safer panel.
 */
export async function revokeStaffAction(userId: string): Promise<AdminResult> {
  const owner = await requireOwner();

  if (userId === owner.id) {
    return { ok: false, message: "You cannot take away your own keys." };
  }

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true },
  });
  if (!target) return { ok: false, message: "That account is gone." };
  if (target.role === "USER") return { ok: true, message: "Already a member." };

  if (target.role === "OWNER") {
    const owners = await db.user.count({ where: { role: "OWNER" } });
    if (owners <= 1) return { ok: false, message: "That is the last owner." };
  }

  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { role: "USER" } }),
    // Their panel sessions are what the role was letting through, so they go
    // with it. A revoked admin holding a live cookie is a revoked admin only
    // in the database.
    db.session.deleteMany({ where: { userId } }),
  ]);

  await recordAudit({
    actorId: owner.id,
    action: "staff.revoked",
    subject: target.name,
    detail: `was ${target.role}`,
  });

  revalidatePath("/admin/access");
  revalidatePath("/admin/users");
  return { ok: true, message: `${target.name} is a member again, and signed out.` };
}

/** End every live session on one account, without touching its role. */
export async function endSessionsAction(userId: string): Promise<AdminResult> {
  const owner = await requireOwner();

  const target = await db.user.findUnique({ where: { id: userId }, select: { name: true } });
  if (!target) return { ok: false, message: "That account is gone." };

  const dropped = await db.session.deleteMany({ where: { userId } });
  await recordAudit({
    actorId: owner.id,
    action: "sessions.ended",
    subject: target.name,
    detail: `${dropped.count} dropped`,
  });

  revalidatePath("/admin/access");
  return { ok: true, message: `${dropped.count} ${dropped.count === 1 ? "session" : "sessions"} ended.` };
}
