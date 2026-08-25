import type { Metadata } from "next";

import { saveNotificationsAction } from "@/app/(app)/settings/actions";
import { SqSaveForm, SqToggleRow } from "@/components/sq/forms";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";

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
  const settings = await db.notificationSettings.findUnique({ where: { userId: user.id } });

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
          Notifications
        </h2>
        <span className="sq-kicker-sm" style={{ fontSize: 10, letterSpacing: "0.08em" }}>
          {user.email}
        </span>
      </div>

      <SqSaveForm
        action={saveNotificationsAction}
        footer="Everything except product news is about your own quests and your own verdicts."
      >
        <ul>
          <SqToggleRow
            name="questDrop"
            label="Quest drop"
            description="Monday at 06:00 for the weekly, the 1st for the monthly. One email, with the quest in it."
            defaultOn={settings?.questDrop ?? true}
          />
          <SqToggleRow
            name="verdict"
            label="A verdict on your proof"
            description="Approved or sent back, with the reader's note when there is one."
            defaultOn={settings?.verdict ?? true}
          />
          <SqToggleRow
            name="boardSealed"
            label="A board sealing with your name on it"
            description="Only when you finished in the top three of a window that has just closed."
            defaultOn={settings?.boardSealed ?? true}
          />
          <SqToggleRow
            name="productNews"
            label="Product news"
            description="Occasional, and never more than once a month. Off unless you ask for it."
            defaultOn={settings?.productNews ?? false}
          />
        </ul>
      </SqSaveForm>
    </section>
  );
}
