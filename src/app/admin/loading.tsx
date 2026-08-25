import { Skeleton, SkeletonRows } from "@/components/sq/ui";

/** The panel's shape, while it loads. */
export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <header className="sq-head">
        <div className="sq-head-row">
          <div style={{ display: "grid", gap: 12, minWidth: 320, flex: 1 }}>
            <Skeleton width={120} height={11} />
            <Skeleton width="55%" height={34} radius={10} />
          </div>
          <Skeleton width={160} height={38} radius={8} />
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} height={92} radius={14} />
        ))}
      </div>

      <div className="sq-card" style={{ padding: 22 }}>
        <SkeletonRows rows={7} columns={5} />
      </div>
    </div>
  );
}
