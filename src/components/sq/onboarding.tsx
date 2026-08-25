"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";

import { updatePreferencesAction, type ProfileState } from "@/app/(app)/profile/actions";
import { saveDisplayAction } from "@/app/(app)/settings/actions";
import { Glyph } from "@/components/sq/icons";
import { SqCheckoutButton } from "@/components/sq/plan-actions";
import { useToast } from "@/components/sq/toast";

type Step = { key: string; label: string };

const STEPS: Step[] = [
  { key: "region", label: "Where you walk" },
  { key: "units", label: "How it reads" },
  { key: "plan", label: "Which plan" },
  { key: "strava", label: "Your watch" },
];

/**
 * Getting set up.
 *
 * A rail down the left with four steps and one panel at a time. Steps are not
 * gated on each other: somebody who wants to skip straight to the plan can,
 * and an answer already on file shows as answered rather than as blank.
 */
export function SqOnboarding({
  name,
  countries,
  current,
  billingEnabled,
  ultraEnabled,
  stravaEnabled: stravaConfigured,
}: {
  name: string;
  countries: { name: string; europe: boolean }[];
  current: {
    country: string;
    units: string;
    language: string;
    plan: string;
    stravaConnected: boolean;
  };
  billingEnabled: boolean;
  ultraEnabled: boolean;
  stravaEnabled: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(current.country ? (current.plan === "free" ? 2 : 3) : 0);
  const [country, setCountry] = useState(current.country);
  const [units, setUnits] = useState(current.units);
  const [language, setLanguage] = useState(current.language);
  const [, start] = useTransition();

  const [regionState, saveRegion, regionPending] = useActionState<ProfileState, FormData>(
    updatePreferencesAction,
    undefined,
  );

  const done = [Boolean(country), true, current.plan !== "free" || !billingEnabled, current.stravaConnected];

  return (
    <>
      <header className="sq-head">
        <span className="sq-kicker" style={{ display: "block", marginBottom: 10 }}>
          Four short answers
        </span>
        <h1 className="sq-h1">Let&rsquo;s get you a quest, {name}.</h1>
      </header>

      <div className="sq-settings-grid">
        <nav aria-label="Setup steps" style={{ display: "flex", flexDirection: "column", gap: 1, position: "sticky", top: 24 }}>
          {STEPS.map((entry, index) => (
            <button
              key={entry.key}
              type="button"
              onClick={() => setStep(index)}
              className="sq-nav-item"
              aria-current={step === index ? "page" : undefined}
              style={{
                textAlign: "left",
                border: 0,
                cursor: "pointer",
                background: step === index ? "var(--paper-2)" : "transparent",
                font: "inherit",
                fontSize: 13.5,
              }}
            >
              <span style={{ flex: 1 }}>{entry.label}</span>
              {done[index] ? (
                <span style={{ color: "var(--moss)" }}>
                  <Glyph name="check" size={14} strokeWidth={2.4} />
                </span>
              ) : (
                <span className="sq-mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>
                  {index + 1}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          {step === 0 ? (
            <form action={saveRegion} className="sq-card" style={{ overflow: "hidden" }}>
              <Head title="Where you walk" note="One country" />
              <div style={{ padding: "18px 24px", display: "grid", gap: 14 }}>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-2)" }}>
                  A country, never a town and never an address. It is what the generator measures
                  from, and it is the only place a quest ever reads about where you are.
                </p>
                <label className="sq-field">
                  <span className="sq-label">Country</span>
                  <select
                    className="sq-select"
                    name="country"
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                  >
                    <option value="">Pick one</option>
                    {countries.map((entry) => (
                      <option key={entry.name} value={entry.name}>
                        {entry.name}
                        {entry.europe ? "" : " · Ultra"}
                      </option>
                    ))}
                  </select>
                  {regionState?.errors?.country ? (
                    <span className="sq-error">{regionState.errors.country}</span>
                  ) : null}
                </label>
              </div>
              <Foot
                note="Outside Europe is Ultra. Everything else is on every plan."
                label={regionPending ? "Saving…" : "Next"}
                onNext={() => setStep(1)}
                submit
              />
            </form>
          ) : null}

          {step === 1 ? (
            <section className="sq-card" style={{ overflow: "hidden" }}>
              <Head title="How it reads" note="Units and language" />
              <div style={{ padding: "18px 24px", display: "grid", gap: 14 }}>
                <label className="sq-field">
                  <span className="sq-label">Units</span>
                  <select className="sq-select" value={units} onChange={(event) => setUnits(event.target.value)}>
                    <option value="METRIC">Metric — km and metres</option>
                    <option value="IMPERIAL">Imperial — miles and feet</option>
                  </select>
                </label>
                <label className="sq-field">
                  <span className="sq-label">Language</span>
                  <select className="sq-select" value={language} onChange={(event) => setLanguage(event.target.value)}>
                    <option value="en">English</option>
                    <option value="sk">Slovenčina</option>
                  </select>
                </label>
              </div>
              <Foot
                note="Quests are written in metric. Imperial converts on the way out."
                label="Next"
                onNext={() => {
                  const data = new FormData();
                  data.set("units", units);
                  data.set("language", language);
                  start(() => {
                    void saveDisplayAction(data).then(() => {
                      router.refresh();
                      setStep(2);
                    });
                  });
                }}
              />
            </section>
          ) : null}

          {step === 2 ? (
            <section className="sq-card" style={{ overflow: "hidden" }}>
              <Head title="Which plan" note={billingEnabled ? "Cancel any time" : "Not configured here"} />
              <div style={{ padding: "18px 24px", display: "grid", gap: 14 }}>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-2)" }}>
                  Free gets you three quests to see whether the thing is for you. Explorer is the
                  product as intended — the weekly, the monthly, and the envelope. Ultra adds the
                  rest of the world and the rest of the sticker sheet.
                </p>
                {billingEnabled ? (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <SqCheckoutButton plan="explorer" interval="monthly" label="Take Explorer" />
                    {ultraEnabled ? (
                      <SqCheckoutButton plan="ultra" interval="monthly" label="Take Ultra" variant="ghost" />
                    ) : null}
                  </div>
                ) : (
                  <p className="sq-hint">This deployment has no Stripe keys, so everybody is on Free.</p>
                )}
              </div>
              <Foot note="You can change this later in Settings." label="Skip for now" onNext={() => setStep(3)} />
            </section>
          ) : null}

          {step === 3 ? (
            <section className="sq-card" style={{ overflow: "hidden" }}>
              <Head title="Your watch" note="Optional" />
              <div style={{ padding: "18px 24px", display: "grid", gap: 14 }}>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-2)" }}>
                  Connect Strava and the proof form reads distance, ascent and moving time straight
                  off an activity instead of asking you to type them. Read-only, and only when you
                  paste a link.
                </p>
                {current.stravaConnected ? (
                  <p style={{ fontSize: 13, color: "var(--moss)" }}>Already connected.</p>
                ) : stravaConfigured ? (
                  <a href="/api/strava/connect" className="sq-btn sq-btn-primary" style={{ justifySelf: "start" }}>
                    Connect Strava
                  </a>
                ) : (
                  <p className="sq-hint">Strava is not configured on this deployment.</p>
                )}
              </div>
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
                <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>That is everything.</span>
                <Link
                  href="/dashboard"
                  className="sq-btn sq-btn-primary sq-btn-sm"
                  onClick={() => toast("Welcome in.")}
                >
                  Open the dashboard
                </Link>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </>
  );
}

function Head({ title, note }: { title: string; note: string }) {
  return (
    <div className="sq-section-head sq-rule-head">
      <h2 className="sq-h2" style={{ fontSize: 19 }}>
        {title}
      </h2>
      <span className="sq-kicker-sm" style={{ fontSize: 10 }}>
        {note}
      </span>
    </div>
  );
}

function Foot({
  note,
  label,
  onNext,
  submit,
}: {
  note: string;
  label: string;
  onNext: () => void;
  submit?: boolean;
}) {
  return (
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
      <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{note}</span>
      <button
        type={submit ? "submit" : "button"}
        className="sq-btn sq-btn-primary sq-btn-sm"
        onClick={submit ? undefined : onNext}
      >
        {label}
      </button>
    </div>
  );
}
