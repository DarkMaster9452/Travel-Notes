"use client";

import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { dismissNudgeAction } from "@/app/(app)/nudge-actions";
import { useT } from "@/components/i18n";
import { Button, ButtonLink } from "@/components/ui/button";

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
export function Nudge({
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
  const t = useT();
  const router = useRouter();
  const [gone, setGone] = useState(false);
  const [pending, start] = useTransition();

  if (gone) return null;

  return (
    <aside role="status" className="mb-6 flex flex-col gap-4 rounded-card bg-info-soft p-4 sm:flex-row sm:items-center">
      <span className="flex min-w-0 flex-1 items-start gap-3">
        <Mail className="mt-0.5 size-5 shrink-0 text-info" aria-hidden="true" />
        <span className="min-w-0">
          <b className="block text-body-sm font-semibold text-text">{title}</b>
          <span className="mt-1 block text-body-sm text-muted">{body}</span>
        </span>
      </span>
      <span className="flex shrink-0 flex-wrap gap-2">
        <ButtonLink href={href} size="sm">
          {action}
        </ButtonLink>
        <Button
          variant="ghost"
          size="sm"
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
          {t.nudge.notNow}
        </Button>
      </span>
    </aside>
  );
}
