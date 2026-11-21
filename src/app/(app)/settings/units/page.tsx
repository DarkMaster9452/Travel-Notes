import type { Metadata } from "next";

import { saveDisplayAction } from "@/app/(app)/settings/actions";
import { SaveForm } from "@/components/app/forms";
import { Pane } from "@/components/app/pane";
import { Field, Select } from "@/components/ui/field";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { LOCALES } from "@/lib/i18n";
import { getLocale, getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).settings.items.units };
}
export const dynamic = "force-dynamic";

/** How figures and words are written. Nothing here changes what a quest is. */
export default async function UnitsSettingsPage() {
  const user = await requireClient();
  const [display, t, locale] = await Promise.all([
    db.displaySettings.findUnique({ where: { userId: user.id } }),
    getT(user.id),
    getLocale(user.id),
  ]);
  const words = t.settings.units;

  return (
    <Pane title={words.heading}>
      <SaveForm action={saveDisplayAction} footer={words.footer}>
        <input type="hidden" name="expertStats" value={display?.expertStats ? "true" : "false"} />
        <Field label={words.units} htmlFor="units">
          <Select id="units" name="units" defaultValue={display?.units ?? "METRIC"}>
            <option value="METRIC">{words.metric}</option>
            <option value="IMPERIAL">{words.imperial}</option>
          </Select>
        </Field>
        {/* Each language names itself, in itself. Somebody who has landed on a
            language they cannot read needs to find their own in the list. */}
        <Field label={words.language} htmlFor="language" hint={words.languageHint}>
          <Select id="language" name="language" defaultValue={display?.language ?? locale}>
            {LOCALES.map((option) => (
              <option key={option.id} value={option.id} lang={option.id}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      </SaveForm>
    </Pane>
  );
}
