"use client";

import * as React from "react";
import { useActionState } from "react";

import { addCommentAction, toggleReactionAction } from "@/app/(app)/actions";
import { Button, Marker, Spinner } from "@/components/stopa/ui";
import { CATEGORIES, REACTIONS, type QuestCategoryId } from "@/lib/gamification";
import type { Dictionary } from "@/lib/i18n/dictionaries/sk";
import { cn } from "@/lib/utils";

export type FeedEntry = {
  id: string;
  photo: string;
  caption: string | null;
  difficulty: string;
  createdAt: string;
  adminNote: string | null;
  adminNotePublic: boolean;
  user: { id: string; name: string };
  quest: { id: string; title: string; category: QuestCategoryId; location: string };
  reactions: Array<{ emoji: string; userId: string }>;
  comments: Array<{
    id: string;
    body: string;
    createdAt: string;
    user: { id: string; name: string; role: string };
  }>;
};

export function Feed({
  entries,
  currentUserId,
  t,
}: {
  entries: FeedEntry[];
  currentUserId: string;
  t: Dictionary;
}) {
  return (
    <ul className="space-y-4">
      {entries.map((entry) => (
        <FeedCard key={entry.id} entry={entry} currentUserId={currentUserId} t={t} />
      ))}
    </ul>
  );
}

function FeedCard({
  entry,
  currentUserId,
  t,
}: {
  entry: FeedEntry;
  currentUserId: string;
  t: Dictionary;
}) {
  const [showComments, setShowComments] = React.useState(false);

  return (
    <li className="card-solid overflow-hidden p-0">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <Marker color={CATEGORIES[entry.quest.category].marker} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-lg">{entry.user.name}</p>
          <p className="truncate text-xs text-moss">
            {entry.quest.title} · {entry.quest.location}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-cream/25 px-2.5 py-1 text-[0.6875rem] text-cream/80">
          {t.difficulty[entry.difficulty as keyof typeof t.difficulty]}
        </span>
      </div>

      {/* Submitted photos are user content of unknown dimensions; a plain img
          with a fixed aspect keeps the feed rhythm without a layout shift. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={entry.photo}
        alt={`${entry.quest.title} — ${entry.user.name}`}
        className="aspect-[4/3] w-full bg-forest-deep object-cover"
        loading="lazy"
      />

      <div className="px-4 py-3.5">
        {entry.caption && <p className="font-serif text-base leading-relaxed">{entry.caption}</p>}

        {entry.adminNote && entry.adminNotePublic && (
          <p className="mt-3 rounded-[10px] border-l-2 border-amber bg-amber/10 px-3 py-2 text-sm">
            <span className="block text-xs uppercase tracking-[0.12em] text-amber">
              {t.home.adminReply}
            </span>
            <span className="mt-1 block text-cream/90">{entry.adminNote}</span>
          </p>
        )}

        <Reactions entry={entry} currentUserId={currentUserId} />

        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="mt-3 text-sm text-moss hover:text-cream"
        >
          {t.home.comments} ({entry.comments.length})
        </button>

        {showComments && <Comments entry={entry} t={t} />}
      </div>
    </li>
  );
}

function Reactions({ entry, currentUserId }: { entry: FeedEntry; currentUserId: string }) {
  const [pending, startTransition] = React.useTransition();
  const [optimistic, setOptimistic] = React.useState(entry.reactions);

  const react = (emoji: string) => {
    const mine = optimistic.some((r) => r.emoji === emoji && r.userId === currentUserId);
    setOptimistic((prev) =>
      mine
        ? prev.filter((r) => !(r.emoji === emoji && r.userId === currentUserId))
        : [...prev, { emoji, userId: currentUserId }],
    );
    startTransition(async () => {
      await toggleReactionAction(entry.id, emoji);
    });
  };

  return (
    <div className={cn("mt-3 flex flex-wrap gap-2", pending && "opacity-70")}>
      {REACTIONS.map((emoji) => {
        const count = optimistic.filter((r) => r.emoji === emoji).length;
        const mine = optimistic.some((r) => r.emoji === emoji && r.userId === currentUserId);
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => react(emoji)}
            aria-pressed={mine}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
              mine ? "border-amber bg-amber/15 text-cream" : "border-cream/20 text-cream/75 hover:border-cream/50",
            )}
          >
            <span aria-hidden="true">{emoji}</span>
            {count > 0 && <span className="tabular-nums">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

function Comments({ entry, t }: { entry: FeedEntry; t: Dictionary }) {
  const [state, formAction, pending] = useActionState(addCommentAction, undefined);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (!pending && !state?.error) formRef.current?.reset();
  }, [pending, state]);

  return (
    <div className="mt-3 border-t border-cream/12 pt-3">
      <ul className="space-y-2.5">
        {entry.comments.map((comment) => (
          <li key={comment.id} className="text-sm">
            <span className={cn("font-serif", comment.user.role === "ADMIN" ? "text-amber" : "text-cream")}>
              {comment.user.name}
            </span>{" "}
            <span className="text-cream/80">{comment.body}</span>
          </li>
        ))}
      </ul>

      <form ref={formRef} action={formAction} className="mt-3 flex gap-2">
        <input type="hidden" name="submissionId" value={entry.id} />
        <input
          name="body"
          maxLength={400}
          required
          placeholder={t.home.addComment}
          aria-label={t.home.addComment}
          className="h-10 min-w-0 flex-1 rounded-[10px] border border-cream/20 bg-transparent px-3 text-sm text-cream placeholder:text-moss/70 focus:border-amber focus:outline-none"
        />
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? <Spinner /> : t.home.send}
        </Button>
      </form>
    </div>
  );
}
