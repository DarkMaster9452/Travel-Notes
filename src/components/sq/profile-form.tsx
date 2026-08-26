"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { savePublicProfileAction, type PublicProfileState } from "@/app/(app)/profile/public-actions";
import { Glyph } from "@/components/sq/icons";
import { useT } from "@/components/sq/i18n";
import { ACCENT_INK, ACCENT_KEYS } from "@/lib/accents";

export type ProfileDraft = {
  handle: string;
  published: boolean;
  displayName: string;
  headline: string;
  bio: string;
  instagram: string;
  facebook: string;
  strava: string;
  accent: string;
  showStats: boolean;
  showCountry: boolean;
  showActivities: boolean;
  showStickers: boolean;
  showActivityGrid: boolean;
};

/**
 * The public page editor.
 *
 * Publishing is the only privacy control there is, so it sits at the top as a
 * switch with the consequence spelled out beside it rather than buried under
 * the fields it governs. Every section switch below it is a real switch: a
 * section turned off is absent from the page, not blank on it.
 */
export function SqProfileForm({ draft }: { draft: ProfileDraft }) {
  const t = useT();
  const [state, action, pending] = useActionState<PublicProfileState, FormData>(
    savePublicProfileAction,
    undefined,
  );

  const [published, setPublished] = useState(draft.published);
  const [toggles, setToggles] = useState({
    showStats: draft.showStats,
    showCountry: draft.showCountry,
    showActivities: draft.showActivities,
    showStickers: draft.showStickers,
    showActivityGrid: draft.showActivityGrid,
  });

  const errors = state && !state.ok ? state.errors : {};

  return (
    <form action={action}>
      <section className="sq-card" style={{ overflow: "hidden", marginBottom: 16 }}>
        <div className="sq-section-head sq-rule-head">
          <h2 className="sq-h2" style={{ fontSize: 19 }}>
            Your public page
          </h2>
          {state?.ok ? (
            <Link href={`/people/${state.handle}`} style={{ fontSize: 12.5 }}>
              See it →
            </Link>
          ) : draft.published ? (
            <Link href={`/people/${draft.handle}`} style={{ fontSize: 12.5 }}>
              See it →
            </Link>
          ) : null}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) auto",
            gap: 18,
            alignItems: "center",
            padding: "16px 24px",
            borderBottom: "1px solid var(--line-2)",
          }}
        >
          <span>
            <b style={{ display: "block", fontSize: 14.5, fontWeight: 600 }}>Published</b>
            <span style={{ display: "block", marginTop: 5, fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-2)" }}>
              Visible to signed-in members only, and never indexed. Un-publishing takes it away
              immediately.
            </span>
          </span>
          <input type="hidden" name="published" value={published ? "true" : "false"} />
          <button
            type="button"
            role="switch"
            aria-checked={published}
            aria-label="Published"
            className="sq-switch"
            onClick={() => setPublished((value) => !value)}
          >
            <i />
          </button>
        </div>

        <div style={{ padding: "18px 24px", display: "grid", gap: 14 }}>
          <label className="sq-field">
            <span className="sq-label">Handle</span>
            <input className="sq-input" name="handle" defaultValue={draft.handle} maxLength={30} required />
            {errors?.handle ? <span className="sq-error">{errors.handle}</span> : null}
            <span className="sq-hint">The bit after /people/. Letters, numbers and hyphens.</span>
          </label>

          <label className="sq-field">
            <span className="sq-label">Name on the page</span>
            <input
              className="sq-input"
              name="displayName"
              defaultValue={draft.displayName}
              maxLength={60}
              placeholder="Leave empty to use the name on the account"
            />
          </label>

          <label className="sq-field">
            <span className="sq-label">One line</span>
            <input
              className="sq-input"
              name="headline"
              defaultValue={draft.headline}
              maxLength={90}
              placeholder="Slow up, slower down. Mostly the Fatras."
            />
          </label>

          <label className="sq-field">
            <span className="sq-label">About</span>
            <textarea className="sq-textarea" name="bio" defaultValue={draft.bio} maxLength={600} />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14 }}>
            <label className="sq-field">
              <span className="sq-label">Instagram</span>
              <input className="sq-input" name="instagram" defaultValue={draft.instagram} maxLength={120} />
            </label>
            <label className="sq-field">
              <span className="sq-label">Facebook</span>
              <input className="sq-input" name="facebook" defaultValue={draft.facebook} maxLength={120} />
            </label>
            <label className="sq-field">
              <span className="sq-label">Strava</span>
              <input className="sq-input" name="strava" defaultValue={draft.strava} maxLength={120} />
            </label>
          </div>

          {/* Swatches rather than a dropdown. The accent is the one thing on
              this form whose effect is purely visual, and a list of seven
              words asks somebody to imagine seven colours they have never
              seen. */}
          <fieldset className="sq-field" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="sq-label" style={{ padding: 0 }}>
              Accent
            </legend>
            <p style={{ fontSize: 12, color: "var(--ink-2)", margin: "0 0 10px" }}>
              The ink your page is printed in — the band behind your name, and the year strip.
            </p>
            <div className="sq-swatches">
              {ACCENT_KEYS.map((key) => (
                <label key={key} className="sq-swatch" title={ACCENT_INK[key].label}>
                  <input
                    type="radio"
                    name="accent"
                    value={key}
                    defaultChecked={draft.accent === key}
                  />
                  <span
                    aria-hidden
                    style={{
                      background: ACCENT_INK[key].deep,
                      borderColor: ACCENT_INK[key].edge,
                    }}
                  />
                  <b>{ACCENT_INK[key].label}</b>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <ul>
          {(
            [
              ["showStats", t.profile.switches.stats.label, t.profile.switches.stats.detail],
              ["showCountry", t.profile.switches.country.label, t.profile.switches.country.detail],
              [
                "showActivities",
                t.profile.switches.activities.label,
                t.profile.switches.activities.detail,
              ],
              ["showStickers", t.profile.switches.stickers.label, t.profile.switches.stickers.detail],
              [
                "showActivityGrid",
                t.profile.switches.activityGrid.label,
                t.profile.switches.activityGrid.detail,
              ],
            ] as const
          ).map(([key, label, description]) => (
            <li
              key={key}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,1fr) auto",
                gap: 18,
                alignItems: "center",
                padding: "15px 24px",
                borderTop: "1px solid var(--line-2)",
              }}
            >
              <span style={{ minWidth: 0 }}>
                <b style={{ display: "block", fontSize: 14.5, fontWeight: 600 }}>{label}</b>
                <span style={{ display: "block", marginTop: 5, fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-2)" }}>
                  {description}
                </span>
              </span>
              <input type="hidden" name={key} value={toggles[key] ? "true" : "false"} />
              <button
                type="button"
                role="switch"
                aria-checked={toggles[key]}
                aria-label={label}
                className="sq-switch"
                onClick={() => setToggles((current) => ({ ...current, [key]: !current[key] }))}
              >
                <i />
              </button>
            </li>
          ))}
        </ul>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            padding: "14px 24px",
            borderTop: "1px solid var(--line-2)",
            background: "var(--paper-2)",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 12.5, color: errors?.form ? "var(--signal)" : "var(--ink-2)" }}>
            {errors?.form ?? "Nothing you file is public unless this page is."}
          </span>
          <button type="submit" className="sq-btn sq-btn-primary sq-btn-sm" disabled={pending}>
            {pending ? "Saving…" : state?.ok ? <Glyph name="check" size={16} /> : "Save"}
          </button>
        </div>
      </section>
    </form>
  );
}
