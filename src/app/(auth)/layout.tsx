import Link from "next/link";

import { QuestImage } from "@/components/quest/quest-image";
import { IMAGES } from "@/lib/images";
import { BRAND } from "@/lib/config";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* Image panel — decorative on mobile, full height on desktop. */}
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <QuestImage
          src={IMAGES.forestPath.src}
          alt={IMAGES.forestPath.alt}
          palette={IMAGES.forestPath.palette}
          sizes="50vw"
          zoomOnHover={false}
          priority
        />
        <div className="scrim absolute inset-0" aria-hidden="true" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Link href="/" className="font-display text-3xl font-extrabold text-paper">
            {BRAND.name}
          </Link>
          <p className="max-w-sm font-script text-4xl leading-relaxed text-paper">
            Somewhere within an hour of you, there is a place you have never stood.
          </p>
        </div>
      </div>

      <main className="flex flex-col justify-center bg-paper px-5 py-12 sm:px-12 lg:px-16">
        <Link
          href="/"
          className="mb-12 font-display text-2xl font-extrabold text-ink lg:hidden"
        >
          {BRAND.name}
        </Link>
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
