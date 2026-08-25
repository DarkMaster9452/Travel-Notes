"use client";

/**
 * The 500 of last resort.
 *
 * This replaces the root layout, so it cannot rely on the app's stylesheet
 * being present — every rule here is inline for that reason. It is deliberately
 * the plainest page in the product: whatever broke, broke underneath
 * everything else.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "32px 20px",
          background: "#eff0e5",
          color: "#141a16",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <main style={{ maxWidth: 460, textAlign: "center" }}>
          <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden="true" style={{ marginBottom: 20 }}>
            <path
              d="M2 25 L11 10 L16.5 19 L20 13.5 L30 25 Z"
              fill="none"
              stroke="#1e3b2c"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path d="M11 10 L14.6 16 L7.4 16 Z" fill="#c4481b" />
            <path d="M2 29 H30" fill="none" stroke="#1e3b2c" strokeWidth="1.7" strokeLinecap="round" opacity="0.35" />
          </svg>

          <p
            style={{
              margin: "0 0 12px",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 10.5,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#848a78",
            }}
          >
            500
          </p>
          <h1
            style={{
              margin: "0 0 14px",
              fontFamily: "Georgia, 'Iowan Old Style', serif",
              fontWeight: 600,
              fontSize: 32,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            Something underneath gave way.
          </h1>
          <p style={{ margin: "0 0 22px", fontSize: 15, lineHeight: 1.6, color: "#47544b" }}>
            Nothing you filed has been lost. Try again — if it keeps happening, quote the reference
            below.
          </p>

          <button
            type="button"
            onClick={reset}
            style={{
              border: 0,
              borderRadius: 8,
              padding: "11px 18px",
              background: "#2c5540",
              color: "#f9faf3",
              font: "600 14px/1 inherit",
              cursor: "pointer",
            }}
          >
            Try again
          </button>

          {error.digest ? (
            <p
              style={{
                margin: "18px 0 0",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 11,
                color: "#848a78",
              }}
            >
              {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
