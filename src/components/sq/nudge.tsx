"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { dismissNudgeAction } from "@/app/(app)/nudge-actions";
import { Glyph } from "@/components/sq/icons";

/**
 * The ask that waited.
 *
 * One notice at the top of the page, never a modal: it arrives a day after
 * something good happened and it has no business interrupting whatever the
 * member came here to do. It states the consequence of ignoring it, because a
 * "not now" button is only honest if the person pressing it knows what they
 * are choosing — here, an email instead of an envelope.
 *
 * Dismissing is permanent. The notice does not come back on the next page load
 * wearing a different sentence.
 */
export function SqNudge({
  kind,
  title,
  body,
  action,
  href,
}: {
  kind: string;
  title: string;
  body: string;
  action: string;
  href: string;
}) {
  const router = useRouter();
  const [gone, setGone] = useState(false);
  const [pending, start] = useTransition();

  if (gone) return null;

  return (
    <aside className="sq-nudge" role="status">
      <span className="sq-nudge-mark" aria-hidden>
        <Glyph name="envelope" size={16} strokeWidth={1.9} />
      </span>

      <span className="sq-nudge-body">
        <b>{title}</b>
        <span>{body}</span>
      </span>

      <span className="sq-nudge-actions">
        <Link href={href} className="sq-btn sq-btn-primary sq-btn-sm">
          {action}
        </Link>
        <button
          type="button"
          className="sq-btn sq-btn-ghost sq-btn-sm"
          disabled={pending}
          onClick={() => {
            // Hidden first, written second. The answer to "not now" should be
            // instant; whether the row updated is not something to wait on.
            setGone(true);
            start(async () => {
              await dismissNudgeAction(kind);
              router.refresh();
            });
          }}
        >
          Not now
        </button>
      </span>
    </aside>
  );
}
