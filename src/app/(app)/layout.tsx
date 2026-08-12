import { BottomNav } from "@/components/stopa/bottom-nav";
import { WaveHeader } from "@/components/stopa/wave-header";
import { requireUser } from "@/lib/auth/guards";
import { getTranslations } from "@/lib/i18n";

/**
 * Everything under this layout requires an account. The guard runs on the
 * server on every request — the client never decides whether it may be here.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const { t } = await getTranslations();

  return (
    <div className="min-h-dvh bg-forest">
      <WaveHeader points={user.points} />
      <div className="mx-auto max-w-3xl px-5 pb-28 pt-6">{children}</div>
      <BottomNav t={t} isAdmin={user.role === "ADMIN"} />
    </div>
  );
}
