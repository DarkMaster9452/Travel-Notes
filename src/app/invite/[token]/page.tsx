import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoMark } from "@/components/sq/icons";
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
    <main
      className="sq"
      style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "40px 20px" }}
    >
      <div className="sq-card sq-pad" style={{ maxWidth: 460, textAlign: "center" }}>
        <span style={{ display: "inline-block", marginBottom: 18 }}>
          <LogoMark size={34} />
        </span>
        <h1 style={{ fontSize: 26, lineHeight: 1.15, marginBottom: 12 }}>{problem.title}</h1>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-2)", marginBottom: 22 }}>
          {problem.body}
        </p>
        <p className="sq-kicker-sm" style={{ marginBottom: 18 }}>
          Signed in as {user.email}
        </p>
        <Link href="/dashboard" className="sq-btn sq-btn-ghost sq-btn-sm">
          Back to the product
        </Link>
      </div>
    </main>
  );
}
