import { Skeleton } from "@/components/ui/feedback";

/** Skeletons where the header and the first blocks will land, never a spinner. */
export default function AppLoading() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-10 w-2/3" />
      </div>
      <Skeleton className="h-64 rounded-dialog" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-40 rounded-card" />
        <Skeleton className="h-40 rounded-card" />
      </div>
    </div>
  );
}
