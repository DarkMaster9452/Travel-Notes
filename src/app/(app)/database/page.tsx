import type { Metadata } from "next";

import { QuestDatabase } from "@/components/app/quest-database";
import { Kicker } from "@/components/ui/primitives";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { getCatalogue, getCatalogueFilters } from "@/lib/quest/catalogue";
import { pluralise } from "@/lib/utils";

export const metadata: Metadata = { title: "Quest database" };

export default async function QuestDatabasePage() {
  await requireOnboardedUser();

  const catalogue = getCatalogue();
  const filters = getCatalogueFilters(catalogue);

  return (
    <main className="px-4 pb-16 pt-6 sm:px-6 lg:px-10">
      <header className="border-b border-ink/12 pb-8">
        <Kicker>Quest database</Kicker>
        <h1 className="display-md mt-4 max-w-[18ch]">Every place we can send you.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone">
          {pluralise(catalogue.length, "place")} the generator draws from. Each one supports a range
          of route lengths and difficulties rather than a single fixed walk — which is how the same
          valley can produce an evening loop and a full-day traverse without repeating itself.
        </p>
      </header>

      <div className="pt-8">
        <QuestDatabase
          entries={catalogue}
          countries={filters.countries}
          difficulties={filters.difficulties}
          durations={filters.durations}
        />
      </div>
    </main>
  );
}
