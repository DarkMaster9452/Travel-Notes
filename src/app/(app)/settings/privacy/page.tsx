import type { Metadata } from "next";
import Link from "next/link";

import { clearMyDataAction, deleteAccountAction } from "@/app/(app)/profile/actions";
import { SqDangerForm } from "@/components/sq/forms";
import { Tag } from "@/components/sq/ui";
import { requireClient } from "@/lib/auth/guards";
import { DELETE_PHRASE } from "@/lib/config";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Privacy" };
export const dynamic = "force-dynamic";

/**
 * What is published, and what can be taken back.
 *
 * The privacy model has exactly one switch — whether the public page is
 * published — and this page states that plainly rather than offering a matrix
 * of visibility levels that would each need their own answer. Below it are the
 * two irreversible things, both of which type out what they will do.
 */
export default async function PrivacySettingsPage() {
  const user = await requireClient();

  const [profile, submissions] = await Promise.all([
    db.profile.findUnique({
      where: { userId: user.id },
      select: { handle: true, published: true },
    }),
    db.submission.count({ where: { userId: user.id } }),
  ]);

  return (
    <>
      <section className="sq-card sq-pad">
        <div className="sq-section-head" style={{ marginBottom: 10 }}>
          <h2 className="sq-h2" style={{ fontSize: 19 }}>
            Your public page
          </h2>
          <Tag tone={profile?.published ? "green" : "plain"} small>
            {profile?.published ? "Published" : "Not published"}
          </Tag>
        </div>
        <p style={{ maxWidth: "58ch", fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)", marginBottom: 16 }}>
          Unpublished is the default and stays the default. A published page is visible to
          signed-in members only, never indexed, and un-publishing takes it away immediately rather
          than scheduling anything. Nothing you file is public unless the page is.
        </p>
        <Link href="/settings/profile" className="sq-btn sq-btn-ghost sq-btn-sm">
          {profile?.published ? "Edit what it shows" : "Set it up"}
        </Link>
      </section>

      <section className="sq-card sq-pad">
        <h2 className="sq-h2" style={{ fontSize: 19, marginBottom: 10 }}>
          Clear what you have logged
        </h2>
        <p style={{ maxWidth: "58ch", fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)", marginBottom: 16 }}>
          Removes your quest history and your {submissions}{" "}
          {submissions === 1 ? "submission" : "submissions"}, including the photographs. The account
          stays; the record of what you have walked does not. This cannot be undone.
        </p>
        <SqDangerForm action={clearMyDataAction} label="Clear it" phrase={DELETE_PHRASE} />
      </section>

      <section className="sq-card sq-pad" style={{ borderColor: "var(--signal)" }}>
        <h2 className="sq-h2" style={{ fontSize: 19, marginBottom: 10 }}>
          Delete the account
        </h2>
        <p style={{ maxWidth: "58ch", fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)", marginBottom: 16 }}>
          A hard delete: sessions, preferences, subscription, history and profile go with it. There
          is no soft-delete flag quietly keeping the row.
        </p>
        <SqDangerForm action={deleteAccountAction} label="Delete everything" phrase={DELETE_PHRASE} />
      </section>
    </>
  );
}
