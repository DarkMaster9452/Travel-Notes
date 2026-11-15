import type { Metadata } from "next";
import { ArrowRight, ClipboardCheck } from "lucide-react";

import { Badge, SubmissionBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page";
import { type } from "@/components/ui/typography";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatDate, plural } from "@/lib/i18n/format";
import { getReader } from "@/lib/i18n/server";
import { formatDistance, formatHeight, formatMinutes } from "@/lib/i18n/units";
import { slotTitle } from "@/lib/quest/labels";
import { slotFromKey } from "@/lib/admin/schedule";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getReader()).t.submissions.title };
}
export const dynamic = "force-dynamic";

/**
 * Everything this account has filed, newest first.
 *
 * The verdict is the point of the card, so it gets a block of its own rather
 * than a chip in a corner. A decline carries the reviewer's note in their own
 * words — a reason somebody can act on is the difference between a decline
 * and a rejection.
 */
export default async function SubmissionsPage() {
  const user = await requireClient();

  const [submissions, reader] = await Promise.all([
    db.submission.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        quest: { select: { id: true, title: true, location: true, region: true } },
      },
    }),
    getReader(user.id),
  ]);
  const { t, locale, units } = reader;

  const approved = submissions.filter((entry) => entry.status === "APPROVED").length;
  const waiting = submissions.filter((entry) => entry.status === "PENDING").length;

  return (
    <>
      <PageHeader title={t.submissions.title} lede={t.submissions.summary(submissions.length, approved, waiting)} />

      {submissions.length === 0 ? (
        <Card>
          <EmptyState
            icon={ClipboardCheck}
            title={t.submissions.empty}
            action={
              <ButtonLink href="/monthly" variant="monthly">
                {t.questCard.openMonthly}
              </ButtonLink>
            }
          >
            {t.submissions.emptyBody}
          </EmptyState>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {submissions.map((entry) => {
            const declined = entry.status === "REJECTED";
            const settled = entry.status !== "PENDING";
            const slot = entry.period && entry.slotKey ? slotFromKey(entry.period, entry.slotKey) : null;

            return (
              <Card as="li" key={entry.id} className="flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className={type.h3}>{entry.quest.title}</h2>
                    <p className="mt-1 text-caption text-muted">
                      {entry.quest.location} · {entry.quest.region}
                    </p>
                  </div>
                  <SubmissionBadge status={entry.status}>
                    {entry.status === "APPROVED"
                      ? t.submissions.approvedTag
                      : declined
                        ? t.questCard.sentBack
                        : t.submissions.inReview}
                  </SubmissionBadge>
                </div>

                {slot || entry.retreated ? (
                  <div className="flex flex-wrap gap-2">
                    {slot ? (
                      <Badge tone={slot.period === "MONTHLY" ? "monthlySoft" : "weekly"}>
                        {(slot.period === "MONTHLY" ? t.app.quest.wasMonthly : t.app.quest.wasWeekly)(
                          slotTitle(slot, locale, t),
                        )}
                      </Badge>
                    ) : null}
                    {entry.retreated ? <Badge>{t.submissions.retreat}</Badge> : null}
                  </div>
                ) : null}

                <p className="max-w-text text-body-sm text-muted text-pretty">{entry.note}</p>

                <dl className="flex flex-wrap gap-x-6 gap-y-1 text-caption tabular-nums text-muted">
                  <div>
                    <dt className="sr-only">{t.proof.distance}</dt>
                    <dd>{entry.distance != null ? formatDistance(locale, entry.distance, units) : t.common.none}</dd>
                  </div>
                  <div>
                    <dt className="sr-only">{t.proof.ascent}</dt>
                    <dd>{entry.elevation != null ? `${formatHeight(locale, entry.elevation, units)} ↑` : t.common.none}</dd>
                  </div>
                  <div>
                    <dt className="sr-only">{t.proof.movingTime}</dt>
                    <dd>{entry.movingTime != null ? formatMinutes(entry.movingTime) : t.common.none}</dd>
                  </div>
                  <div>
                    <dd>{plural(locale, entry.photos.length, t.submissions.photos)}</dd>
                  </div>
                  {entry.stravaUrl ? (
                    <div>
                      <dd>{t.submissions.stravaAttached}</dd>
                    </div>
                  ) : null}
                </dl>

                <Alert
                  tone={entry.status === "APPROVED" ? "success" : declined ? "warning" : "info"}
                  title={
                    entry.status === "APPROVED"
                      ? t.submissions.approved
                      : declined
                        ? t.submissions.sentBack
                        : t.submissions.waiting
                  }
                >
                  {settled && entry.reviewedAt
                    ? t.submissions.readOn(formatDate(locale, entry.reviewedAt))
                    : t.submissions.unread}
                  {declined && entry.reviewNote ? (
                    <span className="mt-2 block border-l-2 border-warning pl-3 text-text">{entry.reviewNote}</span>
                  ) : null}
                </Alert>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-caption text-subtle">
                    {t.submissions.filed} {formatDate(locale, entry.createdAt)}
                  </span>
                  <ButtonLink
                    variant={declined ? "primary" : "secondary"}
                    size="sm"
                    href={entry.status === "APPROVED" ? `/quests/${entry.quest.id}` : `/quests/${entry.quest.id}/proof`}
                  >
                    {entry.status === "APPROVED"
                      ? t.submissions.seeQuest
                      : declined
                        ? t.submissions.addAndRefile
                        : t.submissions.editWhileWaiting}
                    <ArrowRight aria-hidden="true" />
                  </ButtonLink>
                </div>
              </Card>
            );
          })}
        </ul>
      )}
    </>
  );
}
