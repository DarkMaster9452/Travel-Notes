import type { Metadata } from "next";
import Link from "next/link";

import { IssueQuestButton } from "@/components/app/issue-quest";
import { CountUp, Reveal } from "@/components/app/motion";
import { stagger } from "@/lib/motion";
import { questDocumentId } from "@/components/app/quest-sheet";
import { EmptyState, Eyebrow, IconLock, Panel, Tag } from "@/components/field";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getUserStats } from "@/lib/quest/service";
import { formatDate, formatDuration } from "@/lib/utils";

export const metadata: Metadata = { title: "History" };

/**
 * Everything this account has been issued.
 *
 * A ledger, not a gallery: one line per quest, newest first. The point of the
 * page is that it is the record of what has already been sent, which is what
 * makes "never the same one twice" mean anything.
 */
export default async function HistoryPage() {
  const user = await requireClient();

  const [entries, stats] = await Promise.all([
    db.questHistory.findMany({
      where: { userId: user.id },
      orderBy: { generatedAt: "desc" },
      include: { quest: true },
      take: 100,
    }),
    getUserStats(user.id),
  ]);

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>The record</Eyebrow>
          <h1>Where you&apos;ve been sent.</h1>
          <p>
            Every quest this account has been issued. Logged ones are retired — they never come
            back.
          </p>
        </div>
      </Reveal>

      <Reveal delay={stagger(0)} className="mb-5">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-4">
          <Figure label="Issued" value={entries.length} />
          <Figure label="Logged" value={stats.completedCount} />
          <Figure label="Kilometres" value={Math.round(stats.kmExplored)} />
          <Figure label="Metres up" value={Math.round(stats.elevation)} />
        </dl>
      </Reveal>

      {entries.length === 0 ? (
        <Reveal delay={stagger(1)}>
          <EmptyState icon={<IconLock />} title="Nothing here yet." action={<IssueQuestButton />}>
            Your history fills up one morning at a time. Take a quest and it lands here the moment
            you log it.
          </EmptyState>
        </Reveal>
      ) : (
        <Panel flush>
          <ul>
            {entries.map((entry, index) => (
              <Reveal
                as="li"
                key={entry.id}
                delay={stagger(index, 8)}
                className="border-b border-line last:border-b-0"
              >
                <Link
                  href={`/quests/${entry.quest.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-ink/[.03]"
                >
                  <span className="qc-id w-[122px] shrink-0">
                    {questDocumentId(entry.quest.number)}
                  </span>

                  <span className="min-w-[min(100%,16rem)] flex-1">
                    <b className="block font-serif text-[17px] font-semibold tracking-[-0.02em]">
                      {entry.quest.title}
                    </b>
                    <span className="meta mt-1 block normal-case tracking-[0.06em]">
                      {entry.quest.location} · {entry.quest.region}
                    </span>
                  </span>

                  <span className="flex shrink-0 items-center gap-4 font-mono text-[11px] text-ink-2">
                    <span>{entry.quest.distance.toFixed(1)} km</span>
                    <span>{Math.round(entry.quest.elevationGain)} m ↑</span>
                    <span className="hidden sm:inline">{formatDuration(entry.quest.duration)}</span>
                  </span>

                  <span className="flex shrink-0 items-center gap-3">
                    <span className="meta hidden md:inline">
                      {formatDate(entry.completedAt ?? entry.generatedAt)}
                    </span>
                    <Tag tone={entry.completed ? "pine" : "ghost"}>
                      {entry.completed ? "Logged" : "Open"}
                    </Tag>
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card px-5 py-4">
      <dt className="meta">{label}</dt>
      <dd className="mt-1 font-mono text-[22px] font-bold tracking-[-0.02em]">
        <CountUp value={value} />
      </dd>
    </div>
  );
}
