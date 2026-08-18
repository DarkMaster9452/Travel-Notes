import type { Metadata } from "next";
import Link from "next/link";

import { ProgressBar, Reveal } from "@/components/app/motion";
import { stagger } from "@/lib/motion";
import { Eyebrow, Panel, PanelHead, Sticker, StickerSheet, Tag } from "@/components/field";
import { requireClient } from "@/lib/auth/guards";
import { countEarned, countReachable, getAchievements } from "@/lib/achievements";
import { getEntitlement } from "@/lib/entitlements";
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
  const [stats, entitlement] = await Promise.all([
    getUserStats(user.id),
    getEntitlement(user.id),
  ]);

  const achievements = getAchievements(stats, entitlement.plan);
  const earned = countEarned(achievements);
  const reachable = countReachable(achievements);
  const beyondPlan = achievements.length - reachable;

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
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.05fr] lg:items-start">
        <Reveal delay={stagger(0)}>
          <StickerSheet tag={`Sheet 01 · ${earned} of ${reachable}`}>
            {achievements.map((achievement) => (
              <Sticker
                key={achievement.id}
                achievementKey={achievement.sticker}
                locked={!achievement.earned && !achievement.planLocked}
                planLocked={achievement.planLocked}
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
