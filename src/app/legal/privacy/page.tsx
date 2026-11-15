import type { Metadata } from "next";

import { Prose, ProseLink } from "@/components/marketing/prose";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: "Privacy",
  robots: { index: false, follow: true },
};

const COMMITMENTS = [
  {
    term: "Names",
    detail: "First names and initials only. No home addresses, no coordinates of where you live, no public profile pages.",
  },
  {
    term: "Matching",
    detail: "Off by default, per-account opt-in. Nothing is shared between two people until both have accepted.",
  },
  {
    term: "Photos",
    detail: "Proof photos are private to the quest unless you share them, and GPS is stripped from anything you upload.",
  },
  {
    term: "Leaving",
    detail: "Export your data and hard-delete the account, from your settings.",
  },
];

/**
 * Placeholder, for the same reason as the terms: the privacy policy has to
 * describe what is actually stored and processed, and several of those systems
 * (uploads, email, analytics) are not built yet. What the product has already
 * committed to is listed here so it is on the record.
 */
export default function PrivacyPage() {
  return (
    <Prose overline="Legal" title="Privacy policy">
      <p>Not published yet. It is written once the systems it has to describe exist, rather than before.</p>
      <p>These commitments are already fixed and the policy will not walk them back:</p>
      <dl className="divide-y divide-border rounded-card border border-border bg-surface">
        {COMMITMENTS.map((entry) => (
          <div key={entry.term} className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
            <dt className="shrink-0 text-body-sm font-semibold text-text sm:w-24">{entry.term}</dt>
            <dd className="text-body-sm">{entry.detail}</dd>
          </div>
        ))}
      </dl>
      <p className="text-body-sm">
        Questions in the meantime:{" "}
        <ProseLink href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</ProseLink>
      </p>
    </Prose>
  );
}
