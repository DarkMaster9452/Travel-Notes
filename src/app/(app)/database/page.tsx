import type { Metadata } from "next";

import { QuestDatabase } from "@/components/app/quest-database";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { getEntitlement } from "@/lib/entitlements";
import { getCatalogue, getCatalogueFilters } from "@/lib/quest/catalogue";
import { pluralise } from "@/lib/utils";

export const metadata: Metadata = { title: "Quests" };
export const dynamic = "force-dynamic";

export default async function QuestDatabasePage() {
  const user = await requireOnboardedUser();
  const entitlement = await getEntitlement(user.id);

  const catalogue = getCatalogue();
  const filters = getCatalogueFilters(catalogue);

  return (
    <main className="mx-auto max-w-[90rem] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <header>
        <p className="text-[0.6875rem] font-semibold tracking-[0.12em] uppercase text-muted">
          Quest database
        </p>
        <h1 className="mt-3 font-display text-3xl font-extrabold normal-case sm:text-4xl">
          Every place we can send you.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          {pluralise(catalogue.length, "place")} to choose from. Each supports a range of route
          lengths and difficulties rather than one fixed walk — which is how the same valley gives
          an evening loop or a full-day traverse. Unlocking one turns it into your quest.
        </p>
        {!entitlement.canUnlock && (
          <p className="mt-4 rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ink">
            You&apos;ve used all your free quests — browsing stays open, and upgrading unlocks
            these again.
          </p>
        )}
      </header>

      <div className="mt-8 rounded-xl border border-line bg-card p-5">
        <QuestDatabase
          entries={catalogue}
          countries={filters.countries}
          difficulties={filters.difficulties}
          durations={filters.durations}
          canUnlock={entitlement.canUnlock}
        />
      </div>
    </main>
  );
}
