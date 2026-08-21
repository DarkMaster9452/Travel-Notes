import { CountUp, Stagger } from "@/components/app/motion";

export type StatItem = {
  label: string;
  value: number;
  /** Change against the previous comparable window. Signed. */
  delta?: number;
  deltaLabel?: string;
  /** A line under the number — a rate, a qualifier, a caveat. */
  foot?: string;
  /** Rendered as-is instead of counting up (money, percentages). */
  display?: string;
};

/**
 * The row of figures at the top of an admin page.
 *
 * The cells are dealt left to right and the numbers count up when they arrive,
 * because that draws the eye to the one thing that changed since the last look.
 * The deltas do neither: a delta is read once, and a moving minus sign is just
 * noise next to a figure that is already moving.
 */
export function StatGrid({ items }: { items: StatItem[] }) {
  return (
    <Stagger
      as="dl"
      className="stat-grid"
      select=".stat-cell"
      style={{ ["--stat-columns" as string]: String(items.length) }}
    >
      {items.map((item) => (
        <div key={item.label} className="stat-cell">
          <dt className="meta">{item.label}</dt>
          <dd>
            <span className="stat-value">
              {item.display ?? <CountUp value={item.value} />}
            </span>
            {item.delta !== undefined && item.delta !== 0 && (
              <span className={item.delta > 0 ? "stat-delta up" : "stat-delta down"}>
                {item.delta > 0 ? "▲" : "▼"} {Math.abs(item.delta)}
                {item.deltaLabel ? ` ${item.deltaLabel}` : ""}
              </span>
            )}
            {item.foot && <span className="stat-foot">{item.foot}</span>}
          </dd>
        </div>
      ))}
    </Stagger>
  );
}
