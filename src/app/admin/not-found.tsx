import Link from "next/link";

import { EmptyState } from "@/components/sq/ui";

/** A panel 404. The row was probably deleted while somebody held the link. */
export default function AdminNotFound() {
  return (
    <>
      <header className="sq-head">
        <span className="sq-kicker" style={{ display: "block", marginBottom: 10 }}>
          404
        </span>
        <h1 className="sq-h1">That record is gone.</h1>
      </header>

      <EmptyState
        glyph="database"
        title="Nothing at that address"
        body="Either it never existed, or it was deleted while somebody was holding the link."
        action={
          <Link href="/admin" className="sq-btn sq-btn-primary sq-btn-sm">
            Back to the overview
          </Link>
        }
      />
    </>
  );
}
