import * as React from "react";

import { cn } from "@/lib/utils";

/** The three avatar colourways from the landing page. */
export type AvatarVariant = "a" | "b" | "c";

const VARIANTS: AvatarVariant[] = ["a", "b", "c"];

/**
 * Pick a stable variant from a string, so the same person keeps the same
 * colour across the board, a room and a match without storing anything.
 */
export function avatarVariant(seed: string): AvatarVariant {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return VARIANTS[Math.abs(hash) % VARIANTS.length];
}

/**
 * Reduce a name to initials.
 *
 * The product shows first names and initials only — never a full surname and
 * never an uploaded photograph, even on a published profile — so this is the
 * whole of a person's visual identity and it lives in one function.
 */
export function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  // A single name gives one letter, not its first two — "Tomáš" is T, not TO.
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  name,
  initials,
  variant,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  /** Used for the initials and, unless overridden, the colour. */
  name: string;
  /** Override when the account already stores its own initials. */
  initials?: string;
  variant?: AvatarVariant;
}) {
  const resolved = variant ?? avatarVariant(name);
  return (
    <span
      aria-hidden="true"
      className={cn("av", resolved !== "a" && resolved, className)}
      {...props}
    >
      {initials ?? initialsFrom(name)}
    </span>
  );
}
