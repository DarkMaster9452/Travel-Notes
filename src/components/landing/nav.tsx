"use client";

import Link from "next/link";
import * as React from "react";

import { LogoMark } from "@/components/field";
import { cn } from "@/lib/utils";

import { useAuthModal } from "./auth-modal";

const LINKS = [
  { href: "#demo", label: "Try it" },
  { href: "#how", label: "How it works" },
  { href: "#mail", label: "By mail" },
  { href: "#together", label: "Go together" },
  { href: "#weekly", label: "Weekly" },
  { href: "#stickers", label: "Stickers" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function LandingNav({ signedIn }: { signedIn: boolean }) {
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
          {signedIn ? (
            <Link href="/app" className="btn btn-primary btn-sm">
              Your quests
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
