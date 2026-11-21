import type { Metadata } from "next";

import { saveAddressAction } from "@/app/(app)/settings/actions";
import { SaveForm } from "@/components/app/forms";
import { Pane } from "@/components/app/pane";
import { Field, Input } from "@/components/ui/field";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).settings.items.address };
}
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
  const words = t.settingsPages.address;

  return (
    <Pane title={words.heading}>
      <SaveForm action={saveAddressAction} footer={words.footer}>
        <Field label={words.recipient} htmlFor="recipient">
          <Input
            id="recipient"
            name="recipient"
            autoComplete="name"
            defaultValue={address?.recipient ?? user.name}
            maxLength={80}
          />
        </Field>
        <Field label={words.line1} htmlFor="line1">
          <Input id="line1" name="line1" autoComplete="address-line1" defaultValue={address?.line1 ?? ""} maxLength={120} />
        </Field>
        <Field label={words.line2} htmlFor="line2" optional={t.ui.optional}>
          <Input id="line2" name="line2" autoComplete="address-line2" defaultValue={address?.line2 ?? ""} maxLength={120} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label={words.city} htmlFor="city" className="sm:col-span-2">
            <Input id="city" name="city" autoComplete="address-level2" defaultValue={address?.city ?? ""} maxLength={80} />
          </Field>
          <Field label={words.postcode} htmlFor="postcode">
            <Input
              id="postcode"
              name="postcode"
              autoComplete="postal-code"
              defaultValue={address?.postcode ?? ""}
              maxLength={20}
            />
          </Field>
        </div>
        <Field label={words.country} htmlFor="country">
          <Input
            id="country"
            name="country"
            autoComplete="country-name"
            defaultValue={address?.country ?? "Slovakia"}
            maxLength={60}
            required
          />
        </Field>
      </SaveForm>
    </Pane>
  );
}
