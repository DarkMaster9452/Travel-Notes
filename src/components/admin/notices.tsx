import Link from "next/link";

import {
  IconAlert,
  IconArrowRight,
  IconCheck,
  IconClock,
  IconDot,
  type IconProps,
} from "@/components/field";
import type { AdminNotice, NoticeTone } from "@/lib/admin/notifications";
import { cn } from "@/lib/utils";

/**
 * How the panel's notices look.
 *
 * Kept apart from where they are *computed* and from the bell that opens them,
 * because the same list renders in two places — inside the notification
 * dropdown and as a block at the top of the overview — and they have to be the
 * same list, not two designs of one idea.
 *
 * Deliberately not a client component: it holds no state, so on the overview it
 * renders on the server, and inside the dropdown it is simply part of that
 * client component's tree.
 */

/**
 * The four tones, spelled out.
 *
 * Colour is only ever half of it: each tone also carries its own icon and its
 * own uppercase label, so the difference between "deal with this now" and "for
 * your information" survives a monochrome screen, a colour-blind reader, and a
 * glance too quick to register hue at all.
 */
export const TONE: Record<
  NoticeTone,
  { label: string; icon: React.ComponentType<IconProps>; description: string }
> = {
  critical: { label: "Urgent", icon: IconAlert, description: "Something is broken now" },
  warning: { label: "Soon", icon: IconClock, description: "Breaks shortly if left" },
  info: { label: "Note", icon: IconDot, description: "Worth knowing, not urgent" },
  clear: { label: "Clear", icon: IconCheck, description: "Nothing to do" },
};

export function NoticeBadge({ tone }: { tone: NoticeTone }) {
  const Icon = TONE[tone].icon;
  return (
    <span className={cn("notice-badge", `notice-${tone}`)}>
      <Icon className="notice-badge-icon" />
      {TONE[tone].label}
    </span>
  );
}

/**
 * One notice: what is true, what to do, and the way to go and do it.
 *
 * The action is a link rather than a button, because every one of these is
 * fixed on a page that already exists — the notice's job is to be the shortest
 * path to that page, not to grow its own controls.
 */
export function NoticeRow({ notice }: { notice: AdminNotice }) {
  return (
    <li className={cn("notice", `notice-${notice.tone}`)}>
      <div className="notice-line">
        <NoticeBadge tone={notice.tone} />
        {notice.count !== undefined && <span className="notice-count">{notice.count}</span>}
      </div>
      <p className="notice-title">{notice.title}</p>
      <p className="notice-detail">{notice.detail}</p>
      <Link href={notice.href} className="notice-action">
        {notice.action}
        <IconArrowRight width={13} height={13} />
      </Link>
    </li>
  );
}

/**
 * The whole list, or the sentence that says there isn't one.
 *
 * An empty state that says "nothing needs attention" is load-bearing rather
 * than decorative: without it, an empty notice area is indistinguishable from
 * a notice area that failed to load, and the difference between those two is
 * the difference between a calm panel and an unnoticed outage.
 */
export function NoticeList({
  notices,
  className,
}: {
  notices: AdminNotice[];
  className?: string;
}) {
  if (notices.length === 0) {
    return (
      <div className={cn("notice-empty", className)}>
        <NoticeBadge tone="clear" />
        <p>
          Nothing needs attention. The calendar is booked ahead, the queue is current, and billing
          is clean.
        </p>
      </div>
    );
  }

  return (
    <ul className={cn("notice-list", className)}>
      {notices.map((notice) => (
        <NoticeRow key={notice.id} notice={notice} />
      ))}
    </ul>
  );
}

/** How many of these are the loud kind — the number the bell carries. */
export function urgentCount(notices: AdminNotice[]): number {
  return notices.filter((notice) => notice.tone === "critical" || notice.tone === "warning").length;
}
