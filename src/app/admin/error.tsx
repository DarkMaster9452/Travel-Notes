"use client";

import Link from "next/link";
import { useEffect } from "react";

import { ErrorState } from "@/components/sq/ui";

/**
 * A panel screen broke.
 *
 * The message never carries the error itself: a stack trace here would be read
 * by whoever has the session, which is exactly the person a compromised
 * session belongs to.
 */
export default function AdminError({
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
          Behind the desk
        </span>
        <h1 className="sq-h1">That screen did not load.</h1>
      </header>

      <ErrorState
        title="The panel could not read that"
        body="Nothing has been written. Try again — the digest below is what to quote if it keeps happening."
        action={
          <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              <button type="button" className="sq-btn sq-btn-primary sq-btn-sm" onClick={reset}>
                Try again
              </button>
              <Link href="/admin" className="sq-btn sq-btn-ghost sq-btn-sm">
                Back to the overview
              </Link>
            </div>
            {error.digest ? (
              <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
                {error.digest}
              </span>
            ) : null}
          </div>
        }
      />
    </>
  );
}
