/** Shown while a protected page streams in. */
export default function AppLoading() {
  return (
    <div className="space-y-4 py-4" role="status" aria-live="polite">
      <span className="sr-only">…</span>
      <div className="h-4 w-40 animate-pulse rounded bg-cream/10" />
      <div className="h-64 animate-pulse rounded-[14px] bg-cream/10" />
      <div className="h-16 animate-pulse rounded-[12px] bg-cream/10" />
      <div className="h-16 animate-pulse rounded-[12px] bg-cream/10" />
    </div>
  );
}
