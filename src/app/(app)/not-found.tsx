import { MapPinOff } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page";
import { getT } from "@/lib/i18n/server";

/** A 404 inside the app: the shell stays, and there are two ways on. */
export default async function AppNotFound() {
  const t = await getT();

  return (
    <>
      <PageHeader overline={t.app.state.notFoundOverline} title={t.app.state.notFoundTitle} />
      <Card>
        <EmptyState
          icon={MapPinOff}
          title={t.errors.notFound}
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink href="/dashboard">{t.nav.dashboard}</ButtonLink>
              <ButtonLink href="/quests" variant="secondary">
                {t.nav.quests}
              </ButtonLink>
            </div>
          }
        >
          {t.errors.notFoundBody}
        </EmptyState>
      </Card>
    </>
  );
}
