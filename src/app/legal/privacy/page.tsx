import type { Metadata } from "next";

import { Eyebrow } from "@/components/field";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: "Privacy",
  robots: { index: false, follow: true },
};

/**
 * Placeholder, for the same reason as the terms: the privacy policy has to
 * describe what is actually stored and processed, and several of those systems
 * (uploads, email, analytics) are not built yet. What the product has already
 * committed to is listed here so it is on the record.
 */
export default function PrivacyPage() {
  return (
    <article>
      <Eyebrow>Legal</Eyebrow>
      <h1 className="h2 mt-4">Privacy policy.</h1>
      <div className="mt-8 flex flex-col gap-5 text-[16px] leading-[1.65] text-ink-2">
        <p>
          Not published yet. It is written once the systems it has to describe exist, rather than
          before.
        </p>
        <p>These commitments are already fixed and the policy will not walk them back:</p>
        <ul className="unlocks !grid-cols-1">
          <li>
            <b>Names</b> First names and initials only. No home addresses, no coordinates of where
            you live, no public profile pages.
          </li>
          <li>
            <b>Matching</b> Off by default, per-account opt-in. Nothing is shared between two people
            until both have accepted.
          </li>
          <li>
            <b>Photos</b> Proof photos are private to the quest unless you share them, and GPS is
            stripped from anything you upload.
          </li>
          <li>
            <b>Leaving</b> Export your data and hard-delete the account, from your settings.
          </li>
        </ul>
        <p className="note">
          Questions in the meantime: <a href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a>
        </p>
      </div>
    </article>
  );
}
