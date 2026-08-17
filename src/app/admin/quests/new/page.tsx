import type { Metadata } from "next";
import Link from "next/link";

import { QuestForm } from "@/components/admin/quest-form";
import { Reveal } from "@/components/app/motion";
import { Eyebrow } from "@/components/field";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "New quest · Admin" };

export default async function NewQuestPage() {
  await requireAdmin();

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>🗺️ Authoring</Eyebrow>
          <h1>New quest.</h1>
          <p>
            Quests are written by admins and by nobody else. Everything the issued document shows
            is asked for here.
          </p>
        </div>
        <Link href="/admin/quests" className="btn btn-ghost btn-sm">
          Back to quests
        </Link>
      </Reveal>

      <Reveal>
        <div className="mx-auto max-w-[760px]">
          <QuestForm />
        </div>
      </Reveal>
    </>
  );
}
