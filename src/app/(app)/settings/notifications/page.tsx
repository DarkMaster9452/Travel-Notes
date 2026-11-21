import type { Metadata } from "next";

import { saveNotificationsAction } from "@/app/(app)/settings/actions";
import { SaveForm, ToggleRow } from "@/components/app/forms";
import { Pane } from "@/components/app/pane";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).settings.items.notifications };
}
export const dynamic = "force-dynamic";

/**
 * Which emails.
 *
 * The three that matter default on, because they are the product telling you
 * something happened to your quest or your verdict. Product news defaults off,
 * because that one has to be asked for.
 */
export default async function NotificationSettingsPage() {
  const user = await requireClient();
  const [settings, t] = await Promise.all([
    db.notificationSettings.findUnique({ where: { userId: user.id } }),
    getT(user.id),
  ]);
  const words = t.settingsPages.notifications;

  return (
    <Pane title={words.heading} note={user.email}>
      <SaveForm action={saveNotificationsAction} footer={words.footer} flush>
        <ul>
          <ToggleRow
            name="questDrop"
            label={words.questDrop}
            description={words.questDropDetail}
            defaultOn={settings?.questDrop ?? true}
          />
          <ToggleRow
            name="verdict"
            label={words.verdict}
            description={words.verdictDetail}
            defaultOn={settings?.verdict ?? true}
          />
          <ToggleRow
            name="boardSealed"
            label={words.boardSealed}
            description={words.boardSealedDetail}
            defaultOn={settings?.boardSealed ?? true}
          />
          <ToggleRow
            name="productNews"
            label={words.productNews}
            description={words.productNewsDetail}
            defaultOn={settings?.productNews ?? false}
          />
        </ul>
      </SaveForm>
    </Pane>
  );
}
