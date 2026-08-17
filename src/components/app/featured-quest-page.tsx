import Link from "next/link";

import { ProgressBar, Reveal } from "@/components/app/motion";
import { stagger } from "@/lib/motion";
import { QuestSheet } from "@/components/app/quest-sheet";
import { EmptyState, Eyebrow, IconLock, Panel, PanelHead, Tag } from "@/components/field";
import type { FeaturedQuest } from "@/lib/quest/featured";
import { formatDate } from "@/lib/utils";

/**
 * The shared weekly and monthly quest.
 *
 * Both periods render identically because they are the same idea at two
 * cadences: one quest, the same one for everybody, with a window that closes.
 * The counters are what make it shared — you are looking at the same document
 * as everyone else, and at how many of them have logged it.
 */
export function FeaturedQuestPage({
  featured,
  label,
  eyebrow,
  closesAt,
  blurb,
  /** Accepted and logged across the whole community. */
  counters,
}: {
  featured: FeaturedQuest | null;
  label: string;
  eyebrow: string;
  closesAt: Date;
  blurb: string;
  counters?: { accepted: number; logged: number };
}) {
  if (!featured) {
    return (
      <>
        <Reveal as="header" className="page-head">
          <div>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1>{label}</h1>
          </div>
        </Reveal>
        <Reveal delay={stagger(0)}>
          <EmptyState
            icon={<IconLock />}
            title="Nothing placed for this period."
            action={
              <Link href="/profile" className="btn btn-ghost">
                Open settings
              </Link>
            }
          >
            We couldn&apos;t place one inside your current range and difficulty. Widen either in
            settings and it turns up here.
          </EmptyState>
        </Reveal>
      </>
    );
  }

  const share = counters && counters.accepted > 0 ? counters.logged / counters.accepted : 0;

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1>{featured.summary.title}</h1>
          <p>{blurb}</p>
        </div>
        <Tag tone="ghost">Closes {formatDate(closesAt)}</Tag>
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <Reveal delay={stagger(0)}>
          <QuestSheet quest={featured.summary} issuedAt={label} seal={null} />
        </Reveal>

        <div className="flex flex-col gap-5">
          {counters && (
            <Reveal delay={stagger(1)}>
              <Panel flush>
                <PanelHead title="Everyone else" aside={<Tag>Shared</Tag>} />
                <div className="px-5 py-5">
                  <p className="font-mono text-[12px] text-ink-2">
                    <b className="text-ink">{counters.accepted}</b> accepted ·{" "}
                    <b className="text-ink">{counters.logged}</b> logged
                  </p>
                  <ProgressBar
                    value={share}
                    label="Share of accepted quests that have been logged"
                    className="mt-3 w-full"
                  />
                  <p className="note">
                    The same objective, the same window, the same bonus — for every member.
                  </p>
                </div>
              </Panel>
            </Reveal>
          )}

          <Reveal delay={stagger(2)}>
            <Panel flush>
              <PanelHead title="How it works" />
              <ul className="flex flex-col gap-3 px-5 py-5">
                {[
                  ["MON", "The weekly drops at 06:00."],
                  ["SUN", "The log closes at 23:59."],
                  ["1st", "The monthly opens — the big one."],
                ].map(([key, text]) => (
                  <li key={key} className="flex items-baseline gap-3">
                    <span className="meta w-9 shrink-0 text-moss-2">{key}</span>
                    <span className="text-[14.5px] text-ink-2">{text}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </Reveal>
        </div>
      </div>
    </>
  );
}
