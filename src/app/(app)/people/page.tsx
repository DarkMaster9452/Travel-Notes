import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/app/motion";
import {
  Avatar,
  EmptyState,
  Eyebrow,
  IconUsers,
  QuestArt,
} from "@/components/field";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { stagger } from "@/lib/motion";
import { getDirectory } from "@/lib/profile";

export const metadata: Metadata = {
  title: "People",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/**
 * Who else is out there.
 *
 * Only accounts that have published a page. This is not a member list and it
 * is not searchable from outside: somebody who has not published one is not
 * here at all, and nothing on this page confirms whether they have an account.
 *
 * Ordered by what people have logged rather than by when they joined, because
 * the question being asked here is "who might I walk with" and an empty page
 * does not answer it.
 */
export default async function PeoplePage() {
  const user = await requireClient();
  const [people, mine] = await Promise.all([
    getDirectory(),
    db.profile.findUnique({
      where: { userId: user.id },
      select: { handle: true, published: true },
    }),
  ]);

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>Who else is out there</Eyebrow>
          <h1>People.</h1>
          <p>
            Everybody who has published a page. Nobody is here who has not chosen to be, and
            nothing here says whether anyone else has an account.
          </p>
        </div>
        <Link
          href="/profile/public"
          className={mine?.published ? "btn btn-ghost btn-sm" : "btn btn-primary btn-sm"}
        >
          {mine?.published ? "Edit your page" : "Publish yours"}
        </Link>
      </Reveal>

      {people.length === 0 ? (
        <Reveal delay={stagger(0)}>
          <EmptyState
            icon={<IconUsers />}
            title="Nobody yet."
            action={
              <Link href="/profile/public" className="btn btn-primary btn-sm">
                Be the first
              </Link>
            }
          >
            No pages have been published. Yours would be the one everybody else finds.
          </EmptyState>
        </Reveal>
      ) : (
        <ul className="people-grid">
          {people.map((person, index) => (
            <Reveal as="li" key={person.handle} delay={stagger(index, 6)}>
              <Link
                href={`/people/${person.handle}`}
                className="person-card"
                data-accent={person.accent.toLowerCase()}
              >
                <QuestArt
                  seed={`profile:${person.handle}`}
                  variant="band"
                  className="person-band"
                />
                <Avatar name={person.name} className="person-avatar" />
                <b>{person.name}</b>
                {person.headline && <em>{person.headline}</em>}
                <span className="person-foot">
                  {person.country && <i>{person.country}</i>}
                  <i>
                    {person.logged} {person.logged === 1 ? "quest" : "quests"} logged
                  </i>
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      )}
    </>
  );
}
