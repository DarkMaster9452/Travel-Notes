import Link from "next/link";

import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { Overline } from "@/components/ui/typography";
import type { Messages } from "@/lib/i18n";

/** The marketing footer (§6.5): a quiet sunken surface, never a dark slab. */
export function SiteFooter({ t, sections = true }: { t: Messages; sections?: boolean }) {
  const product = [
    { href: "/#how", label: t.landing.nav.how },
    { href: "/#quests", label: t.landing.nav.quests },
    { href: "/#proof", label: t.landing.nav.proof },
    { href: "/#stickers", label: t.landing.nav.stickers },
    { href: "/#pricing", label: t.landing.nav.pricing },
    { href: "/#faq", label: t.landing.nav.faq },
  ];
  const account = [
    { href: "/login", label: t.landing.footer.login },
    { href: "/signup", label: t.landing.footer.signup },
  ];
  const legal = [
    { href: "/legal/terms", label: t.landing.footer.terms },
    { href: "/legal/privacy", label: t.landing.footer.privacy },
    { href: "/legal/safety", label: t.landing.footer.safety },
  ];

  const columns = sections
    ? [
        { title: t.landing.footer.product, links: product },
        { title: t.landing.footer.account, links: account },
        { title: t.landing.footer.legal, links: legal },
      ]
    : [{ title: t.landing.footer.legal, links: legal }];

  return (
    <footer className="mt-auto bg-surface-sunken text-muted">
      <Container className="py-12">
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-5">
            <Logo />
            <p className="mt-3 max-w-form text-body-sm">{t.landing.footer.blurb}</p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
            {columns.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <Overline as="h2">{column.title}</Overline>
                <ul className="mt-3 flex flex-col gap-2">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-body-sm text-muted no-underline transition-colors duration-fast hover:text-text hover:underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-caption sm:flex-row sm:items-center sm:justify-between">
          <span>{t.landing.footer.rights(new Date().getFullYear())}</span>
          <span>{t.landing.footer.motto}</span>
        </div>
      </Container>
    </footer>
  );
}
