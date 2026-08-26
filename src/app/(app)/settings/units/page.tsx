import type { Metadata } from "next";

import { saveDisplayAction } from "@/app/(app)/settings/actions";
import { SqSaveForm } from "@/components/sq/forms";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { LOCALES } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Units & language" };
export const dynamic = "force-dynamic";

/** How figures and copy are written. Nothing here changes what a quest is. */
export default async function UnitsSettingsPage() {
  const user = await requireClient();
  const [display, t] = await Promise.all([
    db.displaySettings.findUnique({ where: { userId: user.id } }),
    getT(user.id),
  ]);

  return (
    <section className="sq-card" style={{ overflow: "hidden" }}>
      <div style={{ padding: "15px 24px", borderBottom: "1px solid var(--line-2)" }}>
        <h2 className="sq-h2" style={{ fontSize: 19 }}>
          {t.settings.units.heading}
        </h2>
      </div>

      <SqSaveForm action={saveDisplayAction} footer={t.settings.units.footer}>
        <input type="hidden" name="expertStats" value={display?.expertStats ? "true" : "false"} />
        <div style={{ padding: "18px 24px", display: "grid", gap: 16 }}>
          <label className="sq-field">
            <span className="sq-label">{t.settings.units.units}</span>
            <select className="sq-select" name="units" defaultValue={display?.units ?? "METRIC"}>
              <option value="METRIC">{t.settings.units.metric}</option>
              <option value="IMPERIAL">{t.settings.units.imperial}</option>
            </select>
          </label>

          <label className="sq-field">
            <span className="sq-label">{t.settings.units.language}</span>
            {/* Each language names itself, in itself. Somebody who has landed
                on a language they cannot read needs to find their own in the
                list, and "Slovak" is no use to them. */}
            <select className="sq-select" name="language" defaultValue={display?.language ?? "en"}>
              {LOCALES.map((locale) => (
                <option key={locale.id} value={locale.id}>
                  {locale.label}
                </option>
              ))}
            </select>
            <span
              style={{ display: "block", marginTop: 7, fontSize: 12, color: "var(--ink-3)" }}
            >
              {t.settings.units.languageHint}
            </span>
          </label>
        </div>
      </SqSaveForm>
    </section>
  );
}
