import Link from "next/link";

import { Eyebrow, EmptyState, IconCompass, Panel, PanelHead, QuestArt, Tag } from "@/components/field";
import type { ProfileActivity } from "@/lib/profile";
import { formatDate, formatDuration } from "@/lib/utils";

/**
 * The feed: what somebody has actually been doing.
 *
 * Approved logs only. A pending one is a claim nobody has checked and a
 * declined one is a claim that did not hold up — neither belongs on a page
 * whose entire purpose is to be believed by a stranger deciding whether to
 * spend a Saturday with you.
 *
 * Photographs are shown as the person filed them: whatever they linked, in the
 * order they added it. The first is given the room, the rest sit under it,
 * because a log is usually one photograph that matters and several that are
 * evidence.
 */
export function ProfileFeed({
  activities,
  name,
}: {
  activities: ProfileActivity[];
  name: string;
}) {
  if (activities.length === 0) {
    return (
      <Panel flush>
        <PanelHead title="Logged" />
        <EmptyState icon={<IconCompass />} title="Nothing here yet.">
          {name} has not had a log approved yet — or has chosen not to show them. Either way there
          is nothing to see, which is not the same as nothing having happened.
        </EmptyState>
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Eyebrow>Logged · {activities.length}</Eyebrow>

      {activities.map((activity) => (
        <article key={activity.id} className="feed-item">
          <div className="feed-head">
            <QuestArt seed={activity.questId} tags={activity.tags} className="feed-art" />
            <div className="feed-head-body">
              <span className="feed-when">{formatDate(activity.loggedAt)}</span>
              <h3>
                <Link href={`/quests/${activity.questId}`}>{activity.title}</Link>
              </h3>
              <p className="feed-where">
                {activity.location} · {activity.region}
              </p>
            </div>
            {activity.retreated && <Tag tone="ghost">Turned back</Tag>}
          </div>

          {(activity.distance != null ||
            activity.elevation != null ||
            activity.movingTime != null) && (
            <ul className="feed-figures">
              {activity.distance != null && (
                <li>
                  <b>{activity.distance.toFixed(1)}</b>
                  <span>km</span>
                </li>
              )}
              {activity.elevation != null && (
                <li>
                  <b>{activity.elevation}</b>
                  <span>m up</span>
                </li>
              )}
              {activity.movingTime != null && (
                <li>
                  <b>{formatDuration(activity.movingTime)}</b>
                  <span>moving</span>
                </li>
              )}
            </ul>
          )}

          <p className="feed-note">{activity.note}</p>

          {activity.photos.length > 0 && (
            <div className={`feed-photos count-${Math.min(activity.photos.length, 4)}`}>
              {activity.photos.slice(0, 4).map((photo, index) => (
                // An arbitrary host somebody pasted, not a build-time known
                // domain, so `next/image` has nothing to optimise it against.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={photo}
                  src={photo}
                  alt={index === 0 ? `${activity.title}, photographed by ${name}` : ""}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
