"use client";

import React, { MouseEvent, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Icon, type IconName } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * A holographic award badge that tilts toward the cursor.
 *
 * The technique is the supplied Product Hunt badge's: a `matrix3d` built from
 * the pointer's offset from centre, eased through an "opposite" matrix on
 * enter and leave so the card settles instead of snapping, and a stack of
 * blurred polygons in `mix-blend-mode: overlay` rotating behind a mask to make
 * the foil sheen. The chrome is ours — shipping another company's name and
 * logo on our own award would be passing off their mark as ours.
 *
 * Falls back to a still badge when the reader prefers reduced motion.
 */

const IDENTITY_MATRIX = "1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1";

const MAX_ROTATE = 0.25;
const MIN_ROTATE = -0.25;
const MAX_SCALE = 1;
const MIN_SCALE = 0.97;

/** Foil hues. Tinted toward the brand greens rather than a full rainbow. */
const FOIL = [
  "hsl(88, 45%, 55%)",
  "hsl(64, 55%, 55%)",
  "hsl(140, 35%, 45%)",
  "hsl(45, 60%, 60%)",
  "hsl(160, 30%, 50%)",
  "hsl(100, 40%, 60%)",
  "transparent",
  "transparent",
  "hsl(70, 50%, 65%)",
  "white",
];

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export type AwardBadgeProps = {
  /** Small line above the title, e.g. "Quest complete". */
  eyebrow: string;
  /** The award itself, e.g. the quest or achievement name. */
  title: string;
  icon?: IconName;
  className?: string;
};

export function AwardBadge({ eyebrow, title, icon = "trophy", className }: AwardBadgeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [firstOverlayPosition, setFirstOverlayPosition] = useState(0);
  const [matrix, setMatrix] = useState(IDENTITY_MATRIX);
  const [currentMatrix, setCurrentMatrix] = useState(IDENTITY_MATRIX);
  const [disableInOutOverlayAnimation, setDisableInOutOverlayAnimation] = useState(true);
  const [disableOverlayAnimation, setDisableOverlayAnimation] = useState(false);
  const [isTimeoutFinished, setIsTimeoutFinished] = useState(false);

  const enterTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimeouts = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  // Subscribed rather than copied into state: the media query stays the source
  // of truth, and the server snapshot is "no preference" so SSR stays stable.
  const reduced = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    () => false,
  );

  // Every pending timer must die with the component, or a late setState lands
  // after unmount.
  useEffect(
    () => () => {
      if (enterTimeout.current) clearTimeout(enterTimeout.current);
      leaveTimeouts.current.forEach(clearTimeout);
    },
    [],
  );

  const getDimensions = () => {
    const rect = ref.current?.getBoundingClientRect();
    return {
      left: rect?.left ?? 0,
      right: rect?.right ?? 0,
      top: rect?.top ?? 0,
      bottom: rect?.bottom ?? 0,
    };
  };

  const getMatrix = (clientX: number, clientY: number) => {
    const { left, right, top, bottom } = getDimensions();
    const xCenter = (left + right) / 2;
    const yCenter = (top + bottom) / 2;

    const scale = [
      MAX_SCALE - ((MAX_SCALE - MIN_SCALE) * Math.abs(xCenter - clientX)) / (xCenter - left || 1),
      MAX_SCALE - ((MAX_SCALE - MIN_SCALE) * Math.abs(yCenter - clientY)) / (yCenter - top || 1),
      MAX_SCALE -
        ((MAX_SCALE - MIN_SCALE) * (Math.abs(xCenter - clientX) + Math.abs(yCenter - clientY))) /
          (xCenter - left + yCenter - top || 1),
    ];

    const rotate = {
      x1: 0.25 * ((yCenter - clientY) / (yCenter || 1) - (xCenter - clientX) / (xCenter || 1)),
      x2: MAX_ROTATE - ((MAX_ROTATE - MIN_ROTATE) * Math.abs(right - clientX)) / (right - left || 1),
      y2: MAX_ROTATE - ((MAX_ROTATE - MIN_ROTATE) * (top - clientY)) / (top - bottom || 1),
      z0: -(
        MAX_ROTATE -
        ((MAX_ROTATE - MIN_ROTATE) * Math.abs(right - clientX)) / (right - left || 1)
      ),
      z1: 0.2 - (0.8 * (top - clientY)) / (top - bottom || 1),
    };

    return (
      `${scale[0]}, 0, ${rotate.z0}, 0, ` +
      `${rotate.x1}, ${scale[1]}, ${rotate.z1}, 0, ` +
      `${rotate.x2}, ${rotate.y2}, ${scale[2]}, 0, ` +
      `0, 0, 0, 1`
    );
  };

  const getOppositeMatrix = (source: string, clientY: number, onEnter?: boolean) => {
    const { top, bottom } = getDimensions();
    const oppositeY = bottom - clientY + top;
    const weakening = onEnter ? 0.7 : 4;
    const multiplier = onEnter ? -1 : 1;

    return source
      .split(", ")
      .map((item, index) => {
        if (index === 2 || index === 4 || index === 8) {
          return String((-parseFloat(item) * multiplier) / weakening);
        }
        if (index === 0 || index === 5 || index === 10) return "1";
        if (index === 6) {
          return String(
            (multiplier *
              (MAX_ROTATE - ((MAX_ROTATE - MIN_ROTATE) * (top - oppositeY)) / (top - bottom || 1))) /
              weakening,
          );
        }
        if (index === 9) {
          return String(
            (MAX_ROTATE - ((MAX_ROTATE - MIN_ROTATE) * (top - oppositeY)) / (top - bottom || 1)) /
              weakening,
          );
        }
        return item;
      })
      .join(", ");
  };

  const onMouseEnter = (event: MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    leaveTimeouts.current.forEach(clearTimeout);
    leaveTimeouts.current = [];
    setDisableOverlayAnimation(true);

    const { left, right, top, bottom } = getDimensions();
    const xCenter = (left + right) / 2;
    const yCenter = (top + bottom) / 2;

    setDisableInOutOverlayAnimation(false);
    enterTimeout.current = setTimeout(() => setDisableInOutOverlayAnimation(true), 350);
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        setFirstOverlayPosition(
          (Math.abs(xCenter - event.clientX) + Math.abs(yCenter - event.clientY)) / 1.5,
        ),
      ),
    );

    setMatrix(getOppositeMatrix(getMatrix(event.clientX, event.clientY), event.clientY, true));
    setIsTimeoutFinished(false);
    leaveTimeouts.current.push(setTimeout(() => setIsTimeoutFinished(true), 200));
  };

  const onMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const { left, right, top, bottom } = getDimensions();
    const xCenter = (left + right) / 2;
    const yCenter = (top + bottom) / 2;

    leaveTimeouts.current.push(
      setTimeout(
        () =>
          setFirstOverlayPosition(
            (Math.abs(xCenter - event.clientX) + Math.abs(yCenter - event.clientY)) / 1.5,
          ),
        150,
      ),
    );

    if (isTimeoutFinished) setCurrentMatrix(getMatrix(event.clientX, event.clientY));
  };

  const onMouseLeave = (event: MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    if (enterTimeout.current) clearTimeout(enterTimeout.current);

    setCurrentMatrix(getOppositeMatrix(matrix, event.clientY));
    leaveTimeouts.current.push(setTimeout(() => setCurrentMatrix(IDENTITY_MATRIX), 200));

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setDisableInOutOverlayAnimation(false);
        leaveTimeouts.current.push(
          setTimeout(() => setFirstOverlayPosition(-firstOverlayPosition / 4), 150),
          setTimeout(() => setFirstOverlayPosition(0), 300),
          setTimeout(() => {
            setDisableOverlayAnimation(false);
            setDisableInOutOverlayAnimation(true);
          }, 500),
        );
      }),
    );
  };

  // Once the enter animation has settled, the badge tracks the pointer
  // directly; before that it holds the eased-in matrix. Derived at render
  // rather than mirrored through an effect.
  const displayMatrix = isTimeoutFinished ? currentMatrix : matrix;

  const overlayAnimations = FOIL.map(
    (_, index) => `
    @keyframes foilSweep${index + 1} {
      0% { transform: rotate(${index * 10}deg); }
      50% { transform: rotate(${(index + 1) * 10}deg); }
      100% { transform: rotate(${index * 10}deg); }
    }`,
  ).join(" ");

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onMouseEnter={onMouseEnter}
      className={cn("block w-[260px] max-w-full", className)}
    >
      <style>{overlayAnimations}</style>
      <div
        style={{
          transform: `perspective(700px) matrix3d(${displayMatrix})`,
          transformOrigin: "center center",
          transition: "transform 200ms ease-out",
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 76" className="h-auto w-full">
          <defs>
            <filter id="awardBlur">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
            </filter>
            <mask id="awardMask">
              <rect width="260" height="76" fill="white" rx="12" />
            </mask>
          </defs>

          <rect width="260" height="76" rx="12" fill="#1e342b" />
          <rect
            x="4"
            y="4"
            width="252"
            height="68"
            rx="9"
            fill="transparent"
            stroke="#9aa133"
            strokeOpacity="0.55"
            strokeWidth="1"
          />

          <text
            x="72"
            y="31"
            fill="#9aa133"
            fontSize="9"
            fontWeight="700"
            letterSpacing="1.6"
            fontFamily="var(--font-sans), system-ui, sans-serif"
          >
            {eyebrow.toUpperCase()}
          </text>
          {/* Clipped as well as truncated: the plate is a fixed 260 wide, and a
              long quest name would otherwise run straight off the edge. */}
          <clipPath id="awardTextClip">
            <rect x="66" y="38" width="182" height="22" />
          </clipPath>
          <text
            x="72"
            y="53"
            fill="#c6c691"
            fontSize="14"
            fontWeight="800"
            fontFamily="var(--font-display), Georgia, serif"
            clipPath="url(#awardTextClip)"
          >
            {title.length > 19 ? `${title.slice(0, 18)}…` : title}
          </text>

          <g transform="translate(22, 20)" color="#9aa133">
            <Icon name={icon} size={36} />
          </g>

          <g style={{ mixBlendMode: "overlay" }} mask="url(#awardMask)">
            {FOIL.map((fill, index) => (
              <g
                key={index}
                style={{
                  transform: `rotate(${firstOverlayPosition + index * 10}deg)`,
                  transformOrigin: "center center",
                  transition: !disableInOutOverlayAnimation ? "transform 200ms ease-out" : "none",
                  animation:
                    disableOverlayAnimation || reduced
                      ? "none"
                      : `foilSweep${index + 1} 5s infinite`,
                  willChange: "transform",
                }}
              >
                <polygon
                  points="0,0 260,76 260,0 0,76"
                  fill={fill}
                  filter="url(#awardBlur)"
                  opacity="0.5"
                />
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
