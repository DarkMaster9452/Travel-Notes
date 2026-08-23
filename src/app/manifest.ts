import type { MetadataRoute } from "next";

/**
 * The web manifest.
 *
 * Here so the mark follows the product off the browser tab: an installed
 * shortcut, an Android home screen, a task switcher. Without it those all fall
 * back to a screenshot of the page or the first letter of the name, which is
 * how a product that has a mark still ends up looking like it doesn't.
 *
 * The colours are the paper the whole product is printed on and the pine the
 * chrome is drawn in — the same two values the stylesheet opens with, repeated
 * here because a manifest cannot read a custom property.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Summit Quest",
    short_name: "Summit Quest",
    description:
      "A place to be, an objective to complete, one bonus challenge you didn't ask for. Never the same one twice.",
    start_url: "/",
    display: "standalone",
    background_color: "#eff0e5",
    // Paper, matching the `themeColor` the root layout already declares — the
    // two describe the same browser chrome and disagreeing about it would show
    // as a colour change between the tab and an installed window.
    theme_color: "#eff0e5",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      // Maskable: Android crops an icon to whatever shape the launcher uses,
      // and only the middle ~80% survives it. So this is a separate drawing —
      // paper to the edge instead of the rounded tile, which would otherwise be
      // rounded twice, and the ridge scaled into the safe circle.
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
