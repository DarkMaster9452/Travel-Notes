"use client";

import Image from "next/image";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Photography with a designed floor.
 *
 * A generated ridgeline, coloured from the asset's palette, is painted first
 * and the photograph fades in over it. If the image is slow or fails outright,
 * what remains still looks composed instead of broken.
 */

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (Math.imul(h, 31) + input.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function ridgeSvg(palette: readonly [string, string, string], seed: number): string {
  const rand = (n: number) => {
    const x = Math.sin(seed * 9301 + n * 49297) * 233280;
    return x - Math.floor(x);
  };

  const layer = (baseY: number, amplitude: number, index: number) => {
    const points: string[] = [`0,100`];
    for (let x = 0; x <= 100; x += 10) {
      const y = baseY + Math.sin((x / 100) * Math.PI * (1.5 + index)) * amplitude * rand(x + index * 7);
      points.push(`${x},${y.toFixed(1)}`);
    }
    points.push(`100,100`);
    return points.join(" ");
  };

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
    <defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${palette[1]}"/><stop offset="100%" stop-color="${palette[0]}"/>
    </linearGradient></defs>
    <rect width="100" height="100" fill="url(#s)"/>
    <polygon points="${layer(52, 14, 1)}" fill="${palette[1]}" opacity="0.75"/>
    <polygon points="${layer(66, 11, 2)}" fill="${palette[0]}" opacity="0.85"/>
    <polygon points="${layer(80, 9, 3)}" fill="${palette[2]}"/>
  </svg>`;

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export type QuestImageProps = {
  src: string;
  alt: string;
  palette: readonly [string, string, string];
  priority?: boolean;
  sizes?: string;
  className?: string;
  /** Scale the photo up slightly on parent hover. */
  zoomOnHover?: boolean;
};

export function QuestImage({
  src,
  alt,
  palette,
  priority = false,
  sizes = "100vw",
  className,
  zoomOnHover = true,
}: QuestImageProps) {
  const [state, setState] = React.useState<"loading" | "loaded" | "failed">("loading");
  const backdrop = React.useMemo(() => ridgeSvg(palette, hash(src)), [palette, src]);

  return (
    <div
      className={cn("absolute inset-0 overflow-hidden bg-ink", className)}
      style={{ backgroundImage: backdrop, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      {state !== "failed" && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized
          className={cn(
            "object-cover transition-[opacity,transform] duration-700 ease-out",
            state === "loaded" ? "opacity-100" : "opacity-0",
            zoomOnHover && "group-hover:scale-[1.04]",
          )}
          onLoad={() => setState("loaded")}
          onError={() => setState("failed")}
        />
      )}
    </div>
  );
}
