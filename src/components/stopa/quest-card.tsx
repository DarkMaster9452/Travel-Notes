import Link from "next/link";

import { Countdown } from "@/components/stopa/countdown";
import { Button, CameraIcon, Marker, PinIcon, PointsBadge } from "@/components/stopa/ui";
import { CATEGORIES, type QuestCategoryId } from "@/lib/gamification";
import { fill, type Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type QuestCardQuest = {
  id: string;
  title: string;
  location: string;
  region: string;
  description: string;
  category: QuestCategoryId;
  points: number;
  closesAt: Date;
};

export type MySubmissionState =
  | { status: "PENDING" }
  | { status: "APPROVED"; points: number }
  | { status: "REJECTED"; note: string | null }
  | null;

/** The weekly challenge banner — the first thing on the home screen. */
export function QuestCard({
  quest,
  t,
  submission,
  difficulty,
}: {
  quest: QuestCardQuest;
  t: Dictionary;
  submission: MySubmissionState;
  difficulty: { count: number; difficulty: string } | null;
}) {
  const marker = CATEGORIES[quest.category].marker;

  return (
    <article className="card p-5">
      <div className="flex items-start gap-4">
        <Marker color={marker} />

        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-3xl leading-tight">{quest.title}</h3>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-moss">
            <PinIcon />
            {quest.location}
          </p>
        </div>

        <PointsBadge points={quest.points} label={t.common.points === "b." ? "BODOV" : "POINTS"} />
      </div>

      <p className="mt-5 font-serif text-lg leading-relaxed text-cream/90">{quest.description}</p>

      {difficulty && (
        <p className="mt-3 text-sm text-moss">
          {fill(t.home.difficultyByCrowd, { count: difficulty.count })} ·{" "}
          <span className="text-cream">
            {t.difficulty[difficulty.difficulty as keyof typeof t.difficulty]}
          </span>
        </p>
      )}

      <div className="mt-5">
        <Countdown
          closesAt={quest.closesAt.toISOString()}
          label={t.home.untilEnd}
          closedLabel={t.home.closed}
        />
      </div>

      <div className="mt-5">
        {submission === null ? (
          <Button asChild size="block">
            <Link href={`/submit?quest=${quest.id}`}>
              <CameraIcon />
              {t.home.submitProof}
            </Link>
          </Button>
        ) : (
          <SubmissionState submission={submission} t={t} />
        )}
      </div>
    </article>
  );
}

function SubmissionState({
  submission,
  t,
}: {
  submission: NonNullable<MySubmissionState>;
  t: Dictionary;
}) {
  const tone =
    submission.status === "APPROVED"
      ? "border-olive bg-olive/25 text-cream"
      : submission.status === "REJECTED"
        ? "border-brick/60 bg-brick/15 text-cream"
        : "border-cream/25 text-cream/85";

  const label =
    submission.status === "APPROVED"
      ? fill(t.home.approved, { points: submission.points })
      : submission.status === "REJECTED"
        ? t.home.rejected
        : t.home.pendingReview;

  return (
    <div className={cn("rounded-[10px] border px-4 py-3.5 text-center font-serif", tone)}>
      {label}
      {submission.status === "REJECTED" && submission.note && (
        <p className="mt-2 text-sm text-cream/75">“{submission.note}”</p>
      )}
    </div>
  );
}

/** Compact row used for "your recent trails". */
export function TrailRow({
  title,
  points,
  category,
  status,
  t,
}: {
  title: string;
  points: number;
  category: QuestCategoryId;
  status: "PENDING" | "APPROVED" | "REJECTED";
  t: Dictionary;
}) {
  return (
    <li className="card-solid flex items-center gap-3.5 px-4 py-3">
      <Marker color={CATEGORIES[category].marker} size="sm" />
      <span className="min-w-0 flex-1 truncate font-serif text-lg">{title}</span>
      <span
        className={cn(
          "shrink-0 font-serif tabular-nums",
          status === "APPROVED" ? "text-cream" : "text-moss",
        )}
      >
        {status === "APPROVED"
          ? `+${points} ${t.common.points}`
          : status === "PENDING"
            ? t.home.pendingReview
            : t.home.rejected}
      </span>
    </li>
  );
}
