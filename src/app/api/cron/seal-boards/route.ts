import { pruneSystemEvents } from "@/lib/admin/systems";
import { runScheduled } from "@/lib/cron";
import { db } from "@/lib/db";
import { sendBoardSealed } from "@/lib/email";
import { getLeaderboard, pastSlots } from "@/lib/leaderboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tell the podium their board has sealed.
 *
 * Reading a closed board is what seals it — see `getLeaderboard` — so this
 * reads the last few closed slots, which both writes the awards down and gives
 * us the three names to write to. An award that already existed before this
 * ran is skipped: the email goes out once, on the sealing, not every night
 * afterwards.
 */
export async function GET(request: Request) {
  return runScheduled(request, "job.seal-boards", async () => {
    let sent = 0;
    const sealed: string[] = [];

    for (const period of ["MONTHLY", "WEEKLY"] as const) {
      // The current slot plus the one behind it: anything older has been read
      // and sealed on some previous night.
      for (const slot of pastSlots(period, 2)) {
        const before = await db.leaderboardAward.count({
          where: { period, slotKey: slot.key },
        });

        const board = await getLeaderboard(period, slot.key);
        if (!board.sealed || board.state !== "past") continue;

        // Already sealed on an earlier run, so its podium has already been told.
        if (before > 0) continue;

        sealed.push(`${period} ${slot.key}`);

        for (const row of board.rows.filter((entry) => entry.medal)) {
          const result = await sendBoardSealed(row.userId, {
            label: board.label,
            rank: row.rank,
            medal: row.medal as string,
            score: row.score,
          });
          if (result.sent) sent += 1;
        }
      }
    }

    // The systems log is swept here rather than on the board, which is probed
    // on every page load: a delete on every load would be a delete for nothing
    // ninety-nine times out of a hundred. This is the job that runs most
    // often, so it is the one that keeps the table small.
    const pruned = await pruneSystemEvents();

    return { sent, sealed, pruned };
  });
}
