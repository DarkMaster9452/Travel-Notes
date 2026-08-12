import Link from "next/link";

import { Button } from "@/components/stopa/ui";
import { requireUser } from "@/lib/auth/guards";
import { getTranslations } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function SubmissionSentPage() {
  await requireUser();
  const { t } = await getTranslations();

  return (
    <main className="flex min-h-[60dvh] flex-col justify-center">
      <div className="animate-pop">
        <span className="text-5xl" aria-hidden="true">
          📸
        </span>
        <h1 className="mt-5 font-serif text-3xl">{t.submit.successTitle}</h1>
        <p className="mt-3 max-w-md leading-relaxed text-moss">{t.submit.successBody}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/home">{t.submit.backHome}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/profile">{t.profile.title}</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
