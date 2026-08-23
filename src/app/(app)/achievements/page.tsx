import type { Metadata } from "next";
import Link from "next/link";

import { FreshStickers } from "@/components/app/fresh-stickers";
import { ProgressBar, Reveal } from "@/components/app/motion";
import { PlanChip } from "@/components/app/plan-mark";
import { stagger } from "@/lib/motion";
import { Eyebrow, Panel, PanelHead, Sticker, StickerSheet, Tag } from "@/components/field";
import { requireClient } from "@/lib/auth/guards";
import { countEarned, countReachable, getAchievements } from "@/lib/achievements";
import { db } from "@/lib/db";
import { getEntitlement } from "@/lib/entitlements";
import { getHeldAwards, medalLabel } from "@/lib/leaderboard";
import { getUserStats } from "@/lib/quest/service";

export const metadata: Metadata = { title: "Stickers" };

/**
 * The sticker sheet.
 *
 * The whole sheet is shown to every account, always. What a plan changes is
 * how far down it you can reach: beyond that, stickers are blurred out — you
 * can see something is there and that it isn't yours, and nothing else. That
 * is deliberately more honest than hiding them, and it is the only upgrade
 * prompt on this page.
 */
export default async function StickersPage() {
  const user = await requireClient();
  const [stats, entitlement, awards, account, revocations] = await Promise.all([
    getUserStats(user.id),
    getEntitlement(user.id),
    getHeldAwards(user.id),
    db.user.findUnique({ where: { id: user.id }, select: { seenAchievements: true } }),
    db.achievementRevocation.findMany({
      where: { userId: user.id },
      select: { achievementId: true },
    }),
  ]);

  const achievements = getAchievements(
    stats,
    entitlement.plan,
    revocations.map((row) => row.achievementId),
  );
  const earned = countEarned(achievements);
  const reachable = countReachable(achievements);
  const beyondPlan = achievements.length - reachable;

  // Earned, and not yet celebrated. A sticker earned before this column
  // existed counts as already seen — see `markStickersSeenAction`, which is
  // what closes the loop after the animation has played.
  const seen = new Set(account?.seenAchievements ?? []);
  const fresh = achievements.filter((achievement) => achievement.earned && !seen.has(achievement.id));
  const freshIds = new Set(fresh.map((achievement) => achievement.id));

  return (
    <>
      <Reveal as="header" className="page-head">
        <div>
          <Eyebrow>Levels, but physical</Eyebrow>
          <h1>
            {earned} of {reachable} unlocked.
          </h1>
          <p>
            Each one is a real die-cut sticker, drawn for that achievement. It unlocks here the
            moment you log the quest that earns it.
          </p>
        </div>
        <PlanChip plan={entitlement.plan} />
      </Reveal>

      {/* The podium shelf, above the sheet and separate from it.
          These are not progress — no amount of walking earns one, only
          finishing in the top three of a week or a month somebody else was
          also walking. Putting them on the same sheet as "twenty-five
          kilometres" would quietly reclassify them as another threshold. */}
      {awards.length > 0 ? (
        <Reveal className="mb-5">
          <Panel flush>
            <PanelHead
              title="Podium finishes"
              aside={<Tag tone="warm">{`${awards.length} held`}</Tag>}
            />
            <div className="award-grid">
              {awards.map((award) => (
                <div key={award.id} className="award">
                  <Sticker
                    achievementKey={award.sticker}
                    className="medal"
                    title={`${medalLabel(award.medal)} — ${award.label}`}
                  />
                  <b>{award.label}</b>
                  <span className="meta">
                    {medalLabel(award.medal)} ·{" "}
                    {award.period === "WEEKLY" ? "weekly" : "monthly"}
                  </span>
                  <span className="meta">
                    {award.score} points · {award.quests}{" "}
                    {award.quests === 1 ? "quest" : "quests"}
                  </span>
                </div>
              ))}
            </div>
            <p className="note">
              Won on a closed board and kept for good. A weekly medal and a monthly one are
              different stickers, because they are different achievements.
            </p>
          </Panel>
        </Reveal>
      ) : (
        <Reveal className="mb-5">
          <Panel>
            <PanelHead title="Podium finishes" aside={<Tag tone="ghost">None yet</Tag>} />
            <p className="note">
              Finish in the top three of a weekly or monthly leaderboard and its sticker lands
              here when the board closes. Six designs — a gold, a silver and a bronze for each
              cadence.{" "}
              <Link href="/leaderboard" className="underline">
                See where you are
              </Link>
              .
            </p>
          </Panel>
        </Reveal>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_1.05fr] lg:items-start">
        <Reveal delay={stagger(0)}>
          <FreshStickers
            ids={fresh.map((achievement) => achievement.id)}
            labels={fresh.map((achievement) => achievement.label)}
          />
          <StickerSheet tag={`Sheet 01 · ${earned} of ${reachable}`}>
            {achievements.map((achievement) => (
              <Sticker
                key={achievement.id}
                achievementKey={achievement.sticker}
                locked={!achievement.earned && !achievement.planLocked}
                planLocked={achievement.planLocked}
                fresh={freshIds.has(achievement.id)}
                freshDelay={
                  freshIds.has(achievement.id)
                    ? fresh.findIndex((entry) => entry.id === achievement.id) * 220
                    : undefined
                }
                title={`${achievement.label} — ${achievement.earned ? "unlocked" : "locked"}`}
              />
            ))}
          </StickerSheet>

          {beyondPlan > 0 ? (
            <div className="sheet-upsell">
              <p>
                <b>{beyondPlan} more</b> on this sheet are past what {entitlement.definition.name}{" "}
                reaches.
              </p>
              <Link href="/upgrade" className="btn btn-primary btn-sm">
                See the plans
              </Link>
            </div>
          ) : (
            <p className="note text-center">
              {entitlement.can("printedStickers")
                ? "The printed sheet is posted to you once a season — it's part of your plan."
                : "Printed sheets are posted to subscribers. The digital ones are yours either way."}
            </p>
          )}
        </Reveal>

        <Reveal delay={stagger(1)}>
          <Panel flush>
            <PanelHead
              title="What unlocks what"
              aside={<Tag tone="ghost">{`${earned} / ${reachable}`}</Tag>}
            />
            <ul>
              {achievements.map((achievement, index) => (
                <Reveal
                  as="li"
                  key={achievement.id}
                  delay={stagger(index, 6)}
                  className="border-b border-line-2 px-5 py-4 last:border-b-0"
                >
                  {achievement.planLocked ? (
                    // Name and target stay hidden: the list must not become the
                    // readable version of the sheet's blur.
                    <div className="flex items-baseline justify-between gap-3">
                      <b className="text-[15px] font-semibold tracking-[-0.01em] text-ink-3">
                        Locked sticker
                      </b>
                      <Tag tone="ghost">{achievement.requiredPlan}</Tag>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline justify-between gap-3">
                        <b className="text-[15px] font-semibold tracking-[-0.01em]">
                          {achievement.label}
                        </b>
                        <span className={achievement.earned ? "meta text-moss-2" : "meta"}>
                          {achievement.progressLabel}
                        </span>
                      </div>
                      <p className="mt-1 text-[14px] leading-[1.5] text-ink-2">
                        {achievement.description}
                      </p>
                      {!achievement.earned && (
                        <ProgressBar
                          value={achievement.progress}
                          label={`${achievement.label} progress`}
                          className="mt-3 w-full"
                        />
                      )}
                    </>
                  )}
                </Reveal>
              ))}
            </ul>
          </Panel>
        </Reveal>
      </div>
    </>
  );
}
