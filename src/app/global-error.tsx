"use client";

import { useEffect, useState } from "react";

/**
 * The 500 of last resort.
 *
 * This replaces the root layout, so it cannot rely on the app's stylesheet,
 * fonts or dictionaries being present. Every rule here is inline for that
 * reason, and the values are the Trail tokens written out by hand
 * (design/tokens.css, light theme). It is deliberately the plainest page in
 * the product: whatever broke, broke underneath everything else.
 */

const COPY = {
  sk: {
    title: "Niečo sa pod nami prepadlo.",
    body: "Nič z toho, čo si odovzdal, sa nestratilo. Skús to znova. Ak sa to opakuje, pošli nám kód nižšie.",
    retry: "Skúsiť znova",
  },
  en: {
    title: "Something underneath gave way.",
    body: "Nothing you filed has been lost. Try again. If it keeps happening, quote the reference below.",
    retry: "Try again",
  },
  de: {
    title: "Darunter hat etwas nachgegeben.",
    body: "Nichts von dem, was du eingereicht hast, ist verloren. Versuch es noch einmal. Wenn es wieder passiert, nenne uns den Code unten.",
    retry: "Noch einmal versuchen",
  },
} as const;

type Lang = keyof typeof COPY;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // No dictionary and no cookie reader down here; the browser's own language
  // is the only thing left to ask. Slovak until it has answered.
  const [lang, setLang] = useState<Lang>("sk");
  useEffect(() => {
    const wanted = navigator.language.slice(0, 2).toLowerCase();
    if (wanted === "en" || wanted === "de") setLang(wanted);
  }, []);
  const copy = COPY[lang];

  return (
    <html lang={lang}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "32px 16px",
          background: "#f4f8f1",
          color: "#16241c",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <main style={{ maxWidth: 440, textAlign: "center" }}>
          <svg width="48" height="48" viewBox="0 0 64 64" aria-hidden="true" style={{ margin: "0 auto 24px" }}>
            <rect width="64" height="64" rx="16" fill="#157a47" />
            <path
              d="M9 49 26.5 17.5 37 36.5 43 27.5 55 49Z"
              fill="#fff"
              stroke="#fff"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path
              d="M26.5 17.5 33.4 30 29.6 27.2 26.6 31.4 23.6 27.6 19.9 29.4Z"
              fill="#ff6a3d"
              stroke="#ff6a3d"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>

          <p
            style={{
              margin: "0 0 8px",
              fontSize: 12,
              lineHeight: "16px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#5e6e62",
            }}
          >
            500
          </p>
          <h1
            style={{
              margin: "0 0 12px",
              fontWeight: 700,
              fontSize: 32,
              lineHeight: "38px",
              letterSpacing: "-0.02em",
            }}
          >
            {copy.title}
          </h1>
          <p style={{ margin: "0 0 24px", fontSize: 16, lineHeight: "24px", color: "#4a5a4f" }}>{copy.body}</p>

          <button
            type="button"
            onClick={reset}
            style={{
              border: 0,
              borderRadius: 12,
              minHeight: 48,
              padding: "12px 20px",
              background: "#157a47",
              color: "#ffffff",
              font: "600 16px/24px inherit",
              cursor: "pointer",
            }}
          >
            {copy.retry}
          </button>

          {error.digest ? (
            <p
              style={{
                margin: "20px 0 0",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 13,
                lineHeight: "18px",
                color: "#5e6e62",
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
