import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";

import { SqFilterBar, SqParamSearch, SqParamSelect } from "@/components/sq/controls";
import { Avatar, EmptyState, PageHeader, StatGrid, StatTile, Tag } from "@/components/sq/ui";
import { ROLE_LABEL, STAFF_ROLES } from "@/lib/admin/access";
import { requireRank } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Users · Admin" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 60;
const LIVE = ["ACTIVE", "TRIALING", "PAST_DUE"] as const;
const JOINED = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "2-digit" });

const PLAN_TONE: Record<string, { bg: string; fg: string }> = {
  ULTRA: { bg: "var(--pine)", fg: "#f9faf3" },
  EXPLORER: { bg: "var(--color-accent-100)", fg: "var(--color-accent-700)" },
  FREE: { bg: "var(--paper-2)", fg: "var(--ink-2)" },
};

/**
 * The directory.
 *
 * Read-only about roles, on purpose: what an account *is* is set on Panel
 * access, where the consequences of setting it are written down beside the
 * switch. This screen answers "who is this and what do they hold", which is
 * the question a support message actually asks.
 */
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; plan?: string; state?: string; page?: string }>;
}) {
  await requireRank("ADMIN");
  const params = await searchParams;

  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const search = (params.q ?? "").trim();
  const plan = params.plan ?? "all";
  const state = params.state ?? "all";

  const where: Prisma.UserWhereInput = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  // Plan and state can both constrain the subscription, so they are ANDed
  // rather than assigned: "Explorer" and "payment retrying" together is a real
  // question, and the second filter overwriting the first would answer a
  // different one without saying so.
  const and: Prisma.UserWhereInput[] = [];
  if (plan === "FREE") and.push({ subscription: { is: null } });
  else if (plan !== "all") {
    and.push({ subscription: { is: { plan: plan as "EXPLORER" | "ULTRA", status: { in: [...LIVE] } } } });
  }
  if (state === "staff") and.push({ role: { in: [...STAFF_ROLES] } });
  if (state === "members") and.push({ role: "USER" });
  if (state === "pastdue") and.push({ subscription: { is: { status: "PAST_DUE" } } });
  if (and.length > 0) where.AND = and;

  const [total, users, counts] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        freeQuestsUsed: true,
        createdAt: true,
        subscription: { select: { plan: true, status: true, cancelAtPeriodEnd: true } },
        _count: { select: { history: true, submissions: true } },
      },
    }),
    Promise.all([
      db.user.count({ where: { role: "USER" } }),
      db.user.count({ where: { role: { in: [...STAFF_ROLES] } } }),
      db.subscription.count({ where: { status: { in: [...LIVE] } } }),
      db.subscription.count({ where: { status: "PAST_DUE" } }),
    ]),
  ]);

  const [members, staff, subscribers, pastDue] = counts;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader
        kicker="Accounts"
        title="Users"
        lede="Every account, and what it holds. Roles are set on Panel access, where the consequences are written down beside the switch."
        right={
          <Link href="/admin/access" className="sq-btn sq-btn-ghost">
            Staff &amp; panel access
          </Link>
        }
      />

      <StatGrid>
        <StatTile label="Members" count={members} countId="users-members" index={0} />
        <StatTile label="Staff" count={staff} countId="users-staff" index={1} />
        <StatTile label="Subscribers" count={subscribers} countId="users-subs" index={2} />
        <StatTile
          label="Payment retrying"
          count={pastDue}
          countId="users-pastdue"
          note={pastDue > 0 ? "Access holds while Paddle retries" : undefined}
          index={3}
        />
      </StatGrid>

      <div style={{ marginTop: 16 }}>
        <SqFilterBar>
          <SqParamSearch name="q" value={search} label="Find" placeholder="Name or email" />
          <SqParamSelect
            name="plan"
            value={plan}
            label="Plan"
            options={[
              { value: "all", label: "Any plan" },
              { value: "ULTRA", label: "Ultra" },
              { value: "EXPLORER", label: "Explorer" },
              { value: "FREE", label: "Free" },
            ]}
          />
          <SqParamSelect
            name="state"
            value={state}
            label="Kind"
            options={[
              { value: "all", label: "Everyone" },
              { value: "members", label: "Members" },
              { value: "staff", label: "Staff" },
              { value: "pastdue", label: "Payment retrying" },
            ]}
          />
        </SqFilterBar>
      </div>

      <section className="sq-card" style={{ overflow: "hidden" }}>
        <div className="sq-section-head sq-rule-head">
          <h2 className="sq-h2" style={{ fontSize: 19 }}>
            Directory
          </h2>
          <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
            {users.length} of {total.toLocaleString("en-GB")}
          </span>
        </div>

        {users.length === 0 ? (
          <div style={{ padding: 26 }}>
            <EmptyState glyph="users" title="No account matches that" body="Clear a filter and try again." />
          </div>
        ) : (
          <div className="sq-scroll-x">
            <ul className="sq-stagger" style={{ minWidth: 864 }}>
              {users.map((user, index) => {
                const live =
                  user.subscription && LIVE.includes(user.subscription.status as "ACTIVE")
                    ? user.subscription.plan
                    : "FREE";
                const tone = PLAN_TONE[live] ?? PLAN_TONE.FREE;

                return (
                  <li key={user.id} style={{ ["--i" as string]: index }}>
                    <Link
                      href={`/admin/users/${user.id}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(224px,1fr) 96px 104px 104px 236px",
                        gap: 14,
                        alignItems: "center",
                        padding: "13px 22px",
                        borderTop: "1px solid var(--line-2)",
                        color: "var(--color-text)",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                        <Avatar name={user.name} size={36} square />
                        <span style={{ minWidth: 0 }}>
                          <b
                            style={{
                              display: "block",
                              fontSize: 15,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {user.name}
                          </b>
                          <span
                            className="sq-mono"
                            style={{
                              display: "block",
                              fontSize: 10.5,
                              letterSpacing: "0.05em",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              color: "var(--ink-3)",
                            }}
                          >
                            {user.email}
                          </span>
                        </span>
                      </span>

                      <span className="sq-mono" style={{ fontSize: 10.5, whiteSpace: "nowrap", color: "var(--ink-3)" }}>
                        {user._count.history} issued
                      </span>
                      <span className="sq-mono" style={{ fontSize: 10.5, whiteSpace: "nowrap", color: "var(--ink-3)" }}>
                        {user.freeQuestsUsed} free used
                      </span>
                      <span className="sq-mono" style={{ fontSize: 10.5, whiteSpace: "nowrap", color: "var(--ink-3)" }}>
                        {JOINED.format(user.createdAt)}
                      </span>

                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 7,
                          minWidth: 0,
                        }}
                      >
                        {user.role !== "USER" ? <Tag small>{ROLE_LABEL[user.role].toUpperCase()}</Tag> : null}
                        <span
                          className="sq-tag sq-tag-xs"
                          style={{ background: tone.bg, color: tone.fg }}
                        >
                          {live}
                        </span>
                        {user.subscription?.status === "PAST_DUE" ? (
                          <Tag tone="stamp" small>
                            RETRYING
                          </Tag>
                        ) : user.subscription?.cancelAtPeriodEnd ? (
                          <Tag tone="stamp" small>
                            LEAVING
                          </Tag>
                        ) : null}
                        <span className="sq-mono" style={{ fontSize: 10.5, whiteSpace: "nowrap", color: "var(--ink-2)" }}>
                          Open
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {pages > 1 ? (
        <nav style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 18 }} aria-label="Pages">
          {page > 1 ? (
            <Link className="sq-btn sq-btn-ghost sq-btn-sm" href={href(params, page - 1)}>
              ← Newer
            </Link>
          ) : null}
          <span className="sq-mono" style={{ alignSelf: "center", fontSize: 11, color: "var(--ink-3)" }}>
            {page} of {pages}
          </span>
          {page < pages ? (
            <Link className="sq-btn sq-btn-ghost sq-btn-sm" href={href(params, page + 1)}>
              Older →
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}

function href(params: Record<string, string | undefined>, page: number): string {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "page") next.set(key, value);
  }
  next.set("page", String(page));
  return `/admin/users?${next.toString()}`;
}
