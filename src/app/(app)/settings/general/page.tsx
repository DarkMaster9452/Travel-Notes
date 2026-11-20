import type { Metadata } from "next";

import { setThemeAction } from "@/app/(app)/actions";
import { saveDisplayAction } from "@/app/(app)/settings/actions";
import { SaveForm, ToggleRow } from "@/components/app/forms";
import { Pane } from "@/components/app/pane";
import { ThemePicker } from "@/components/app/theme-picker";
import { requireClient } from "@/lib/auth/guards";
import { planCopy } from "@/lib/config";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).settings.items.general };
}
export const dynamic = "force-dynamic";

/**
 * The switches that apply to every quest, and the palette.
 *
 * Expert figures is plan-gated, and the gate is shown rather than hidden: a
 * switch you can see and cannot move is what tells you the plan is the reason.
 * The server refuses it anyway — see `saveDisplayAction`.
 */
export default async function GeneralSettingsPage() {
  const user = await requireClient();

  const [display, entitlement, t] = await Promise.all([
    db.displaySettings.findUnique({ where: { userId: user.id } }),
    getEntitlement(user.id),
    getT(user.id),
  ]);
  const words = t.settingsPages.general;

  return (
    <>
      <Pane title={words.heading} note={words.kicker}>
        <SaveForm action={saveDisplayAction} footer={words.expertFooter} flush>
          <input type="hidden" name="units" value={display?.units ?? "METRIC"} />
          <input type="hidden" name="language" value={display?.language ?? "sk"} />
          <ul>
            <ToggleRow
              name="expertStats"
              label={words.expertFigures}
              tag={entitlement.isSubscribed ? undefined : planCopy(t, "explorer").name}
              description={words.expertDetail}
              defaultOn={display?.expertStats ?? false}
              disabled={!entitlement.isSubscribed}
            />
          </ul>
        </SaveForm>
      </Pane>

      <Pane title={words.palette} padded>
        <ThemePicker current={user.theme} save={setThemeAction} />
        <p className="text-caption text-subtle">{t.app.theme.note}</p>
      </Pane>
    </>
  );
}
