import type { Metadata } from "next";

import { changePasswordAction } from "@/app/(app)/settings/actions";
import { SaveForm } from "@/components/app/forms";
import { Pane } from "@/components/app/pane";
import { Field, Input } from "@/components/ui/field";
import { requireClient } from "@/lib/auth/guards";
import { getT } from "@/lib/i18n/server";
import { PASSWORD_MIN } from "@/lib/validation";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).settings.items.password };
}
export const dynamic = "force-dynamic";

/** Change it, and end every session while you are at it. */
export default async function PasswordSettingsPage() {
  const user = await requireClient();
  const t = await getT(user.id);
  const words = t.panes.password;

  return (
    <Pane title={words.heading}>
      <SaveForm action={changePasswordAction} submitLabel={words.changeIt} refreshOnSave={false} footer={words.signsOut}>
        <Field label={words.currentPassword} htmlFor="current">
          <Input id="current" type="password" name="current" autoComplete="current-password" required />
        </Field>
        <Field label={words.newPassword} htmlFor="next" hint={t.auth.passwordHint(PASSWORD_MIN)}>
          <Input id="next" type="password" name="next" autoComplete="new-password" minLength={PASSWORD_MIN} required />
        </Field>
      </SaveForm>
    </Pane>
  );
}
