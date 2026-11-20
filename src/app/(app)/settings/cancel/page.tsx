import type { Metadata } from "next";
import { CalendarX, Pause } from "lucide-react";

import { cancelPlanAction } from "@/app/(app)/actions";
import { pausePlanAction, resumePlanAction } from "@/app/(app)/settings/actions";
import { ConfirmButton } from "@/components/app/forms";
import { Pane } from "@/components/app/pane";
import { Badge } from "@/components/ui/badge";
import { requireClient } from "@/lib/auth/guards";
import { REFUND_WINDOW_DAYS } from "@/lib/config";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import { formatDate } from "@/lib/i18n/format";
import { getReader } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getReader()).t.settings.items.cancel };
}
export const dynamic = "force-dynamic";

/**
 * Leaving, in the two shapes people actually mean by it.
 *
 * A pause is "not this month"; a cancel is "not any more". Both are stated
 * with what survives them, because the fear in either case is the same one —
 * that the stickers and the board history go with it. They do not.
 *
 * Server actions go to the confirm buttons as themselves (bound where they
 * take an argument): a server page cannot hand a client component an inline
 * function, only a reference to an action.
 */
export default async function CancelSettingsPage() {
  const user = await requireClient();
  const [{ t, locale }, entitlement, subscription] = await Promise.all([
    getReader(user.id),
    getEntitlement(user.id),
    db.subscription.findUnique({ where: { userId: user.id }, select: { status: true } }),
  ]);
  const words = t.app.settingsPane.cancel;
  const panes = t.panes.cancel;
  const paused = subscription?.status === "PAUSED";

  return (
    <>
      <Pane
        title={panes.pauseMonth}
        action={
          paused ? (
            <Badge tone="warning" icon={Pause}>
              {words.paused}
            </Badge>
          ) : undefined
        }
        padded
      >
        <p className="max-w-text text-body-sm text-muted">{words.pauseBody}</p>
        {!entitlement.isSubscribed && !paused ? (
          <p className="text-body-sm text-subtle">{words.noPause}</p>
        ) : paused ? (
          <ConfirmButton action={resumePlanAction} label={panes.resume} confirmLabel={panes.resumeNow} />
        ) : (
          <div className="flex flex-wrap gap-3">
            <ConfirmButton action={pausePlanAction.bind(null, 1)} label={panes.pauseOne} confirmLabel={panes.pauseOne} />
            <ConfirmButton action={pausePlanAction.bind(null, 3)} label={panes.pauseThree} confirmLabel={panes.pauseThree} />
          </div>
        )}
      </Pane>

      <Pane title={words.cancelHeading} tone="danger" padded>
        <p className="max-w-text text-body-sm text-muted">
          {words.cancelBody(
            entitlement.currentPeriodEnd ? formatDate(locale, entitlement.currentPeriodEnd, "dayMonth") : null,
            REFUND_WINDOW_DAYS,
          )}
        </p>
        {entitlement.cancelAtPeriodEnd ? (
          <Badge tone="warning" icon={CalendarX}>
            {words.alreadyCancelling}
          </Badge>
        ) : entitlement.isSubscribed ? (
          <ConfirmButton
            tone="danger"
            action={cancelPlanAction}
            label={panes.cancelPlan}
            confirmLabel={words.confirmCancel}
          />
        ) : (
          <p className="text-body-sm text-subtle">{words.nothing}</p>
        )}
      </Pane>
    </>
  );
}
