"use client";

import * as React from "react";

import { Button } from "@/components/stopa/ui";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[app] unhandled error", error);
  }, [error]);

  return (
    <main className="flex min-h-[60dvh] flex-col justify-center">
      <h1 className="font-serif text-3xl">Niečo sa pokazilo.</h1>
      <p className="mt-3 max-w-md leading-relaxed text-moss">
        Skús to znova — nič, čo si poslal, sa nestratilo.
      </p>
      {error.digest && <p className="mt-2 text-xs text-moss/70">Ref: {error.digest}</p>}
      <div className="mt-7 flex gap-3">
        <Button onClick={reset}>Skúsiť znova</Button>
        <Button asChild variant="outline">
          <a href="/home">Na domov</a>
        </Button>
      </div>
    </main>
  );
}
