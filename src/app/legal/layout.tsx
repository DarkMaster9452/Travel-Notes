import Link from "next/link";

import { LogoMark } from "@/components/field";

const PAGES = [
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/safety", label: "Safety notice" },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <div className="paper-grain" aria-hidden="true" />

      <header className="nav stuck">
        <div className="wrap nav-in">
          <Link href="/" className="logo" aria-label="Summit Quest home">
            <LogoMark />
            Summit&nbsp;Quest
          </Link>
          <nav className="nav-links">
            {PAGES.map((page) => (
              <Link key={page.href} href={page.href}>
                {page.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="app-main flex-1">
        <div className="wrap max-w-[760px]">{children}</div>
      </main>
    </div>
  );
}
