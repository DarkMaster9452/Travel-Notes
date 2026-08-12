import { Skeleton } from "@/components/ui/primitives";

/** Shown while a protected page streams in. */
export default function AppLoading() {
  return (
    <div className="px-5 pb-16 pt-10 sm:px-8 lg:px-12 lg:pt-14" role="status" aria-live="polite">
      <span className="sr-only">Finding your next adventure…</span>

      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-6 h-16 w-full max-w-2xl" />
      <Skeleton className="mt-4 h-16 w-full max-w-xl" />

      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        <Skeleton className="aspect-[16/11] lg:col-span-2" />
        <Skeleton className="aspect-[4/5]" />
      </div>

      <div className="mt-10 space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}
