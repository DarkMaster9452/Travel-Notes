"use client";

import Link from "next/link";
import { useEffect } from "react";

import { ErrorState } from "@/components/sq/ui";

/**
 * Something on the member side broke.
 *
 * The reset button is the first thing offered because most of these are a
 * failed read that succeeds on a second try. The message is never the raw
 * error: a stack trace tells a member nothing and tells everybody else too
 * much.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <header className="sq-head">
        <span className="sq-kicker" style={{ display: "block", marginBottom: 10 }}>
          Something went wrong
        </span>
        <h1 className="sq-h1">That page did not load.</h1>
      </header>

      <ErrorState
        title="We could not read that"
        body="Nothing you filed has been lost. Try again — if it keeps happening, the desk will see it in the logs."
        action={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <button type="button" className="sq-btn sq-btn-primary sq-btn-sm" onClick={reset}>
              Try again
            </button>
            <Link href="/dashboard" className="sq-btn sq-btn-ghost sq-btn-sm">
              Back to the dashboard
            </Link>
          </div>
        }
      />
    </>
  );
}
