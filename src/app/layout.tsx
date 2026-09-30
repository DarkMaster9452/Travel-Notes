import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";

import { ToastProvider } from "@/components/field/toast";
import { PressFeedback } from "@/components/motion/interactions";

import "./globals.css";

/**
 * The three faces of the Trail design system (design/DESIGN-SYSTEM.md §2):
 *   Bricolage Grotesque  display — h1, h2, the monthly quest's title, big numbers
 *   Inter                UI and body, everywhere, the admin panel included
 *   JetBrains Mono       codes only — slot keys, ids, logs
 */
const bricolage = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--font-bricolage",
  weight: ["600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500"],
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
  themeColor: "#f4f8f1",
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
      className={`${bricolage.variable} ${inter.variable} ${jetbrainsMono.variable}`}
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
