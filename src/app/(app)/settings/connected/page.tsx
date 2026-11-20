import type { Metadata } from "next";
import { Check } from "lucide-react";

import { disconnectStravaAction } from "@/app/(app)/actions";
import { ConfirmButton } from "@/components/app/forms";
import { Pane } from "@/components/app/pane";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { requireClient } from "@/lib/auth/guards";
import { formatDate } from "@/lib/i18n/format";
import { getReader } from "@/lib/i18n/server";
import { getStravaConnection, stravaEnabled } from "@/lib/strava";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getReader()).t.settings.items.connected };
}
export const dynamic = "force-dynamic";

/**
 * Connected apps.
 *
 * One app so far, and the page says exactly what it is for: read the figures
 * off an activity so they do not have to be typed twice. Disconnecting deletes
 * the tokens — there is no "revoked but remembered" state.
 */
export default async function ConnectedAppsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const user = await requireClient();
  const { t, locale } = await getReader(user.id);
  const words = t.app.settingsPane.connected;
  const params = await searchParams;
  const connection = await getStravaConnection(user.id);

  const errors: Record<string, string> = {
    unconfigured: t.panes.connected.notConfigured,
    declined: t.panes.connected.denied,
    state: words.stateMismatch,
    exchange: t.panes.connected.handshakeFailed,
  };
  const error = params.error ? (errors[params.error] ?? words.failed) : null;

  return (
    <Pane
      title={t.panes.connected.heading}
      action={
        params.connected ? (
          <Badge tone="success" icon={Check}>
            {words.connected}
          </Badge>
        ) : undefined
      }
      padded
    >
      {error ? (
        <Alert tone="danger" role="alert" className="w-full">
          {error}
        </Alert>
      ) : null}

      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <b className="block text-body-sm font-semibold text-text">Strava</b>
          <p className="mt-1 text-caption text-muted">
            {connection
              ? words.connectedAs(
                  connection.athleteName ?? String(connection.athleteId),
                  formatDate(locale, connection.connectedAt),
                )
              : t.panes.connected.stravaDetail}
          </p>
        </div>
        {!stravaEnabled() ? (
          <Badge>{words.notConfigured}</Badge>
        ) : connection ? (
          <ConfirmButton
            tone="danger"
            action={disconnectStravaAction}
            label={t.panes.connected.disconnect}
            confirmLabel={t.panes.connected.disconnectIt}
          />
        ) : (
          <ButtonLink href="/api/strava/connect">{words.connect}</ButtonLink>
        )}
      </div>

      <p className="w-full border-t border-border pt-4 text-caption text-subtle">{words.footer}</p>
    </Pane>
  );
}
