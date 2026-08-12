/**
 * Every photograph in the product is referenced through this module.
 *
 * Each entry carries a `palette` alongside the URL. The palette drives a
 * generated ridgeline artwork that sits *underneath* the photo, so a slow
 * network or a dead URL degrades into something designed rather than a grey
 * box. Swapping in your own asset host is a one-file change.
 */

export type ImageAsset = {
  key: string;
  src: string;
  alt: string;
  /** [sky, far ridge, near ridge] — used by the generated fallback artwork. */
  palette: readonly [string, string, string];
};

const UNSPLASH = (id: string, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const IMAGES = {
  heroMountain: {
    key: "heroMountain",
    src: UNSPLASH("1464822759023-fed622ff2c3b", 2400),
    alt: "Layered mountain ridges disappearing into morning haze",
    palette: ["#1b2a2b", "#2f4a41", "#0d1512"],
  },
  waterfallForest: {
    key: "waterfallForest",
    src: UNSPLASH("1432405972618-c60b0225b8f9"),
    alt: "A waterfall falling into a mossy forest pool",
    palette: ["#16211c", "#27403a", "#0b110f"],
  },
  sunsetRidge: {
    key: "sunsetRidge",
    src: UNSPLASH("1501785888041-af3ef285b470"),
    alt: "A hiker's view of a valley at sunset",
    palette: ["#3a2418", "#7c4327", "#160d09"],
  },
  forestPath: {
    key: "forestPath",
    src: UNSPLASH("1441974231531-c6227db76b6e"),
    alt: "Sunlight falling through a dense green forest",
    palette: ["#16240f", "#33512a", "#0a120a"],
  },
  alpineLake: {
    key: "alpineLake",
    src: UNSPLASH("1506905925346-21bda4d32df4"),
    alt: "A still alpine lake below bare peaks",
    palette: ["#16232e", "#2d4a5c", "#0a1016"],
  },
  ruins: {
    key: "ruins",
    src: UNSPLASH("1533105079780-92b9be482077"),
    alt: "Stone castle ruins on a wooded hilltop",
    palette: ["#241f19", "#4a4034", "#100d0a"],
  },
  rockyGorge: {
    key: "rockyGorge",
    src: UNSPLASH("1470071459604-3b5ec3a7fe05"),
    alt: "A narrow rock gorge in low fog",
    palette: ["#1a1c1e", "#3c4247", "#0c0d0f"],
  },
  meadowMorning: {
    key: "meadowMorning",
    src: UNSPLASH("1472396961693-142e6e269027"),
    alt: "Open meadow at first light",
    palette: ["#22271a", "#4b5533", "#0e1109"],
  },
  cave: {
    key: "cave",
    src: UNSPLASH("1520962880247-cfaf541c8724"),
    alt: "Light entering the mouth of a cave",
    palette: ["#14161a", "#333a42", "#08090b"],
  },
  riverValley: {
    key: "riverValley",
    src: UNSPLASH("1439853949127-fa647821eba0"),
    alt: "A river running through a wide green valley",
    palette: ["#182420", "#33534a", "#0a100e"],
  },
  summitFog: {
    key: "summitFog",
    src: UNSPLASH("1483728642387-6c3bdd6c93e5"),
    alt: "A summit rising above a sea of fog",
    palette: ["#1d242b", "#485867", "#0b0e12"],
  },
  autumnForest: {
    key: "autumnForest",
    src: UNSPLASH("1507371341162-763b5e419408"),
    alt: "Autumn forest in warm afternoon light",
    palette: ["#2a1d12", "#6b4423", "#120c07"],
  },
  winterRidge: {
    key: "winterRidge",
    src: UNSPLASH("1418985991508-e47386d96a71"),
    alt: "Snow-covered ridge under a pale sky",
    palette: ["#20262c", "#5b6875", "#0d1013"],
  },
  lakeReflection: {
    key: "lakeReflection",
    src: UNSPLASH("1552083375-1447ce886485"),
    alt: "Mountains reflected in a calm lake",
    palette: ["#141f27", "#2b4657", "#080d11"],
  },
  trailMarker: {
    key: "trailMarker",
    src: UNSPLASH("1551632811-561732d1e306"),
    alt: "A hiker on a marked trail above the treeline",
    palette: ["#1c2620", "#3d5546", "#0a0f0c"],
  },
  nightSky: {
    key: "nightSky",
    src: UNSPLASH("1470071459604-3b5ec3a7fe05"),
    alt: "Stars above a dark mountain silhouette",
    palette: ["#0b1018", "#1d2a3d", "#050709"],
  },
} as const satisfies Record<string, ImageAsset>;

export type ImageKey = keyof typeof IMAGES;

export const IMAGE_KEYS = Object.keys(IMAGES) as ImageKey[];

export function getImage(key: string | null | undefined): ImageAsset {
  if (key && key in IMAGES) return IMAGES[key as ImageKey];
  return IMAGES.heroMountain;
}

/** Resolve a stored cover-image URL back to its asset, if we know it. */
export function assetForSrc(src: string): ImageAsset | undefined {
  return Object.values(IMAGES).find((image) => image.src === src);
}

/**
 * Quest records store the resolved URL. Given a stored URL, recover the
 * palette so the fallback artwork still matches the photograph.
 */
export function paletteForSrc(src: string): readonly [string, string, string] {
  return assetForSrc(src)?.palette ?? (["#16211c", "#2f4a41", "#0b110f"] as const);
}
