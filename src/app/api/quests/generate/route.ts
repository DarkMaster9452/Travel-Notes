import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { appUrl } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { generateQuestForUser } from "@/lib/quest/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/quests/generate
 *
 * The one endpoint that costs anything, so it carries the most guards:
 * authentication, origin check, a short duplicate-submission lock, then the
 * service's own entitlement and rate limits.
 */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== appUrl && !isSameHost(origin, request.url)) {
    return NextResponse.json({ ok: false, code: "bad_origin", message: "Rejected." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, code: "unauthenticated", message: "Log in to generate a quest." },
      { status: 401 },
    );
  }

  if (!user.onboardedAt) {
    return NextResponse.json(
      { ok: false, code: "no_preferences", message: "Finish onboarding first." },
      { status: 409 },
    );
  }

  // Collapse double-clicks and duplicate submissions into one generation.
  // Short on purpose: long enough to swallow a double-tap, short enough that
  // someone who genuinely wants another quest isn't told to wait.
  const lock = await rateLimit(`generate:lock:${user.id}`, 1, 4);
  if (!lock.ok) {
    return NextResponse.json(
      { ok: false, code: "in_flight", message: "Already working on one — hold on." },
      { status: 429 },
    );
  }

  const result = await generateQuestForUser(user.id);

  if (!result.ok) {
    const status =
      result.code === "quota_exhausted" ? 402 : result.code === "rate_limited" ? 429 : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json({
    ok: true,
    questId: result.quest.id,
    number: result.generationNumber,
    entitlement: {
      isSubscribed: result.entitlement.isSubscribed,
      freeQuestsRemaining: result.entitlement.freeQuestsRemaining,
    },
  });
}

function isSameHost(origin: string, requestUrl: string): boolean {
  try {
    return new URL(origin).host === new URL(requestUrl).host;
  } catch {
    return false;
  }
}
