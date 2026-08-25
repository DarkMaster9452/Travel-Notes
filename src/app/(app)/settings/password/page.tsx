import type { Metadata } from "next";

import { changePasswordAction } from "@/app/(app)/settings/actions";
import { SqSaveForm } from "@/components/sq/forms";
import { requireClient } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Password" };
export const dynamic = "force-dynamic";

/** Change it, and end every session while you are at it. */
export default async function PasswordSettingsPage() {
  await requireClient();

  return (
    <section className="sq-card" style={{ overflow: "hidden" }}>
      <div style={{ padding: "15px 24px", borderBottom: "1px solid var(--line-2)" }}>
        <h2 className="sq-h2" style={{ fontSize: 19 }}>
          Password
        </h2>
      </div>

      <SqSaveForm
        action={changePasswordAction}
        submitLabel="Change it"
        refreshOnSave={false}
        footer="Changing a password signs out every session, including this one."
      >
        <div style={{ padding: "18px 24px", display: "grid", gap: 14 }}>
          <label className="sq-field">
            <span className="sq-label">Current password</span>
            <input className="sq-input" type="password" name="current" autoComplete="current-password" required />
          </label>
          <label className="sq-field">
            <span className="sq-label">New password</span>
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
