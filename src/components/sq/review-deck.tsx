"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { Glyph, StravaMark } from "@/components/sq/icons";
import { useReducedMotion } from "@/components/sq/motion";
import { useToast } from "@/components/sq/toast";
import type { ProofCell, ReviewCardData } from "@/lib/admin/review-queue";

export type Verdict = "yes" | "no";

type LogEntry = { id: string; name: string; quest: string; verdict: Verdict };

const COMMIT_PX = 110;
const RAMP_PX = 90;
const FLY_MS = 320;

/**
 * The review deck.
 *
 * Two cards are on screen at a time: the one being read and the shape of the
 * one behind it, which is what makes the deck feel like a stack rather than a
 * page that replaces itself. Everything else is a consequence of that —
 * the drag is on the top card, the second card is the one that grows into
 * place, and a third fades in underneath as the stack shortens.
 *
 * The verdict is optimistic. A reader gets through a sitting at the speed
 * they can read, not at the speed of a round trip, so the card leaves
 * immediately and the write follows; a failure puts the card back and says so
 * rather than silently losing a decision.
 *
 * Under reduced motion the card does not fly — a button or an arrow key
 * commits instantly, and dragging is still available for anyone who wants it.
 */
export function SqReviewDeck({
  cards,
  onDecide,
  onUndo,
}: {
  cards: ReviewCardData[];
  onDecide: (id: string, approve: boolean) => Promise<{ ok: boolean; message?: string }>;
  onUndo: (id: string) => Promise<{ ok: boolean; message?: string }>;
}) {
  const [cursor, setCursor] = useState(0);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [flying, setFlying] = useState<Verdict | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [, startTransition] = useTransition();

  const startX = useRef(0);
  const reduced = useReducedMotion();
  const toast = useToast();

  const current = cards[cursor] ?? null;

  const commit = useCallback(
    (verdict: Verdict) => {
      const card = cards[cursor];
      if (!card || flying) return;

      const advance = () => {
        setFlying(null);
        setDx(0);
        setDragging(false);
        setCursor((value) => value + 1);
        setLog((entries) =>
          [
            { id: card.id, name: shortName(card.personName), quest: card.title, verdict },
            ...entries,
          ].slice(0, 5),
        );
      };

      if (reduced) advance();
      else {
        setFlying(verdict);
        window.setTimeout(advance, FLY_MS);
      }

      startTransition(() => {
        void onDecide(card.id, verdict === "yes").then((result) => {
          if (!result.ok) {
            toast(result.message ?? "That verdict didn't save.", "stamp");
            setCursor((value) => Math.max(0, value - 1));
            setLog((entries) => entries.filter((entry) => entry.id !== card.id));
          }
        });
      });
    },
    [cards, cursor, flying, onDecide, reduced, toast],
  );

  const undo = useCallback(() => {
    const last = log[0];
    if (!last) return;
    setLog((entries) => entries.slice(1));
    setCursor((value) => Math.max(0, value - 1));
    setDx(0);
    startTransition(() => {
      void onUndo(last.id).then((result) => {
        if (!result.ok) toast(result.message ?? "That one could not be put back.", "stamp");
      });
    });
  }, [log, onUndo, toast]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        commit("yes");
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        commit("no");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commit]);

  const waiting = Math.max(0, cards.length - cursor);
  const approved = log.filter((entry) => entry.verdict === "yes").length;
  const declined = log.length - approved;

  const visible = cards.slice(cursor, cursor + 2);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))",
        gap: 26,
        alignItems: "start",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div className="sq-deck">
          {visible.map((card, offset) => {
            const top = offset === 0;
            const lift = top ? dx : 0;
            const flyClass =
              top && flying ? (flying === "yes" ? "sq-deck-fly-yes" : "sq-deck-fly-no") : "";

            return (
              <article
                key={card.id}
                className={`sq-deck-card ${flyClass}`}
                data-top={top ? "1" : "0"}
                data-dragging={dragging && top ? "1" : "0"}
                style={{
                  zIndex: 10 - offset,
                  opacity: top ? 1 : 0.55,
                  transform: top
                    ? `translateX(${lift}px) rotate(${lift * 0.045}deg)`
                    : "scale(0.965) translateY(12px)",
                  transition:
                    dragging && top
                      ? "none"
                      : "transform 0.42s cubic-bezier(0.34,1.3,0.5,1), opacity 0.42s cubic-bezier(0.34,1.3,0.5,1)",
                }}
                onPointerDown={
                  top
                    ? (event) => {
                        event.currentTarget.setPointerCapture(event.pointerId);
                        startX.current = event.clientX;
                        setDragging(true);
                        setDx(0);
                      }
                    : undefined
                }
                onPointerMove={
                  top
                    ? (event) => {
                        if (!dragging) return;
                        setDx(event.clientX - startX.current);
                      }
                    : undefined
                }
                onPointerUp={
                  top
                    ? () => {
                        if (dx > COMMIT_PX) return commit("yes");
                        if (dx < -COMMIT_PX) return commit("no");
                        setDragging(false);
                        setDx(0);
                      }
                    : undefined
                }
                onPointerCancel={
                  top
                    ? () => {
                        setDragging(false);
                        setDx(0);
                      }
                    : undefined
                }
              >
                <DeckCardBody card={card} />

                <span
                  className="sq-deck-stamp sq-deck-stamp-yes"
                  style={{ opacity: top ? ramp(lift) : 0 }}
                  aria-hidden="true"
                >
                  Approve
                </span>
                <span
                  className="sq-deck-stamp sq-deck-stamp-no"
                  style={{ opacity: top ? ramp(-lift) : 0 }}
                  aria-hidden="true"
                >
                  Send back
                </span>
              </article>
            );
          })}

          {!current ? (
            <div className="sq-deck-empty">
              <div style={{ display: "grid", gap: 10, justifyItems: "center" }}>
                <b style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 22 }}>
                  Queue clear
                </b>
                <p style={{ fontSize: 13, color: "var(--ink-2)" }}>
                  {log.length > 0
                    ? `${log.length === 1 ? "One" : log.length} read this sitting. Nothing is waiting on a reader.`
                    : "Nothing is waiting on a reader."}
                </p>
                {log.length > 0 ? (
                  <button type="button" className="sq-btn sq-btn-outline sq-btn-sm" onClick={undo}>
                    Undo the last one
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <button
            type="button"
            aria-label="Send back"
            disabled={!current}
            onClick={() => commit("no")}
            style={{
              width: 58,
              height: 58,
              borderRadius: 999,
              border: "1px solid var(--signal)",
              background: "var(--card)",
              color: "var(--signal)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <Glyph name="cross" size={22} strokeWidth={2} />
          </button>

          <span
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
              minWidth: 56,
            }}
          >
            <b style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 20, lineHeight: 1 }}>
              {waiting}
            </b>
            <span className="sq-kicker-sm" style={{ fontSize: 9 }}>
              waiting
            </span>
            <button
              type="button"
              onClick={undo}
              disabled={log.length === 0}
              className="sq-kicker-sm"
              style={{
                marginTop: 4,
                border: 0,
                background: "transparent",
                fontSize: 9,
                cursor: "pointer",
              }}
            >
              Undo
            </button>
          </span>

          <button
            type="button"
            aria-label="Approve"
            disabled={!current}
            onClick={() => commit("yes")}
            style={{
              width: 58,
              height: 58,
              borderRadius: 999,
              border: 0,
              background: "var(--pine)",
              color: "#eff0e5",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <Glyph name="check" size={24} strokeWidth={2.2} />
          </button>
        </div>

        <p
          className="sq-kicker-sm"
          style={{ textAlign: "center", maxWidth: 340, lineHeight: 1.6, textTransform: "none" }}
        >
          Drag the card, use the buttons, or press ← and → · {approved} approved · {declined}{" "}
          declined this sitting
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <section className="sq-card sq-pad-sm">
          <h2 className="sq-h2" style={{ fontSize: 20, marginBottom: 14 }}>
            What you have decided
          </h2>
          <div style={{ display: "flex", gap: 22, marginBottom: 16 }}>
            <Tally value={approved} label="Approved" />
            <Tally value={declined} label="Sent back" />
            <Tally value={waiting} label="Left in queue" muted />
          </div>
          <ul className="sq-verdict-log">
            {log.map((entry) => (
              <li
                key={`${entry.id}-${entry.verdict}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "10px 0",
                  borderTop: "1px solid var(--line-2)",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    flex: "0 0 7px",
                    background: entry.verdict === "yes" ? "var(--moss)" : "var(--signal)",
                  }}
                />
                <span style={{ flex: 1, minWidth: 0, fontSize: 13.5 }}>
                  {entry.name} · {entry.quest}
                </span>
                <span
                  className="sq-kicker-sm"
                  style={{
                    fontSize: 10,
                    color: entry.verdict === "yes" ? "var(--moss)" : "var(--signal)",
                  }}
                >
                  {entry.verdict === "yes" ? "Approved" : "Sent back"}
                </span>
              </li>
            ))}
            {log.length === 0 ? (
              <li
                style={{
                  padding: "10px 0",
                  borderTop: "1px solid var(--line-2)",
                  fontSize: 13,
                  color: "var(--ink-3)",
                }}
              >
                Nothing decided in this sitting yet.
              </li>
            ) : null}
          </ul>
        </section>

        <section className="sq-tinted sq-pad-sm">
          <h2 className="sq-h2" style={{ fontSize: 20, marginBottom: 6 }}>
            How the queue is dealt
          </h2>
          <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)", marginBottom: 14 }}>
            The order is fixed, so the reader never picks who waits.
          </p>
          <ol style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {[
              "Monthly proof first, then weekly — both are filed against a window that closes.",
              "Then by plan: Ultra, Explorer, free.",
              "Oldest first inside a tier.",
              "Everything else follows, in the order it arrived.",
            ].map((rule, index) => (
              <li key={rule} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <b
                  className="sq-mono"
                  style={{
                    fontWeight: 400,
                    fontSize: 12,
                    color: "var(--ink-3)",
                    flex: "0 0 22px",
                    paddingTop: 2,
                  }}
                >
                  {String(index + 1).padStart(2, "0")}
                </b>
                <span style={{ fontSize: 13.5, lineHeight: 1.5 }}>{rule}</span>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="sq-card"
          style={{ borderColor: "var(--line)", padding: "20px 22px", boxShadow: "none" }}
        >
          <h3 className="sq-h2" style={{ fontSize: 17, marginBottom: 12 }}>
            Sending back is not a punishment
          </h3>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--ink-2)" }}>
            A declined submission keeps its photos and its note, and the filer can add to it and
            file again inside the same window. Only a window that has closed makes a verdict final.
          </p>
        </section>
      </div>
    </div>
  );
}

function Tally({ value, label, muted }: { value: number; label: string; muted?: boolean }) {
  return (
    <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <b
        style={{
          fontFamily: "var(--font-heading)",
          fontWeight: 600,
          fontSize: 28,
          lineHeight: 1,
          color: muted ? "var(--ink-3)" : undefined,
        }}
      >
        {value}
      </b>
      <span className="sq-kicker-sm" style={{ fontSize: 9.5 }}>
        {label}
      </span>
    </span>
  );
}

function DeckCardBody({ card }: { card: ReviewCardData }) {
  const photos = card.photos.slice(0, 3);
  const columns = Math.max(1, Math.min(card.photos.length, 3));

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span className="sq-kicker-sm" style={{ flex: 1, minWidth: 0, fontSize: 9.5 }}>
          {card.questNo} · {card.personName}
        </span>
        {card.cadence ? (
          <span className="sq-tag sq-tag-stamp sq-tag-xs">{card.cadence}</span>
        ) : null}
        {card.retreated ? <span className="sq-tag sq-tag-xs">Retreat</span> : null}
        <span
          className="sq-tag sq-tag-xs"
          style={{
            background: card.hard ? "#fbe7de" : "#e2e9dd",
            color: card.hard ? "var(--signal)" : "#21402f",
          }}
        >
          {card.grade}
        </span>
      </div>

      <div>
        <p className="sq-kicker-sm" style={{ fontSize: 9.5, letterSpacing: "0.08em", marginBottom: 5 }}>
          {card.where}
        </p>
        <h2 style={{ fontSize: 21, lineHeight: 1.15 }}>{card.title}</h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns},minmax(0,1fr))`,
          gap: 2,
          borderRadius: 12,
          overflow: "hidden",
          flex: 1,
          minHeight: 104,
        }}
      >
        {photos.length > 0 ? (
          photos.map((photo, index) => (
            <span
              key={photo}
              style={{
                background: "var(--paper-3)",
                display: "grid",
                placeItems: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {index === 2 && card.photoLabel ? (
                <span className="sq-kicker-sm" style={{ fontSize: 8.5, letterSpacing: "0.07em" }}>
                  {card.photoLabel}
                </span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- proof photos are user uploads on arbitrary hosts
                <img
                  src={photo}
                  alt={`Proof photo ${index + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  draggable={false}
                />
              )}
            </span>
          ))
        ) : (
          <span
            style={{
              background: "var(--paper-3)",
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              padding: 6,
            }}
          >
            <span className="sq-kicker-sm" style={{ fontSize: 8.5, letterSpacing: "0.07em" }}>
              No photos filed
            </span>
          </span>
        )}
      </div>

      <p
        style={{
          fontSize: 12.5,
          lineHeight: 1.5,
          fontStyle: "italic",
          color: "var(--ink-2)",
          textWrap: "pretty",
        }}
      >
        {card.note}
      </p>

      <div className="sq-proof-grid">
        {card.cells.map((entry) => (
          <ProofCellView key={entry.label} cell={entry} />
        ))}
      </div>

      {card.stravaUrl ? (
        <span
          className="sq-mono"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            fontSize: 10,
            letterSpacing: "0.05em",
            color: "var(--signal)",
          }}
        >
          <StravaMark />
          Strava activity attached
        </span>
      ) : null}

      {card.flags.length > 0 ? (
        <ul className="sq-flags">
          {card.flags.map((flag) => (
            <li
              key={flag}
              style={{ fontSize: 11.5, lineHeight: 1.4, color: "var(--color-accent-2-700)" }}
            >
              {flag}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

function ProofCellView({ cell }: { cell: ProofCell }) {
  return (
    <div className="sq-proof-cell" data-off={cell.off ? "1" : "0"}>
      <b
        style={{
          color: cell.missing ? "#848a78" : cell.off ? "var(--signal)" : "#141a16",
        }}
      >
        {cell.value}
      </b>
      <span>{cell.label}</span>
    </div>
  );
}

/** "Lucia Bednárová" → "Lucia B." — the log is a reminder, not a record. */
function shortName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts[0] ?? name;
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function ramp(value: number): number {
  return Math.min(1, Math.max(0, value / RAMP_PX));
}
