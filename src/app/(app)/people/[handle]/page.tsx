import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SqSticker } from "@/components/sq/sticker";
import { Avatar } from "@/components/sq/ui";
import { requireClient } from "@/lib/auth/guards";
import { getPublicProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

const WHEN = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const SINCE = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" });

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  return { title: `@${handle}` };
}

/**
 * Somebody's page.
 *
 * A page about a person for the people they might walk with: what they have
 * logged, what they have said about it, where else to find them. Every section
 * is a switch they hold, and a section switched off is simply absent — never
 * shown as a blank, because an empty profile should read as private rather
 * than as unfinished.
 *
 * An unpublished handle and a handle that does not exist are indistinguishable
 * from here, on purpose: the directory must not be usable to confirm that
 * somebody has an account.
 */
export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const user = await requireClient();
  const { handle } = await params;

  const profile = await getPublicProfile(handle, user.id);
  if (!profile) notFound();

  return (
    <>
      <section
        className="sq-card"
        style={{ padding: 26, display: "flex", gap: 22, alignItems: "flex-start", flexWrap: "wrap" }}
      >
        <Avatar name={profile.name} size={112} />

        <div style={{ flex: 1, minWidth: 220 }}>
          <p className="sq-kicker-sm" style={{ marginBottom: 8, fontSize: 10, letterSpacing: "0.1em" }}>
            @{profile.handle}
            {profile.country ? ` · ${profile.country}` : ""}
          </p>
          <h1 style={{ fontSize: 34, lineHeight: 1.05, marginBottom: 8 }}>{profile.name}</h1>
          {profile.headline ? (
            <p style={{ fontSize: 15, lineHeight: 1.5, maxWidth: "46ch", color: "var(--ink-2)", marginBottom: 16 }}>
              {profile.headline}
            </p>
          ) : null}

          {profile.stats ? (
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {[
                { k: "Logged", v: profile.stats.logged },
                { k: "Kilometres", v: Math.round(profile.stats.km) },
                { k: "Metres up", v: Math.round(profile.stats.up) },
                { k: "Regions", v: profile.stats.regions },
              ].map((stat) => (
                <span key={stat.k} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <b style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 24, lineHeight: 1 }}>
                    {stat.v}
                  </b>
                  <span className="sq-kicker-sm" style={{ fontSize: 9.5 }}>
                    {stat.k}
                  </span>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 9, minWidth: 150 }}>
          {profile.isSelf ? (
            <Link href="/settings/profile" className="sq-btn sq-btn-primary">
              Edit your page
            </Link>
          ) : (
            <Link href="/people?tab=groups" className="sq-btn sq-btn-ghost">
              Walk together
            </Link>
          )}
          <span className="sq-kicker-sm" style={{ textAlign: "center", fontSize: 9.5 }}>
            Walking since {SINCE.format(profile.joinedAt)}
          </span>
        </div>
      </section>

      <div className="sq-grid sq-grid-fit-md" style={{ marginTop: 16, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {profile.bio ? (
            <article className="sq-card-flat">
              <div style={{ padding: "15px 22px", borderBottom: "1px solid var(--line-2)" }}>
                <h2 className="sq-h2">About</h2>
              </div>
              <p
                style={{
                  padding: "18px 22px",
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: "var(--ink-2)",
                  textWrap: "pretty",
                }}
              >
                {profile.bio}
              </p>
            </article>
          ) : null}

          {profile.socials.length > 0 ? (
            <article className="sq-card-flat">
              <div style={{ padding: "15px 22px", borderBottom: "1px solid var(--line-2)" }}>
                <h2 className="sq-h2">Elsewhere</h2>
              </div>
              <ul>
                {profile.socials.map((social) => (
                  <li
                    key={social.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "13px 22px",
                      borderTop: "1px solid var(--line-2)",
                    }}
                  >
                    <span className="sq-kicker-sm" style={{ fontSize: 10, letterSpacing: "0.08em" }}>
                      {social.key}
                    </span>
                    <a href={social.href} rel="noreferrer noopener nofollow" target="_blank">
                      <b style={{ fontSize: 13.5, fontWeight: 600 }}>{social.handle}</b>
                    </a>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}

          {profile.stickers.length > 0 ? (
            <article className="sq-card-flat">
              <div className="sq-section-head sq-rule-head">
                <h2 className="sq-h2">Earned</h2>
                <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
                  {profile.stickers.length}
                </span>
              </div>
              <div
                style={{
                  padding: "18px 22px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(56px,1fr))",
                  gap: 10,
                }}
              >
                {profile.stickers.map((sticker, index) => (
                  <SqSticker
                    key={sticker.id}
                    sticker={sticker.sticker}
                    size={54}
                    index={index}
                    title={sticker.label}
                  />
                ))}
              </div>
            </article>
          ) : null}
        </div>

        <article className="sq-card" style={{ overflow: "hidden" }}>
          <div className="sq-section-head sq-rule-head">
            <h2 className="sq-h2">What {firstName(profile.name)} has walked</h2>
            <span className="sq-kicker-sm" style={{ fontSize: 10 }}>
              Approved only
            </span>
          </div>

          {profile.activities.length === 0 ? (
            <p style={{ padding: "18px 22px", fontSize: 13, color: "var(--ink-3)" }}>
              Nothing approved yet. Only proof a reader has passed shows up here.
            </p>
          ) : (
            <ul className="sq-stagger">
              {profile.activities.map((activity, index) => (
                <li
                  key={activity.id}
                  style={{
                    padding: "18px 22px",
                    borderTop: "1px solid var(--line-2)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 11,
                    ["--i" as string]: index,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                    <b style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 17, lineHeight: 1.2 }}>
                      {activity.title}
                    </b>
                    <span
                      className="sq-mono"
                      style={{ fontSize: 10, letterSpacing: "0.06em", whiteSpace: "nowrap", color: "var(--ink-3)" }}
                    >
                      {WHEN.format(activity.loggedAt)}
                    </span>
                  </div>
                  <span className="sq-kicker-sm" style={{ fontSize: 10, letterSpacing: "0.07em" }}>
                    {activity.location} · {activity.region}
                    {activity.retreated ? " · retreat" : ""}
                  </span>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                      gap: 1,
                      background: "var(--line-2)",
                      borderRadius: 8,
                      overflow: "hidden",
                    }}
                  >
                    {[
                      { k: "km", v: activity.distance != null ? activity.distance.toFixed(1) : "—" },
                      { k: "m ↑", v: activity.elevation != null ? String(activity.elevation) : "—" },
                      { k: "moving", v: activity.movingTime != null ? `${activity.movingTime}m` : "—" },
                    ].map((fact) => (
                      <span key={fact.k} style={{ background: "var(--paper-2)", padding: "9px 11px" }}>
                        <b style={{ display: "block", fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 16 }}>
                          {fact.v}
                        </b>
                        <span className="sq-kicker-sm" style={{ fontSize: 8.5, letterSpacing: "0.07em" }}>
                          {fact.k}
                        </span>
                      </span>
                    ))}
                  </div>

                  <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)", textWrap: "pretty" }}>
                    {activity.note}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </>
  );
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

