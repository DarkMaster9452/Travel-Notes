import Link from "next/link";

import { LanguageToggle } from "@/components/i18n/language-toggle";
import { Button, SectionLabel } from "@/components/stopa/ui";
import { getTranslations } from "@/lib/i18n";

/** Public copy of the rules, linked from the signup checkbox. */
export default async function RulesPage() {
  const { t, locale } = await getTranslations();

  return (
    <div className="min-h-dvh bg-forest">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/" className="wordmark text-2xl text-cream">
          STOPA
        </Link>
        <LanguageToggle current={locale} tone="light" />
      </div>

      <main className="mx-auto max-w-2xl px-5 pb-16">
        <SectionLabel>{t.rewards.rules}</SectionLabel>
        <ul className="mt-5 space-y-3">
          {t.rulesList.map((rule) => (
            <li key={rule} className="flex gap-3 font-serif text-base leading-relaxed">
              <span aria-hidden="true" className="text-moss">·</span>
              {rule}
            </li>
          ))}
        </ul>
        <Button asChild variant="outline" className="mt-8">
          <Link href="/signup">{t.nav.signup}</Link>
        </Button>
      </main>
    </div>
  );
}
