import Link from "next/link";

import { submitProofAction } from "@/app/(app)/actions";
import { SubmitForm } from "@/components/stopa/submit-form";
import { Button, EmptyState, SectionLabel } from "@/components/stopa/ui";
import { requireUser } from "@/lib/auth/guards";
import { getTranslations } from "@/lib/i18n";
import { getActiveQuest, getComparableQuests, getMySubmission } from "@/lib/stopa/data";

export const dynamic = "force-dynamic";

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ quest?: string }>;
}) {
  const user = await requireUser();
  const { t } = await getTranslations();
  await searchParams;

  const quest = await getActiveQuest();

  if (!quest) {
    return (
      <main>
        <SectionLabel>{t.submit.title}</SectionLabel>
        <EmptyState className="mt-4" title={t.home.noQuestTitle} body={t.home.noQuestBody} />
      </main>
    );
  }

  // The rules gate is enforced in the action too; this is the friendly half.
  if (!user.rulesAcceptedAt) {
    return (
      <main>
        <SectionLabel>{t.submit.title}</SectionLabel>
        <EmptyState
          className="mt-4"
          title={t.rewards.acceptRequired}
          body={t.rewards.rules}
          action={
            <Button asChild>
              <Link href="/rewards#rules">{t.profile.reviewRules}</Link>
            </Button>
          }
        />
      </main>
    );
  }

  const [mine, comparable] = await Promise.all([
    getMySubmission(user.id, quest.id),
    getComparableQuests(user.id),
  ]);

  if (mine) {
    return (
      <main>
        <SectionLabel>{t.submit.title}</SectionLabel>
        <EmptyState
          className="mt-4"
          title={t.submit.errors.duplicate}
          body={t.submit.successBody}
          action={
            <Button asChild variant="outline">
              <Link href="/home">{t.submit.backHome}</Link>
            </Button>
          }
        />
      </main>
    );
  }

  return (
    <main>
      <SectionLabel>{t.submit.title}</SectionLabel>
      <h1 className="mt-3 font-serif text-3xl">{quest.title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-moss">{t.submit.lede}</p>

      <div className="mt-7">
        <SubmitForm
          action={submitProofAction}
          questId={quest.id}
          questTitle={`${quest.location} · ${quest.region}`}
          comparableQuests={comparable}
          t={t}
        />
      </div>
    </main>
  );
}
