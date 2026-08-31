/**
 * The envelope the hero quest is issued in.
 *
 * Three pieces, deliberately flat siblings of the quest document rather than a
 * wrapper around it: the pocket has to paint *over* the document while it is
 * still inside, and the flap has to fall *behind* it once it has folded back.
 * A component that contained the quest could not do both — everything inside
 * one positioned box shares that box's place in the stack.
 *
 * Nothing here animates itself. The geometry is in `field-guide.css` and reads
 * `--flap` and `--out` off the hero section, which `HeroScroll` writes from the
 * scroll position. With no script the properties keep their defaults, the
 * envelope is dropped away, and the quest is simply in the hero.
 */
export function Envelope() {
  return (
    <>
      <div className="env-part env-pocket" aria-hidden="true">
        {/* The creases where the back flaps meet — drawn, not shaded, and rising
            to the same point the top flap comes down to. */}
        <svg
          className="env-seam"
          viewBox="0 0 100 68"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 68 L50 41.5 L100 68" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>

      <div className="env-part env-flap" aria-hidden="true">
        <div className="env-flap-in">
          <div className="env-face env-face-out" />
          <div className="env-face env-face-in" />
          <WaxSeal />
        </div>
      </div>
    </>
  );
}

/**
 * The seal, riding the tip of the flap so that breaking it and opening the
 * envelope are one gesture.
 *
 * Brass, not stamp ink: it is an object sitting on the paper rather than a mark
 * made on it, and it is the only place in the product that wears the wax
 * palette. The peak inside it is the same one the issuing seal carries, pressed
 * in rather than printed.
 */
function WaxSeal() {
  return (
    <svg className="env-wax" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id="env-wax-face" cx="36%" cy="30%" r="78%">
          <stop offset="0" stopColor="var(--wax-light)" />
          <stop offset="0.52" stopColor="var(--wax)" />
          <stop offset="1" stopColor="var(--wax-deep)" />
        </radialGradient>
      </defs>

      {/* Poured, so the edge is round but never a circle. */}
      <path
        fill="url(#env-wax-face)"
        d="M50 3.5C60.6 3.5 74.2 10.3 82 18C89.8 25.8 96.9 39.4 96.8 50C96.7 60.6 89.3 73.8 81.5 81.5C73.7 89.2 60.6 96.2 50 96.2C39.4 96.2 26 89.5 18.2 81.8C10.4 74.1 3.1 60.6 3.1 50C3.1 39.4 10.4 26 18.3 18.3C26.1 10.5 39.4 3.5 50 3.5Z"
      />
      {/* Pressed rim and peak. Shadow only — a die leaves depth, not ink. */}
      <circle cx="50" cy="50" r="33" fill="none" stroke="rgba(20,26,22,.20)" strokeWidth="1.6" />
      <path d="M30 61 L42 41 L50 53 L57 44 L70 61 Z" fill="rgba(20,26,22,.26)" />
      <path
        d="M30 61 L42 41 L50 53 L57 44 L70 61 Z"
        fill="none"
        stroke="rgba(255,255,255,.22)"
        strokeWidth="1"
        transform="translate(0,-1.4)"
      />
    </svg>
  );
}
