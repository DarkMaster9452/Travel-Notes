import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Inter, Source_Serif_4 } from "next/font/google";

import { getLocale, getDictionary } from "@/lib/i18n";

import "./globals.css";

const display = Big_Shoulders({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display-face",
  weight: ["600", "700", "800", "900"],
  display: "swap",
});

const body = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body-face",
  display: "swap",
});

const serif = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  variable: "--font-serif-face",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getLocale());

  return {
    title: { default: t.meta.title, template: "%s · STOPA" },
    description: t.meta.description,
    openGraph: {
      title: t.meta.title,
      description: t.meta.description,
      type: "website",
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: "#0b0c0a",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${display.variable} ${body.variable} ${serif.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
