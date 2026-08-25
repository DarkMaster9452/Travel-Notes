import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState, PageHeader, Tag } from "@/components/sq/ui";
import { requireClient } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";

export const metadata: Metadata = { title: "Your submissions" };
export const dynamic = "force-dynamic";

const WHEN = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

/**
 * Everything this account has filed, newest first.
 *
 * The verdict is the point of the card, so it gets a tinted block of its own
 * rather than a chip in a corner. A decline carries the reader's note in their
 * own words, quoted — a reason somebody can act on is the difference between a
 * decline and a rejection.
 */
export default async function SubmissionsPage() {
  const user = await requireClient();

  const [submissions, entitlement] = await Promise.all([
    db.submission.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        quest: {
          select: {
            id: true,
            title: true,
            location: true,
            region: true,
            distance: true,
            elevationGain: true,
            duration: true,
          },
        },
      },
    }),
    getEntitlement(user.id),
  ]);

  const approved = submissions.filter((entry) => entry.status === "APPROVED").length;
  const waiting = submissions.filter((entry) => entry.status === "PENDING").length;

  return (
    <>
      <PageHeader
        kicker="Filed"
        title="Your submissions"
        lede={`${submissions.length} filed · ${approved} approved · ${waiting} waiting`}
        right={<Tag tone="green" small>{entitlement.definition.name.toUpperCase()}</Tag>}
      />

      {submissions.length === 0 ? (
        <EmptyState
          glyph="book"
          title="Nothing filed yet"
          body="Proof is what makes a quest count. File against the monthly, the weekly, or anything in the database."
          action={
            <Link href="/monthly" className="sq-btn sq-btn-primary sq-btn-sm">
              Open the monthly
            </Link>
          }
        />
      ) : (
        <div className="sq-stagger" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {submissions.map((entry, index) => {
            const declined = entry.status === "REJECTED";
            const settled = entry.status !== "PENDING";
            return (
              <article
                key={entry.id}
                className="sq-card"
                style={{
                  overflow: "hidden",
                  borderColor: declined ? "var(--signal)" : "var(--line-2)",
                  ["--i" as string]: index,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 14,
                    padding: "15px 22px",
                    borderBottom: "1px solid var(--line-2)",
                  }}
                >
                  <h2 className="sq-h2" style={{ fontSize: 19 }}>
                    {entry.quest.title}
                  </h2>
                  <Tag
                    tone={entry.status === "APPROVED" ? "green" : declined ? "stamp" : "plain"}
                    small
                  >
                    {entry.status === "APPROVED"
                      ? "Approved"
                      : declined
                        ? "Sent back"
                        : "In review"}
                  </Tag>
                </div>

                <div style={{ padding: "18px 22px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                  <p className="sq-mono" style={{ fontSize: 10.5, letterSpacing: "0.05em", color: "var(--ink-3)" }}>
                    {entry.quest.location} · {entry.quest.region}
                    {entry.period ? ` · ${entry.period === "MONTHLY" ? "monthly" : "weekly"} ${entry.slotKey ?? ""}` : ""}
                    {entry.retreated ? " · retreat" : ""}
                  </p>

                  <p
                    style={{
                      fontSize: 14,
                      lineHeight: 1.6,
                      fontStyle: "italic",
                      color: "var(--ink-2)",
                      textWrap: "pretty",
                    }}
                  >
                    {entry.note}
                  </p>

                  <div
                    className="sq-mono"
                    style={{
                      display: "flex",
                      gap: 16,
                      flexWrap: "wrap",
                      fontSize: 11,
                      letterSpacing: "0.05em",
                      color: "var(--ink-2)",
                    }}
                  >
                    <span>{entry.distance != null ? `${entry.distance.toFixed(1)} km` : "— km"}</span>
                    <span>{entry.elevation != null ? `${entry.elevation} m ↑` : "— m ↑"}</span>
                    <span>{entry.movingTime != null ? `${entry.movingTime} min` : "— moving"}</span>
                    <span>{entry.photos.length} {entry.photos.length === 1 ? "photo" : "photos"}</span>
                    {entry.stravaUrl ? <span style={{ color: "var(--signal)" }}>Strava attached</span> : null}
                  </div>

                  <div
                    style={{
                      padding: "14px 16px",
                      borderRadius: 10,
                      background: declined
                        ? "var(--signal-wash)"
                        : entry.status === "APPROVED"
                          ? "var(--color-accent-100)"
                          : "var(--paper-2)",
                    }}
                  >
                    <p style={{ fontSize: 13, lineHeight: 1.55 }}>
                      <b>
                        {entry.status === "APPROVED"
                          ? "Approved."
                          : declined
                            ? "Sent back."
                            : "Waiting on a reader."}
                      </b>{" "}
                      {settled && entry.reviewedAt
                        ? `Read ${WHEN.format(entry.reviewedAt)}.`
                        : "Nobody has read it yet — everything is read in the order it was filed."}
                    </p>
                    {declined && entry.reviewNote ? (
                      <p
                        style={{
                          marginTop: 10,
                          paddingLeft: 12,
                          borderLeft: "2px solid var(--signal)",
                          fontSize: 13,
                          lineHeight: 1.55,
                          fontStyle: "italic",
                          color: "var(--ink-2)",
                        }}
                      >
                        {entry.reviewNote}
                      </p>
                    ) : null}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <span className="sq-kicker-sm">Filed {WHEN.format(entry.createdAt)}</span>
                    <Link
                      href={
                        entry.status === "APPROVED"
                          ? `/quests/${entry.quest.id}`
                          : `/quests/${entry.quest.id}/proof`
                      }
                      style={{ fontSize: 13, whiteSpace: "nowrap" }}
                    >
                      {entry.status === "APPROVED"
                        ? "See the quest"
                        : declined
                          ? "Add to it and file again"
                          : "Edit while it waits"}{" "}
                      →
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
