"use client";

import { createDrawable, createTimeline, stagger, utils } from "animejs";
import Link from "next/link";
import * as React from "react";

import { unstyle, usePrefersReducedMotion } from "@/components/motion/anime";
import { CAPABILITY_COPY, planById, type Capability, type PlanId } from "@/lib/config";
import { EASE_BACK, EASE_FIELD } from "@/lib/motion";

/**
 * What happens the second checkout returns.
 *
 * The complaint this answers is a real one: you pay, you land back in the app,
 * and nothing looks any different — so it doesn't *feel* like anything changed,
 * whatever the database says. This is the deliberate counterweight. The seal
 * stamps down, the plan name is said out loud, and every capability the account
 * just gained ticks itself off one line at a time, slowly enough to read.
 *
 * The sequence is a single anime.js timeline rather than a set of CSS delays
 * that happen to add up. It has to be a timeline for two reasons: the number of
 * capability lines depends on the plan, so every beat after the list is a
 * function of how long the list took; and the tick beside each line is a stroke
 * being *drawn*, which anime.js does natively and a keyframe can only fake with
 * a hand-computed `pathLength`. Nothing here can desync, and under reduced
 * motion no timeline is created at all — the page is simply already finished.
 */
export function UnlockCeremony({
  plan,
  capabilities,
  pending,
}: {
  plan: PlanId;
  capabilities: readonly Capability[];
  /** Stripe hadn't confirmed yet when the page rendered. */
  pending?: boolean;
}) {
  const definition = planById(plan);
  const root = useCeremonySequence(capabilities.length);

  return (
    <div className="ceremony" ref={root}>
      <div className="ceremony-seal" aria-hidden="true">
        <MemberStamp label={definition.name} />
      </div>

      <span className="ceremony-kicker">Subscription active</span>
      <h1 className="ceremony-title">
        You&apos;re {definition.name}
        <span className="ceremony-stop">.</span>
      </h1>
      <p className="ceremony-lede">
        {pending
          ? "Payment taken. Stripe is still confirming the details — everything below unlocks the moment it does."
          : "It has already taken effect on this account. Here is what changed."}
      </p>

      <ul className="ceremony-list">
        {capabilities.map((capability) => (
          <li key={capability} className="ceremony-line">
            <span className="ceremony-tick" aria-hidden="true">
              <svg viewBox="0 0 20 20" width="13" height="13">
                <path
                  d="M4 10.5l4 4 8-9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  className="ceremony-check"
                />
              </svg>
            </span>
            <span>
              <b>{CAPABILITY_COPY[capability].title}</b>
              <em>{CAPABILITY_COPY[capability].detail}</em>
            </span>
          </li>
        ))}
      </ul>

      <div className="ceremony-actions">
        <Link href="/dashboard" className="btn btn-signal btn-lg">
          Take a quest now
        </Link>
        <Link href="/upgrade" className="btn btn-ghost btn-lg">
          See the membership
        </Link>
      </div>

      <p className="note ceremony-foot">
        The receipt is on its way to your inbox.
      </p>
    </div>
  );
}

/**
 * The ceremony, beat by beat.
 *
 * Lead and step are the same numbers the CSS carried, kept because they were
 * tuned against the copy: a line every 170ms is slow enough to read the title
 * of each capability as it arrives, and the 420ms lead gives the stamp the
 * first beat to itself.
 */
function useCeremonySequence(lines: number) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  React.useEffect(() => {
    const root = ref.current;
    if (reduced || !root) return;

    const LEAD_MS = 420;
    const STEP_MS = 170;

    const pick = (selector: string) => Array.from(root.querySelectorAll<HTMLElement>(selector));
    const seal = root.querySelector<HTMLElement>(".ceremony-seal");
    const heads = pick(".ceremony-kicker, .ceremony-title, .ceremony-lede");
    const rows = pick(".ceremony-line");
    const checks = root.querySelectorAll(".ceremony-check");
    const tail = pick(".ceremony-actions, .ceremony-foot");

    const everything = [...(seal ? [seal] : []), ...heads, ...rows, ...tail];
    utils.set(everything, { opacity: 0 });

    const timeline = createTimeline({
      defaults: { ease: EASE_FIELD },
      onComplete: () => unstyle(everything),
    });

    if (seal) {
      // The stamp lands first and alone: overshoot, a shade off-square, settle.
      timeline.add(
        seal,
        {
          opacity: [0, 1],
          scale: [1.5, 0.94, 1],
          rotate: [-7, 1.5, 0],
          duration: 600,
          ease: EASE_BACK,
        },
        0,
      );
    }

    timeline.add(
      heads,
      { opacity: [0, 1], translateY: [16, 0], duration: 520, delay: stagger(70) },
      120,
    );

    if (rows.length) {
      timeline.add(
        rows,
        { opacity: [0, 1], translateX: [-8, 0], duration: 440, delay: stagger(STEP_MS) },
        LEAD_MS,
      );
      // Each tick draws itself just after its line arrives, so the line reads
      // as becoming true rather than as having always been true.
      timeline.add(
        createDrawable(checks),
        { draw: ["0 0", "0 1"], duration: 340, delay: stagger(STEP_MS) },
        LEAD_MS + 90,
      );
    }

    timeline.add(
      tail,
      { opacity: [0, 1], translateY: [16, 0], duration: 500, delay: stagger(100) },
      LEAD_MS + lines * STEP_MS + 160,
    );

    return () => {
      timeline.revert();
      // However far it got, the page ends up readable and the ticks drawn.
      utils.set(everything, { opacity: 1, translateY: 0, translateX: 0, scale: 1, rotate: 0 });
      utils.set(checks, { "stroke-dashoffset": 0 });
    };
  }, [lines, reduced]);

  return ref;
}

/**
 * The stamp that lands on the page.
 *
 * Its own drawing rather than the `Seal` watermark used on quest cards: that
 * one is absolutely positioned at 16% opacity because it is paper texture
 * behind a document. This one is the subject of the screen, in stamp ink,
 * which is precisely what stamp ink is reserved for.
 */
function MemberStamp({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 100 100" className="member-stamp" aria-hidden="true">
      <circle cx="50" cy="50" r="46" />
      <circle cx="50" cy="50" r="38" />
      <path d="M30 60 L42 40 L50 52 L56 44 L70 60 Z" />
      <text x="50" y="26" textAnchor="middle">
        SUMMIT QUEST
      </text>
      <text x="50" y="80" textAnchor="middle">
        {label.toUpperCase()}
      </text>
    </svg>
  );
}
