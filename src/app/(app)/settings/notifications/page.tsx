import type { Metadata } from "next";

import { saveNotificationsAction } from "@/app/(app)/settings/actions";
import { SqSaveForm, SqToggleRow } from "@/components/sq/forms";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Notifications" };
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

  return (
    <section className="sq-card" style={{ overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          padding: "15px 24px",
          borderBottom: "1px solid var(--line-2)",
        }}
      >
        <h2 className="sq-h2" style={{ fontSize: 19 }}>
          {t.settingsPages.notifications.heading}
        </h2>
        <span className="sq-kicker-sm" style={{ fontSize: 10, letterSpacing: "0.08em" }}>
          {user.email}
        </span>
      </div>

      <SqSaveForm
        action={saveNotificationsAction}
        footer={t.settingsPages.notifications.footer}
      >
        <ul>
          <SqToggleRow
            name="questDrop"
            label={t.settingsPages.notifications.questDrop}
            description={t.settingsPages.notifications.questDropDetail}
            defaultOn={settings?.questDrop ?? true}
          />
          <SqToggleRow
            name="verdict"
            label={t.settingsPages.notifications.verdict}
            description={t.settingsPages.notifications.verdictDetail}
            defaultOn={settings?.verdict ?? true}
          />
          <SqToggleRow
            name="boardSealed"
            label={t.settingsPages.notifications.boardSealed}
            description={t.settingsPages.notifications.boardSealedDetail}
            defaultOn={settings?.boardSealed ?? true}
          />
          <SqToggleRow
            name="productNews"
            label={t.settingsPages.notifications.productNews}
            description={t.settingsPages.notifications.productNewsDetail}
            defaultOn={settings?.productNews ?? false}
          />
        </ul>
      </SqSaveForm>
    </section>
  );
}
