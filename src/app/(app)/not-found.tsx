import Link from "next/link";

import { EmptyState } from "@/components/sq/ui";
import { getT } from "@/lib/i18n/server";

/** A member-side 404, inside the shell rather than dumped outside it. */
export default async function AppNotFound() {
  const t = await getT();

  return (
    <>
      <header className="sq-head">
        <span className="sq-kicker" style={{ display: "block", marginBottom: 10 }}>
          404
        </span>
        <h1 className="sq-h1">This one isn&rsquo;t on the map.</h1>
      </header>

      <EmptyState
        glyph="map"
        title={t.errors.notFound}
        body={t.errors.notFoundBody}
        action={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/dashboard" className="sq-btn sq-btn-primary sq-btn-sm">
              {t.nav.dashboard}
            </Link>
            <Link href="/quests" className="sq-btn sq-btn-ghost sq-btn-sm">
              {t.nav.quests}
            </Link>
          </div>
        }
      />
    </>
  );
}
