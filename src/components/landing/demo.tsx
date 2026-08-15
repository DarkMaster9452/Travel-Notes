"use client";

import * as React from "react";

import {
  Avatar,
  Panel,
  Pill,
  PillGroup,
  QuestCard,
  QuestLocked,
  QuestParty,
} from "@/components/field";

import { AuthButton } from "./auth-button";
import { useAuthModal } from "./auth-modal";

/**
 * The sample generator from the landing page, ported as-is.
 *
 * It is deliberately dull and deliberately fake: three hardcoded quests around
 * one place, three samples, then a hard gate. A guest never sees a real quest —
 * those are generated server-side against the user's history, which is the
 * entire reason accounts exist. Nothing here talks to the quest engine.
 */

type DemoQuest = {
  place: string;
  obj: string;
  km: string;
  gain: string;
  time: string;
  diff: string;
  start: string;
  bonus: string;
  note: string;
};

const DEMO: DemoQuest[] = [
  {
    place: "The full circuit of Slnečné skaly",
    obj: "Start at the Rajecké Teplice spa car park and take the yellow markers up. Touch every one of the three viewpoints before you allow yourself to come down — the last one is further than it looks on the map.",
    km: "7.8",
    gain: "420",
    time: "3h 10",
    diff: "Moderate",
    start: "06:20",
    bonus: "Sit on the top rock for ten minutes without taking your phone out of your pocket.",
    note: "Sunrise start · dry rock only, this one is miserable in rain",
  },
  {
    place: "Slnečné skaly, the long way round",
    obj: "Approach from Poluvsie instead of the spa, so you climb the quiet side. Reach the main crag before the first climbers rack up, and be back at the road for coffee.",
    km: "11.2",
    gain: "560",
    time: "4h 25",
    diff: "Moderate",
    start: "05:50",
    bonus: "Learn the name of one plant you walk past and check it when you get home.",
    note: "Sunrise start · headlamp for the first 30 minutes",
  },
  {
    place: "Sunset shift at Slnečné skaly",
    obj: "Go up late. Be on the west-facing rocks for the last hour of light with the Rajec valley underneath you, and walk the descent in the dark on purpose.",
    km: "6.4",
    gain: "380",
    time: "2h 40",
    diff: "Easy",
    start: "18:40",
    bonus: "Stay fifteen minutes after the sun has actually gone. That part is the point.",
    note: "Golden hour · headlamp and a warm layer, it drops fast",
  },
];

const PARTY: Record<string, string> = {
  solo: "Solo · nobody to negotiate with",
  duo: "Two people · one map between you",
  match: "Partner matching on · we look for one compatible quester",
  group: "Group matching on · up to four, slowest sets the pace",
};

const PEOPLE = [
  { name: "Tomáš K.", initials: "TK", variant: "a", where: "Žilina · 12 km away", pct: "94%" },
  { name: "Lucia M.", initials: "LM", variant: "b", where: "Martin · 21 km away", pct: "88%" },
  { name: "Peter H.", initials: "PH", variant: "c", where: "Rajec · 18 km away", pct: "81%" },
  { name: "Zuzana B.", initials: "ZB", variant: "b", where: "Púchov · 26 km away", pct: "86%" },
  { name: "Marek D.", initials: "MD", variant: "c", where: "Terchová · 6 km away", pct: "91%" },
  { name: "Nina S.", initials: "NS", variant: "a", where: "Trenčín · 33 km away", pct: "79%" },
] as const;

const GROUPS = {
  range: {
    label: "Where should it send you?",
    hint: "01 / Range",
    options: [
      { value: "My country", label: "My country" },
      { value: "Europe", label: "Europe · Pro", locked: true },
      { value: "Worldwide", label: "Worldwide · Pro", locked: true },
    ],
  },
  terrain: {
    label: "What ground do you want under you?",
    hint: "02 / Terrain",
    options: [
      { value: "ridge", label: "Ridgeline" },
      { value: "forest", label: "Deep forest" },
      { value: "water", label: "Lakes & rivers" },
      { value: "coast", label: "Coast" },
      { value: "alpine", label: "High alpine" },
    ],
  },
  party: {
    label: "Who's coming?",
    hint: "03 / Rope",
    options: [
      { value: "solo", label: "Just me" },
      { value: "duo", label: "Someone I already know" },
      { value: "match", label: "Find me a partner" },
      { value: "group", label: "Match me with a group" },
    ],
  },
} as const;

type GroupKey = keyof typeof GROUPS;

const SAMPLE_CREDITS = 3;
const SPIN_TICKS = 6;
const SPIN_INTERVAL_MS = 55;

export function DemoGenerator() {
  const { open } = useAuthModal();

  const [state, setState] = React.useState<Record<GroupKey, string>>({
    range: "My country",
    terrain: "ridge",
    party: "solo",
  });
  const [credits, setCredits] = React.useState(SAMPLE_CREDITS);
  // The first paint is a free preview that doesn't spend a credit.
  const [shown, setShown] = React.useState(0);
  const [party, setParty] = React.useState<typeof PEOPLE[number][]>([]);
  const [rollingTitle, setRollingTitle] = React.useState<string | null>(null);
  const [lockedHint, setLockedHint] = React.useState<string | null>(null);

  const quest = DEMO[shown];
  const rolling = rollingTitle !== null;

  const generate = () => {
    if (credits <= 0) {
      open("signup");
      return;
    }

    setCredits((value) => value - 1);
    const next = (shown + 1) % DEMO.length;
    setShown(next);
    setParty(drawParty(state.party));

    // The title spins through the other samples before settling. Skipped
    // outright when reduced motion is preferred.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ticks = 0;
    const spin = window.setInterval(() => {
      ticks += 1;
      if (ticks > SPIN_TICKS) {
        window.clearInterval(spin);
        setRollingTitle(null);
        return;
      }
      setRollingTitle(DEMO[Math.floor(Math.random() * DEMO.length)].place);
    }, SPIN_INTERVAL_MS);
  };

  const choose = (group: GroupKey, value: string, locked?: boolean) => {
    if (locked) {
      // Locked ranges are a Pro feature: say so on the pill, then take them
      // to the plans rather than silently doing nothing.
      setLockedHint(value);
      window.setTimeout(() => setLockedHint(null), 1400);
      document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setState((current) => ({ ...current, [group]: value }));
  };

  return (
    <section id="demo" className="section demo-section">
      <div className="wrap">
        <div className="sec-head">
          <span className="eyebrow">Sample · No account needed</span>
          <h2 className="h2">
            Answer three things.
            <br />
            See what an assignment looks like.
          </h2>
          <p className="lede">
            This is a taster, and it is deliberately dull: the demo only knows one place —{" "}
            <b>Slnečné skaly</b> above Rajecké Teplice. Real quests are chosen for you, from
            anywhere in your range, and they live in your account.
          </p>
        </div>

        <div className="demo-grid">
          <Panel>
            {(Object.keys(GROUPS) as GroupKey[]).map((key) => {
              const group = GROUPS[key];
              return (
                <PillGroup key={key} label={group.label} hint={group.hint}>
                  {group.options.map((option) => {
                    const locked = "locked" in option && option.locked;
                    const isHinted = lockedHint === option.value;
                    return (
                      <Pill
                        key={option.value}
                        pressed={state[key] === option.value}
                        onClick={() => choose(key, option.value, locked)}
                        style={isHinted ? { color: "var(--signal)" } : undefined}
                      >
                        {isHinted ? "Explorer only →" : option.label}
                      </Pill>
                    );
                  })}
                </PillGroup>
              );
            })}

            <div className="gen-row">
              <button className="btn btn-signal" type="button" onClick={generate}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M8 1.6v3M8 11.4v3M1.6 8h3M11.4 8h3M3.5 3.5l2.1 2.1M10.4 10.4l2.1 2.1M12.5 3.5l-2.1 2.1M5.6 10.4l-2.1 2.1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                See a sample quest
              </button>
              <Credits credits={credits} />
            </div>
          </Panel>

          <div className="result">
            {credits <= 0 ? (
              <QuestLocked
                title="That is as much as the demo knows."
                action={
                  <AuthButton mode="signup" className="btn btn-signal">
                    Create a free account
                  </AuthButton>
                }
                footnote={
                  <>
                    Free account · no card ·{" "}
                    <AuthButton mode="login" className="underline text-moss-2 font-[inherit]">
                      already have one?
                    </AuthButton>
                  </>
                }
              >
                Real quests are picked for you, anywhere in your range — and they need somewhere to
                live. Create an account to get your first three, keep your history, collect stickers
                and see who else is going.
              </QuestLocked>
            ) : (
              <QuestCard
                key={shown}
                rolling={rolling}
                documentId="Sample quest · Slnečné skaly only"
                difficulty={quest.diff}
                region="Slnečné skaly · Rajecké Teplice"
                title={rollingTitle ?? quest.place}
                objective={quest.obj}
                stats={[
                  { value: quest.km, label: "Kilometres" },
                  { value: quest.gain, label: "Metres up" },
                  { value: quest.time, label: "Est. moving" },
                ]}
                bonus={quest.bonus}
                seal="SAMPLE"
                footLeft={`Start ${quest.start}`}
                footRight="Your real quests live in your account"
              >
                {party.length > 0 && (
                  <QuestParty
                    title={party.length === 1 ? "Your rope — 1 match found" : "Your rope — 3 matches found"}
                    footnote="Sample people. Real matches need an account, and nobody is contacted until you both accept."
                  >
                    {party.map((person) => (
                      <div className="row" key={person.name}>
                        <Avatar
                          name={person.name}
                          initials={person.initials}
                          variant={person.variant}
                        />
                        <i>{person.name}</i>
                        <em>
                          {person.where} · {person.pct}
                        </em>
                      </div>
                    ))}
                  </QuestParty>
                )}
                <p className="note">
                  {quest.note} · {PARTY[state.party]}
                </p>
              </QuestCard>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Credits({ credits }: { credits: number }) {
  const { open } = useAuthModal();

  if (credits <= 0) {
    return (
      <span className="credits">
        Samples used up —{" "}
        <b>
          <button
            type="button"
            className="font-[inherit] text-moss-2 underline"
            onClick={() => open("signup")}
          >
            create an account
          </button>
        </b>
      </span>
    );
  }

  return (
    <span className="credits">
      Samples left: <b>{credits}</b>
      <span className="dots">
        {Array.from({ length: SAMPLE_CREDITS }, (_, index) => (
          <i key={index} className={index < credits ? undefined : "spent"} />
        ))}
      </span>
    </span>
  );
}

/** Matching is only shown when it was asked for — off is the default here too. */
function drawParty(preference: string): typeof PEOPLE[number][] {
  if (preference !== "match" && preference !== "group") return [];
  const count = preference === "match" ? 1 : 3;
  return [...PEOPLE].sort(() => Math.random() - 0.5).slice(0, count);
}
