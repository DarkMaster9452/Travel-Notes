import type { Metadata } from "next";

import { Eyebrow } from "@/components/field";
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
    <article>
      <Eyebrow>Legal</Eyebrow>
      <h1 className="h2 mt-4">Terms of service.</h1>
      <div className="mt-8 flex flex-col gap-5 text-[16px] leading-[1.65] text-ink-2">
        <p>
          These are not published yet. Summit Quest is not taking payments in this build, and no
          terms are in force.
        </p>
        <p>
          When they are, they will cover the subscription, cancellation, what happens to your quest
          history if you leave, and the limits of what an issued quest is — which the{" "}
          <a href="/legal/safety" className="underline">
            safety notice
          </a>{" "}
          already sets out in plain language.
        </p>
        <p className="note">
          Questions in the meantime: <a href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a>
        </p>
      </div>
    </article>
  );
}
