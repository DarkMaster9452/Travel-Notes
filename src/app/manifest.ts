import type { MetadataRoute } from "next";

/**
 * The web manifest.
 *
 * Here so the mark follows the product off the browser tab: an installed
 * shortcut, an Android home screen, a task switcher.
 *
 * The colours are the page ground of the Trail system (`--sq-bg`, light),
 * repeated here because a manifest cannot read a custom property. The icons
 * are built from the mark by `scripts/build-icons.mjs`.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Summit Quest",
    short_name: "Summit Quest",
    description:
      "One big quest a month and a smaller one every week. Walk the route, file your proof, earn the sticker.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f8f1",
    theme_color: "#f4f8f1",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      // Maskable: Android crops an icon to its launcher's shape and keeps only
      // the middle ~80 %, so this one is full-bleed with the peak drawn smaller.
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
