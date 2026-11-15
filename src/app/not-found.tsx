import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { LogoMark } from "@/components/ui/logo";
import { Overline, type } from "@/components/ui/typography";
import { homeFor } from "@/lib/auth/guards";
import { getCurrentUser } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";

/** The 404 for anything outside the app and the panel, which have their own. */
export default async function NotFound() {
  const [t, user] = await Promise.all([getT(), getCurrentUser()]);
  const home = user ? homeFor(user) : null;

  return (
    <main className="grid min-h-dvh place-items-center py-16">
      <Container size="narrow" className="flex flex-col items-start gap-4">
        <LogoMark className="size-12" />
        <Overline>{t.notFound.code}</Overline>
        <h1 className={type.display}>{t.notFound.title}</h1>
        <p className="text-body-lg text-muted">{t.notFound.body}</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          {home ? (
            <ButtonLink href={home} size="lg">
              {home === "/admin" ? t.landing.nav.openPanel : t.notFound.toQuests}
            </ButtonLink>
          ) : null}
          <ButtonLink href="/" variant={home ? "secondary" : "primary"} size="lg">
            {t.notFound.toStart}
          </ButtonLink>
        </div>
      </Container>
    </main>
  );
}
