import * as React from "react";

/**
 * The icon set used by the field-guide components, lifted from `index.html`.
 * Line weights and viewboxes are the originals — these are drawn to sit at
 * one size each, so they are not parameterised into a generic icon component.
 */

export type IconProps = React.SVGProps<SVGSVGElement>;

/** Map pin. Prefixes every location line. */
export function IconPin(props: IconProps) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" {...props}>
      <path
        d="M6 11S1.8 7.6 1.8 4.8a4.2 4.2 0 118.4 0C10.2 7.6 6 11 6 11z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle cx="6" cy="4.8" r="1.4" fill="currentColor" />
    </svg>
  );
}

/** Star. Only ever appears on a bonus challenge, in stamp ink. */
export function IconBonus(props: IconProps) {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true" {...props}>
      <path
        d="M8.5 1.5l2 4.4 4.8.6-3.5 3.3.9 4.7-4.2-2.3-4.2 2.3.9-4.7L1.7 6.5l4.8-.6 2-4.4z"
        stroke="#C4481B"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Shield with a tick. The safety notice, everywhere it appears. */
export function IconShield(props: IconProps) {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true" {...props}>
      <path
        d="M8.5 1.6l5.6 2.3v4.3c0 3.4-2.3 6.1-5.6 7.2-3.3-1.1-5.6-3.8-5.6-7.2V3.9l5.6-2.3z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M6.1 8.4l1.8 1.8 3.2-3.4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Circled tick. Approval verdicts. */
export function IconApproved(props: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <circle cx="10" cy="10" r="8.4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.2 10.2l2.6 2.6 5-5.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true" {...props}>
      <path
        d="M2.5 8l3.5 3.5L12.5 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconCross(props: IconProps) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true" {...props}>
      <path d="M4 4l7 7M11 4l-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconClose(props: IconProps) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true" {...props}>
      <path
        d="M3.5 3.5l8 8M11.5 3.5l-8 8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconArrowRight(props: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconClock(props: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" {...props}>
      <circle cx="9" cy="9" r="7.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 5v4.3l2.8 1.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Warning triangle. Reserved for the panel's notices, where it marks the two
 * loud tones — nothing else in the product raises an alarm.
 */
export function IconAlert(props: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path
        d="M8 1.9l6.4 11.2H1.6L8 1.9z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M8 6.2v3.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11.2" r="0.85" fill="currentColor" />
    </svg>
  );
}

/** Bell. Opens the panel's notices, and carries their count. */
export function IconBell(props: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4.4 12.4V8.2a4.6 4.6 0 019.2 0v4.2l1.2 1.7H3.2l1.2-1.7z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M7.3 15.3a1.8 1.8 0 003.4 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** Small ring used to bullet the fact list on a board post. */
export function IconDot(props: IconProps) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true" {...props}>
      <circle cx="6.5" cy="6.5" r="5.4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function IconLock(props: IconProps) {
  return (
    <svg viewBox="0 0 44 44" fill="none" aria-hidden="true" {...props}>
      <rect x="9" y="19" width="26" height="19" rx="4" stroke="currentColor" strokeWidth="2" />
      <path d="M15 19v-5a7 7 0 0114 0v5" stroke="currentColor" strokeWidth="2" />
      <circle cx="22" cy="28" r="2.4" fill="currentColor" />
    </svg>
  );
}

export function IconStrava(props: IconProps) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M5.6.5L1.9 7.7h2.2L5.6 4.8l1.5 2.9h2.2L5.6.5zm1.5 7.2l-1.1 2.1-1.1-2.1H3.1l2.9 5.3 2.9-5.3H7.1z" />
    </svg>
  );
}

/**
 * Navigation glyphs, for the sidebar.
 *
 * Line icons rather than emoji: an emoji is a colour glyph baked into the
 * platform font, so it cannot take the sidebar's ink or paper colour and
 * reads as decoration next to the mono labels. These are drawn at 24×24 in
 * the same stroke language as the rest of the set — 1.6 weight, round caps,
 * no fill — so they inherit `currentColor` and sit at one weight, one colour,
 * wherever they render.
 */

export function IconGrid(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="13" width="7.5" height="7.5" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function IconCompass(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="8.6" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M14.8 9.2l-1.9 4.4-4.4 1.9 1.9-4.4 4.4-1.9z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconInbox(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 12.5h4.3l1.4 2.4h4.6l1.4-2.4H20"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="4" y="6" width="16" height="13" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="9" cy="8.5" r="3.1" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3.6 19c.6-3 2.7-4.7 5.4-4.7s4.8 1.7 5.4 4.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M15.3 5.2c1.5.3 2.6 1.6 2.6 3.2s-1.1 2.9-2.6 3.2M18 14.6c1.9.5 3.2 1.9 3.6 4.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconMap(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M9 4.5L4 6.3v13.2L9 17.7l6 2.8 5-1.9V5.4l-5 1.9-6-2.8z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 4.5v13.2M15 7.3v13.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function IconMarker(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 21s-6.8-6.3-6.8-11.2a6.8 6.8 0 1113.6 0C18.8 14.7 12 21 12 21z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="9.8" r="2.3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function IconCoin(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="8.6" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M14.6 9a3 3 0 00-2.6-1.4c-1.7 0-3 1.5-3 3.4v2c0 1.9 1.3 3.4 3 3.4A3 3 0 0014.6 15M8.4 10.6h4.4M8.4 13.4h4.4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconDatabase(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <ellipse cx="12" cy="6" rx="7.5" ry="2.6" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4.5 6v12c0 1.4 3.4 2.6 7.5 2.6s7.5-1.2 7.5-2.6V6M4.5 12c0 1.4 3.4 2.6 7.5 2.6s7.5-1.2 7.5-2.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconSun(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="4.4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 2.8v2.6M12 18.6v2.6M4.5 12H7M17 12h2.5M6.6 6.6l1.8 1.8M15.6 15.6l1.8 1.8M17.4 6.6l-1.8 1.8M8.4 15.6l-1.8 1.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconCalendarDays(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="1.8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 9.6h17M8 3v3.6M16 3v3.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8.3" cy="13.6" r="1" fill="currentColor" />
      <circle cx="12" cy="13.6" r="1" fill="currentColor" />
      <circle cx="15.7" cy="13.6" r="1" fill="currentColor" />
    </svg>
  );
}

export function IconMountain(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M3 19L9.5 8l3.7 6.4 2.3-3.3L21 19H3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="17" cy="6.5" r="1.6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function IconBook(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4.5 5.4c1.9-.9 4.5-.9 7.5.4V19c-3-1.3-5.6-1.3-7.5-.4V5.4zM19.5 5.4c-1.9-.9-4.5-.9-7.5.4V19c3-1.3 5.6-1.3 7.5-.4V5.4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconBadge(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="9.4" r="5.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 13.8l-1.6 6.8L12 18l4.6 2.6-1.6-6.8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/** Speech bubble. The back-office room, and nothing else. */
export function IconChat(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M20.5 12.4c0 3.9-3.8 7-8.5 7a10 10 0 01-2.6-.34L4.2 20.8l1.1-3.5A6.6 6.6 0 013.5 12.4c0-3.9 3.8-7 8.5-7s8.5 3.1 8.5 7z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8.6 11.4h6.8M8.6 14.4h4.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconGear(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="3.1" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 3.6v2.3M12 18.1v2.3M20.4 12h-2.3M5.9 12H3.6M17.8 6.2l-1.6 1.6M7.8 16.2l-1.6 1.6M17.8 17.8l-1.6-1.6M7.8 7.8L6.2 6.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconSparkle(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 3.5l1.7 5 5 1.7-5 1.7-1.7 5-1.7-5-5-1.7 5-1.7 1.7-5z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconPencil(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M14.3 5.3l4.4 4.4M4 20l.9-4.2a2 2 0 01.55-1L15 5.3a1.7 1.7 0 012.4 0l1.3 1.3a1.7 1.7 0 010 2.4L8.2 18.5a2 2 0 01-1 .55L3 20"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconGoogle(props: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" {...props}>
      <path
        fill="#4285F4"
        d="M15.7 8.2c0-.6 0-1-.1-1.5H8v2.9h4.3a3.7 3.7 0 01-1.6 2.4v2h2.6c1.5-1.4 2.4-3.5 2.4-5.8z"
      />
      <path
        fill="#34A853"
        d="M8 16c2.2 0 4-.7 5.3-2l-2.6-2c-.7.5-1.6.8-2.7.8-2.1 0-3.9-1.4-4.5-3.3H.8v2.1A8 8 0 008 16z"
      />
      <path fill="#FBBC05" d="M3.5 9.5a4.8 4.8 0 010-3V4.4H.8a8 8 0 000 7.2l2.7-2.1z" />
      <path
        fill="#EA4335"
        d="M8 3.2c1.2 0 2.2.4 3 1.2l2.3-2.3A8 8 0 00.8 4.4l2.7 2.1C4.1 4.6 5.9 3.2 8 3.2z"
      />
    </svg>
  );
}

/** The wordmark's peak. Orange summit on a green outline. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg className={className ?? "mark"} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M2 25 L11 10 L16.5 19 L20 13.5 L30 25 Z" />
      <path className="peak" d="M11 10 L14.6 16 L7.4 16 Z" />
      <path d="M2 29 H30" opacity=".35" />
    </svg>
  );
}

/**
 * The issued seal. Watermarked into the corner of every quest document; the
 * lower word changes with what the document is — ISSUED, SAMPLE, LOGGED.
 */
export function Seal({ label = "ISSUED" }: { label?: string }) {
  return (
    <svg className="seal" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="46" />
      <circle cx="50" cy="50" r="38" />
      <path d="M30 60 L42 40 L50 52 L56 44 L70 60 Z" />
      <text x="50" y="26" textAnchor="middle">
        SUMMIT QUEST
      </text>
      <text x="50" y="80" textAnchor="middle">
        {label}
      </text>
    </svg>
  );
}

/** The contour backdrop behind the hero and the closing call to action. */
export function Contours({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "contours"}
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <path d="M600 400c-90 0-150 30-150 70s70 60 150 60 150-25 150-60-60-70-150-70z" />
      <path d="M600 350c-140 0-235 48-235 116s110 100 235 100 235-38 235-100-95-116-235-116z" />
      <path d="M600 300c-190 0-320 66-320 162s150 140 320 140 320-52 320-140-130-162-320-162z" />
      <path d="M600 250c-240 0-405 84-405 208s190 180 405 180 405-66 405-180-165-208-405-208z" />
      <path d="M600 200c-290 0-490 102-490 254s230 220 490 220 490-80 490-220-200-254-490-254z" />
      <path d="M600 150c-340 0-575 120-575 300s270 260 575 260 575-94 575-260-235-300-575-300z" />
      <path d="M600 100c-390 0-660 138-660 346s310 300 660 300 660-108 660-300-270-346-660-346z" />
      <path d="M600 50c-440 0-745 156-745 392s350 340 745 340 745-122 745-340S1040 50 600 50z" />
      <path d="M600 0C130 0-195 168-195 438s375 380 795 380 795-136 795-380S1070 0 600 0z" />
    </svg>
  );
}
