"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { setThemeAction } from "@/app/(app)/actions";
import { cn } from "@/lib/utils";

export type ThemeChoice = "SYSTEM" | "LIGHT" | "DARK";

const OPTIONS: { value: ThemeChoice; label: string; glyph: React.ReactNode }[] = [
  {
    value: "LIGHT",
    label: "Light",
    glyph: (
      <>
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.2 5.2l1.7 1.7M17.1 17.1l1.7 1.7M18.8 5.2l-1.7 1.7M6.9 17.1l-1.7 1.7" />
      </>
    ),
  },
  {
    value: "SYSTEM",
    label: "Auto",
    glyph: (
      <>
        <rect x="2.8" y="4.2" width="18.4" height="12.4" rx="2" />
        <path d="M8.5 20.2h7M12 16.6v3.6" />
      </>
    ),
  },
  {
    value: "DARK",
    label: "Dark",
    glyph: <path d="M20 14.3A8.4 8.4 0 019.7 4a8.4 8.4 0 1010.3 10.3z" />,
  },
];

/**
 * Light / Auto / Dark, as a segmented control.
 *
 * The palette is applied optimistically to the shell the moment a segment is
 * pressed, and only then written to the account — waiting for the round trip
 * would make choosing a theme feel like it hadn't worked. The server action
 * revalidates the layout afterwards, so a reload agrees with what you see.
 */
export function ThemeToggle({ value, className }: { value: ThemeChoice; className?: string }) {
  const router = useRouter();
  const [choice, setChoice] = React.useState<ThemeChoice>(value);
  const [pending, startTransition] = React.useTransition();

  // The server is the source of truth: if it disagrees with what we optimistically
  // painted (another tab, a failed write), fall back into line.
  const [lastValue, setLastValue] = React.useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setChoice(value);
  }

  function pick(next: ThemeChoice) {
    if (next === choice) return;
    setChoice(next);

    // Repaint now. Every themeable surface reads `data-theme` off an ancestor,
    // so writing it on the shells is the whole of the optimistic update.
    for (const node of document.querySelectorAll<HTMLElement>("[data-theme]")) {
      node.dataset.theme = next.toLowerCase();
    }

    startTransition(async () => {
      const result = await setThemeAction(next).catch(() => null);
      if (!result?.ok) {
        setChoice(value);
        for (const node of document.querySelectorAll<HTMLElement>("[data-theme]")) {
          node.dataset.theme = value.toLowerCase();
        }
        return;
      }
      router.refresh();
    });
  }

  return (
    <div
      className={cn("theme-toggle", className)}
      role="radiogroup"
      aria-label="Appearance"
      data-pending={pending || undefined}
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={choice === option.value}
          className={cn(choice === option.value && "active")}
          onClick={() => pick(option.value)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            aria-hidden="true"
          >
            {option.glyph}
          </svg>
          {option.label}
        </button>
      ))}
    </div>
  );
}
