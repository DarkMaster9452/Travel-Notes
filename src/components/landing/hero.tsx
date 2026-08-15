import { Contours, QuestCard } from "@/components/field";

import { AuthButton } from "./auth-button";

const META = [
  { value: "3 min", label: "To set up" },
  { value: "∞", label: "Combinations" },
  { value: "0", label: "Repeats, ever" },
  { value: "1×/wk", label: "Straight to your mail" },
];

export function Hero() {
  return (
    <section className="hero">
      <Contours />

      <div className="wrap hero-grid">
        <div>
          <span className="eyebrow">Est. 2025 · Field-issued adventures</span>
          <h1 className="h1">
            You don&apos;t plan
            <br />
            the hike.
            <br />
            <em>You accept it.</em>
          </h1>
          <p className="lede">
            Summit Quest turns what you&apos;re after into a real assignment — a place to be, an
            objective to complete, one bonus challenge you didn&apos;t ask for. Never the same one
            twice — and, if you want it, someone to walk it with.
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
          <div className="hero-meta">
            {META.map((item) => (
              <div key={item.label}>
                <b>{item.value}</b>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
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
      </div>
    </section>
  );
}
