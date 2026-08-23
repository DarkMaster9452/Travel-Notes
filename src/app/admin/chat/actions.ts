"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { CHAT_SELECT, projectMessage, type ChatMessage } from "@/lib/admin/chat";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";

/**
 * The back-office room.
 *
 * Every one of these re-checks the role against the database rather than
 * trusting that the caller reached an admin page. A server action is a public
 * endpoint: the room being absent from the customer navigation is a fact about
 * the menu, not about who can post to it.
 *
 * The history read lives in `lib/admin/chat` rather than here, because every
 * export from a `"use server"` file is a client-callable endpoint and a read
 * that takes a reader id as an argument should not be one.
 *
 * What clients do call is `pollMessagesAction`, which returns only what has
 * appeared since the last id they hold, so an open tab costs one small query
 * rather than the whole conversation every few seconds.
 */

export type ChatResult = { ok: boolean; message?: string };

const bodySchema = z.string().trim().min(1, "Say something first.").max(2000);

/* -------------------------------------------------------------------------- */
/* Writing                                                                     */
/* -------------------------------------------------------------------------- */

export async function postMessageAction(formData: FormData): Promise<ChatResult> {
  const admin = await requireAdmin();

  const parsed = bodySchema.safeParse(formData.get("body"));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check that." };
  }

  await db.adminMessage.create({ data: { authorId: admin.id, body: parsed.data } });

  // Posting counts as reading: nobody wants a badge for their own message.
  await db.user.update({ where: { id: admin.id }, data: { adminChatReadAt: new Date() } });

  revalidatePath("/admin/chat");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/**
 * Edit your own message.
 *
 * Yours only, and marked as edited. Everybody here has the same role, so
 * "admin" is not a licence to rewrite what a colleague said — the record of a
 * decision is worth more than the convenience of correcting somebody else's
 * typo.
 */
export async function editMessageAction(id: string, body: string): Promise<ChatResult> {
  const admin = await requireAdmin();

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check that." };
  }

  const existing = await db.adminMessage.findUnique({
    where: { id },
    select: { authorId: true },
  });
  if (!existing) return { ok: false, message: "That message is gone." };
  if (existing.authorId !== admin.id) {
    return { ok: false, message: "You can only edit your own messages." };
  }

  await db.adminMessage.update({
    where: { id },
    data: { body: parsed.data, editedAt: new Date() },
  });

  revalidatePath("/admin/chat");
  return { ok: true };
}

/** Delete your own message. Same rule, same reason. */
export async function deleteMessageAction(id: string): Promise<ChatResult> {
  const admin = await requireAdmin();

  const existing = await db.adminMessage.findUnique({
    where: { id },
    select: { authorId: true },
  });
  if (!existing) return { ok: true };
  if (existing.authorId !== admin.id) {
    return { ok: false, message: "You can only delete your own messages." };
  }

  await db.adminMessage.delete({ where: { id } });
  revalidatePath("/admin/chat");
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Reading                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Everything since `afterId`, for a tab that is already open.
 *
 * Polled rather than pushed. A handful of admins and a message every few
 * minutes does not justify a socket, and this costs one indexed read that
 * usually returns nothing.
 */
export async function pollMessagesAction(afterId: string | null): Promise<ChatMessage[]> {
  const admin = await requireAdmin();

  const after = afterId
    ? await db.adminMessage.findUnique({ where: { id: afterId }, select: { createdAt: true } })
    : null;

  const rows = await db.adminMessage.findMany({
    where: after ? { createdAt: { gt: after.createdAt } } : {},
    orderBy: { createdAt: "asc" },
    take: 80,
    select: CHAT_SELECT,
  });

  return rows.map((row) => projectMessage(row, admin.id));
}

/**
 * Mark the room read, up to now.
 *
 * Called when the page is open and the tab has focus — not on render, or a
 * background tab left open overnight would swallow every message that arrived
 * in it and the badge would never appear again.
 */
export async function markChatReadAction(): Promise<ChatResult> {
  const admin = await requireAdmin();
  await db.user.update({ where: { id: admin.id }, data: { adminChatReadAt: new Date() } });
  revalidatePath("/admin", "layout");
  return { ok: true };
}
