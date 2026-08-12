import { Feed, type FeedEntry } from "@/components/stopa/feed";
import { QuestCard, TrailRow, type MySubmissionState } from "@/components/stopa/quest-card";
import { EmptyState, SectionLabel } from "@/components/stopa/ui";
import { requireUser } from "@/lib/auth/guards";
import type { QuestCategoryId } from "@/lib/gamification";
import { getTranslations } from "@/lib/i18n";
import {
  getActiveQuest,
  getFeed,
  getMySubmission,
  getMySubmissions,
  getQuestDifficulty,
} from "@/lib/stopa/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await requireUser();
  const { t } = await getTranslations();

  const quest = await getActiveQuest();

  const [mine, difficulty, trails, feed] = await Promise.all([
    quest ? getMySubmission(user.id, quest.id) : Promise.resolve(null),
    quest ? getQuestDifficulty(quest.id) : Promise.resolve(null),
    getMySubmissions(user.id, 5),
    getFeed(10),
  ]);

  const submissionState: MySubmissionState = mine
    ? mine.status === "APPROVED"
      ? { status: "APPROVED", points: mine.pointsAwarded }
      : mine.status === "REJECTED"
        ? { status: "REJECTED", note: mine.adminNote }
        : { status: "PENDING" }
    : null;

  const feedEntries: FeedEntry[] = feed.map((entry) => ({
    id: entry.id,
    photo: entry.photo,
    caption: entry.caption,
    difficulty: entry.difficulty,
    createdAt: entry.createdAt.toISOString(),
    adminNote: entry.adminNote,
    adminNotePublic: entry.adminNotePublic,
    user: entry.user,
    quest: {
      id: entry.quest.id,
      title: entry.quest.title,
      category: entry.quest.category as QuestCategoryId,
      location: entry.quest.location,
    },
    reactions: entry.reactions,
    comments: entry.comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      user: comment.user,
    })),
  }));

  return (
    <main className="space-y-9">
      <section>
        <SectionLabel>{t.home.weeklyChallenge}</SectionLabel>
        <div className="mt-3 animate-rise">
          {quest ? (
            <QuestCard
              quest={{
                id: quest.id,
                title: quest.title,
                location: quest.location,
                region: quest.region,
                description: quest.description,
                category: quest.category as QuestCategoryId,
                points: quest.points,
                closesAt: quest.closesAt,
              }}
              t={t}
              submission={submissionState}
              difficulty={difficulty}
            />
          ) : (
            <EmptyState title={t.home.noQuestTitle} body={t.home.noQuestBody} />
          )}
        </div>
      </section>

      <section>
        <SectionLabel>{t.home.yourTrails}</SectionLabel>
        {trails.length > 0 ? (
          <ul className="mt-3 space-y-2.5">
            {trails.map((trail) => (
              <TrailRow
                key={trail.id}
                title={trail.quest.title}
                points={trail.pointsAwarded}
                category={trail.quest.category as QuestCategoryId}
                status={trail.status}
                t={t}
              />
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-moss">{t.home.noTrails}</p>
        )}
      </section>

      <section>
        <SectionLabel>{t.home.feed}</SectionLabel>
        <div className="mt-3">
          {feedEntries.length > 0 ? (
            <Feed entries={feedEntries} currentUserId={user.id} t={t} />
          ) : (
            <p className="text-sm text-moss">{t.home.feedEmpty}</p>
          )}
        </div>
      </section>
    </main>
  );
}
