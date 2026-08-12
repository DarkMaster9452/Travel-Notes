import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Kicker } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col justify-center bg-ink px-5 py-16 text-paper sm:px-10">
      <div className="mx-auto w-full max-w-2xl">
        <Kicker className="text-ember-light">404</Kicker>
        <h1 className="display-lg mt-5">This one isn&apos;t on the map.</h1>
        <p className="mt-6 max-w-md text-lg text-paper/70">
          The page you were looking for doesn&apos;t exist — or it belongs to someone else&apos;s
          adventure.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="light" size="lg">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
          <Button asChild variant="outlineLight" size="lg">
            <Link href="/">Back to the start</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
