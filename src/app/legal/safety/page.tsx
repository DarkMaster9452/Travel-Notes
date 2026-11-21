import type { Metadata } from "next";

import { Prose, ProseHeading } from "@/components/marketing/prose";
import { Alert } from "@/components/ui/feedback";

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
    <Prose overline="Safety notice" title="A quest is an assignment, not a guarantee.">
      <p>
        Quests are built from marked, publicly documented routes. Every one carries a distance, an elevation
        gain, an estimated moving time and a daylight window calculated for the date and the place. None of
        that is a substitute for a map, a weather check on the morning, or your own judgement about whether to
        go.
      </p>

      <Alert tone="warning">
        Routes are publicly documented and marked, but a map, a weather check and your own judgement are still
        yours to bring.
      </Alert>

      <ProseHeading>Turning back counts</ProseHeading>
      <p>
        An honest retreat is a completed quest, not a failure. If the weather closes in, if the rock is greasy,
        if you get to the saddle and decide that is far enough — say so when you log it. It is approved as a
        retreat, it goes into your history, and the quest is not re-issued to you.
      </p>

      <ProseHeading>Night quests</ProseHeading>
      <p>
        Night starts are only ever issued if you have explicitly enabled them in your preferences. They are off
        until you turn them on.
      </p>

      <ProseHeading>Going with other people</ProseHeading>
      <p>
        Partner matching is off by default and is per-account opt-in. You are matched on the quest rather than
        on a profile — same range, same morning, similar pace. You see a first name, a rough distance and how
        many quests someone has logged; nothing is exchanged until you have both accepted.
      </p>
      <p>
        You can also publish a page about yourself, and that is the only way anybody browses anybody here. It
        is off until you switch it on, off again the instant you switch it back, visible to signed-in accounts
        only, and kept out of search engines. What goes on it — your figures, your logs, the photographs you
        filed, your country, links to your accounts elsewhere — is a set of switches you hold. Anything you
        leave off is not fetched at all, not merely hidden.
      </p>
      <p>
        Either side can unmatch, block or report at any point, without giving a reason. Blocks work both ways
        and hide posts, rooms and matches. Meet at the trailhead, tell someone at home where you are going, and
        if it feels off, walk your own quest.
      </p>

      <ProseHeading>What we never publish</ProseHeading>
      <p>
        First names and initials only. No home addresses, no coordinates of where anybody lives, no public
        profile pages. Proof photos stay private to the quest unless you tick the box to share them.
      </p>
    </Prose>
  );
}
