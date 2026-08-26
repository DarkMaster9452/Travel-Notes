import type { Metadata } from "next";

import { disconnectStravaAction } from "@/app/(app)/actions";
import { SqConfirmButton } from "@/components/sq/forms";
import { StravaMark } from "@/components/sq/icons";
import { Tag } from "@/components/sq/ui";
import { requireClient } from "@/lib/auth/guards";
import { getT } from "@/lib/i18n/server";
import { getStravaConnection, stravaEnabled } from "@/lib/strava";

export const metadata: Metadata = { title: "Connected apps" };
export const dynamic = "force-dynamic";

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

const ERRORS: Record<string, string> = {
  unconfigured: "Strava is not configured on this deployment.",
  declined: "Strava was not given permission.",
  state: "That handshake did not match — start it again from here.",
  exchange: "Strava would not complete the handshake. Try once more.",
};

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
  const t = await getT(user.id);
  const params = await searchParams;

  const connection = await getStravaConnection(user.id);
  const error = params.error ? (ERRORS[params.error] ?? "That connection did not complete.") : null;

  return (
    <section className="sq-card" style={{ overflow: "hidden" }}>
      <div className="sq-section-head sq-rule-head">
        <h2 className="sq-h2" style={{ fontSize: 19 }}>
          Connected apps
        </h2>
        {params.connected ? (
          <Tag tone="green" small>
            Connected
          </Tag>
        ) : null}
      </div>

      {error ? (
        <p
          style={{
            padding: "12px 24px",
            background: "var(--signal-wash)",
            color: "var(--color-accent-2-700)",
            fontSize: 13,
          }}
        >
          {error}
        </p>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) auto",
          gap: 18,
          alignItems: "center",
          padding: "18px 24px",
        }}
      >
        <span style={{ minWidth: 0 }}>
          <b style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14.5, fontWeight: 600 }}>
            <span style={{ color: "var(--signal)" }}>
              <StravaMark size={14} />
            </span>
            Strava
          </b>
          <span style={{ display: "block", marginTop: 5, fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-2)" }}>
            {connection
              ? `Connected as ${connection.athleteName ?? connection.athleteId} since ${DATE.format(connection.connectedAt)}. The proof form can read distance, ascent and moving time straight off an activity.`
              : "Read distance, ascent and moving time straight off an activity instead of typing them. Read-only access, and only to activities."}
          </span>
        </span>

        {!stravaEnabled() ? (
          <span className="sq-mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
            Not configured
          </span>
        ) : connection ? (
          <SqConfirmButton
            action={async () => {
              const result = await disconnectStravaAction();
              return { ok: result.ok, message: "Strava disconnected." };
            }}
            label={t.panes.connected.disconnect}
            confirmLabel="Disconnect it"
            tone="stamp"
          />
        ) : (
          <a href="/api/strava/connect" className="sq-btn sq-btn-primary">
            Connect Strava
          </a>
        )}
      </div>

      <p
        style={{
          padding: "14px 24px",
          borderTop: "1px solid var(--line-2)",
          background: "var(--paper-2)",
          fontSize: 12.5,
          lineHeight: 1.5,
          color: "var(--ink-2)",
        }}
      >
        Nothing is pushed to Strava, and nothing is read from it unless you paste an activity link
        into a proof form.
      </p>
    </section>
  );
}
