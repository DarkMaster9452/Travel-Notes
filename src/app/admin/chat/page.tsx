import type { Metadata } from "next";

import { ChatRoom } from "@/components/admin/chat-room";
import { Reveal } from "@/components/app/motion";
import { Eyebrow, Panel, PanelHead, Tag } from "@/components/field";
import { loadMessages } from "@/lib/admin/chat";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Back office · Admin" };
export const dynamic = "force-dynamic";

/**
 * The back office.
 *
 * Staff only, and only reachable from the admin panel — there is no customer
 * route to it and `requireAdmin` guards the page as well as every action that
 * writes to it.
 *
 * One room. There are a handful of people here and one subject, so channels
 * would only be places for things to be filed and then not read. It exists
 * because the decisions this panel is used to make — why a submission was
 * declined, which quest is going in next month, who is covering the weekend —
 * were being made somewhere else entirely and then not written down anywhere
 * near the thing they were about.
 */
export default async function AdminChatPage() {
  const admin = await requireAdmin();

  const [messages, admins] = await Promise.all([
    loadMessages(admin.id),
    db.user.findMany({
      where: { role: "ADMIN" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>Staff only</Eyebrow>
          <h1>Back office.</h1>
          <p>
            One room, every admin, nothing customer-facing. Everything said here stays — it is a
            record of what was decided, not a place messages go to disappear.
          </p>
        </div>
        <Tag tone="ghost">{`${admins.length} ${admins.length === 1 ? "admin" : "admins"}`}</Tag>
      </Reveal>

      <Reveal>
        <Panel flush>
          <PanelHead
            title="The room"
            aside={
              <span className="chat-who">
                {admins.map((person) => (
                  <span key={person.id}>{person.name.split(" ")[0]}</span>
                ))}
              </span>
            }
          />
          <ChatRoom initial={messages} meId={admin.id} meName={admin.name} />
        </Panel>
      </Reveal>

      <Reveal className="mt-5">
        <p className="note text-center">
          Visible to anybody who can open this panel, and to nobody else. You can edit or delete
          what you wrote; you cannot edit what somebody else wrote.
        </p>
      </Reveal>
    </>
  );
}
