"use client";

import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { activatePlanAction } from "@/app/(app)/settings/plan-actions";
import { Glyph } from "@/components/sq/icons";
import { useT } from "@/components/sq/i18n";
import { useToast } from "@/components/sq/toast";
import { capabilityCopy, type Capability } from "@/lib/config";
import { SHAPE_RADIUS, type StickerShape } from "@/lib/stickers";

/**
 * Turning a plan on, and the moment afterwards.
 *
 * The button and the celebration live in one component because the second is
 * the consequence of the first and splitting them would mean passing the news
 * through a query string. Nothing is asked for here: the postal address is
 * queued server-side as a nudge for the following day, so this screen stays a
 * celebration rather than becoming a form with a banner on top.
 *
 * The whole thing is CSS. Under `prefers-reduced-motion` the house `--motion`
 * token is 0, which flattens the travel and the spin to nothing while leaving
 * the fades — and the confetti is dropped entirely, because a thing whose only
 * content is movement has nothing left when the movement is taken away.
 */

/** The scraps that fly out. Shapes and inks from the sticker sheet. */
const CONFETTI: { shape: StickerShape; ink: string }[] = [
  { shape: "disc", ink: "#f2c14e" },
  { shape: "leaf", ink: "#3a6047" },
  { shape: "shield", ink: "#c4481b" },
  { shape: "blob", ink: "#26596f" },
  { shape: "arch", ink: "#a8bfa5" },
  { shape: "leafFlipped", ink: "#d9a13c" },
  { shape: "disc", ink: "#2c5540" },
  { shape: "blob", ink: "#e8622f" },
];

const SCRAPS = 22;

export function SqActivateButton({
  plan,
  label,
  gains,
  variant = "primary",
}: {
  plan: "explorer" | "ultra";
  label: string;
  /** What this account does not have yet and would get. Drives the list. */
  gains: Capability[];
  variant?: "primary" | "ghost";
}) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [unlocked, setUnlocked] = useState<{ name: string } | null>(null);

  return (
    <>
      <button
        type="button"
        className={`sq-btn ${variant === "primary" ? "sq-btn-primary" : "sq-btn-ghost"}`}
        disabled={pending}
        onClick={() => {
          start(async () => {
            const result = await activatePlanAction(plan);
            if (!result.ok) {
              toast(result.message, "stamp");
              return;
            }
            setUnlocked({ name: result.name });
          });
        }}
      >
        {pending ? t.unlock.unlocking : label}
      </button>

      {unlocked ? (
        <SqUnlockCelebration
          name={unlocked.name}
          gains={gains}
          onClose={() => {
            setUnlocked(null);
            // The page behind this was rendered for the old plan. Refreshing on
            // the way out is what makes the locked panels open rather than
            // needing a reload nobody would think to do.
            router.refresh();
          }}
        />
      ) : null}
    </>
  );
}

export function SqUnlockCelebration({
  name,
  gains,
  onClose,
}: {
  name: string;
  gains: Capability[];
  onClose: () => void;
}) {
  const t = useT();

  return (
    <div className="sq-unlock" role="dialog" aria-modal="true" aria-label={`${name} unlocked`}>
      <div className="sq-unlock-scrim" onClick={onClose} />

      <div className="sq-unlock-card">
        <div className="sq-unlock-burst" aria-hidden>
          {Array.from({ length: SCRAPS }, (_, index) => {
            const piece = CONFETTI[index % CONFETTI.length];
            // Deterministic rather than random: the same burst every time, so
            // it cannot land differently on a re-render mid-animation.
            const angle = (index * 360) / SCRAPS + (index % 3) * 7;
            const distance = 118 + ((index * 37) % 96);
            const size = 9 + ((index * 13) % 9);
            return (
              <i
                key={index}
                style={
                  {
                    "--angle": `${angle}deg`,
                    "--distance": `${distance}px`,
                    "--spin": `${index % 2 === 0 ? 1 : -1}turn`,
                    "--delay": `${(index % 6) * 26}ms`,
                    width: size,
                    height: size,
                    borderRadius: SHAPE_RADIUS[piece.shape],
                    background: piece.ink,
                  } as CSSProperties
                }
              />
            );
          })}
        </div>

        <div className="sq-unlock-seal" aria-hidden>
          <svg viewBox="0 0 88 88" width="88" height="88">
            <circle
              className="sq-unlock-ring"
              cx="44"
              cy="44"
              r="38"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <g className="sq-unlock-mark">
              <path
                d="M27 52 L40 34 L48 45 L54 38 L62 52 Z"
                fill="currentColor"
                opacity="0.92"
              />
              <circle cx="58" cy="28" r="4.5" fill="currentColor" opacity="0.6" />
            </g>
          </svg>
        </div>

        <p className="sq-kicker" style={{ marginBottom: 10 }}>
          {t.unlock.unlocked}
        </p>
        <h2 className="sq-unlock-title">{name}</h2>
        <p className="sq-unlock-lede">{t.unlock.lede}</p>

        {gains.length > 0 ? (
          <ul className="sq-unlock-list">
            {gains.slice(0, 6).map((capability, index) => (
              <li key={capability} style={{ ["--i" as string]: index }}>
                <span>
                  <Glyph name="check" size={14} strokeWidth={2.6} />
                </span>
                <b>{capabilityCopy(t, capability).title}</b>
                <i>{capabilityCopy(t, capability).detail}</i>
              </li>
            ))}
          </ul>
        ) : null}

        {gains.includes("mail") ? (
          <p className="sq-unlock-note">{t.unlock.envelopeNote}</p>
        ) : null}

        <button type="button" className="sq-btn sq-btn-primary sq-unlock-go" onClick={onClose}>
          {t.unlock.good}
        </button>
      </div>
    </div>
  );
}
