import type { Metadata } from "next";

import { Reveal } from "@/components/app/motion";
import { stagger } from "@/lib/motion";
import { Avatar, Eyebrow, Panel, Tag } from "@/components/field";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Users · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireAdmin();

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      subscription: { select: { plan: true, status: true } },
      _count: { select: { history: true } },
    },
  });

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>Accounts</Eyebrow>
          <h1>Users.</h1>
          <p>Lookup only. Roles are set in the database — nothing here writes one.</p>
        </div>
        <Tag tone="ghost">{`${users.length} shown`}</Tag>
      </Reveal>

      <Panel flush>
        <ul>
          {users.map((user, index) => (
            <Reveal
              as="li"
              key={user.id}
              delay={stagger(index, 8)}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-5 py-4 last:border-b-0"
            >
              <Avatar
                name={user.name}
                className="size-9 flex-[0_0_2.25rem] rounded-[11px] text-[12px]"
              />
              <span className="min-w-[min(100%,14rem)] flex-1">
                <b className="block text-[15px] font-semibold">{user.name}</b>
                <span className="meta normal-case tracking-[0.06em]">{user.email}</span>
              </span>
              <span className="meta w-24 shrink-0">{user._count.history} issued</span>
              <span className="meta hidden w-28 shrink-0 md:inline">
                {formatDate(user.createdAt)}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <Tag tone="ghost">{user.subscription?.plan ?? "FREE"}</Tag>
                {user.role === "ADMIN" && <Tag tone="warm">Admin</Tag>}
              </span>
            </Reveal>
          ))}
        </ul>
      </Panel>
    </>
  );
}
