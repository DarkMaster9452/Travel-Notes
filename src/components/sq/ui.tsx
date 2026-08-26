import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { CountUp } from "@/components/sq/count-up";
import { Glyph, type GlyphName } from "@/components/sq/icons";

/* -------------------------------------------------------------------------- */
/* Page header                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The header every screen opens with: mono kicker, Fraunces 44px H1, and a
 * right-hand cluster that is either figures or actions. It is one component
 * rather than a pattern repeated twenty-two times so the alignment can never
 * drift between the member side and the panel.
 */
export function PageHeader({
  kicker,
  title,
  lede,
  right,
}: {
  kicker?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="sq-head">
      <div className="sq-head-row">
        <div style={{ minWidth: 0 }}>
          {kicker ? <span className="sq-kicker">{kicker}</span> : null}
          <h1 className="sq-h1">{title}</h1>
          {lede ? <p className="sq-lede" style={{ marginTop: 12 }}>{lede}</p> : null}
        </div>
        {right ? <div className="sq-stats">{right}</div> : null}
      </div>
    </header>
  );
}

/** One figure in the right-hand cluster, or in a stat grid. */
export function Stat({
  value,
  label,
  count,
  countId,
  prefix,
}: {
  value: ReactNode;
  label: ReactNode;
  /** Numeric value to count up from zero. Omit for figures that are not numbers. */
  count?: number;
  countId?: string;
  prefix?: string;
}) {
  return (
    <span className="sq-stat">
      <b>
        {typeof count === "number" ? (
          <>
            {prefix}
            <CountUp value={count} id={countId} />
          </>
        ) : (
          value
        )}
      </b>
      <span>{label}</span>
    </span>
  );
}

/** The panel's stat grid: the same figure, tiled. */
export function StatGrid({ children }: { children: ReactNode }) {
  return (
    <section
      className="sq-grid sq-stagger"
      style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}
    >
      {children}
    </section>
  );
}

export function StatTile({
  value,
  label,
  note,
  count,
  countId,
  index = 0,
}: {
  value?: ReactNode;
  label: ReactNode;
  note?: ReactNode;
  count?: number;
  countId?: string;
  index?: number;
}) {
  return (
    <div
      className="sq-card sq-lift"
      style={{ padding: "16px 18px", "--i": index } as CSSProperties}
    >
      <p className="sq-kicker-sm">{label}</p>
      <b
        style={{
          display: "block",
          marginTop: 8,
          fontFamily: "var(--font-heading)",
          fontWeight: 600,
          fontSize: 28,
          lineHeight: 1,
        }}
      >
        {typeof count === "number" ? <CountUp value={count} id={countId} /> : value}
      </b>
      {note ? (
        <p style={{ marginTop: 7, fontSize: 12, color: "var(--ink-2)" }}>{note}</p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                    */
/* -------------------------------------------------------------------------- */

export function Panel({
  title,
  rule,
  action,
  children,
  padded = true,
  className = "sq-card",
  style,
}: {
  title?: ReactNode;
  /** The quiet line of copy beside a section heading. */
  rule?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  padded?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <section className={className} style={{ overflow: "hidden", ...style }}>
      {title ? (
        <div className="sq-section-head sq-rule-head">
          <h2 className="sq-h2">{title}</h2>
          {action ?? (rule ? <span className="sq-meta">{rule}</span> : null)}
        </div>
      ) : null}
      <div style={padded ? { padding: "16px 22px 20px" } : undefined}>{children}</div>
    </section>
  );
}

/** A dark figures slab — the one tinted block a screen is allowed. */
export function Slab({
  kicker,
  children,
  style,
}: {
  kicker?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div className="sq-slab" style={{ padding: "22px 26px", ...style }}>
      {kicker ? (
        <p className="sq-kicker-sm" style={{ marginBottom: 12 }}>
          {kicker}
        </p>
      ) : null}
      {children}
    </div>
  );
}

export function SlabFigures({
  figures,
  columns = 3,
}: {
  figures: { k: string; v: ReactNode }[];
  columns?: number;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns},minmax(0,1fr))`,
        gap: 10,
      }}
    >
      {figures.map((figure) => (
        <span key={figure.k}>
          <b
            style={{
              display: "block",
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              fontSize: 16,
              whiteSpace: "nowrap",
            }}
          >
            {figure.v}
          </b>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 8.5,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--forest-ink-3)",
            }}
          >
            {figure.k}
          </span>
        </span>
      ))}
    </div>
  );
}

/** The hairline-separated fact list inside a quest card. */
export function FactList({ facts }: { facts: { k: string; v: ReactNode }[] }) {
  return (
    <dl
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(100px,1fr))",
        gap: 1,
        background: "var(--line-2)",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      {facts.map((fact) => (
        <div key={fact.k} style={{ background: "var(--paper-2)", padding: "10px 12px" }}>
          <dt className="sq-kicker-sm" style={{ fontSize: 9.5 }}>
            {fact.k}
          </dt>
          <dd
            style={{
              marginTop: 4,
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              fontSize: 18,
              whiteSpace: "nowrap",
            }}
          >
            {fact.v}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* -------------------------------------------------------------------------- */
/* Small parts                                                                 */
/* -------------------------------------------------------------------------- */

export type TagTone = "plain" | "stamp" | "green" | "gold";

export function Tag({
  tone = "plain",
  small,
  children,
  style,
}: {
  tone?: TagTone;
  small?: boolean;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const toneClass =
    tone === "stamp"
      ? " sq-tag-stamp"
      : tone === "green"
        ? " sq-tag-green"
        : tone === "gold"
          ? " sq-tag-gold"
          : "";
  return (
    <span className={`sq-tag${toneClass}${small ? " sq-tag-xs" : ""}`} style={style}>
      {children}
    </span>
  );
}

export function Bar({ pct, fill }: { pct: number; fill?: string }) {
  const width = `${Math.max(0, Math.min(100, Math.round(pct)))}%`;
  return (
    <span className="sq-bar">
      <span style={{ width, background: fill }} />
    </span>
  );
}

export function Avatar({
  name,
  src,
  size = 40,
  square,
  tint,
}: {
  name: string;
  src?: string | null;
  size?: number;
  square?: boolean;
  tint?: string;
}) {
  return (
    <span
      className={`sq-avatar${square ? " sq-avatar-sq" : ""}`}
      style={{
        width: size,
        height: size,
        background: tint ?? tintFor(name),
        fontSize: Math.max(9, Math.round(size * 0.34)),
      }}
      aria-hidden="true"
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- member photos come from arbitrary hosts
        <img src={src} alt="" />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** A stable per-person tint from the green ramp, so a face keeps its colour. */
export function tintFor(name: string): string {
  const ramp = ["#a8bfa5", "#7e9a80", "#cbd8c4", "#b9c2a8", "#e2e9dd"];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % 9973;
  return ramp[hash % ramp.length];
}

/* -------------------------------------------------------------------------- */
/* States                                                                      */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  glyph = "ridge",
  title,
  body,
  action,
}: {
  glyph?: GlyphName;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="sq-empty">
      <span style={{ color: "var(--ink-3)" }}>
        <Glyph name={glyph} size={26} />
      </span>
      <b style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 20 }}>{title}</b>
      {body ? (
        <p style={{ fontSize: 13.5, maxWidth: "44ch", color: "var(--ink-2)" }}>{body}</p>
      ) : null}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "That didn't load",
  body,
  action,
}: {
  title?: string;
  body?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="sq-empty" style={{ borderColor: "var(--signal)" }}>
      <span style={{ color: "var(--signal)" }}>
        <Glyph name="cross" size={24} />
      </span>
      <b style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 20 }}>{title}</b>
      {body ? (
        <p style={{ fontSize: 13.5, maxWidth: "48ch", color: "var(--ink-2)" }}>{body}</p>
      ) : null}
      {action}
    </div>
  );
}

export function Skeleton({
  height = 14,
  width = "100%",
  radius = 6,
}: {
  height?: number;
  width?: number | string;
  radius?: number;
}) {
  return <span className="sq-skel" style={{ display: "block", height, width, borderRadius: radius }} />;
}

/** The shimmering placeholder every table and list falls back to while loading. */
export function SkeletonRows({ rows = 6, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="sq-rows" aria-hidden="true">
      {Array.from({ length: rows }, (_, row) => (
        <div
          key={row}
          className="sq-row"
          style={{ gridTemplateColumns: `repeat(${columns},minmax(0,1fr))` }}
        >
          {Array.from({ length: columns }, (_, column) => (
            <Skeleton key={column} width={column === 0 ? "60%" : "80%"} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Links                                                                       */
/* -------------------------------------------------------------------------- */

export function QuietLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} style={{ fontSize: 13 }}>
      {children}
    </Link>
  );
}
