"use client";

import { Mountain } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * A photo with a flat fallback underneath (design/DESIGN-SYSTEM.md §7.13).
 * If the image fails it is removed, so the reader sees the sunken surface and
 * a mountain glyph — never a gradient, never a broken-image icon.
 *
 * The caller sets the ratio and the radius through `className`
 * (`aspect-4/3 rounded-control`, …); the photo itself always covers.
 */
export function TrailPhoto({
  src,
  alt,
  eager,
  className,
  tone = "surface",
}: {
  src: string | null | undefined;
  alt: string;
  eager?: boolean;
  className?: string;
  /** On the monthly feature panel the fallback is tinted from its ink instead. */
  tone?: "surface" | "feature";
}) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // An image can fail before React hydrates and attaches `onError`; catch
  // that case by asking the element once it is ours.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  return (
    <div
      className={cn(
        "relative max-w-full overflow-hidden",
        tone === "feature" ? "bg-feature-fg/10 text-feature-fg/60" : "bg-surface-sunken text-subtle",
        className,
      )}
    >
      <div className="absolute inset-0 grid place-items-center" aria-hidden="true">
        <Mountain className="size-8" />
      </div>
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote photos from arbitrary hosts; the fallback sits underneath
        <img
          ref={ref}
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover"
        />
      ) : null}
    </div>
  );
}
