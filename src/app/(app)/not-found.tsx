import Link from "next/link";

import { EmptyState } from "@/components/sq/ui";

/** A member-side 404, inside the shell rather than dumped outside it. */
export default function AppNotFound() {
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
        title="Nothing here"
        body="The page you were looking for does not exist — or it belongs to somebody else's account."
        action={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/dashboard" className="sq-btn sq-btn-primary sq-btn-sm">
              Your dashboard
            </Link>
            <Link href="/quests" className="sq-btn sq-btn-ghost sq-btn-sm">
              The quest database
            </Link>
          </div>
        }
      />
    </>
  );
}
