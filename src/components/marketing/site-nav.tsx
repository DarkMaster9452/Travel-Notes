"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useT } from "@/components/i18n";
import { ButtonLink, buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

/**
 * The marketing top bar (design/DESIGN-SYSTEM.md §6.5): 64 px, sticky, the
 * page ground at 90 % with a hairline once the page has scrolled. Logo, the
 * section links, the language, "Log in" (ghost) and "Get started" (primary).
 *
 * `links` are the landing page's own sections; the legal pages pass their
 * three documents instead and login/signup pass none.
 */
export type SiteNavLink = { href: string; label: string };

export function SiteNav({
  home,
  links = [],
  linksLabel,
  auth = true,
}: {
  /** Where a signed-in visitor belongs, or null when signed out. */
  home: string | null;
  links?: SiteNavLink[];
  linksLabel?: string;
  /** Hide the account buttons on the pages that are themselves the account forms. */
  auth?: boolean;
}) {
  const t = useT();
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const account = home ? (
    <ButtonLink href={home} size="md">
      {home === "/admin" ? t.landing.nav.openPanel : t.landing.nav.yourQuests}
    </ButtonLink>
  ) : (
    <>
      <ButtonLink href="/login" variant="ghost" className="hidden sm:inline-flex">
        {t.landing.nav.login}
      </ButtonLink>
      <ButtonLink href="/signup">{t.landing.nav.start}</ButtonLink>
    </>
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-nav border-b bg-bg/90 backdrop-blur-sm transition-colors duration-base",
        stuck || open ? "border-border" : "border-transparent",
      )}
    >
      <Container className="flex h-16 items-center gap-2">
        <Link href="/" aria-label={t.ui.home} className="mr-auto rounded-control no-underline lg:mr-4">
          <Logo />
        </Link>

        {links.length > 0 ? (
          <nav aria-label={linksLabel} className="mr-auto hidden lg:block">
            <ul className="flex items-center gap-1">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="inline-flex min-h-10 items-center rounded-control px-3 text-body-sm font-medium text-muted no-underline transition-colors duration-fast hover:bg-surface-sunken hover:text-text"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <LocaleSwitcher />
        {auth ? account : null}

        {links.length > 0 ? (
          <button
            type="button"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={t.ui.menu}
            onClick={() => setOpen((value) => !value)}
            className={cn(buttonVariants({ variant: "ghost" }), "px-3 lg:hidden")}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        ) : null}
      </Container>

      {links.length > 0 && open ? (
        <nav id="site-menu" aria-label={linksLabel} className="border-t border-border lg:hidden">
          <Container className="py-3">
            <ul className="flex flex-col">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center rounded-control px-3 text-body font-medium text-text no-underline hover:bg-surface-sunken"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              {auth && !home ? (
                <li className="sm:hidden">
                  <Link
                    href="/login"
                    className="flex min-h-11 items-center rounded-control px-3 text-body font-medium text-text no-underline hover:bg-surface-sunken"
                  >
                    {t.landing.nav.login}
                  </Link>
                </li>
              ) : null}
            </ul>
          </Container>
        </nav>
      ) : null}
    </header>
  );
}
