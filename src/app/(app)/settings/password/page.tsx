import type { Metadata } from "next";

import { changePasswordAction } from "@/app/(app)/settings/actions";
import { SqSaveForm } from "@/components/sq/forms";
import { requireClient } from "@/lib/auth/guards";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Password" };
export const dynamic = "force-dynamic";

/** Change it, and end every session while you are at it. */
export default async function PasswordSettingsPage() {
  const user = await requireClient();
  const t = await getT(user.id);

  return (
    <section className="sq-card" style={{ overflow: "hidden" }}>
      <div style={{ padding: "15px 24px", borderBottom: "1px solid var(--line-2)" }}>
        <h2 className="sq-h2" style={{ fontSize: 19 }}>
          {t.panes.password.heading}
        </h2>
      </div>

      <SqSaveForm
        action={changePasswordAction}
        submitLabel={t.panes.password.changeIt}
        refreshOnSave={false}
        footer={t.panes.password.signsOut}
      >
        <div style={{ padding: "18px 24px", display: "grid", gap: 14 }}>
          <label className="sq-field">
            <span className="sq-label">{t.panes.password.currentPassword}</span>
            <input className="sq-input" type="password" name="current" autoComplete="current-password" required />
          </label>
          <label className="sq-field">
            <span className="sq-label">{t.panes.password.newPassword}</span>
            <input
              className="sq-input"
              type="password"
              name="next"
              autoComplete="new-password"
              minLength={10}
              required
            />
          </label>
        </div>
      </SqSaveForm>
    </section>
  );
}
