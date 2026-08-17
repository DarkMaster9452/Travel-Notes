import Link from "next/link";

import { Contours, Eyebrow } from "@/components/field";

export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh flex-col justify-center overflow-hidden bg-paper text-ink">
      <div className="paper-grain" aria-hidden="true" />
      <Contours />
      <div className="wrap">
        <Eyebrow tone="warm">404</Eyebrow>
        <h1 className="h2 mt-4 max-w-[18ch]">This one isn&apos;t on the map.</h1>
        <p className="lede mt-5 max-w-[46ch]">
          The page you were looking for doesn&apos;t exist — or it belongs to someone else&apos;s
          adventure.
        </p>
        <div className="hero-actions">
          <Link href="/dashboard" className="btn btn-signal btn-lg">
            Go to your quests
          </Link>
          <Link href="/" className="btn btn-ghost btn-lg">
            Back to the start
          </Link>
        </div>
      </div>
    </main>
  );
}
