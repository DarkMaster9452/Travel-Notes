import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SqSticker } from "@/components/sq/sticker";
import { Avatar } from "@/components/sq/ui";
import { accentInk, FIGURE_INKS, heat, terrainInk } from "@/lib/accents";
import { requireClient } from "@/lib/auth/guards";
import { getPublicProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

const WHEN = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const SINCE = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" });
const NUMBER = new Intl.NumberFormat("en-GB");

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
 * It is also the one screen in the product that is allowed to be *theirs*.
 * The rest of the app is one house style on one paper; here the account's
 * `accent` prints the band behind their name, the figures come in four
 * different inks, the year strip shows the months they actually walked, and
 * the ground each quest crossed is a colour rather than another grey word. A
 * page about a person that looked like a table row was the thing to fix.
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

  const accent = accentInk(profile.accent);
  const walked = profile.months.reduce((sum, month) => sum + month.count, 0);
  const busiest = profile.months.reduce(
    (best, month) => (month.count > best.count ? month : best),
    profile.months[0] ?? { count: 0, label: "" },
  );

  const figures = profile.stats
    ? [
        { k: "Logged", v: NUMBER.format(profile.stats.logged) },
        { k: "Kilometres", v: NUMBER.format(Math.round(profile.stats.km)) },
        { k: "Metres up", v: NUMBER.format(Math.round(profile.stats.up)) },
        { k: "Regions", v: NUMBER.format(profile.stats.regions) },
      ]
    : [];

  return (
    <>
      <section className="sq-card" style={{ overflow: "hidden", padding: 0 }}>
        <div
          className="sq-profile-band"
          style={{ ["--band" as string]: accent.deep } as CSSProperties}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
            <span className="sq-kicker-sm" style={{ fontSize: 10, letterSpacing: "0.11em" }}>
              @{profile.handle}
              {profile.country ? ` · ${profile.country}` : ""}
            </span>
            <span className="sq-mono" style={{ fontSize: 10, letterSpacing: "0.08em" }}>
              Walking since {SINCE.format(profile.joinedAt)}
            </span>
          </div>

          <div className="sq-profile-face">
            <Avatar name={profile.name} size={104} />
          </div>
        </div>

        <div style={{ padding: "18px 26px 0", display: "flex", gap: 22, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <h1 style={{ fontSize: 34, lineHeight: 1.05, marginBottom: 8 }}>{profile.name}</h1>
            {profile.headline ? (
              <p style={{ fontSize: 15, lineHeight: 1.5, maxWidth: "46ch", color: "var(--ink-2)" }}>
                {profile.headline}
              </p>
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
          </div>
        </div>

        {figures.length > 0 ? (
          <div className="sq-figure-row">
            {figures.map((figure, index) => {
              const pen = FIGURE_INKS[index % FIGURE_INKS.length];
              return (
                <div
                  key={figure.k}
                  className="sq-figure-tile"
                  style={
                    {
                      "--ink": pen.ink,
                      "--wash": pen.wash,
                      "--edge": pen.edge,
                      "--i": index,
                    } as CSSProperties
                  }
                >
                  <b>{figure.v}</b>
                  <span>{figure.k}</span>
                </div>
              );
            })}
          </div>
        ) : null}
      </section>

      {profile.months.length > 0 ? (
        <article className="sq-card-flat" style={{ marginTop: 16, overflow: "hidden" }}>
          <div className="sq-section-head sq-rule-head">
            <h2 className="sq-h2">The last twelve months</h2>
            <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
              {walked === 0
                ? "Nothing approved yet"
                : busiest.count > 0
                  ? `Busiest: ${busiest.label}`
                  : `${walked} walked`}
            </span>
          </div>
          <div
            className="sq-year"
            style={
              { "--ink": accent.ink, "--wash": accent.wash, "--edge": accent.edge } as CSSProperties
            }
          >
            {profile.months.map((month, index) => (
              <div key={month.key} className="sq-year-month">
                <div
                  className="sq-year-cell"
                  data-heat={heat(month.count)}
                  style={{ ["--i" as string]: index }}
                  title={`${month.label} — ${month.count} ${month.count === 1 ? "quest" : "quests"}`}
                />
                <span>{month.short}</span>
              </div>
            ))}
          </div>
        </article>
      ) : null}

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
            <article className="sq-card-flat" style={{ overflow: "hidden" }}>
              <div className="sq-section-head sq-rule-head">
                <h2 className="sq-h2">Earned</h2>
                <span className="sq-mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
                  {profile.stickers.length}
                </span>
              </div>
              <div className="sq-sticker-scatter">
                {profile.stickers.map((sticker, index) => (
                  <span
                    key={sticker.id}
                    style={{ ["--tilt" as string]: tiltFor(index), display: "inline-flex" }}
                  >
                    <SqSticker
                      sticker={sticker.sticker}
                      size={58}
                      index={index}
                      title={sticker.label}
                    />
                  </span>
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

                  {activity.tags.length > 0 ? (
                    <div className="sq-terrain">
                      {[...new Set(activity.tags)].slice(0, 5).map((tag) => {
                        const pen = terrainInk(tag);
                        return (
                          <span
                            key={tag}
                            style={
                              {
                                "--ink": pen.ink,
                                "--wash": pen.wash,
                                "--edge": pen.edge,
                              } as CSSProperties
                            }
                          >
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  ) : null}

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

/** A fixed wobble rather than a random one, so a page does not reshuffle
 *  itself between the server's render and the browser's. */
function tiltFor(index: number): number {
  return [-5, 3, -2, 6, -4, 2][index % 6];
}
