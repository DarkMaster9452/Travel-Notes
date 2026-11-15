import type { ProfileAccent } from "@prisma/client";
import { cva, type VariantProps } from "class-variance-authority";

import { accentInk } from "@/lib/accents";
import { cn } from "@/lib/utils";

/**
 * Avatar (design/DESIGN-SYSTEM.md §7.11): 24 · 32 · 40 · 64 · 96. Without a
 * photo it shows initials on the wash of the person's profile colour.
 */
const avatarVariants = cva(
  "inline-grid shrink-0 select-none place-items-center overflow-hidden rounded-pill bg-(--avatar-bg) font-sans font-semibold text-(--avatar-fg)",
  {
    variants: {
      size: {
        xs: "size-6 text-overline tracking-normal",
        sm: "size-8 text-overline tracking-normal",
        md: "size-10 text-body-sm",
        lg: "size-16 text-h3",
        xl: "size-24 text-h1",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  name,
  src,
  size,
  accent,
  className,
}: {
  name: string;
  src?: string | null;
  accent?: ProfileAccent | null;
  className?: string;
} & VariantProps<typeof avatarVariants>) {
  const ink = accentInk(accent);
  return (
    <span
      className={cn(avatarVariants({ size }), className)}
      style={{ ["--avatar-bg" as string]: ink.wash, ["--avatar-fg" as string]: ink.ink }}
      aria-hidden="true"
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- member photos come from arbitrary hosts
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}
