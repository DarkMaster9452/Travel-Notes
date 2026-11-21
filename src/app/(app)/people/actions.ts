"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { uniqueSlug } from "@/lib/groups";
import { getT } from "@/lib/i18n/server";

export type GroupResult = { ok: boolean; message?: string; slug?: string };

const groupSchema = z.object({
  name: z.string().trim().min(2).max(60),
  blurb: z.string().trim().max(240).optional().or(z.literal("")),
});

/** Start a group. Whoever starts it owns it, and is its first member. */
export async function createGroupAction(formData: FormData): Promise<GroupResult> {
  const user = await requireClient();

  const parsed = groupSchema.safeParse({
    name: formData.get("name"),
    blurb: formData.get("blurb"),
  });
  if (!parsed.success) {
    const words = (await getT(user.id)).app.actions;
    return { ok: false, message: parsed.error.issues[0]?.path[0] === "name" ? words.groupName : words.checkForm };
  }

  const slug = await uniqueSlug(parsed.data.name);

  await db.group.create({
    data: {
      slug,
      name: parsed.data.name,
      blurb: parsed.data.blurb || null,
      createdById: user.id,
      members: { create: { userId: user.id, role: "OWNER" } },
    },
  });

  revalidatePath("/people");
  return { ok: true, slug };
}

/**
 * Join a group.
 *
 * By slug, which is what an invite link carries. There is no request-and-
 * approve step: a group whose slug you were given is one somebody meant you to
 * be in, and a pending-membership queue would be a second inbox for a product
 * that already has one.
 */
export async function joinGroupAction(slug: string): Promise<GroupResult> {
  const user = await requireClient();

  const group = await db.group.findUnique({ where: { slug }, select: { id: true } });
  if (!group) return { ok: false, message: (await getT(user.id)).app.actions.groupMissing };

  await db.groupMembership.upsert({
    where: { groupId_userId: { groupId: group.id, userId: user.id } },
    update: {},
    create: { groupId: group.id, userId: user.id },
  });

  revalidatePath(`/people/groups/${slug}`);
  revalidatePath("/people");
  return { ok: true, slug };
}

/**
 * Leave a group.
 *
 * The last owner cannot leave without handing it on — a group with a roster
 * and nobody who can change it is a dead end rather than a group.
 */
export async function leaveGroupAction(slug: string): Promise<GroupResult> {
  const user = await requireClient();

  const group = await db.group.findUnique({
    where: { slug },
    select: { id: true, members: { select: { userId: true, role: true } } },
  });
  if (!group) return { ok: false, message: (await getT(user.id)).app.actions.groupMissing };

  const mine = group.members.find((member) => member.userId === user.id);
  if (!mine) return { ok: true, slug };

  const owners = group.members.filter((member) => member.role === "OWNER");
  if (mine.role === "OWNER" && owners.length === 1 && group.members.length > 1) {
    return { ok: false, message: (await getT(user.id)).app.actions.groupHandOver };
  }

  await db.groupMembership.delete({
    where: { groupId_userId: { groupId: group.id, userId: user.id } },
  });

  // A group nobody is in is not a group. Removing it keeps the slug free and
  // stops an empty page sitting behind an old invite link.
  if (group.members.length === 1) {
    await db.group.delete({ where: { id: group.id } }).catch(() => undefined);
  }

  revalidatePath("/people");
  return { ok: true };
}
