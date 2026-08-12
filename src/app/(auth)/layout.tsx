import Link from "next/link";

import { LanguageToggle } from "@/components/i18n/language-toggle";
import { getLocale } from "@/lib/i18n";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    <div className="flex min-h-dvh flex-col bg-forest">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/" className="wordmark text-2xl text-cream">
          STOPA
        </Link>
        <LanguageToggle current={locale} tone="light" />
      </div>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-16">
        {children}
      </main>
    </div>
  );
}
