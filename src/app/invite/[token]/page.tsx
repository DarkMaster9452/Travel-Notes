import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogoMark } from "@/components/ui/logo";
import { type } from "@/components/ui/typography";
import { ROLE_LABEL } from "@/lib/admin/access";
import { claimInvite } from "@/lib/admin/invites";
import { recordAudit } from "@/lib/admin/audit";
import { requireUser } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "An invitation" };
export const dynamic = "force-dynamic";

const REASONS: Record<string, { title: string; body: string }> = {
  unknown: {
    title: "That invitation does not exist",
    body: "It may have been withdrawn, or already used. Ask whoever invited you to send a new one.",
  },
  expired: {
    title: "That invitation has expired",
    body: "Invitations last a week. Ask whoever invited you to send it again — a resend issues a fresh link.",
  },
  "wrong-account": {
    title: "That invitation is for a different address",
    body: "An invitation only works for the account it was written to. Sign in with that email address and open the link again.",
  },
  already: {
    title: "That invitation has already been used",
    body: "If you are meant to be at the desk and cannot get in, ask an owner to check your role.",
  },
};

/**
 * Accept an invitation.
 *
 * Signing in comes first: the guard sends a signed-out visitor to login and
 * back here afterwards. That ordering is the point — the link is one half of
 * the credential and the account is the other, so a link that reaches the
 * wrong person is inert rather than a way in.
 */
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const user = await requireUser(`/invite/${token}`);

  const result = await claimInvite(token, {
    id: user.id,
    email: user.email,
    role: user.role,
  });

  if (result.ok) {
    await recordAudit({
      actorId: user.id,
      action: "staff.invite_accepted",
      subject: user.email,
      detail: `now ${ROLE_LABEL[result.role].toLowerCase()}`,
    });
    redirect("/admin");
  }

  const problem = REASONS[result.reason] ?? REASONS.unknown;

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <Card pad="lg" className="flex w-full max-w-dialog-sm flex-col items-center gap-4 text-center">
        <LogoMark className="size-12" />
        <h1 className={type.h2}>{problem.title}</h1>
        <p className="text-body-sm text-muted">{problem.body}</p>
        <p className="text-caption text-subtle">Signed in as {user.email}</p>
        <ButtonLink href="/dashboard" variant="secondary">
          Back to the product
        </ButtonLink>
      </Card>
    </main>
  );
}
