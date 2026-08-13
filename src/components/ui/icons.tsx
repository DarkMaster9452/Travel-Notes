import { cn } from "@/lib/utils";

/**
 * One stroked icon set for the whole product.
 *
 * Everything is drawn on the same 24-grid with the same 1.6 stroke and
 * `currentColor`, so an icon inherits the colour of whatever it sits in and a
 * row of them reads as one family. This replaces the emoji that used to stand
 * in for achievements, difficulties and terrain tags: emoji render as another
 * vendor's full-colour artwork on every platform, which no amount of CSS can
 * bring into line with a palette.
 */

export type IconProps = {
  className?: string;
  /** Pixel size for width and height. Defaults to 1em so it tracks font-size. */
  size?: number;
  title?: string;
};

function Svg({
  className,
  size,
  title,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size ?? "1em"}
      height={size ?? "1em"}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={cn("shrink-0", className)}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}

/* ---- Terrain & interests -------------------------------------------- */

export const IconForest = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3 7.5 10h3L6.5 16.5h11L13.5 10h3z" />
    <path d="M12 16.5V21" />
  </Svg>
);

export const IconMountain = (p: IconProps) => (
  <Svg {...p}>
    <path d="m2.5 19 6-10.5 4 6.5 2.5-4L21.5 19z" />
    <path d="m8.5 8.5 2.2 3.8" />
  </Svg>
);

export const IconWater = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3s5.5 6.2 5.5 10a5.5 5.5 0 1 1-11 0C6.5 9.2 12 3 12 3Z" />
  </Svg>
);

export const IconRocks = (p: IconProps) => (
  <Svg {...p}>
    <path d="m3 18 4-7 4 7z" />
    <path d="m10.5 18 4.5-9 6 9z" />
  </Svg>
);

export const IconCastle = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20V8l2.5 2L9 6l3 3 3-3 2.5 4L20 8v12z" />
    <path d="M10 20v-4h4v4" />
  </Svg>
);

export const IconSunrise = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 18h18" />
    <path d="M7.5 18a4.5 4.5 0 0 1 9 0" />
    <path d="M12 3v3M4.8 7.8l2 2m12.4-2-2 2" />
  </Svg>
);

export const IconCompass = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m15 9-2 4.5L8.5 15l2-4.5z" />
  </Svg>
);

export const IconBoot = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 5h3.5v6l7 3.5a3 3 0 0 1 1.7 2.7V19H5z" />
    <path d="M5 15.5h5" />
  </Svg>
);

export const IconCave = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 20v-5a8.5 8.5 0 0 1 17 0v5h-5v-4a3.5 3.5 0 0 0-7 0v4z" />
  </Svg>
);

/* ---- Achievements ---------------------------------------------------- */

export const IconRuler = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.5" y="8.5" width="19" height="7" rx="1.5" />
    <path d="M7 8.5v3m4-3v4m4-4v3" />
  </Svg>
);

export const IconMap = (p: IconProps) => (
  <Svg {...p}>
    <path d="m3 6.5 6-2.5 6 2.5 6-2.5v13L15 19.5 9 17l-6 2.5z" />
    <path d="M9 4v13m6-10.5V19.5" />
  </Svg>
);

export const IconBookmark = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6.5 4h11v16l-5.5-4-5.5 4z" />
  </Svg>
);

export const IconTrophy = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
    <path d="M7 5.5H4.5V7A3.5 3.5 0 0 0 8 10.5M17 5.5h2.5V7a3.5 3.5 0 0 1-3.5 3.5" />
    <path d="M12 14v3m-3.5 3h7" />
  </Svg>
);

export const IconFlag = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 21V4" />
    <path d="M6 4.5h11l-2 3.5 2 3.5H6z" />
  </Svg>
);

export const IconSunrisePeak = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="7" r="3" />
    <path d="m3 20 5-7 3 4 2.5-3L21 20z" />
  </Svg>
);

/* ---- Interface ------------------------------------------------------- */

export const IconHome = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5.5 10V20h13V10" />
  </Svg>
);

export const IconDatabase = (p: IconProps) => (
  <Svg {...p}>
    <ellipse cx="12" cy="6.5" rx="7.5" ry="3" />
    <path d="M4.5 6.5v11c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-11" />
    <path d="M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3" />
  </Svg>
);

export const IconCalendar = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="1.5" />
    <path d="M3.5 9.5h17M8 3.5V6m8-2.5V6" />
  </Svg>
);

export const IconUser = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5" />
  </Svg>
);

export const IconCrown = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 17h16M4 17 3 7l5 3.5L12 5l4 5.5L21 7l-1 10" />
  </Svg>
);

export const IconBell = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5S6.5 14 6.5 10Z" />
    <path d="M10.5 19a1.8 1.8 0 0 0 3 0" />
  </Svg>
);

export const IconSearch = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </Svg>
);

export const IconChevronDown = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);

export const IconArrowRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 12h15m-5.5-5.5L19.5 12l-6 5.5" />
  </Svg>
);

export const IconPin = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21s6.5-5.7 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 15.3 12 21 12 21z" />
    <circle cx="12" cy="10.5" r="2.2" />
  </Svg>
);

export const IconStar = (p: IconProps) => (
  <Svg {...p}>
    <path d="m12 4 2.4 5 5.6.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.6-.8z" />
  </Svg>
);

export const IconActivity = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 12h4l2.5-6 4 12 2.5-6h5" />
  </Svg>
);

export const IconSettings = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3.5v2m0 13v2M3.5 12h2m13 0h2M6 6l1.5 1.5M16.5 16.5 18 18M18 6l-1.5 1.5M7.5 16.5 6 18" />
  </Svg>
);

export const IconLogout = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14.5 4.5H19V19.5h-4.5" />
    <path d="M4 12h10m-3.5-4L14.5 12l-4 4" />
  </Svg>
);

export const IconSparkle = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9z" />
    <path d="M18.5 15.5 19 17l1.5.5-1.5.5-.5 1.5-.5-1.5L16.5 18l1.5-.5z" />
  </Svg>
);

export const IconCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Svg>
);

export const IconClock = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v5.2l3.2 2" />
  </Svg>
);

export const IconMenu = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const IconClose = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const IconDice = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <circle cx="9" cy="9" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="15" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconLeaf = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 4C10 4 4.5 8 4.5 14.5A5.5 5.5 0 0 0 10 20c6.5 0 10-5.5 10-16Z" />
    <path d="M16.5 7.5 7 17" />
  </Svg>
);

/** Named lookup used where the icon is chosen by data (taxonomy, achievements). */
export const ICONS = {
  forest: IconForest,
  mountain: IconMountain,
  water: IconWater,
  rocks: IconRocks,
  castle: IconCastle,
  sunrise: IconSunrise,
  compass: IconCompass,
  boot: IconBoot,
  cave: IconCave,
  ruler: IconRuler,
  map: IconMap,
  bookmark: IconBookmark,
  trophy: IconTrophy,
  flag: IconFlag,
  peak: IconSunrisePeak,
  leaf: IconLeaf,
  dice: IconDice,
  star: IconStar,
  check: IconCheck,
  clock: IconClock,
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, ...props }: IconProps & { name: IconName }) {
  const Component = ICONS[name];
  return <Component {...props} />;
}
