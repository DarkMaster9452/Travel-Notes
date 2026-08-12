"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Kicker } from "@/components/ui/primitives";

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
    <main className="flex min-h-[70dvh] flex-col justify-center px-5 py-16 sm:px-10">
      <div className="max-w-xl">
        <Kicker className="text-ember">Something went sideways</Kicker>
        <h1 className="display-md mt-4">We couldn&apos;t find an adventure right now.</h1>
        <p className="mt-5 text-sm leading-relaxed text-stone">
          The trail is still there, we just lost the map for a second. Try again — nothing you had
          saved is affected.
        </p>
        {error.digest && <p className="mt-3 text-xs text-stone/70">Reference: {error.digest}</p>}

        <div className="mt-8 flex gap-3">
          <Button onClick={reset} size="lg">
            Try again
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="/dashboard">Back to dashboard</a>
          </Button>
        </div>
      </div>
    </main>
  );
}
