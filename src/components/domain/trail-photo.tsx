"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A photo with a flat fallback underneath (design/DESIGN-SYSTEM.md §7.13).
 * If the image fails it is removed, so the reader sees the sunken surface and
 * a mountain glyph — never a gradient, never a broken-image icon.
 */
export function TrailPhoto({ src, alt, eager }: { src: string | null | undefined; alt: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // An image can fail before React hydrates and attaches `onError`; catch
  // that case by asking the element once it is ours.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);
  return (
    <div className="trail-photo">
      <div className="trail-photo-fallback" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
          <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
        </svg>
      </div>
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote photos from arbitrary hosts; the fallback sits underneath
        <img ref={ref} src={src} alt={alt} loading={eager ? "eager" : "lazy"} onError={() => setFailed(true)} />
      ) : null}
    </div>
  );
}
