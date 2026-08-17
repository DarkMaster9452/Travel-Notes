import Link from "next/link";

import { Contours, LogoMark } from "@/components/field";

/**
 * The shell around login and signup.
 *
 * Same paper, same contour backdrop as the landing hero — arriving at the
 * login form should feel like walking further into the same building, not
 * leaving it.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-paper text-ink">
      <div className="paper-grain" aria-hidden="true" />
      <Contours />

      <header className="wrap flex h-[70px] shrink-0 items-center">
        <Link href="/" className="logo" aria-label="Summit Quest home">
          <LogoMark />
          Summit&nbsp;Quest
        </Link>
      </header>

      <main className="wrap flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-[420px]">{children}</div>
      </main>

      <footer className="wrap shrink-0 pb-8">
        <p className="note text-center">
          Go outside · Leave no trace · Tell someone where you went
        </p>
      </footer>
    </div>
  );
}
