import type { Metadata } from "next";
import Link from "next/link";

import { StatGrid } from "@/components/admin/stat-grid";
import { Reveal } from "@/components/app/motion";
import { Avatar, Eyebrow, Panel, PanelHead, Tag } from "@/components/field";
import { getAdminOverview, LIVE_STATUSES } from "@/lib/admin/stats";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { stagger } from "@/lib/motion";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Users · Admin" };
export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "Everyone" },
  { key: "subscribers", label: "Subscribers" },
  { key: "free", label: "Free" },
  { key: "admins", label: "Staff" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function isFilter(value: string | undefined): value is FilterKey {
  return FILTERS.some((filter) => filter.key === value);
}

/**
 * Accounts.
 *
 * Lookup and filtering, and nothing that writes. Roles in particular are set in
 * the database by a human with a psql prompt: an admin panel that can promote
 * accounts is one compromised session away from making the attacker permanent,
 * and this product has few enough admins that the inconvenience is the point.
 */
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const filter: FilterKey = isFilter(
    typeof params.filter === "string" ? params.filter : undefined,
  )
    ? (params.filter as FilterKey)
    : "all";
  const query = typeof params.q === "string" ? params.q.trim() : "";

  const where = {
    ...(filter === "admins" ? { role: "ADMIN" as const } : {}),
    ...(filter === "subscribers"
      ? { subscription: { is: { status: { in: [...LIVE_STATUSES] } } } }
      : {}),
    ...(filter === "free"
      ? {
          role: "USER" as const,
          OR: [
            { subscription: { is: null } },
            { subscription: { is: { status: { notIn: [...LIVE_STATUSES] } } } },
          ],
        }
      : {}),
    ...(query
      ? {
          OR: [
            { email: { contains: query, mode: "insensitive" as const } },
            { name: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  // The headline figures come from the same place the overview reads them, so
  // "subscribers" and "new this week" cannot mean one thing on one page and
  // something slightly different on another.
  const [users, matched, overview] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        freeQuestsUsed: true,
        createdAt: true,
        subscription: { select: { plan: true, status: true, cancelAtPeriodEnd: true } },
        _count: { select: { history: true, sessions: true } },
      },
    }),
    db.user.count({ where }),
    getAdminOverview(),
  ]);

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>Accounts</Eyebrow>
          <h1>Users.</h1>
          <p>Lookup only. Roles are set in the database — nothing here writes one.</p>
        </div>
      </Reveal>

      <Reveal>
        <StatGrid
          items={[
            { label: "Customers", value: overview.customers },
            { label: "Subscribers", value: overview.subscribers },
            { label: "Staff", value: overview.admins },
            { label: "New this week", value: overview.newThisWeek },
          ]}
        />
      </Reveal>

      <Reveal delay={stagger(1)} className="mt-5">
        <Panel flush>
          <PanelHead
            title="Directory"
            aside={
              <Tag tone="ghost">
                {matched > users.length ? `${users.length} of ${matched}` : `${matched} matching`}
              </Tag>
            }
          />

          <div className="admin-filters">
            <nav aria-label="Filter">
              {FILTERS.map((item) => (
                <Link
                  key={item.key}
                  href={`/admin/users?filter=${item.key}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                  aria-current={item.key === filter ? "page" : undefined}
                  scroll={false}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <form action="/admin/users" className="admin-search" role="search">
              <input type="hidden" name="filter" value={filter} />
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Name or email"
                aria-label="Search accounts"
                className="input input-pill"
              />
              <button type="submit" className="btn btn-ghost btn-sm">
                Search
              </button>
            </form>
          </div>

          {users.length === 0 ? (
            <p className="chart-empty">No account matches that.</p>
          ) : (
            <ul>
              {users.map((user, index) => {
                const live =
                  user.subscription &&
                  LIVE_STATUSES.includes(user.subscription.status as "ACTIVE");

                return (
                  <Reveal
                    as="li"
                    key={user.id}
                    delay={stagger(index, 8)}
                    className="admin-row border-b border-line px-5 py-4 last:border-b-0"
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
                    <span className="meta hidden w-24 shrink-0 lg:inline">
                      {user.role === "ADMIN"
                        ? "—"
                        : `${user.freeQuestsUsed} free used`}
                    </span>
                    <span className="meta hidden w-28 shrink-0 md:inline">
                      {formatDate(user.createdAt)}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Tag tone={live ? "pine" : "ghost"}>
                        {live ? (user.subscription?.plan ?? "FREE") : "FREE"}
                      </Tag>
                      {user.subscription?.cancelAtPeriodEnd && <Tag tone="warm">Cancelling</Tag>}
                      {user.role === "ADMIN" && <Tag tone="warm">Admin</Tag>}
                    </span>
                  </Reveal>
                );
              })}
            </ul>
          )}
        </Panel>
      </Reveal>
    </>
  );
}
