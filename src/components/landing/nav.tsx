"use client";

import Link from "next/link";
import * as React from "react";

import { LogoMark } from "@/components/field";
import { cn } from "@/lib/utils";

import { useAuthModal } from "./auth-modal";

/**
 * The nav is a shortlist, not a table of contents.
 *
 * The sections it skips are still on the page and still linked from the
 * footer — they are simply not what someone deciding whether to sign up
 * needs jumped to. The monthly quest is the product's headline, so the
 * cadence section is reached through "How it works" rather than given a tab
 * that would sell the weekly as the main event.
 */
const LINKS = [
  { href: "#demo", label: "Try it" },
  { href: "#how", label: "How it works" },
  { href: "#together", label: "Go together" },
  { href: "#stickers", label: "Stickers" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function LandingNav({ home }: { home: string | null }) {
  const { open } = useAuthModal();
  const [stuck, setStuck] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cn("nav", stuck && "stuck")}>
      <div className="wrap nav-in">
        <Link href="/" className="logo" aria-label="Summit Quest home">
          <LogoMark />
          Summit&nbsp;Quest
        </Link>

        <nav className={cn("nav-links", menuOpen && "open")} onClick={() => setMenuOpen(false)}>
          {LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <button
          className="burger"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label="Menu"
          aria-expanded={menuOpen}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>

        <div className="nav-cta">
          {home ? (
            <Link href={home} className="btn btn-primary btn-sm">
              {home === "/admin" ? "Open the panel" : "Your quests"}
            </Link>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => open("login")}>
                Log in
              </button>
              <a href="#pricing" className="btn btn-primary btn-sm">
                Subscribe
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
