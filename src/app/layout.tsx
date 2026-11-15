import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
// Self-hosted from npm: `next/font/google` fails to resolve Bricolage's font
// files under Turbopack, so the variable face ships with the bundle instead.
import "@fontsource-variable/bricolage-grotesque";

import { I18nProvider } from "@/components/i18n";
import { ToastProvider } from "@/components/ui/toast";
import { getCurrentUser } from "@/lib/auth/session";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";

import "./globals.css";

/**
 * The three faces of the Trail design system (design/DESIGN-SYSTEM.md §2):
 *   Bricolage Grotesque  display — h1, h2, the monthly quest's title, big numbers
 *   Inter                UI and body, everywhere, the admin panel included
 *   JetBrains Mono       codes only — slot keys, ids, logs
 */
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

export async function generateMetadata(): Promise<Metadata> {
  const t = getMessages(await getLocale());
  return {
    title: { default: t.meta.title, template: "%s · Summit Quest" },
    description: t.meta.description,
    openGraph: { title: t.meta.title, description: t.meta.description, type: "website" },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f8f1" },
    { media: "(prefers-color-scheme: dark)", color: "#1f2a26" },
  ],
  width: "device-width",
  initialScale: 1,
};

/**
 * Language and theme are decided here, once, for the whole document: the
 * language from the account or the visitor (see `lib/i18n/server`), the theme
 * from the account, falling back to the system's. Both sit on `<html>` so that
 * portalled surfaces — dialogs, menus, toasts — read the same ones as the page.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()]);
  const theme = user?.theme === "DARK" ? "dark" : user?.theme === "LIGHT" ? "light" : "system";
  const t = getMessages(locale);

  return (
    // The landing page scrolls smoothly to its anchors. `data-scroll-behavior`
    // tells the router that is deliberate, so route transitions still jump.
    <html
      lang={locale}
      data-theme={theme}
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-dvh">
        <I18nProvider locale={locale}>
          <ToastProvider dismissLabel={t.ui.dismiss}>{children}</ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
