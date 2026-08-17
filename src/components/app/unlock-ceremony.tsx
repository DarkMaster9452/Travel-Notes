"use client";

import Link from "next/link";
import * as React from "react";

import { CAPABILITY_COPY, planById, type Capability, type PlanId } from "@/lib/config";

/**
 * What happens the second checkout returns.
 *
 * The complaint this answers is a real one: you pay, you land back in the app,
 * and nothing looks any different — so it doesn't *feel* like anything changed,
 * whatever the database says. This is the deliberate counterweight. The seal
 * stamps down, the plan name is said out loud, and every capability the account
 * just gained ticks itself off one line at a time, slowly enough to read.
 *
 * The sequence is CSS animation with per-line delays rather than a chain of
 * timers, so it cannot desync, it costs nothing on the main thread, and the
 * whole thing collapses to "already finished" under reduced motion.
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

  // Each line waits for the one before it. The seal takes the first beat alone.
  const LEAD_MS = 420;
  const STEP_MS = 170;

  return (
    <div className="ceremony">
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
        {capabilities.map((capability, index) => (
          <li
            key={capability}
            className="ceremony-line"
            style={{ animationDelay: `${LEAD_MS + index * STEP_MS}ms` }}
          >
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
                  style={{ animationDelay: `${LEAD_MS + index * STEP_MS + 90}ms` }}
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

      <div
        className="ceremony-actions"
        style={{ animationDelay: `${LEAD_MS + capabilities.length * STEP_MS + 160}ms` }}
      >
        <Link href="/dashboard" className="btn btn-signal btn-lg">
          Take a quest now
        </Link>
        <Link href="/upgrade" className="btn btn-ghost btn-lg">
          See the membership
        </Link>
      </div>

      <p
        className="note ceremony-foot"
        style={{ animationDelay: `${LEAD_MS + capabilities.length * STEP_MS + 260}ms` }}
      >
        The receipt is on its way to your inbox.
      </p>
    </div>
  );
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
