import type { Metadata } from "next";
import { Check, EyeOff } from "lucide-react";

import { clearMyDataAction, deleteAccountAction } from "@/app/(app)/profile/actions";
import { DangerForm } from "@/components/app/forms";
import { Pane } from "@/components/app/pane";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { requireClient } from "@/lib/auth/guards";
import { DELETE_PHRASE } from "@/lib/config";
import { db } from "@/lib/db";
import { plural } from "@/lib/i18n/format";
import { getReader } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getReader()).t.settings.items.privacy };
}
export const dynamic = "force-dynamic";

/**
 * What is published, and what can be taken back.
 *
 * The privacy model has exactly one switch — whether the public page is
 * published — and this page states that plainly. Below it are the two
 * irreversible things, both of which make you type out what they will do.
 */
export default async function PrivacySettingsPage() {
  const user = await requireClient();
  const { t, locale } = await getReader(user.id);
  const words = t.app.settingsPane.privacy;

  const [profile, submissions] = await Promise.all([
    db.profile.findUnique({ where: { userId: user.id }, select: { handle: true, published: true } }),
    db.submission.count({ where: { userId: user.id } }),
  ]);

  return (
    <>
      <Pane
        title={t.app.settingsPane.profile.heading}
        action={
          profile?.published ? (
            <Badge tone="success" icon={Check}>
              {t.panes.privacy.published}
            </Badge>
          ) : (
            <Badge icon={EyeOff}>{t.panes.privacy.notPublished}</Badge>
          )
        }
        padded
      >
        <p className="max-w-text text-body-sm text-muted">{words.pageBody}</p>
        <ButtonLink href="/settings/profile" variant="secondary">
          {profile?.published ? t.panes.privacy.editWhatItShows : t.panes.privacy.setItUp}
        </ButtonLink>
      </Pane>

      <Pane title={words.clearHeading} padded>
        <p className="max-w-text text-body-sm text-muted">
          {words.clearBody(plural(locale, submissions, words.submissions))}
        </p>
        <DangerForm action={clearMyDataAction} label={t.privacyPane.clearIt} phrase={DELETE_PHRASE} />
      </Pane>

      <Pane title={words.deleteHeading} tone="danger" padded>
        <p className="max-w-text text-body-sm text-muted">{words.deleteBody}</p>
        <DangerForm action={deleteAccountAction} label={t.panes.privacy.deleteEverything} phrase={DELETE_PHRASE} />
      </Pane>
    </>
  );
}
