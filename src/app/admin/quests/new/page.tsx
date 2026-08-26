import type { Metadata } from "next";

import { EMPTY_QUEST, SqQuestEditor } from "@/components/sq/quest-editor";
import { PageHeader } from "@/components/sq/ui";
import { requireRank } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Write a quest · Admin" };
export const dynamic = "force-dynamic";

/** A new quest. Saved as a draft unless the publish switch is on. */
export default async function NewQuestPage() {
  await requireRank("WRITER");

  return (
    <>
      <PageHeader
        kicker="The engine"
        title="Write a quest"
        lede="Quests are authored here and nowhere else. A draft is invisible to members and cannot be booked into a slot."
      />
      <SqQuestEditor draft={EMPTY_QUEST} />
    </>
  );
}
