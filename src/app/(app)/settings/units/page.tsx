import type { Metadata } from "next";

import { saveDisplayAction } from "@/app/(app)/settings/actions";
import { SqSaveForm } from "@/components/sq/forms";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Units & language" };
export const dynamic = "force-dynamic";

/** How figures and copy are written. Nothing here changes what a quest is. */
export default async function UnitsSettingsPage() {
  const user = await requireClient();
  const display = await db.displaySettings.findUnique({ where: { userId: user.id } });

  return (
    <section className="sq-card" style={{ overflow: "hidden" }}>
      <div style={{ padding: "15px 24px", borderBottom: "1px solid var(--line-2)" }}>
        <h2 className="sq-h2" style={{ fontSize: 19 }}>
          Units &amp; language
        </h2>
      </div>

      <SqSaveForm
        action={saveDisplayAction}
        footer="Quests are written in metres and kilometres. Imperial converts on the way out; nothing is stored twice."
      >
        <input type="hidden" name="expertStats" value={display?.expertStats ? "true" : "false"} />
        <div style={{ padding: "18px 24px", display: "grid", gap: 16 }}>
          <label className="sq-field">
            <span className="sq-label">Units</span>
            <select className="sq-select" name="units" defaultValue={display?.units ?? "METRIC"}>
              <option value="METRIC">Metric — km and metres</option>
              <option value="IMPERIAL">Imperial — miles and feet</option>
            </select>
          </label>

          <label className="sq-field">
            <span className="sq-label">Language</span>
            <select className="sq-select" name="language" defaultValue={display?.language ?? "en"}>
              <option value="en">English</option>
              <option value="sk">Slovenčina</option>
            </select>
          </label>
        </div>
      </SqSaveForm>
    </section>
  );
}
