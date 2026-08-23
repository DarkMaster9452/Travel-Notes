"use client";

import { animate, utils } from "animejs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as React from "react";

import { reviewSubmissionAction } from "@/app/admin/actions";
import {
  Avatar,
  EmptyState,
  IconApproved,
  IconClose,
  IconStrava,
  Modal,
  Tag,
  useToast,
} from "@/components/field";
import { unstyle, usePrefersReducedMotion } from "@/components/motion/anime";
import { EASE_FIELD } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/lib/utils";

/**
 * The review deck.
 *
 * One submission at a time, as a card you throw to a side: right approves,
 * left declines. Nothing else is on screen, because the decision is binary and
 * a list view invites skimming — the point of reviewing proof is that somebody
 * actually looked at it.
 *
 * Three ways to answer the same question, because reviewing fifty of these by
 * mouse is miserable: drag the card, press the buttons, or use the arrow keys.
 *
 * The two moments that are not a drag are animated with anime.js, because both
 * are about weight: a card released short of the commit line springs back into
 * the deck rather than gliding back, so an accidental nudge is unmistakably not
 * a verdict; and the next submission is dealt onto the pile rather than
 * appearing, so a reviewer can see that the queue moved on.
 */

export type ReviewCard = {
  id: string;
  note: string;
  photos: string[];
  stravaUrl: string | null;
  retreated: boolean;
  createdAt: string;
  /** What the watch recorded. Null where they didn't attach anything. */
  actual: { distance: number | null; elevation: number | null; movingTime: number | null };
  /** What the quest asked for, to diff against. */
  target: { distance: number; elevation: number; movingTime: number };
  quest: { title: string; location: string; region: string; difficulty: string; number: number | null };
  person: { name: string; initials: string };
  plan: "ULTRA" | "EXPLORER" | "FREE";
  /** Filed against a weekly or monthly slot. These are dealt first. */
  cadence: { period: "WEEKLY" | "MONTHLY"; slotKey: string; label: string } | null;
};

const PLAN_LABEL: Record<ReviewCard["plan"], string> = {
  ULTRA: "Ultra",
  EXPLORER: "Explorer",
  FREE: "Free",
};

/** Past this much disagreement between claimed and asked-for, say so. */
const FLAG_RATIO = 0.3;
/** How far the card must travel before letting go counts as a verdict. */
const COMMIT_PX = 110;

export function ReviewDeck({ cards }: { cards: ReviewCard[] }) {
  const router = useRouter();
  const toast = useToast();

  const [queue, setQueue] = React.useState(cards);
  const [leaving, setLeaving] = React.useState<"approve" | "decline" | null>(null);
  const [drag, setDrag] = React.useState(0);
  const [pending, setPending] = React.useState(false);
  const [done, setDone] = React.useState({ approved: 0, declined: 0 });
  const [browseOpen, setBrowseOpen] = React.useState(false);

  const current = queue[0];
  const cardRef = React.useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const dragging = React.useRef(false);
  const startX = React.useRef(0);
  // Mirrors `dragging.current` into render-safe state — a ref can be read in
  // an event handler but not in the JSX below, which runs during render.
  const [isDragging, setIsDragging] = React.useState(false);
  // True while anime.js is driving the card home, which is also when the CSS
  // transition has to stay out of the way: two things easing the same transform
  // is what makes a spring look like a stutter.
  const [springing, setSpringing] = React.useState(false);

  /** Let go of the card short of a verdict: it springs back into the deck. */
  const springBack = React.useCallback(
    (from: number) => {
      if (reduced || from === 0) {
        setDrag(0);
        return;
      }
      const held = { x: from };
      setSpringing(true);
      animate(held, {
        x: 0,
        duration: 620,
        ease: "outElastic(1, .6)",
        onUpdate: () => setDrag(held.x),
        onComplete: () => {
          setDrag(0);
          setSpringing(false);
        },
      });
    },
    [reduced],
  );

  // Each new submission is dealt onto the pile.
  React.useEffect(() => {
    const card = cardRef.current;
    if (reduced || !card || !current) return;

    // Opacity only, deliberately: this element's `transform` is the drag
    // position, written on every render from React state, so an animation that
    // also wrote transform would be overwritten mid-flight by the first render
    // — and would fight the throw if a reviewer grabbed the card immediately.
    utils.set(card, { opacity: 0 });
    const dealt = animate(card, {
      opacity: [0, 1],
      duration: 380,
      ease: EASE_FIELD,
      onComplete: () => unstyle(card, ["opacity"]),
    });

    return () => {
      dealt.pause();
      unstyle(card, ["opacity"]);
    };
  }, [current?.id, current, reduced]);

  /** Bring a chosen submission to the front of the queue without losing the rest. */
  const jumpTo = React.useCallback((id: string) => {
    setQueue((rest) => {
      const target = rest.find((card) => card.id === id);
      if (!target) return rest;
      return [target, ...rest.filter((card) => card.id !== id)];
    });
    setDrag(0);
    setBrowseOpen(false);
  }, []);

  const decide = React.useCallback(
    async (approve: boolean) => {
      if (!current || pending) return;
      setPending(true);
      setLeaving(approve ? "approve" : "decline");

      const result = await reviewSubmissionAction({
        submissionId: current.id,
        approve,
      }).catch(() => null);

      if (!result?.ok) {
        // Put the card back rather than silently dropping a decision.
        setLeaving(null);
        setDrag(0);
        setPending(false);
        toast({
          title: "That didn't save.",
          detail: result?.message ?? "Try again in a moment.",
          tone: "warm",
        });
        return;
      }

      // Let the card finish leaving before the next one takes its place.
      window.setTimeout(() => {
        setQueue((rest) => rest.slice(1));
        setDone((count) => ({
          approved: count.approved + (approve ? 1 : 0),
          declined: count.declined + (approve ? 0 : 1),
        }));
        setLeaving(null);
        setDrag(0);
        setPending(false);
        router.refresh();
      }, 240);
    },
    [current, pending, router, toast],
  );

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") decide(true);
      if (event.key === "ArrowLeft") decide(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide]);

  const browseList = (
    <BrowseQueue
      open={browseOpen}
      onClose={() => setBrowseOpen(false)}
      cards={queue}
      currentId={current?.id ?? null}
      onPick={jumpTo}
    />
  );

  if (!current) {
    return (
      <EmptyState
        icon={<IconApproved width={40} height={40} />}
        title={done.approved + done.declined > 0 ? "Queue cleared." : "Nothing waiting."}
      >
        {done.approved + done.declined > 0
          ? `${done.approved} approved, ${done.declined} declined. Go outside.`
          : "No submissions are pending review. They land here the moment somebody files proof."}
      </EmptyState>
    );
  }

  const offset = leaving === "approve" ? 620 : leaving === "decline" ? -620 : drag;
  const verdict = offset > COMMIT_PX ? "approve" : offset < -COMMIT_PX ? "decline" : null;

  return (
    <div className="review-deck">
      <div className="review-toolbar">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setBrowseOpen(true)}>
          Choose from queue · {queue.length}
        </button>
      </div>
      {browseList}

      <div
        ref={cardRef}
        className={cn("review-card", leaving && "leaving")}
        style={{
          transform: `translateX(${offset}px) rotate(${offset * 0.04}deg)`,
          transition: isDragging || springing ? "none" : "transform .24s var(--ease-field)",
        }}
        onPointerDown={(event) => {
          if (pending) return;
          dragging.current = true;
          setIsDragging(true);
          startX.current = event.clientX;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!dragging.current) return;
          setDrag(event.clientX - startX.current);
        }}
        onPointerUp={() => {
          if (!dragging.current) return;
          dragging.current = false;
          setIsDragging(false);
          if (drag > COMMIT_PX) decide(true);
          else if (drag < -COMMIT_PX) decide(false);
          else springBack(drag);
        }}
      >
        {/* The stamps fade in as the card is thrown, so the verdict is legible
            before you let go of it. */}
        <span
          className="review-stamp approve"
          style={{ opacity: Math.max(0, Math.min(1, offset / COMMIT_PX)) }}
          aria-hidden="true"
        >
          Approve
        </span>
        <span
          className="review-stamp decline"
          style={{ opacity: Math.max(0, Math.min(1, -offset / COMMIT_PX)) }}
          aria-hidden="true"
        >
          Decline
        </span>

        <SubmissionBody card={current} />
      </div>

      <div className="review-actions">
        <button
          type="button"
          className="review-btn decline"
          onClick={() => decide(false)}
          disabled={pending}
          aria-label="Decline"
        >
          <IconClose width={20} height={20} />
        </button>

        <div className="review-count">
          <b>{queue.length}</b>
          <span>waiting</span>
        </div>

        <button
          type="button"
          className="review-btn approve"
          onClick={() => decide(true)}
          disabled={pending}
          aria-label="Approve"
        >
          <IconApproved width={22} height={22} />
        </button>
      </div>

      <p className="note text-center">
        Drag the card, use the buttons, or press ← and → · {done.approved} approved ·{" "}
        {done.declined} declined this session
      </p>

      <span className="sr-only" role="status" aria-live="polite">
        {verdict ? `Release to ${verdict}` : ""}
      </span>
    </div>
  );
}

function SubmissionBody({ card }: { card: ReviewCard }) {
  const flags = flagsFor(card);

  return (
    <>
      <div className="qc-head">
        <span className="qc-id">
          {card.quest.number ? `Quest № ${String(card.quest.number).padStart(4, "0")}` : "Quest"} ·{" "}
          {card.person.name}
        </span>
        <span className="flex items-center gap-2">
          {card.cadence && (
            <Tag tone="warm">
              {card.cadence.period === "MONTHLY" ? "Monthly" : "Weekly"} · {card.cadence.label}
            </Tag>
          )}
          {card.retreated && <Tag tone="ghost">Retreat</Tag>}
          <Tag tone={card.quest.difficulty === "HARD" || card.quest.difficulty === "EXPERT" ? "warm" : "pine"}>
            {card.quest.difficulty}
          </Tag>
        </span>
      </div>

      <div className="review-body">
        <span className="qc-loc">
          {card.quest.location} · {card.quest.region}
        </span>
        <h3 className="qc-title">{card.quest.title}</h3>

        {card.photos.length > 0 && (
          <div className="review-photos">
            {card.photos.slice(0, 4).map((src, index) => (
              <Image
                key={src}
                src={src}
                alt={`Proof photo ${index + 1}`}
                width={480}
                height={200}
                className="h-[150px] w-full object-cover"
                unoptimized
              />
            ))}
          </div>
        )}

        <p className="quote">{card.note}</p>

        {/* Claimed against asked-for. A flagged row is not a rejection — it is
            the one thing worth looking at twice. */}
        <div className="proof-row">
          <Diff label="km" actual={card.actual.distance} target={card.target.distance} />
          <Diff label="m ↑" actual={card.actual.elevation} target={card.target.elevation} />
          <Diff label="moving" actual={card.actual.movingTime} target={card.target.movingTime} suffix="m" />
          <div>
            <b>{card.photos.length}</b>
            <span>photos</span>
          </div>
        </div>

        {card.stravaUrl && (
          <a
            className="strava"
            href={card.stravaUrl}
            target="_blank"
            rel="noreferrer noopener"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <IconStrava />
            Strava activity attached
          </a>
        )}

        {flags.length > 0 && (
          <ul className="review-flags">
            {flags.map((flag) => (
              <li key={flag}>{flag}</li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function Diff({
  label,
  actual,
  target,
  suffix = "",
}: {
  label: string;
  actual: number | null;
  target: number;
  suffix?: string;
}) {
  if (actual == null) {
    return (
      <div>
        <b className="text-ink-3">—</b>
        <span>{label}</span>
      </div>
    );
  }
  const off = target > 0 && Math.abs(actual - target) / target > FLAG_RATIO;
  return (
    <div className={off ? "off" : undefined}>
      <b>
        {Math.round(actual * 10) / 10}
        {suffix}
      </b>
      <span>
        {label} · asked {Math.round(target)}
        {suffix}
      </span>
    </div>
  );
}

/** The things worth a second look, stated rather than scored. */
function flagsFor(card: ReviewCard): string[] {
  const flags: string[] = [];
  if (card.photos.length === 0 && !card.stravaUrl) {
    flags.push("Written account only — no photos and no Strava.");
  }
  if (card.actual.distance == null && card.actual.movingTime == null) {
    flags.push("No recorded figures to compare against the quest.");
  }
  const d = card.actual.distance;
  if (d != null && card.target.distance > 0) {
    const ratio = Math.abs(d - card.target.distance) / card.target.distance;
    if (ratio > FLAG_RATIO) {
      flags.push(
        `Distance is ${Math.round(ratio * 100)}% off what the quest asked for.`,
      );
    }
  }
  if (card.retreated) {
    flags.push("Filed as an honest retreat — approve it as one if the reason holds.");
  }
  return flags;
}

/**
 * The queue, as a list rather than a deck.
 *
 * Reviewing one at a time is the point of the deck, but knowing what's in it
 * and being able to pick a specific one — a particular person, a particular
 * quest — is a different task, so it gets its own view rather than a filter
 * bolted onto the card.
 */
function BrowseQueue({
  open,
  onClose,
  cards,
  currentId,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  cards: ReviewCard[];
  currentId: string | null;
  onPick: (id: string) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Review queue"
      description={`${cards.length} pending — weekly and monthly first, then by plan, then by how long they've waited.`}
      className="max-w-[540px]"
    >
      <ul className="review-queue-list">
        {cards.map((card) => (
          <li key={card.id}>
            <button
              type="button"
              className={cn("review-queue-item", card.id === currentId && "current")}
              onClick={() => onPick(card.id)}
            >
              <Avatar name={card.person.name} initials={card.person.initials} />
              <span className="review-queue-who">
                <b>{card.person.name}</b>
                <span>{card.quest.title}</span>
              </span>
              <span className="review-queue-meta">
                {card.cadence && (
                  <Tag tone="warm">
                    {card.cadence.period === "MONTHLY" ? "Monthly" : "Weekly"}
                  </Tag>
                )}
                <Tag tone={card.plan === "ULTRA" ? "warm" : card.plan === "EXPLORER" ? "pine" : "ghost"}>
                  {PLAN_LABEL[card.plan]}
                </Tag>
                <span className="meta">{formatRelativeDate(card.createdAt)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
