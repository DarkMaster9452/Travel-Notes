import { cn } from "@/lib/utils";

/**
 * The Summit Quest mark (design/DESIGN-SYSTEM.md §7.14).
 *
 * A Meadow tile, a white double peak, a Sunset cap on the summit. The colours
 * are fixed in both themes: it is a brand asset, not a themed surface. The
 * same drawing backs `src/app/icon.svg` and the app icons in `public/`.
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("size-8 shrink-0", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <rect width="64" height="64" rx="16" className="fill-meadow-600" />
      <path
        d="M9 49 26.5 17.5 37 36.5 43 27.5 55 49Z"
        className="fill-moss-0 stroke-moss-0"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M26.5 17.5 33.4 30 29.6 27.2 26.6 31.4 23.6 27.6 19.9 29.4Z"
        className="fill-sunset-500 stroke-sunset-500"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Just the peak, without its tile: for medals and other coloured discs. */
export function LogoPeak({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-6 shrink-0", className)} aria-hidden="true">
      <path
        d="M6 52 26 16 38 37.5 45 27.5 58 52Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Mark + wordmark. The name is always set in the display face, never redrawn. */
export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display text-h3 font-extrabold text-text", className)}>
      <LogoMark className={markClassName} />
      <span className="whitespace-nowrap">Summit Quest</span>
    </span>
  );
}
