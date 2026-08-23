import "server-only";

import { db } from "@/lib/db";

/**
 * Reads for the back-office room.
 *
 * Separate from `app/admin/chat/actions.ts` because every export from a
 * `"use server"` file is a client-callable endpoint. A history read that takes
 * a reader id as an argument has no business being one: it would let anybody
 * who can reach the panel ask for the conversation as somebody else, and while
 * that only changes which messages come back marked `mine`, "only" is not a
 * reason to publish an endpoint nobody needs.
 */

export type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  editedAt: string | null;
  /** Null once the author's account has been deleted. */
  author: { id: string; name: string } | null;
  /** True when the reader wrote it — the only one they may edit or delete. */
  mine: boolean;
};

export const CHAT_SELECT = {
  id: true,
  body: true,
  createdAt: true,
  editedAt: true,
  authorId: true,
  author: { select: { id: true, name: true } },
} as const;

export function projectMessage(
  row: {
    id: string;
    body: string;
    createdAt: Date;
    editedAt: Date | null;
    authorId: string | null;
    author: { id: string; name: string } | null;
  },
  readerId: string,
): ChatMessage {
  return {
    id: row.id,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    editedAt: row.editedAt?.toISOString() ?? null,
    author: row.author,
    mine: row.authorId === readerId,
  };
}

/** The last `take` messages, oldest first — the order they are read in. */
export async function loadMessages(readerId: string, take = 80): Promise<ChatMessage[]> {
  const rows = await db.adminMessage.findMany({
    orderBy: { createdAt: "desc" },
    take,
    select: CHAT_SELECT,
  });
  return rows.reverse().map((row) => projectMessage(row, readerId));
}

/**
 * How many messages this admin has not seen, for the badge in the sidebar.
 *
 * Reads the watermark itself rather than taking it as an argument: it lives on
 * the account, and widening the session user with a field only this badge
 * wants would put it on every request in the product to serve one.
 *
 * Your own messages never count. A badge for something you just typed is a
 * badge nobody trusts twice.
 */
export async function countUnreadMessages(userId: string): Promise<number> {
  const account = await db.user.findUnique({
    where: { id: userId },
    select: { adminChatReadAt: true },
  });
  const since = account?.adminChatReadAt ?? null;

  return db.adminMessage.count({
    where: {
      authorId: { not: userId },
      ...(since ? { createdAt: { gt: since } } : {}),
    },
  });
}
