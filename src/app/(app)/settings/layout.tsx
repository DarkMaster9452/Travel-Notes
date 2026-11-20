import type { Metadata } from "next";

import { SettingsNav } from "@/components/app/settings-nav";
import { PageHeader } from "@/components/ui/page";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: { default: "Settings", template: "%s · Settings" } };

/**
 * The settings shell (design/DESIGN-SYSTEM.md §6.4): one header, a 220 px rail
 * and a 640 px pane from `lg`; tabs above the pane below that.
 */
export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const t = await getT();

  return (
    <>
      <PageHeader title={t.settings.heading} />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <div className="lg:w-56 lg:shrink-0">
          <SettingsNav />
        </div>
        <div className="flex min-w-0 max-w-text flex-1 flex-col gap-4 lg:gap-6">{children}</div>
      </div>
    </>
  );
}
