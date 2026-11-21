import Link from "next/link";

import { AuthSide } from "@/components/marketing/auth-side";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { Logo } from "@/components/ui/logo";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";

/**
 * The shell around login and signup: split 6 / 6 from `lg` up
 * (design/DESIGN-SYSTEM.md §6.4). The form sits on the left in a column no
 * wider than 400 px; the right half shows this month's quest.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = getMessages(locale);

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex min-h-dvh flex-col px-4 md:px-6 lg:px-8">
        <header className="flex h-16 shrink-0 items-center justify-between">
          <Link href="/" aria-label={t.ui.home} className="rounded-control no-underline">
            <Logo />
          </Link>
          <LocaleSwitcher />
        </header>

        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-form">{children}</div>
        </main>

        <footer className="shrink-0 pb-6 text-center text-caption text-subtle">{t.landing.footer.motto}</footer>
      </div>

      <AuthSide t={t} locale={locale} />
    </div>
  );
}
