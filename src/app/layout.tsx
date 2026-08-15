import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";

import { ToastProvider } from "@/components/field/toast";

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
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-dvh">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
