import { MonthlyHero, toTrailQuest } from "@/components/domain/trail";
import { slotFor, slotLabel } from "@/lib/admin/schedule";
import { db } from "@/lib/db";
import { getMessages } from "@/lib/i18n";

/**
 * The landing hero is the monthly quest (design/DESIGN-SYSTEM.md §6.5): the
 * product turns around it, so the first thing anybody sees is this month's
 * route — real, booked, with its marks and its clock — rather than a slogan.
 *
 * It reads the booked slot for the current month, falls back to the most
 * recent monthly that has run, and only when nothing was ever booked shows
 * the newest published quest as an example of what a monthly looks like.
 */
export async function Hero({ signedInHome }: { signedInHome: string | null }) {
  const t = getMessages("en");
  const now = new Date();
  const slot = slotFor("MONTHLY", now);

  const booked =
    (await db.questSchedule.findUnique({
      where: { period_slotKey: { period: "MONTHLY", slotKey: slot.key } },
      include: { quest: true },
    })) ??
    (await db.questSchedule.findFirst({
      where: { period: "MONTHLY", openAt: { lte: now } },
      orderBy: { openAt: "desc" },
      include: { quest: true },
    }));

  const quest =
    booked?.quest ??
    (await db.quest.findFirst({ where: { published: true }, orderBy: { createdAt: "desc" } }));

  const live = booked !== null && booked.slotKey === slot.key;

  return (
    <section className="trail-hero">
      <div className="wrap trail-hero-inner">
        <div className="trail-hero-intro">
          <span className="trail-hero-eyebrow">One big quest a month · a new small one every week</span>
          <h1 className="trail-hero-title">This month, everybody climbs the same mountain.</h1>
          <p className="trail-hero-lede">
            Summit Quest hands you a real route with its trail marks, a time window and a sticker at the
            end. Walk it, file your proof, and see where you land on the board.
          </p>
        </div>

        {quest ? (
          <MonthlyHero
            quest={toTrailQuest(quest, t)}
            t={t}
            locale="en"
            monthLabel={live ? slotLabel(slot) : booked ? slotLabel(slotFor("MONTHLY", booked.openAt)) : "Example"}
            closesAt={live ? booked.closeAt : null}
            lede={quest.subtitle}
            primary={
              signedInHome
                ? { label: t.trail.join, href: "/monthly" }
                : { label: "Join this month's quest", href: "/signup" }
            }
            secondary={{ label: "See a sample quest", href: "#demo" }}
          />
        ) : null}
      </div>
    </section>
  );
}
