import "server-only";

import { db } from "@/lib/db";

/**
 * The panel's write log.
 *
 * One call at the end of an action, after the write has actually happened —
 * an audit entry for something that then failed is worse than no entry at all.
 * It never throws: a log that can take the operation down with it is a
 * liability, and a missing line is recoverable in a way a failed approval is
 * not.
 */
export async function recordAudit(entry: {
  actorId: string | null;
  action: string;
  subject: string;
  detail?: string | null;
}): Promise<void> {
  try {
    await db.adminAudit.create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        subject: entry.subject.slice(0, 300),
        detail: entry.detail?.slice(0, 500) ?? null,
      },
    });
  } catch {
    /* the write already succeeded; losing its log entry must not undo it */
  }
}

export type AuditEntry = {
  id: string;
  action: string;
  subject: string;
  detail: string | null;
  actor: string;
  at: Date;
};

export async function getAuditLog(limit = 50, action?: string): Promise<AuditEntry[]> {
  const rows = await db.adminAudit.findMany({
    where: action ? { action } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      subject: true,
      detail: true,
      createdAt: true,
      actor: { select: { name: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    subject: row.subject,
    detail: row.detail,
    actor: row.actor?.name ?? "an account since deleted",
    at: row.createdAt,
  }));
}

/** The distinct actions in the log, for the filter on the audit screen. */
export async function getAuditActions(): Promise<string[]> {
  const rows = await db.adminAudit.findMany({
    distinct: ["action"],
    orderBy: { action: "asc" },
    select: { action: true },
    take: 60,
  });
  return rows.map((row) => row.action);
}
