"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";

import { updatePreferencesAction, type ProfileState } from "@/app/(app)/profile/actions";
import { saveDisplayAction } from "@/app/(app)/settings/actions";
import { CheckoutButton } from "@/components/app/plan-actions";
import { useI18n } from "@/components/i18n";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/feedback";
import { Field, FieldStack, Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { Chip, ChipGroup } from "@/components/ui/toggle";
import { Overline, type } from "@/components/ui/typography";
import { LOCALES } from "@/lib/i18n";
import { tagFor } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";

/**
 * Getting set up (design/DESIGN-SYSTEM.md §12: one 560 px column, chips and a
 * progress bar).
 *
 * Four short answers, one at a time. Steps are not gated on each other: the
 * step list lets somebody jump straight to the plan, and an answer already on
 * file shows as answered. Each step writes as it is answered, so leaving
 * halfway keeps what was said.
 */
export function Onboarding({
  name,
  countries,
  current,
  billingEnabled,
  ultraEnabled,
  stravaEnabled,
}: {
  name: string;
  countries: { code: string; name: string; europe: boolean }[];
  current: {
    /** The country code already on file, or "". */
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
  const { t, locale } = useI18n();
  const words = t.app.onboarding;
  const router = useRouter();
  const toast = useToast();

  const [step, setStep] = useState(current.country ? (current.plan === "free" ? 2 : 3) : 0);
  const [country, setCountry] = useState(current.country);
  const [units, setUnits] = useState(current.units);
  const [language, setLanguage] = useState(current.language);
  const [saving, start] = useTransition();
  const [regionState, saveRegion, regionPending] = useActionState<ProfileState, FormData>(
    updatePreferencesAction,
    undefined,
  );

  // A saved country moves the flow on. (The old form saved and then stayed
  // put, which read as if nothing had happened.)
  useEffect(() => {
    if (regionState?.saved) setStep(1);
  }, [regionState]);

  // Country names in the reader's language; the value posted is the code.
  const regionName = new Intl.DisplayNames([tagFor(locale)], { type: "region" });
  const sorted = [...countries].sort((a, b) =>
    (regionName.of(a.code) ?? a.name).localeCompare(regionName.of(b.code) ?? b.name, tagFor(locale)),
  );

  const done = [Boolean(country), true, current.plan !== "free" || !billingEnabled, current.stravaConnected];
  const total = words.stepLabels.length;

  return (
    <div className="mx-auto flex w-full max-w-narrow flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Overline>{words.overline}</Overline>
        <h1 className={type.h1}>{words.title(name)}</h1>
      </header>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 text-caption text-muted">
          <span>{words.progress(step + 1, total)}</span>
          <span className="font-semibold text-text">{words.stepLabels[step]}</span>
        </div>
        <Progress value={((step + 1) / total) * 100} label={words.progress(step + 1, total)} />
        <ol aria-label={t.onboarding.steps} className="grid grid-cols-4 gap-2">
          {words.stepLabels.map((label, index) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => setStep(index)}
                aria-current={step === index ? "step" : undefined}
                className={cn(
                  "flex w-full min-w-0 cursor-pointer flex-col items-center gap-1 rounded-control px-1 py-2 text-caption transition-colors duration-fast",
                  step === index ? "bg-primary-soft font-semibold text-primary-soft-fg" : "text-muted hover:bg-surface-sunken",
                )}
              >
                <span
                  className={cn(
                    "grid size-6 place-items-center rounded-pill text-caption font-semibold tabular-nums",
                    done[index] ? "bg-success-soft text-success" : "bg-surface-sunken text-subtle",
                  )}
                >
                  {done[index] ? <Check className="size-3.5" aria-hidden="true" /> : index + 1}
                </span>
                <span className="max-w-full truncate">{label}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      {step === 0 ? (
        <Card as="section">
          <form action={saveRegion}>
            <FieldStack>
              <div>
                <h2 className={type.h3}>{t.onboarding.whereYouWalk}</h2>
                <p className="mt-1 text-body-sm text-muted">{words.countryBody}</p>
              </div>
              <Field
                label={words.country}
                htmlFor="country"
                hint={t.onboarding.outsideEurope}
                error={regionState?.errors?.country}
              >
                <Select
                  id="country"
                  name="country"
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  required
                >
                  <option value="">{words.pickOne}</option>
                  {sorted.map((entry) => (
                    <option key={entry.code} value={entry.code}>
                      {regionName.of(entry.code) ?? entry.name}
                      {entry.europe ? "" : ` · ${words.ultraOnly}`}
                    </option>
                  ))}
                </Select>
              </Field>
              <Footer>
                <Button type="submit" loading={regionPending} disabled={!country}>
                  {regionPending ? t.common.saving : words.next}
                </Button>
              </Footer>
            </FieldStack>
          </form>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card as="section">
          <FieldStack>
            <div>
              <h2 className={type.h3}>{t.onboarding.howItReads}</h2>
              <p className="mt-1 text-body-sm text-muted">{t.onboarding.metricNote}</p>
            </div>
            <ChipGroup legend={words.units}>
              <Chip name="units" value="METRIC" checked={units === "METRIC"} onChange={() => setUnits("METRIC")}>
                {t.settings.units.metric}
              </Chip>
              <Chip name="units" value="IMPERIAL" checked={units === "IMPERIAL"} onChange={() => setUnits("IMPERIAL")}>
                {t.settings.units.imperial}
              </Chip>
            </ChipGroup>
            <ChipGroup legend={words.language}>
              {LOCALES.map((option) => (
                <Chip
                  key={option.id}
                  name="language"
                  value={option.id}
                  lang={option.id}
                  checked={language === option.id}
                  onChange={() => setLanguage(option.id)}
                >
                  {option.label}
                </Chip>
              ))}
            </ChipGroup>
            <Footer back={() => setStep(0)} backLabel={words.back}>
              <Button
                loading={saving}
                onClick={() => {
                  const data = new FormData();
                  data.set("units", units);
                  data.set("language", language);
                  start(async () => {
                    await saveDisplayAction(data);
                    router.refresh();
                    setStep(2);
                  });
                }}
              >
                {words.next}
              </Button>
            </Footer>
          </FieldStack>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card as="section" className="flex flex-col gap-5">
          <div>
            <h2 className={type.h3}>{t.onboarding.whichPlan}</h2>
            <p className="mt-1 text-body-sm text-muted">{words.planBody}</p>
          </div>
          {billingEnabled ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <CheckoutButton plan="explorer" interval="monthly" label={t.onboarding.takeExplorer} />
              {ultraEnabled ? (
                <CheckoutButton plan="ultra" interval="monthly" label={t.onboarding.takeUltra} variant="secondary" />
              ) : null}
            </div>
          ) : (
            <p className="text-body-sm text-subtle">{words.noBilling}</p>
          )}
          <Footer back={() => setStep(1)} backLabel={words.back} note={t.onboarding.changeLater}>
            <Button variant="secondary" onClick={() => setStep(3)}>
              {t.onboarding.skip}
            </Button>
          </Footer>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card as="section" className="flex flex-col gap-5">
          <div>
            <h2 className={type.h3}>{t.common.yourWatch}</h2>
            <p className="mt-1 text-body-sm text-muted">{words.stravaBody}</p>
          </div>
          {current.stravaConnected ? (
            <p className="flex items-center gap-2 text-body-sm text-success">
              <Check className="size-4" aria-hidden="true" />
              {words.connected}
            </p>
          ) : stravaEnabled ? (
            <div>
              <ButtonLink href="/api/strava/connect" variant="secondary">
                {words.connect}
              </ButtonLink>
            </div>
          ) : (
            <p className="text-body-sm text-subtle">{words.noStrava}</p>
          )}
          <Footer back={() => setStep(2)} backLabel={words.back} note={words.done}>
            <ButtonLink href="/dashboard" onClick={() => toast(words.welcome)}>
              {words.finish}
            </ButtonLink>
          </Footer>
        </Card>
      ) : null}
    </div>
  );
}

/** Back on the left, the step's one action on the right; stacked on a phone. */
function Footer({
  children,
  back,
  backLabel,
  note,
}: {
  children: React.ReactNode;
  back?: () => void;
  backLabel?: string;
  note?: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      {note ? <p className="text-caption text-muted">{note}</p> : null}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {back ? (
          <Button variant="ghost" onClick={back}>
            {backLabel}
          </Button>
        ) : (
          <span />
        )}
        {children}
      </div>
    </div>
  );
}
