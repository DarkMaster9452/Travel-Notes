import type { Metadata } from "next";

import { SqSaveForm, SqToggleRow } from "@/components/sq/forms";
import { saveDisplayAction } from "@/app/(app)/settings/actions";
import { setThemeAction } from "@/app/(app)/actions";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import { ThemePicker } from "@/components/sq/theme-picker";

export const metadata: Metadata = { title: "General" };
export const dynamic = "force-dynamic";

/**
 * The switches that apply to every quest.
 *
 * Expert figures is plan-gated, and the gate is shown rather than hidden: a
 * switch you can see and cannot move is what tells you the plan is the reason.
 * The server refuses it anyway — see `saveDisplayAction`.
 */
export default async function GeneralSettingsPage() {
  const user = await requireClient();

  const [display, entitlement] = await Promise.all([
    db.displaySettings.findUnique({ where: { userId: user.id } }),
    getEntitlement(user.id),
  ]);

  return (
    <>
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
            General
          </h2>
          <span className="sq-kicker-sm" style={{ fontSize: 10, letterSpacing: "0.08em" }}>
            Applies to every quest
          </span>
        </div>

        <SqSaveForm
          action={saveDisplayAction}
          footer="Expert figures are part of Explorer and Ultra. On the free plan a quest shows the four figures on its card and nothing more."
        >
          <input type="hidden" name="units" value={display?.units ?? "METRIC"} />
          <input type="hidden" name="language" value={display?.language ?? "en"} />
          <ul>
            <SqToggleRow
              name="expertStats"
              label="Expert figures"
              tag={entitlement.isSubscribed ? undefined : "Explorer"}
              description="The extra per-quest figures — gradient, exposure, the spread over volume — on the dashboard card and the monthly."
              defaultOn={display?.expertStats ?? false}
              disabled={!entitlement.isSubscribed}
            />
          </ul>
        </SqSaveForm>
      </section>

      <section className="sq-card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "15px 24px", borderBottom: "1px solid var(--line-2)" }}>
          <h2 className="sq-h2" style={{ fontSize: 19 }}>
            Palette
          </h2>
        </div>
        <div style={{ padding: "18px 24px" }}>
          <ThemePicker current={user.theme} save={setThemeAction} />
          <p className="sq-hint" style={{ marginTop: 10 }}>
            Stored on the account rather than in the browser, so the first paint on a new device is
            already the one you chose.
          </p>
        </div>
      </section>
    </>
  );
}
