"use client";

import { CircleAlert } from "lucide-react";
import { useEffect } from "react";

import { useT } from "@/components/i18n";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page";

/**
 * A screen that failed to load. The shell stays, so the way out is still on
 * screen; the page says nothing was lost and offers one retry.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <PageHeader overline={t.app.state.errorOverline} title={t.app.state.errorTitle} />
      <Card>
        <EmptyState
          icon={CircleAlert}
          title={t.errors.unreadable}
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={reset}>{t.errors.tryAgain}</Button>
              <ButtonLink href="/dashboard" variant="secondary">
                {t.errors.backToDashboard}
              </ButtonLink>
            </div>
          }
        >
          {t.errors.unreadableBody}
        </EmptyState>
        {error.digest ? (
          <p className="text-center font-mono text-caption text-subtle">{error.digest}</p>
        ) : null}
      </Card>
    </>
  );
}
