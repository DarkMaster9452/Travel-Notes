import type { Metadata } from "next";

import { Eyebrow, IconShield } from "@/components/field";

export const metadata: Metadata = {
  title: "Safety notice",
  description:
    "What a Summit Quest assignment is, what it isn't, and what stays your responsibility on the morning.",
};

/**
 * The safety notice. This is the same promise the landing page makes, written
 * out — not a legal document, so it says what it means in plain sentences.
 */
export default function SafetyPage() {
  return (
    <article>
      <Eyebrow>Safety notice</Eyebrow>
      <h1 className="h2 mt-4">A quest is an assignment, not a guarantee.</h1>

      <div className="mt-8 flex flex-col gap-5 text-[16px] leading-[1.65] text-ink-2">
        <p>
          Quests are built from marked, publicly documented routes. Every one carries a distance, an
          elevation gain, an estimated moving time and a daylight window calculated for the date and
          the place. None of that is a substitute for a map, a weather check on the morning, or your
          own judgement about whether to go.
        </p>

        <div className="safety mt-0">
          <IconShield />
          <p>
            Routes are publicly documented and marked, but a map, a weather check and your own
            judgement are still yours to bring.
          </p>
        </div>

        <h2 className="h3 mt-4 font-serif text-ink">Turning back counts</h2>
        <p>
          An honest retreat is a completed quest, not a failure. If the weather closes in, if the
          rock is greasy, if you get to the saddle and decide that is far enough — say so when you
          log it. It is approved as a retreat, it goes into your history, and the quest is not
          re-issued to you.
        </p>

        <h2 className="h3 mt-4 font-serif text-ink">Night quests</h2>
        <p>
          Night starts are only ever issued if you have explicitly enabled them in your preferences.
          They are off until you turn them on.
        </p>

        <h2 className="h3 mt-4 font-serif text-ink">Going with other people</h2>
        <p>
          Partner matching is off by default and is per-account opt-in. You are matched on the quest
          rather than on a profile — same range, same morning, similar pace. You see a first name, a
          rough distance and how many quests someone has logged; nothing is exchanged until you have
          both accepted.
        </p>
        <p>
          You can also publish a page about yourself, and that is the only way anybody browses
          anybody here. It is off until you switch it on, off again the instant you switch it back,
          visible to signed-in accounts only, and kept out of search engines. What goes on it —
          your figures, your logs, the photographs you filed, your country, links to your accounts
          elsewhere — is a set of switches you hold. Anything you leave off is not fetched at all,
          not merely hidden.
        </p>
        <p>
          Either side can unmatch, block or report at any point, without giving a reason. Blocks work
          both ways and hide posts, rooms and matches. Meet at the trailhead, tell someone at home
          where you are going, and if it feels off, walk your own quest.
        </p>

        <h2 className="h3 mt-4 font-serif text-ink">What we never publish</h2>
        <p>
          First names and initials only. No home addresses, no coordinates of where anybody lives, no
          public profile pages. Proof photos stay private to the quest unless you tick the box to
          share them.
        </p>
      </div>
    </article>
  );
}
