import { EmptyState, SectionLabel } from "@/components/stopa/ui";
import { requireUser } from "@/lib/auth/guards";
import { getTranslations } from "@/lib/i18n";
import { getLeaderboard } from "@/lib/stopa/data";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const user = await requireUser();
  const { t } = await getTranslations();
  const players = await getLeaderboard(50);

  return (
    <main>
      <SectionLabel>{t.leaderboard.title}</SectionLabel>
      <p className="mt-3 text-sm leading-relaxed text-moss">{t.leaderboard.lede}</p>

      {players.length === 0 ? (
        <EmptyState className="mt-6" title={t.leaderboard.empty} body={t.home.noTrails} />
      ) : (
        <ol className="mt-6 space-y-2.5">
          {players.map((player, index) => {
            const isMe = player.id === user.id;
            const rank = index + 1;
            return (
              <li
                key={player.id}
                className={cn(
                  "flex items-center gap-4 rounded-[12px] border px-4 py-3",
                  isMe ? "border-amber bg-amber/10" : "border-cream/15 bg-forest-card",
                )}
              >
                <span
                  className={cn(
                    "w-8 shrink-0 text-center font-serif text-xl tabular-nums",
                    rank <= 3 ? "text-amber" : "text-moss",
                  )}
                >
                  {rank}
                </span>
                <span className="min-w-0 flex-1 truncate font-serif text-lg">
                  {player.name}
                  {isMe && <span className="ml-2 text-sm text-amber">({t.leaderboard.you})</span>}
                </span>
                <span className="shrink-0 font-serif tabular-nums">
                  {player.points} {t.leaderboard.points}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}
