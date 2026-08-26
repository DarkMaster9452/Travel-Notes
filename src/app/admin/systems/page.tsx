import type { Metadata } from "next";

import { SqSystemsSummary, SqSystemTile } from "@/components/sq/systems";
import { PageHeader, Tag } from "@/components/sq/ui";
import { GROUP_LABEL, readSystems, type SystemGroup } from "@/lib/admin/systems";
import { requireRank } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Systems · Admin" };
export const dynamic = "force-dynamic";

const ORDER: SystemGroup[] = ["core", "integration", "job"];

const GROUP_NOTE: Record<SystemGroup, string> = {
  core: "Probed directly. If one of these is red the product is not working.",
  integration:
    "Somebody else's server. Grey means this deployment was never given a key for it, which is a normal state, not a fault.",
  job: "Nothing can be probed on demand here — a job is healthy if it ran when it was supposed to, so these read the row each run writes on its way out.",
};

/**
 * Every system, grouped by what kind of thing it is.
 *
 * The grouping is the point. A red integration and a red core service mean
 * very different things — one is Stripe having an afternoon, the other is the
 * product being down — and a single flat list of ten tiles invites reading
 * them as equally serious.
 *
 * Admin rather than reader, matching the database browser: these tiles say
 * which third parties this deployment is wired to and how it is configured,
 * which is more than a reviewer needs to decide a photograph.
 */
export default async function AdminSystemsPage() {
  await requireRank("ADMIN");

  const systems = await readSystems();

  return (
    <>
      <PageHeader
        kicker="Is it working"
        title="Systems"
        lede="Ten things that have to work for the product to work. Every one of them is checked afresh when you load this — nothing here is a status page somebody remembered to update."
        right={<Tag small>{systems.length} systems</Tag>}
      />

      <div className="sq-card sq-pad-sm" style={{ marginBottom: 16 }}>
        <SqSystemsSummary systems={systems} />
      </div>

      {ORDER.map((group) => {
        const inGroup = systems.filter((system) => system.group === group);
        if (inGroup.length === 0) return null;

        return (
          <section key={group} style={{ marginBottom: 20 }}>
            <div className="sq-section-head" style={{ marginBottom: 12 }}>
              <h2 className="sq-h2" style={{ fontSize: 19 }}>
                {GROUP_LABEL[group]}
              </h2>
              <span className="sq-kicker-sm" style={{ fontSize: 10, letterSpacing: "0.08em" }}>
                {inGroup.length}
              </span>
            </div>

            <p style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--ink-3)", marginBottom: 14, maxWidth: 720 }}>
              {GROUP_NOTE[group]}
            </p>

            <div
              className="sq-stagger"
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(268px,1fr))", gap: 12 }}
            >
              {inGroup.map((system, index) => (
                <div key={system.id} style={{ ["--i" as string]: index, display: "flex" }}>
                  <SqSystemTile system={system} />
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <section className="sq-tinted sq-pad-sm">
        <h2 className="sq-h2" style={{ fontSize: 18, marginBottom: 10 }}>
          What the four words mean
        </h2>
        <ul style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 13, lineHeight: 1.55 }}>
          <li>
            <b>Up</b> — answered, in time, nothing to say.
          </li>
          <li>
            <b>Degraded</b> — answered, but slowly, or something behind it is backing up. Working, worth
            watching.
          </li>
          <li>
            <b>Down</b> — did not answer, refused, or in the case of a scheduled job, has not run when it
            should have.
          </li>
          <li>
            <b>Not wired up</b> — this deployment has no key for it. Grey rather than red on purpose: a
            board that cries wolf about a Stripe key nobody set is a board people stop reading.
          </li>
        </ul>
      </section>
    </>
  );
}
