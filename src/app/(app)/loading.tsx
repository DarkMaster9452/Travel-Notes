import { Skeleton, SkeletonRows } from "@/components/sq/ui";

/**
 * What a member sees while a page is still coming.
 *
 * Shaped like the page rather than a spinner: a header block, a stat cluster
 * and rows. A skeleton that matches the layout means nothing jumps when the
 * data lands.
 */
export default function AppLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <header className="sq-head">
        <div className="sq-head-row">
          <div style={{ display: "grid", gap: 12, minWidth: 320, flex: 1 }}>
            <Skeleton width={140} height={11} />
            <Skeleton width="70%" height={38} radius={10} />
          </div>
          <div className="sq-stats">
            <Skeleton width={90} height={44} radius={8} />
            <Skeleton width={90} height={44} radius={8} />
          </div>
        </div>
      </header>

      <div className="sq-card" style={{ padding: 22 }}>
        <SkeletonRows rows={6} columns={4} />
      </div>
    </div>
  );
}
