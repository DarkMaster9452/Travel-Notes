import type { Metadata } from "next";

import { saveAddressAction } from "@/app/(app)/settings/actions";
import { SqSaveForm } from "@/components/sq/forms";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Shipping address" };
export const dynamic = "force-dynamic";

/**
 * Where the envelope goes.
 *
 * Real post, so a real address. The cut-off is stated on the page rather than
 * discovered later: an address changed after the 28th applies to the envelope
 * after next, because the current one has already been printed.
 */
export default async function AddressSettingsPage() {
  const user = await requireClient();
  const [address, t] = await Promise.all([
    db.shippingAddress.findUnique({ where: { userId: user.id } }),
    getT(user.id),
  ]);

  return (
    <section className="sq-card" style={{ overflow: "hidden" }}>
      <div style={{ padding: "15px 24px", borderBottom: "1px solid var(--line-2)" }}>
        <h2 className="sq-h2" style={{ fontSize: 19 }}>
          {t.settingsPages.address.heading}
        </h2>
      </div>

      <SqSaveForm
        action={saveAddressAction}
        footer={t.settingsPages.address.footer}
      >
        <div style={{ padding: "18px 24px", display: "grid", gap: 14 }}>
          <label className="sq-field">
            <span className="sq-label">{t.settingsPages.address.recipient}</span>
            <input className="sq-input" name="recipient" defaultValue={address?.recipient ?? user.name} maxLength={80} />
          </label>
          <label className="sq-field">
            <span className="sq-label">{t.settingsPages.address.line1}</span>
            <input className="sq-input" name="line1" defaultValue={address?.line1 ?? ""} maxLength={120} />
          </label>
          <label className="sq-field">
            <span className="sq-label">{t.settingsPages.address.line2}</span>
            <input className="sq-input" name="line2" defaultValue={address?.line2 ?? ""} maxLength={120} />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 140px", gap: 14 }}>
            <label className="sq-field">
              <span className="sq-label">{t.settingsPages.address.city}</span>
              <input className="sq-input" name="city" defaultValue={address?.city ?? ""} maxLength={80} />
            </label>
            <label className="sq-field">
              <span className="sq-label">{t.settingsPages.address.postcode}</span>
              <input className="sq-input" name="postcode" defaultValue={address?.postcode ?? ""} maxLength={20} />
            </label>
          </div>
          <label className="sq-field">
            <span className="sq-label">{t.settingsPages.address.country}</span>
            <input className="sq-input" name="country" defaultValue={address?.country ?? "Slovakia"} maxLength={60} required />
          </label>
        </div>
      </SqSaveForm>
    </section>
  );
}
