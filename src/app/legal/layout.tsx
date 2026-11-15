import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteNav } from "@/components/marketing/site-nav";
import { Container } from "@/components/ui/container";
import { Alert } from "@/components/ui/feedback";
import { homeFor } from "@/lib/auth/guards";
import { getCurrentUser } from "@/lib/auth/session";
import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";

/**
 * The legal pages: the marketing shell around a long-text column (640 px,
 * design/DESIGN-SYSTEM.md §6.2). The documents themselves are written in
 * English; a reader in another language is told so rather than left to wonder.
 */
export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()]);
  const t = getMessages(locale);

  const links = [
    { href: "/legal/terms", label: t.legal.terms },
    { href: "/legal/privacy", label: t.legal.privacy },
    { href: "/legal/safety", label: t.legal.safety },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteNav home={user ? homeFor(user) : null} links={links} linksLabel={t.legal.nav} />

      <main className="py-12 lg:py-16">
        <Container size="text" className="flex flex-col gap-8">
          {t.legal.englishOnly ? <Alert tone="info">{t.legal.englishOnly}</Alert> : null}
          <div lang="en">{children}</div>
        </Container>
      </main>

      <SiteFooter t={t} sections={false} />
    </div>
  );
}
