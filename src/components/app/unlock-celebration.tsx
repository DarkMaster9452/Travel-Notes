"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { Celebration } from "@/components/app/celebration";

/**
 * Fires the arrival animation when a reader lands on a quest they just
 * unlocked (`?celebrate=unlocked`).
 *
 * What to show is derived from the URL rather than copied into state on mount:
 * stripping the parameter re-renders this component, and state seeded in an
 * effect was being wiped by that same navigation before the dialog could
 * appear. The parameter is only cleared once the reader dismisses, so a
 * refresh mid-celebration still shows it and a shared link never does.
 */
export function UnlockCelebration({ questTitle }: { questTitle: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [dismissed, setDismissed] = React.useState(false);
  const celebrating = searchParams.get("celebrate") === "unlocked" && !dismissed;

  const items = celebrating
    ? [
        {
          id: "unlocked",
          eyebrow: "Quest unlocked",
          title: questTitle,
          message: "It's yours now. Go and find it, then mark it complete.",
          icon: "compass" as const,
        },
      ]
    : [];

  return (
    <Celebration
      items={items}
      onDismiss={() => {
        setDismissed(true);
        router.replace(pathname, { scroll: false });
      }}
    />
  );
}
