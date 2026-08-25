import type { Metadata } from "next";

import { SqSettingsNav } from "@/components/sq/settings-nav";

export const metadata: Metadata = { title: { default: "Settings", template: "%s · Settings" } };

/** The settings shell: one header, one rail, and whichever pane was asked for. */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sq-head">
        <span className="sq-kicker" style={{ display: "block", marginBottom: 10 }}>
          Your account
        </span>
        <h1 className="sq-h1" style={{ fontSize: 38, maxWidth: "none" }}>
          Settings
        </h1>
      </header>

      <div className="sq-settings-grid">
        <SqSettingsNav />
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          {children}
        </div>
      </div>
    </>
  );
}
