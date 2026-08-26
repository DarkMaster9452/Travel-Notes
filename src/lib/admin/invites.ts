import "server-only";

import { randomBytes } from "node:crypto";

import type { Role } from "@prisma/client";

import { db } from "@/lib/db";
import { appUrl } from "@/lib/env";

/**
 * Invitations to the desk.
 *
 * The panel can invite and it can revoke; it cannot promote. That asymmetry is
 * the whole design, and this module is the "can invite" half.
 *
 * An invite names an email and a role. It is claimed by *that* email signing
 * in and opening the link, which is what makes a leaked token useless to
 * anybody who cannot receive mail at the address it was written to — the token
 * is the second factor, not the only one.
 */

/** Long enough that guessing is not a strategy. */
const TOKEN_BYTES = 32;
const LIFETIME_DAYS = 7;

export function inviteLink(token: string): string {
  return `${appUrl}/invite/${token}`;
}

export type PendingInvite = {
  id: string;
  email: string;
  role: Role;
  token: string;
  link: string;
  invitedBy: string | null;
  createdAt: Date;
  expiresAt: Date;
  expired: boolean;
};

export async function listInvites(): Promise<PendingInvite[]> {
  const rows = await db.staffInvite.findMany({
    where: { acceptedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      token: true,
      createdAt: true,
      expiresAt: true,
      invitedBy: { select: { name: true } },
    },
  });

  const now = Date.now();
  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role,
    token: row.token,
    link: inviteLink(row.token),
    invitedBy: row.invitedBy?.name ?? null,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    expired: row.expiresAt.getTime() <= now,
  }));
}

/**
 * Write (or rewrite) the invitation for one email.
 *
 * Re-inviting replaces rather than adds: two live tokens for one address is
 * two ways in where the desk believes there is one, and the unique index on
 * `email` is what makes that unrepresentable rather than merely discouraged.
 * A resend is the same call, which is why it also rotates the token.
 */
export async function upsertInvite(
  email: string,
  role: Role,
  invitedById: string,
): Promise<PendingInvite> {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  const expiresAt = new Date(Date.now() + LIFETIME_DAYS * 24 * 60 * 60 * 1000);

  const row = await db.staffInvite.upsert({
    where: { email },
    update: { role, token, expiresAt, acceptedAt: null, invitedById },
    create: { email, role, token, expiresAt, invitedById },
    select: {
      id: true,
      email: true,
      role: true,
      token: true,
      createdAt: true,
      expiresAt: true,
      invitedBy: { select: { name: true } },
    },
  });

  return {
    id: row.id,
    email: row.email,
    role: row.role,
    token: row.token,
    link: inviteLink(row.token),
    invitedBy: row.invitedBy?.name ?? null,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    expired: false,
  };
}

export type ClaimResult =
  | { ok: true; role: Role }
  | { ok: false; reason: "unknown" | "expired" | "wrong-account" | "already" };

/**
 * Claim an invitation.
 *
 * Three things have to line up: the token exists, it has not expired, and the
 * signed-in account's email is the one it was written to. The last is the
 * important one — without it the link alone would be the credential, and links
 * end up in browser history, chat logs and screenshots.
 *
 * Claiming never *lowers* a role. An owner who opens a reader invite meant for
 * them stays an owner; the invite is simply consumed.
 */
export async function claimInvite(
  token: string,
  account: { id: string; email: string; role: Role },
): Promise<ClaimResult> {
  const invite = await db.staffInvite.findUnique({ where: { token } });
  if (!invite) return { ok: false, reason: "unknown" };
  if (invite.acceptedAt) return { ok: false, reason: "already" };
  if (invite.expiresAt.getTime() <= Date.now()) return { ok: false, reason: "expired" };

  if (invite.email.toLowerCase() !== account.email.toLowerCase()) {
    return { ok: false, reason: "wrong-account" };
  }

  const { ROLE_RANK } = await import("@/lib/admin/access");
  const keepExisting = ROLE_RANK[account.role] >= ROLE_RANK[invite.role];
  const role = keepExisting ? account.role : invite.role;

  await db.$transaction([
    db.staffInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } }),
    ...(keepExisting
      ? []
      : [db.user.update({ where: { id: account.id }, data: { role } })]),
  ]);

  return { ok: true, role };
}
