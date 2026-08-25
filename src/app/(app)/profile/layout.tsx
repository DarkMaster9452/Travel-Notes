import { logoutAction } from "@/app/(auth)/actions";
import { SettingsNav } from "@/components/app/settings-nav";

/**
 * The settings shell.
 *
 * Four sections that used to be three separate top-level pages plus a fourth
 * that only existed as a panel inside one of them: General, the public
 * profile, plan & billing, and the rules. One window, one nav, so "where do I
 * change my name" and "where do I see what I'm paying" are the same kind of
 * question with the same kind of answer, instead of one being a sidebar item
 * and the other a card you had to already be on the settings page to find.
 *
 * Logout lives here now — on the settings nav, where the rest of this
 * product's settings live — rather than in a menu the account button no
 * longer opens.
 */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="settings-shell">
      <SettingsNav logout={logoutAction} />
      <div className="settings-content">{children}</div>
    </div>
  );
}
