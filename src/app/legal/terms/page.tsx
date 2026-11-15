import type { Metadata } from "next";

import { Prose, ProseLink } from "@/components/marketing/prose";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: "Terms",
  robots: { index: false, follow: true },
};

/**
 * Placeholder. The terms are a legal document and are not something to
 * improvise, so this page says plainly that they are not published yet rather
 * than presenting invented clauses as if they were binding.
 */
export default function TermsPage() {
  return (
    <Prose overline="Legal" title="Terms of service">
      <p>
        These are not published yet. Summit Quest is not taking payments in this build, and no terms are in
        force.
      </p>
      <p>
        When they are, they will cover the subscription, cancellation, what happens to your quest history if
        you leave, and the limits of what an issued quest is — which the{" "}
        <ProseLink href="/legal/safety">safety notice</ProseLink> already sets out in plain language.
      </p>
      <p className="text-body-sm">
        Questions in the meantime:{" "}
        <ProseLink href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</ProseLink>
      </p>
    </Prose>
  );
}
