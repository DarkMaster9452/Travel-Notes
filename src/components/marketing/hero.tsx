import Link from "next/link";

import { QuestImage } from "@/components/quest/quest-image";
import { Button } from "@/components/ui/button";
import { IMAGES } from "@/lib/images";

export function Hero({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-ink">
      <QuestImage
        src={IMAGES.heroMountain.src}
        alt={IMAGES.heroMountain.alt}
        palette={IMAGES.heroMountain.palette}
        priority
        sizes="100vw"
        zoomOnHover={false}
      />
      <div className="scrim absolute inset-0" aria-hidden="true" />
      <div className="grain absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto flex min-h-[100svh] max-w-[100rem] flex-col justify-end px-5 pb-14 pt-28 sm:px-8 sm:pb-20">
        <p className="kicker animate-fade text-paper/70">
          Personalised · Randomised · Never the same twice
        </p>

        <h1 className="display-xl animate-rise mt-6 max-w-[16ch] text-paper">
          Your next summit is waiting.
        </h1>

        <div className="mt-10 flex flex-col gap-8 border-t border-paper/25 pt-8 lg:flex-row lg:items-end lg:justify-between">
          <p className="max-w-md font-script text-2xl leading-relaxed text-paper/85 sm:text-3xl">
            Stop scrolling. Start exploring.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="light" size="xl">
              <Link href={signedIn ? "/dashboard" : "/signup"}>
                Generate my quest
                <span aria-hidden="true">→</span>
              </Link>
            </Button>
            <Button asChild variant="outlineLight" size="xl">
              <a href="#how">See how it works</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
