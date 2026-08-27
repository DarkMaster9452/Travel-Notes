import Image from "next/image";

import {
  Avatar,
  IconApproved,
  IconCheck,
  IconClock,
  IconCross,
  IconDot,
  IconPin,
  IconShield,
  IconStrava,
  LogoMark,
  Sticker,
  StickerSheet,
  Tag,
} from "@/components/field";

import { AuthButton } from "./auth-button";

/* ========================================================================== */
/* How it works                                                               */
/* ========================================================================== */

const STEPS = [
  {
    num: "STEP 01",
    title: "You set the constraints once",
    body: "Range, terrain, distance, difficulty, time. Two minutes, changeable any time.",
    icon: (
      <>
        <circle cx="16" cy="16" r="12" />
        <path d="M16 10v6l4 3" />
      </>
    ),
  },
  {
    num: "STEP 02",
    title: "The generator picks, not you",
    body: "It reads the terrain, the season, the daylight and everything it has already sent you, then commits to one place.",
    icon: (
      <>
        <path d="M4 24l8-13 5 8 3-5 8 10z" />
        <circle cx="24" cy="8" r="3" />
      </>
    ),
  },
  {
    num: "STEP 03",
    title: "It arrives and you answer it",
    body: "Objective, bonus challenge, place to be. Log it when it's done and it never comes back.",
    icon: (
      <>
        <path d="M5 8h22v16H5z" />
        <path d="M5 9l11 8 11-8" />
        <path d="M12 27h8" />
      </>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="section">
      <div className="wrap">
        <div className="sec-head">
          <span className="eyebrow">The mechanism</span>
          <h2 className="h2">Decision fatigue is the thing that keeps you home.</h2>
          <p className="lede">Most weekends die in a browser tab. This one removes the choosing.</p>
        </div>
        <div className="steps">
          {STEPS.map((step) => (
            <div className="step" key={step.num}>
              <svg className="ico" viewBox="0 0 32 32" aria-hidden="true">
                {step.icon}
              </svg>
              <span className="num">{step.num}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* Weekly + monthly                                                           */
/* ========================================================================== */

export function WeeklySection() {
  return (
    <section id="weekly" className="section">
      <div className="wrap week-grid">
        <div>
          <span className="eyebrow">Same quest, same week, everyone</span>
          <h2 className="h2">
            One quest a week.
            <br />
            The whole community gets it.
          </h2>
          <p className="lede mt-[18px]">
            Same objective, same window, same bonus for every member — so you can compare logs with
            someone you have never met, and argue about the bonus afterwards.
          </p>
          <p className="muted mt-4 text-[15.5px]">
            Your own quests stay yours alone. The weekly is the one everybody shares.
          </p>
          <ul className="rope-steps mt-[26px]">
            <li>
              <b>MON</b> &nbsp;Weekly drops, 06:00
            </li>
            <li>
              <b>SUN</b> &nbsp;Log closes 23:59
            </li>
            <li>
              <b>1st</b> &nbsp;Monthly — the big one
            </li>
          </ul>
        </div>

        <div className="shared">
          <article className="shot">
            <Image
              src="https://images.unsplash.com/photo-1551632811-561732d1e306?w=900&q=70&auto=format&fit=crop"
              alt="Hiker on a mountain ridge at sunrise"
              width={900}
              height={210}
              className="h-[210px] w-full object-cover"
            />
            <div className="over">
              <div className="top">
                <Tag>Week 33</Tag>
                <Tag tone="inverse">Everyone</Tag>
              </div>
              <div>
                <span className="loc">Malá Fatra · Slovakia</span>
                <h3>Be on Veľký Rozsutec for first light.</h3>
              </div>
            </div>
            <div className="body">
              <span className="st">
                <b>14.2</b> km
              </span>
              <span className="st">
                <b>1 180</b> m ↑
              </span>
              <span className="st">
                <b>Hard</b>
              </span>
              <span className="st">
                Window <b>04:40–11:00</b>
              </span>
            </div>
            <div className="bar">
              <span>347 accepted · 128 logged</span>
              <span className="progress">
                <i style={{ width: "38%" }} />
              </span>
              <span>Closes Sun 23:59</span>
            </div>
          </article>

          <article className="shot">
            <Image
              src="https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=900&q=70&auto=format&fit=crop"
              alt="High mountain range above the clouds"
              width={900}
              height={210}
              className="h-[210px] w-full object-cover"
            />
            <div className="over">
              <div className="top">
                <Tag tone="warm">August</Tag>
                <Tag tone="inverse">Monthly</Tag>
              </div>
              <div>
                <span className="loc">Vysoké Tatry · Slovakia</span>
                <h3>Cross the Tatras hut to hut in one weekend.</h3>
              </div>
            </div>
            <div className="bar">
              <span>Opens 1 Aug · 61 attempting</span>
              <span className="progress">
                <i style={{ width: "22%" }} />
              </span>
              <span>2 days left</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* Go together — matching, the board, the room                                */
/* ========================================================================== */

const MATCHES = [
  { name: "Tomáš K.", initials: "TK", variant: "a", where: "Žilina · 12 km away · 34 quests logged", pct: "94%" },
  { name: "Lucia M.", initials: "LM", variant: "b", where: "Martin · 21 km away · steady 4.2 km/h", pct: "88%" },
  { name: "Peter H.", initials: "PH", variant: "c", where: "Rajec · 18 km away · likes sunrise starts", pct: "81%" },
] as const;

const POSTS = [
  {
    host: "Marek D.",
    initials: "MD",
    variant: "c",
    meta: "Terchová · 41 quests",
    title: "Rozsutec ridge, sunrise start",
    facts: [
      "Saturday 04:40 · Štefanová",
      "14.2 km · 1 180 m ↑ · Hard",
      "Steady 4 km/h, no rush on the chains",
      "Two seats in the car from Žilina",
    ],
    spots: "2 spots left",
    last: false,
  },
  {
    host: "Lucia M.",
    initials: "LM",
    variant: "b",
    meta: "Martin · 18 quests",
    title: "Suchá Belá gorge before the crowds",
    facts: [
      "Sunday 07:15 · Podlesok",
      "11.4 km · 640 m ↑ · Moderate",
      "Relaxed pace, photo stops allowed",
      "Meeting at the car park",
    ],
    spots: "3 spots left",
    last: false,
  },
  {
    host: "Zuzana B.",
    initials: "ZB",
    variant: "b",
    meta: "Púchov · 26 quests",
    title: "Night quest — Vápeč under a full moon",
    facts: [
      "Friday 21:00 · Horná Poruba",
      "8.6 km · 720 m ↑ · Moderate",
      "Headlamps, spare batteries, tea at the top",
      "Beginners welcome, we wait",
    ],
    spots: "Last spot",
    last: true,
  },
] as const;

export function TogetherSection() {
  return (
    <section id="together" className="section sticker-section">
      <div className="wrap rope-grid">
        <div>
          <span className="eyebrow">Rope up · optional, always</span>
          <h2 className="h2">
            Nobody says you
            <br />
            have to go alone.
          </h2>
          <p className="lede mt-[18px]">
            Ask for company and you are matched on the quest — same range, same morning, similar
            pace. Nothing is shared until you both say yes.
          </p>
          <ul className="rope-steps">
            <li>
              <b>01</b> &nbsp;Tick &ldquo;find me someone&rdquo;
            </li>
            <li>
              <b>02</b> &nbsp;We match the quest, not the profile
            </li>
            <li>
              <b>03</b> &nbsp;Both accept
            </li>
            <li>
              <b>04</b> &nbsp;A thread opens, 48 h before
            </li>
            <li>
              <b>05</b> &nbsp;Meet at the trailhead
            </li>
          </ul>
          <div className="safety">
            <IconShield />
            <p>
              <b>How we keep it sane:</b> first names only, no addresses, and a page only if you
              publish one. Either of you can unmatch, block or report without explaining.
            </p>
          </div>
        </div>

        <div>
          <div className="matches">
            {MATCHES.map((match) => (
              <div className="match" key={match.name}>
                <Avatar name={match.name} initials={match.initials} variant={match.variant} />
                <div className="who">
                  <b>{match.name}</b>
                  <span>{match.where}</span>
                </div>
                <span className="pct">
                  <b>{match.pct}</b>match
                </span>
              </div>
            ))}
          </div>
          <div className="meet">
            <IconClock />
            <div>
              <b>Meet point: Štefanová car park, 04:40</b>
              <span>Agreed by both · added to the quest mail</span>
            </div>
          </div>
          <p className="note text-center">
            Matching is off by default. Solo stays solo, forever, if that&apos;s the point for you.
          </p>
        </div>
      </div>

      <div className="wrap">
        <div className="board">
          <div className="board-head">
            <div>
              <span className="eyebrow">The board</span>
              <h3 className="mt-3">Open quests this weekend.</h3>
              <p>
                Somebody posts where and when, whoever is free turns up — with a real quest attached,
                so everyone arrives knowing what the day is for.
              </p>
            </div>
            <AuthButton mode="signup" className="btn btn-primary btn-sm">
              Post your quest
            </AuthButton>
          </div>

          <div className="posts">
            {POSTS.map((post) => (
              <article className="post" key={post.title}>
                <div className="post-top">
                  <Avatar name={post.host} initials={post.initials} variant={post.variant} />
                  <div>
                    <b>{post.host}</b>
                    <span>{post.meta}</span>
                  </div>
                </div>
                <h4>{post.title}</h4>
                <div className="facts">
                  {post.facts.map((fact) => (
                    <div key={fact}>
                      <IconDot />
                      {fact}
                    </div>
                  ))}
                </div>
                <span className={post.last ? "spots last" : "spots"}>{post.spots}</span>
                <AuthButton className="btn btn-ghost btn-sm">Ask to join</AuthButton>
              </article>
            ))}
          </div>

          <div className="rope-grid mt-[38px] items-center">
            <div>
              <span className="eyebrow">And then you actually talk</span>
              <h3 className="mt-3 font-serif tracking-[-0.025em] text-[clamp(20px,2.2vw,25px)] font-semibold">
                Join a quest and a room opens.
              </h3>
              <p className="muted mt-[14px] text-[15.5px]">
                Accept who you want and a private room opens: meeting place, parking, who is driving,
                what the weather did overnight. It closes a week after, and nothing in it is public.
              </p>
              <ul className="rope-steps mt-[22px]">
                <li>
                  <b>01</b> &nbsp;Post the quest
                </li>
                <li>
                  <b>02</b> &nbsp;Accept who joins
                </li>
                <li>
                  <b>03</b> &nbsp;Room opens
                </li>
                <li>
                  <b>04</b> &nbsp;Agree the meeting point
                </li>
                <li>
                  <b>05</b> &nbsp;Go
                </li>
              </ul>
            </div>

            <div className="chat">
              <div className="chat-head">
                <Avatar name="Marek D." initials="MD" variant="c" />
                <div>
                  <b>Rozsutec ridge, sunrise start</b>
                  <span>Marek, Lucia, you · Saturday</span>
                </div>
                <span className="live">
                  <i />
                  Open
                </span>
              </div>
              <div className="chat-body">
                <div className="msg pin">📍 Meeting point pinned: Štefanová car park, 04:40</div>
                <div className="msg">
                  <b>Marek D.</b>Parking fills by five, I&apos;ll be there quarter past four. Two
                  seats free from Žilina if anyone needs one.
                </div>
                <div className="msg me">
                  <b>You</b>I&apos;ll take one. Chains on the ridge — are they fine when it&apos;s
                  damp?
                </div>
                <div className="msg">
                  <b>Lucia M.</b>Fine, just slow. Forecast says it clears by six, we should be above
                  the cloud for sunrise.
                </div>
                <div className="msg pin">Quest logged Saturday 11:20 · proof pending</div>
              </div>
            </div>
          </div>

          <p className="note text-center mt-[26px]">
            A community, not a contact list. You meet people through the quest they opened.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* Terrain                                                                    */
/* ========================================================================== */

export function TerrainSection() {
  return (
    <section id="terrain" className="section">
      <div className="wrap">
        <div className="sec-head">
          <span className="eyebrow">Where it sends you</span>
          <h2 className="h2">Five kinds of ground, one kind of morning.</h2>
        </div>
        <div className="terrains">
          {TERRAINS.map((terrain) => (
            <article className="terrain" key={terrain.name}>
              <svg
                className="scene"
                viewBox="0 0 100 140"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {/* Flat bands, not graded ones: these are printed scenes on a
                    field-guide cover, and nothing in this product fades from
                    one colour into another. Depth comes from the stack. */}
                {terrain.bands.map((band, index) => (
                  <rect
                    key={index}
                    y={band.y}
                    width="100"
                    height={band.h}
                    fill={band.fill}
                  />
                ))}
                {terrain.shapes}
              </svg>
              <b>{terrain.name}</b>
              <span>{terrain.note}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

type Terrain = {
  name: string;
  note: string;
  /** Sky and ground, painted from the top down. */
  bands: { y: number; h: number; fill: string }[];
  shapes: React.ReactNode;
};

const TERRAINS: Terrain[] = [
  {
    name: "Ridgeline",
    note: "Exposure",
    bands: [
      { y: 0, h: 58, fill: "#E8A968" },
      { y: 58, h: 82, fill: "#B4704A" },
    ],
    shapes: (
      <>
        <circle cx="70" cy="34" r="11" fill="#FFF0C9" />
        <path d="M0 96 L26 52 L44 84 L58 62 L100 110 V140 H0Z" fill="#4A3A46" />
        <path d="M0 118 L30 84 L52 112 L74 92 L100 122 V140 H0Z" fill="#2A2230" />
      </>
    ),
  },
  {
    name: "Deep forest",
    note: "Silence",
    bands: [
      { y: 0, h: 62, fill: "#BFD8A8" },
      { y: 62, h: 78, fill: "#5E7F4E" },
    ],
    shapes: (
      <>
        <g fill="#2E4A33">
          <path d="M18 120 L28 60 L38 120Z" />
          <path d="M46 128 L58 44 L70 128Z" />
          <path d="M72 122 L82 66 L92 122Z" />
          <path d="M2 124 L12 74 L22 124Z" />
        </g>
        <g fill="#16261B">
          <path d="M30 140 L42 88 L54 140Z" />
          <path d="M62 140 L76 92 L90 140Z" />
          <path d="M-4 140 L8 96 L20 140Z" />
        </g>
      </>
    ),
  },
  {
    name: "Lakes & rivers",
    note: "Cold water",
    bands: [
      { y: 0, h: 74, fill: "#A8C9DE" },
      { y: 74, h: 66, fill: "#4E7C93" },
    ],
    shapes: (
      <>
        <path d="M0 74 L30 40 L52 74 L70 52 L100 82 V88 H0Z" fill="#37596B" />
        <rect y="88" width="100" height="52" fill="#1E4353" />
        <g stroke="#CFE6F2" strokeWidth="1.4" opacity=".5">
          <path d="M12 100h26M52 100h22M22 110h34M60 118h22M8 122h30" />
        </g>
      </>
    ),
  },
  {
    name: "Coast",
    note: "Long light",
    bands: [
      { y: 0, h: 64, fill: "#FFD9A0" },
      { y: 64, h: 76, fill: "#2E8794" },
    ],
    shapes: (
      <>
        <circle cx="30" cy="30" r="9" fill="#FFF3D6" />
        <path d="M0 92 C26 84 40 98 62 90 C80 84 90 94 100 88 V140 H0Z" fill="#12545F" />
        <path d="M0 122 C30 116 44 126 68 120 C84 116 92 122 100 118 V140 H0Z" fill="#E8D9B4" />
      </>
    ),
  },
  {
    name: "High alpine",
    note: "Thin air",
    bands: [
      { y: 0, h: 56, fill: "#2B3A56" },
      { y: 56, h: 84, fill: "#1A2439" },
    ],
    shapes: (
      <>
        <g fill="#EFF4FF" opacity=".8">
          <circle cx="18" cy="20" r="1.2" />
          <circle cx="42" cy="12" r="1" />
          <circle cx="66" cy="26" r="1.3" />
          <circle cx="86" cy="14" r="1" />
          <circle cx="30" cy="36" r=".9" />
          <circle cx="78" cy="40" r="1.1" />
        </g>
        <path d="M0 100 L24 46 L40 78 L54 56 L74 84 L100 58 V140 H0Z" fill="#3C4C6B" />
        <path d="M24 46 L33 64 H15Z M54 56 L61 70 H47Z" fill="#EDF2FF" />
        <path d="M0 118 L28 90 L50 116 L72 96 L100 120 V140 H0Z" fill="#161E2F" />
      </>
    ),
  },
];

/* ========================================================================== */
/* Proof & approval                                                           */
/* ========================================================================== */

const FLOW = [
  { k: "01 · POST", body: "Someone proposes a quest, or the weekly drops for everybody at once." },
  { k: "02 · JOIN", body: "Others ask to join. The host accepts who they want, spots run out." },
  { k: "03 · ROOM", body: "A private room opens. Meeting place, parking, transport, weather." },
  { k: "04 · GO", body: "You turn up and do the thing. That part we can't help with." },
  { k: "05 · PROOF", body: "Photos, Strava or a note. An admin approves it and the sticker lands." },
];

export function ProofSection() {
  return (
    <section id="proof" className="section proof-section">
      <div className="wrap proof-grid">
        <div>
          <span className="eyebrow">Logging &amp; approval</span>
          <h2 className="h2">
            Nothing counts
            <br />
            until it&apos;s checked.
          </h2>
          <p className="lede mt-[18px]">
            Photos, a Strava link, or an honest note. A human reads it.
          </p>
          <p className="muted mt-4 text-[15.5px]">
            Approved locks it into your history, unlocks the sticker and retires the quest forever.
            Turned back by the weather? Log it as a retreat — that gets approved too.
          </p>
          <div className="safety mt-6">
            <IconShield />
            <p>
              <b>Why we bother:</b> the stickers are physical and the board is shared, so &ldquo;I
              did it&rdquo; has to mean something. Photos stay private unless you say otherwise.
            </p>
          </div>
        </div>

        <div>
          <article className="proof-card">
            <div className="ph">
              <Image
                src="https://images.unsplash.com/photo-1502126324834-38f8e02d7160?w=900&q=70&auto=format&fit=crop"
                alt="Summit photo submitted as proof"
                width={900}
                height={150}
                className="h-[150px] w-full object-cover"
              />
              <Image
                src="https://images.unsplash.com/photo-1586022045497-31fcf76fa6cc?w=900&q=70&auto=format&fit=crop"
                alt="Trail marker photo submitted as proof"
                width={900}
                height={150}
                className="h-[150px] w-full object-cover"
              />
            </div>
            <div className="proof-body">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="qc-loc m-0">
                  <IconPin />
                  Quest № 0417 · Veľký Rozsutec
                </span>
                <Tag tone="ghost">2 members</Tag>
              </div>
              <div className="proof-row">
                <div>
                  <b>14.6</b>
                  <span>km</span>
                </div>
                <div>
                  <b>1 204</b>
                  <span>m ↑</span>
                </div>
                <div>
                  <b>6:12</b>
                  <span>moving</span>
                </div>
                <div>
                  <b>04:41</b>
                  <span>started</span>
                </div>
              </div>
              <span className="strava">
                <IconStrava />
                Strava activity attached · verified GPX
              </span>
              <p className="quote">
                &ldquo;Cloud broke at 05:58, about ten minutes after we got up. Chains were greasy
                but fine. Bonus done — photo two, nobody else in frame, we beat the Bratislava group
                by four minutes.&rdquo; — Marek D.
              </p>
            </div>
            <div className="verdict">
              <IconApproved />
              <div>
                <b>Approved — both members credited</b>
                <span>Reviewed by an admin · 4 h after submission</span>
              </div>
              <span className="stamp">Logged</span>
            </div>
          </article>
          <p className="note text-center">
            Sticker unlocked: <b className="text-moss-2">Ridge Runner</b> · quest retired from your
            pool
          </p>
        </div>
      </div>

      <div className="wrap">
        <div className="flow">
          {FLOW.map((item) => (
            <div key={item.k}>
              <b>{item.k}</b>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* Stickers                                                                   */
/* ========================================================================== */

const SHEET = [
  "first-light",
  "sunrise-10",
  "night-shift",
  "roped-up",
  "gorge-rat",
  "deep-woods",
  "cartographer",
  "thousand-metres",
];

const UNLOCKS = [
  { k: "Quest 1", body: "First Light — you actually went" },
  { k: "×10", body: "Ten quests logged, no repeats" },
  { k: "First night", body: "Night Shift" },
  { k: "First match", body: "Roped Up — you went with someone" },
  { k: "5 regions", body: "Cartographer" },
  { k: "1 000 m", body: "In one single push" },
];

export function StickersSection() {
  return (
    <section id="stickers" className="section sticker-section">
      <div className="wrap sticker-grid">
        <div>
          <span className="eyebrow">Levels, but physical</span>
          <h2 className="h2">
            Every step you clear
            <br />
            comes with a sticker.
          </h2>
          <p className="lede mt-[18px]">
            Not a badge that glows for a second. A die-cut sticker, drawn for that one achievement,
            yours to put somewhere in the world.
          </p>
          <ul className="unlocks">
            {UNLOCKS.map((unlock) => (
              <li key={unlock.k}>
                <b>{unlock.k}</b> {unlock.body}
              </li>
            ))}
          </ul>
          <p className="muted mt-6 text-[15.5px]">
            Unlocked the moment you log the quest. Subscribers get the printed sheet in the post —
            photograph where it ends up and it goes on the map.
          </p>
          <div className="hero-actions mt-[26px]">
            <AuthButton mode="signup" className="btn btn-signal">
              Start collecting
            </AuthButton>
          </div>
        </div>

        <div>
          <StickerSheet tag="Sheet 01 · posted to subscribers">
            {SHEET.map((key) => (
              <Sticker key={key} achievementKey={key} />
            ))}
          </StickerSheet>
          <p className="note text-center">
            Peel, stick, photograph, log. The sheet changes every season.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* Pricing                                                                    */
/* ========================================================================== */

type PlanFeature = { text: string; absent?: boolean };

const PLANS: {
  name: string;
  price: string;
  period: string;
  desc: string;
  features: PlanFeature[];
  cta: string;
  ctaClass: string;
  note: string;
  flag?: string;
  feature?: boolean;
}[] = [
  {
    name: "Free",
    price: "€0",
    period: "/ forever",
    desc: "Three real quests, to find out whether being told what to do suits you.",
    features: [
      { text: "Free account + 3 real quests" },
      { text: "Your own country only" },
      { text: "Quest history & digital stickers" },
      { text: "No inbox delivery", absent: true },
      { text: "No partner matching", absent: true },
    ],
    cta: "Create a free account",
    ctaClass: "btn btn-ghost",
    note: "Free forever · no card",
  },
  {
    name: "Explorer",
    price: "€11",
    period: "/ month",
    desc: "Unlimited quests anywhere in Europe, in your inbox on the morning you pick.",
    features: [
      { text: "Unlimited quest generation" },
      { text: "Anywhere in Europe, any terrain" },
      { text: "Quests by mail, on your schedule" },
      { text: "Saved quests & full history" },
      { text: "Re-roll, skip and pause" },
      { text: "Partner matching & the community board" },
      { text: "Printed sticker sheets, posted to you" },
    ],
    cta: "Start with Explorer",
    ctaClass: "btn btn-signal",
    note: "Cancel anytime · 7-day refund",
    flag: "Most taken",
    feature: true,
  },
  {
    name: "Ultra Explorer",
    price: "€31",
    period: "/ month",
    desc: "Every range on the map, and quests built around something specific.",
    features: [
      { text: "Everything in Explorer" },
      { text: "Worldwide range, every continent" },
      { text: "Custom quests you commission" },
      { text: "Multi-day and trip-week quests" },
      { text: "Priority support, real replies" },
      { text: "Private crews & invite links" },
      { text: "Group quests, one mail each" },
    ],
    cta: "Go Ultra",
    ctaClass: "btn btn-primary",
    note: "Cancel anytime · 7-day refund",
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="section pricing-section">
      <div className="wrap">
        <div className="sec-head center">
          <span className="eyebrow centered">Plans</span>
          <h2 className="h2">Try it here. Subscribe to stop deciding.</h2>
          <p className="lede">
            Cancel any time, from the footer of any quest mail. Changed your mind inside a week?
            Full refund, no questions.
          </p>
        </div>

        <div className="plans">
          {PLANS.map((plan) => (
            <div className={plan.feature ? "plan feature" : "plan"} key={plan.name}>
              {plan.flag && <span className="plan-flag">{plan.flag}</span>}
              <span className="plan-name">{plan.name}</span>
              <div className="plan-price">
                <b>{plan.price}</b>
                <span>{plan.period}</span>
              </div>
              <p className="plan-desc">{plan.desc}</p>
              <ul>
                {plan.features.map((item) => (
                  <li key={item.text} style={item.absent ? { opacity: 0.5 } : undefined}>
                    {item.absent ? <IconCross /> : <IconCheck />}
                    {item.text}
                  </li>
                ))}
              </ul>
              {/* Checkout is wired in the billing step; until then every plan
                  routes through signup, which is where a new account starts. */}
              <AuthButton mode="signup" className={plan.ctaClass}>
                {plan.cta}
              </AuthButton>
              <p className="plan-note">{plan.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* FAQ                                                                        */
/* ========================================================================== */

const FAQ = [
  {
    q: "Is this just a random trail picker?",
    a: "A picker gives you a trail; a quest gives you a reason to be on it — an objective, an hour, and one bonus challenge. It also remembers what it has sent you, so nothing repeats.",
  },
  {
    q: "What does the free version actually give me?",
    a: "Three real quests in your own country, no card, plus your history and the first six stickers. Inbox delivery, the rest of Europe, matching and printed sheets start at Explorer; worldwide range is Ultra.",
  },
  {
    q: "Why do I need an account?",
    a: "Because a quest is only worth issuing once, and your account is what remembers where you have been. This page can only ever show the same sample loop. The account is free.",
  },
  {
    q: "What are the stickers?",
    a: "Every milestone has its own die-cut sticker. It unlocks when you log the quest; subscribers get the printed sheet in the post. Where it ends up is your business — photograph it and it goes on the map.",
  },
  {
    q: "How often do quests arrive by mail?",
    a: "Weekly, fortnightly or monthly, on the morning you choose — early enough to act on that day. Or generate on demand instead. Subscribers can do both.",
  },
  {
    q: "What if the quest is beyond me, or the weather is wrong?",
    a: "Re-roll it. Every mail has a re-roll and a pause link, and neither counts against you. Difficulty is your setting, not ours.",
  },
  {
    q: "Is it safe to be sent somewhere by an algorithm?",
    a: "Quests use marked, documented routes and carry distance, ascent, moving time and a daylight window. They are not a substitute for your own judgement, a map or the morning forecast. Night quests are only issued if you ask.",
  },
  {
    q: "How do you know I actually did it?",
    a: "You file proof — photos, a Strava link, or an account of the day — and a human reads it. Same reason a summit book exists. Honest retreats count: say the weather turned and it is approved as a retreat, not a failure.",
  },
  {
    q: "Do I have to meet strangers?",
    a: "No. Matching is off unless you switch it on, and solo is a first-class way to use this. If you do, you are matched on the quest, not a profile — and either side can unmatch, block or report at any point.",
  },
  {
    q: "Can I cancel?",
    a: "Any time, from any quest mail or your account page. You keep access to the end of the period you paid for, and your history stays exportable.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="section">
      <div className="wrap">
        <div className="sec-head">
          <span className="eyebrow">Before you ask</span>
          <h2 className="h2">Reasonable questions.</h2>
        </div>
        <div className="faq">
          {FAQ.map((item, index) => (
            <details key={item.q} open={index === 0}>
              <summary>
                <span className="q">{String(index + 1).padStart(2, "0")}</span>
                {item.q}
                <span className="sign" />
              </summary>
              <p className="ans">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* Closing call to action + footer                                            */
/* ========================================================================== */

export function FinalCta() {
  return (
    <section id="cta" className="cta-section relative overflow-hidden py-[110px] text-center">
      <ContoursBright />
      <div className="wrap">
        <span className="eyebrow justify-center">Your move</span>
        <h2 className="h2 mx-auto mt-5 max-w-[21ch]">
          Somewhere out there is a morning with your name on it.
        </h2>
        <p className="lede mx-auto mt-5 max-w-[48ch]">
          Generate one free. If it gets you out of the house, let the next one come to you.
        </p>
        <div className="hero-actions justify-center">
          <AuthButton mode="signup" className="btn btn-signal btn-lg">
            Create a free account
          </AuthButton>
          <a href="#pricing" className="btn btn-ghost btn-lg">
            See the plans
          </a>
        </div>
      </div>
    </section>
  );
}

function ContoursBright() {
  return (
    <svg
      className="contours opacity-70"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <path d="M600 400c-90 0-150 30-150 70s70 60 150 60 150-25 150-60-60-70-150-70z" />
      <path d="M600 350c-140 0-235 48-235 116s110 100 235 100 235-38 235-100-95-116-235-116z" />
      <path d="M600 300c-190 0-320 66-320 162s150 140 320 140 320-52 320-140-130-162-320-162z" />
      <path d="M600 250c-240 0-405 84-405 208s190 180 405 180 405-66 405-180-165-208-405-208z" />
      <path d="M600 200c-290 0-490 102-490 254s230 220 490 220 490-80 490-220-200-254-490-254z" />
      <path d="M600 150c-340 0-575 120-575 300s270 260 575 260 575-94 575-260-235-300-575-300z" />
      <path d="M600 100c-390 0-660 138-660 346s310 300 660 300 660-108 660-300-270-346-660-346z" />
    </svg>
  );
}

export function LandingFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <a href="#" className="logo">
              <LogoMark />
              Summit&nbsp;Quest
            </a>
            <p className="foot-blurb">
              Adventures issued, not planned. One at a time, until you run out of weekends.
            </p>
          </div>
          <div>
            <h4>Product</h4>
            <ul>
              <li>
                <a href="#demo">Try the generator</a>
              </li>
              <li>
                <a href="#how">How it works</a>
              </li>
              <li>
                <a href="#weekly">The weekly and the monthly</a>
              </li>
              <li>
                <a href="#together">Find a partner</a>
              </li>
              <li>
                <a href="#terrain">The ground itself</a>
              </li>
              <li>
                <a href="#stickers">Sticker sheets</a>
              </li>
              <li>
                <a href="#pricing">Pricing</a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li>
                <a href="#how">About</a>
              </li>
              <li>
                <AuthButton>Log in / Account</AuthButton>
              </li>
              <li>
                <a href="#faq">FAQ</a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Legal</h4>
            <ul>
              <li>
                <a href="/legal/terms">Terms</a>
              </li>
              <li>
                <a href="/legal/privacy">Privacy</a>
              </li>
              <li>
                <a href="/legal/safety">Safety notice</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="foot-bot">
          <span>© 2026 Summit Quest</span>
          <span>Go outside · Leave no trace · Tell someone where you went</span>
        </div>
      </div>
    </footer>
  );
}
