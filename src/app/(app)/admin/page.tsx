import { createQuestAction, reviewSubmissionAction } from "@/app/(app)/admin/actions";
import { CreateQuestForm, ReviewCard, type PendingItem } from "@/components/stopa/admin-forms";
import { Card, EmptyState, Marker, SectionLabel } from "@/components/stopa/ui";
import { requireAdmin } from "@/lib/auth/guards";
import { CATEGORIES, nextMondayRelease, weekCloseFor, type QuestCategoryId } from "@/lib/gamification";
import { fill, getTranslations } from "@/lib/i18n";
import { LOCATIONS } from "@/lib/quest/locations";
import { LOCATIONS_SK } from "@/lib/quest/locations.sk";
import { getAllQuests, getPendingSubmissions } from "@/lib/stopa/data";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** `datetime-local` wants "YYYY-MM-DDTHH:mm" in local time. */
function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Category a catalogue entry best fits, from its feature tags. */
function categoryFor(features: string[]): QuestCategoryId {
  if (features.includes("waterfall")) return "WATERFALL";
  if (features.includes("castle") || features.includes("ruins")) return "CASTLE";
  if (features.includes("summit") || features.includes("viewpoint")) return "SUMMIT";
  return "MICRO";
}

export default async function AdminPage() {
  await requireAdmin();
  const { t, locale } = await getTranslations();

  const [pending, quests] = await Promise.all([getPendingSubmissions(), getAllQuests(12)]);

  const release = nextMondayRelease();
  const defaults = {
    publishedAt: toLocalInput(release),
    closesAt: toLocalInput(weekCloseFor(release)),
  };

  // Reuse the curated location catalogue as a starting point for new quests.
  const suggestions = LOCATIONS.map((entry) => ({
    title: LOCATIONS_SK[entry.id]?.name ?? entry.name,
    location: LOCATIONS_SK[entry.id]?.name ?? entry.name,
    region: entry.region,
    category: categoryFor(entry.features),
  }));

  const items: PendingItem[] = pending.map((submission) => ({
    id: submission.id,
    photo: submission.photo,
    caption: submission.caption,
    difficulty: submission.difficulty,
    createdAt: submission.createdAt.toISOString(),
    user: { name: submission.user.name, email: submission.user.email },
    quest: {
      title: submission.quest.title,
      points: submission.quest.points,
      category: submission.quest.category as QuestCategoryId,
    },
  }));

  return (
    <main className="space-y-9">
      <section>
        <SectionLabel>
          {t.admin.pending} ({items.length})
        </SectionLabel>
        {items.length > 0 ? (
          <ul className="mt-3 space-y-4">
            {items.map((item) => (
              <ReviewCard key={item.id} item={item} action={reviewSubmissionAction} t={t} />
            ))}
          </ul>
        ) : (
          <EmptyState className="mt-3" title={t.admin.noPending} body={t.admin.title} />
        )}
      </section>

      <section>
        <SectionLabel>{t.admin.createQuest}</SectionLabel>
        <Card solid className="mt-3">
          <CreateQuestForm
            action={createQuestAction}
            t={t}
            defaults={defaults}
            suggestions={suggestions}
          />
        </Card>
      </section>

      <section>
        <SectionLabel>{t.admin.allQuests}</SectionLabel>
        <ul className="mt-3 space-y-2.5">
          {quests.map((quest) => (
            <li
              key={quest.id}
              className="flex items-center gap-3.5 rounded-[12px] border border-cream/15 bg-forest-card px-4 py-3"
            >
              <Marker color={CATEGORIES[quest.category as QuestCategoryId].marker} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-lg">{quest.title}</p>
                <p className="truncate text-xs text-moss">
                  {formatDate(quest.publishedAt, locale)} ·{" "}
                  {fill(t.admin.submissionsCount, { count: quest._count.submissions })}
                </p>
              </div>
              <span className="shrink-0 font-serif tabular-nums text-cream/80">{quest.points}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
