import Link from "next/link";

import { Button } from "@/components/stopa/ui";
import { getTranslations } from "@/lib/i18n";

export default async function NotFound() {
  const { t } = await getTranslations();

  return (
    <main className="flex min-h-dvh flex-col justify-center bg-forest px-5">
      <div className="mx-auto w-full max-w-md">
        <p className="text-sm uppercase tracking-[0.14em] text-amber">404</p>
        <h1 className="mt-4 font-serif text-4xl">{t.common.notFoundTitle}</h1>
        <p className="mt-3 leading-relaxed text-moss">{t.common.notFoundBody}</p>
        <Button asChild className="mt-7">
          <Link href="/home">{t.common.goHome}</Link>
        </Button>
      </div>
    </main>
  );
}
