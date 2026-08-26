"use server";

import { revalidatePath } from "next/cache";

import { requireClient } from "@/lib/auth/guards";
import { dismissNudge, markNudgeSeen } from "@/lib/nudges";
import type { NudgeKind } from "@prisma/client";

const KINDS: NudgeKind[] = ["SHIPPING_ADDRESS"];

function parse(kind: string): NudgeKind | null {
  return KINDS.includes(kind as NudgeKind) ? (kind as NudgeKind) : null;
}

/**
 * "Not now" — and it means it.
 *
 * A notice somebody has waved away does not come back. That is only fair if
 * the consequence was on the notice when they waved it away, which is why the
 * address nudge says what happens without an address rather than just asking
 * for one.
 */
export async function dismissNudgeAction(kind: string): Promise<{ ok: boolean }> {
  const user = await requireClient();
  const parsed = parse(kind);
  if (!parsed) return { ok: false };

  await dismissNudge(user.id, parsed);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Recorded when the notice is first rendered, so "shown once" is a fact. */
export async function seeNudgeAction(kind: string): Promise<{ ok: boolean }> {
  const user = await requireClient();
  const parsed = parse(kind);
  if (!parsed) return { ok: false };

  await markNudgeSeen(user.id, parsed);
  return { ok: true };
}
