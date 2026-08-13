import type { IconName } from "@/components/ui/icons";

/**
 * Cosmetics — the parts of a profile that change how it looks and nothing else.
 *
 * Every option is enumerated here rather than stored as free-form CSS: the
 * value from the database is only ever used to *look up* one of these entries,
 * so a tampered row can change nothing beyond picking a different preset.
 */

export type AccentId = "moss" | "ember" | "stone" | "ink";

export const ACCENTS: Array<{
  id: AccentId;
  label: string;
  /** Tailwind classes, resolved from the token set — never raw user input. */
  swatch: string;
  ring: string;
  text: string;
  bg: string;
}> = [
  { id: "moss", label: "Moss", swatch: "bg-moss", ring: "ring-moss", text: "text-moss", bg: "bg-moss" },
  { id: "ember", label: "Ember", swatch: "bg-ember", ring: "ring-ember", text: "text-ember", bg: "bg-ember" },
  { id: "stone", label: "Stone", swatch: "bg-stone", ring: "ring-stone", text: "text-stone", bg: "bg-stone" },
  { id: "ink", label: "Ink", swatch: "bg-ink", ring: "ring-ink", text: "text-ink", bg: "bg-ink" },
];

export function accentOf(id: string | null | undefined) {
  return ACCENTS.find((accent) => accent.id === id) ?? ACCENTS[0]!;
}

export type AvatarStyleId = "initial" | "compass" | "mountain" | "trophy";

export const AVATAR_STYLES: Array<{ id: AvatarStyleId; label: string; icon?: IconName }> = [
  { id: "initial", label: "Initial" },
  { id: "compass", label: "Compass", icon: "compass" },
  { id: "mountain", label: "Peak", icon: "mountain" },
  { id: "trophy", label: "Trophy", icon: "trophy" },
];

export function avatarStyleOf(id: string | null | undefined) {
  return AVATAR_STYLES.find((style) => style.id === id) ?? AVATAR_STYLES[0]!;
}

export type BannerId = "ridge" | "valley" | "summit" | "plain";

export const BANNERS: Array<{ id: BannerId; label: string; className: string }> = [
  {
    id: "ridge",
    label: "Ridge",
    className: "bg-gradient-to-br from-moss via-ink to-ink",
  },
  {
    id: "valley",
    label: "Valley",
    className: "bg-gradient-to-br from-sage via-moss-light to-moss",
  },
  {
    id: "summit",
    label: "Summit",
    className: "bg-gradient-to-br from-ember-light via-ember to-ink",
  },
  { id: "plain", label: "Plain", className: "bg-ink" },
];

export function bannerOf(id: string | null | undefined) {
  return BANNERS.find((banner) => banner.id === id) ?? BANNERS[0]!;
}

export const ACCENT_IDS = ACCENTS.map((a) => a.id);
export const AVATAR_STYLE_IDS = AVATAR_STYLES.map((a) => a.id);
export const BANNER_IDS = BANNERS.map((b) => b.id);
