import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/guards";
import { rateLimit } from "@/lib/rate-limit";
import { storePhoto } from "@/lib/uploads";

export const runtime = "nodejs";

/**
 * Upload one photograph.
 *
 * Signed-in only, rate limited per account, and re-encoded server-side (see
 * `lib/uploads`) so the stored file carries no metadata and is genuinely the
 * type it claims to be. The response is the stored URL, which is what the
 * proof form puts in its hidden field.
 */
export async function POST(request: Request) {
  const user = await requireUser();

  const limit = await rateLimit(`upload:${user.id}`, 40, 60 * 60);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, message: "That is a lot of photographs in an hour. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, message: "No file was sent." }, { status: 400 });
  }

  const stored = await storePhoto(file, `proof/${user.id}`);
  if (!stored.ok) return NextResponse.json(stored, { status: 400 });

  return NextResponse.json(stored);
}
