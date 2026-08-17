"use client";

import * as React from "react";

import { EmptyState, IconShield } from "@/components/field";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[app]", error);
  }, [error]);

  return (
    <EmptyState
      icon={<IconShield width={40} height={40} />}
      title="That didn't load."
      action={
        <button type="button" className="btn btn-primary" onClick={reset}>
          Try again
        </button>
      }
    >
      Something on our side gave out rather than anything you did. Trying again usually settles it.
    </EmptyState>
  );
}
