/** Skeleton in the shape of a page head plus two panels, so the layout doesn't jump. */
export default function AppLoading() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="page-head">
        <div className="w-full">
          <div className="h-3 w-32 rounded bg-line" />
          <div className="mt-4 h-9 w-72 max-w-full rounded bg-line" />
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="h-[420px] rounded-[var(--radius-card)] border border-line bg-card" />
        <div className="flex flex-col gap-5">
          <div className="h-48 rounded-[var(--radius-card)] border border-line bg-card" />
          <div className="h-40 rounded-[var(--radius-card)] border border-line bg-card" />
        </div>
      </div>
    </div>
  );
}
