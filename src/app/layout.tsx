import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono, Inter, JetBrains_Mono } from "next/font/google";

import { ToastProvider } from "@/components/field/toast";
import { PressFeedback } from "@/components/motion/interactions";

import "./globals.css";

/**
 * The three faces the design system runs on, per `index.html`:
 *   Fraunces      display serif — headings, big numbers, anything handed to you
 *   Inter         UI and body
 *   JetBrains Mono labels, stats, eyebrows, timestamps — uppercase, letterspaced
 */
const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-fraunces",
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/**
 * The panel's two faces.
 *
 * The marketing site and the customer app are read in passes — a page at a
 * time, a quest card at a time — and Fraunces/Inter/JetBrains is tuned for
 * that: a display serif to hand you something, a mono to caption it. The admin
 * panel is not read that way. It is a queue somebody scans for an hour, and
 * the same type that gives the landing page its voice was costing legibility
 * at the sizes and densities the panel actually runs at.
 *
 * Geist is a UI face rather than a text face: shorter extenders, a taller
 * x-height and unambiguous figures at 13px, which is where most of the panel
 * lives. Its mono is kept for the handful of genuine labels — a scope toggle,
 * a column header — rather than for content.
 *
 * The landing page keeps its own type entirely. These are scoped to the panel
 * in `field-guide.css`, and Fraunces still sets the panel's page titles, which
 * is the thread back to the rest of the product.
 */
const geist = Geist({
  subsets: ["latin", "latin-ext"],
  variable: "--font-geist",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-geist-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Summit Quest — Your next adventure, assigned.",
    template: "%s · Summit Quest",
  },
  description:
    "Summit Quest turns your preferences into a real hiking assignment: a place, an objective, a bonus challenge — and, if you want, someone to go with. Try it online. Subscribe and it arrives in your inbox.",
  openGraph: {
    title: "Summit Quest — Your next adventure, assigned.",
    description:
      "A place to be, an objective to complete, one bonus challenge you didn't ask for. Never the same one twice.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#eff0e5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The landing page scrolls smoothly to its anchors. `data-scroll-behavior`
    // tells the router that is deliberate, so route transitions still jump.
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} ${geist.variable} ${geistMono.variable}`}
    >
      <body className="min-h-dvh">
        {/* Press feedback is mounted once, for the whole product: the landing
            page, the app and the panel all press the same way. */}
        <PressFeedback />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
