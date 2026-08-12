"use client";

import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/config";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#quests", label: "Quests" },
  { href: "#pricing", label: "Pricing" },
];

export function MarketingNav({ signedIn }: { signedIn: boolean }) {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled ? "bg-ink/92 backdrop-blur-sm" : "bg-transparent",
      )}
    >
      <nav
        className="mx-auto flex h-16 max-w-[100rem] items-center justify-between px-5 sm:h-20 sm:px-8"
        aria-label="Main"
      >
        <Link href="/" className="font-display text-2xl font-extrabold tracking-tight text-paper sm:text-3xl">
          {BRAND.name}
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="kicker text-paper/70 transition-colors hover:text-paper"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {signedIn ? (
            <Button asChild variant="light" size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghostLight" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild variant="light" size="sm">
                <Link href="/signup">Start free</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex size-10 items-center justify-center text-paper md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <span className="relative block h-3 w-6">
            <span
              className={cn(
                "absolute inset-x-0 top-0 h-0.5 bg-current transition-transform",
                open && "translate-y-[5px] rotate-45",
              )}
            />
            <span
              className={cn(
                "absolute inset-x-0 bottom-0 h-0.5 bg-current transition-transform",
                open && "-translate-y-[7px] -rotate-45",
              )}
            />
          </span>
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-paper/15 bg-ink px-5 pb-8 pt-4 md:hidden">
          <ul className="flex flex-col">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-paper/12 py-4 font-display text-2xl font-bold uppercase text-paper"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col gap-3">
            {signedIn ? (
              <Button asChild variant="light" size="lg">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="light" size="lg">
                  <Link href="/signup">Start free</Link>
                </Button>
                <Button asChild variant="outlineLight" size="lg">
                  <Link href="/login">Log in</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
