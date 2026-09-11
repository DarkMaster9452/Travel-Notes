import { Contours, QuestCard } from "@/components/field";

import { AuthButton } from "./auth-button";
import { Envelope } from "./envelope";
import { HeroMotion } from "./hero-motion";
import { HeroScroll } from "./hero-scroll";

export function Hero() {
  return (
    <section className="hero hero-scroll">
      {/* The hero is above the fold, so it animates on load rather than on
          scroll — the reveal observer would fire for all of it at once and
          land the whole block in a single beat. The sequence itself is an
          anime.js timeline in `HeroMotion`, which reaches into this markup
          rather than wrapping it: the grid is two columns and a wrapper per
          animated part would break the layout it is animating.

          `HeroScroll` takes over where that timeline stops. The quest is
          issued sealed, and scrolling is what opens it: the stage below pins,
          the copy holds still, and the envelope gives the document up. */}
      <HeroMotion />
      <HeroScroll />

      <div className="hero-stage">
        <Contours />

        <div className="wrap hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Est. 2025 · Field-issued adventures</span>
            <h1 className="h1">
              You don&apos;t plan
              <br />
              the hike.
              <br />
              <em>You accept it.</em>
            </h1>
            <p className="lede">
              Accept your unassigned mission. No account needed to preview a sample quest.
            </p>
            <div className="hero-actions">
              <a href="#demo" className="btn btn-signal btn-lg">
                See a sample quest
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
              <AuthButton mode="signup" className="btn btn-ghost btn-lg">
                Create a free account
              </AuthButton>
            </div>
          </div>

          {/* The document and the envelope are siblings, not nested: the
              envelope's front has to paint over the quest while it is still
              inside, and its flap has to fall behind the quest once it has
              folded back. */}
          <div className="env-stage">
            <div className="env-letter">
              <QuestCard
                documentId="Quest № 0417 · Issued 06:00"
                difficulty="Hard"
                region="Malá Fatra · Slovakia"
                title="Stand on Veľký Rozsutec before the valley wakes up."
                objective="Start from Štefanová in the dark. Take the chained ridge route, not the tourist path. Be on the summit for first light and stay until the cloud below you breaks."
                stats={[
                  { value: "14.2", label: "Kilometres" },
                  { value: "1 180", label: "Metres up" },
                  { value: "6h 40", label: "Est. moving" },
                ]}
                bonus="Photograph the summit cross with nobody else in frame. If someone beats you up there, buy them a coffee at the bottom."
                footLeft="Weather window: 04:40 – 11:00"
                footRight="Expires in 6 days"
              />
            </div>
            <Envelope />
          </div>
        </div>
      </div>
    </section>
  );
}
