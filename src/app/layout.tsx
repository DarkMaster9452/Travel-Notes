import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Inter, Instrument_Serif } from "next/font/google";

import { BRAND } from "@/lib/config";

import "./globals.css";

const display = Big_Shoulders({
  subsets: ["latin"],
  variable: "--font-display-face",
  weight: ["600", "700", "800", "900"],
  display: "swap",
});

const body = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body-face",
  display: "swap",
});

const accent = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-accent-face",
  weight: "400",
  style: ["italic", "normal"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description:
    "Personalised, randomised hiking quests. Stop scrolling, start exploring — a new adventure every time, never the same one twice.",
  openGraph: {
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: "Personalised, randomised adventure quests. Stop scrolling. Start exploring.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b0c0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${accent.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
