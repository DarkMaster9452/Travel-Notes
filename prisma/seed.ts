import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

import { buildShowcaseQuests, DEMO_PREFERENCES } from "./seed-data";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set — copy .env.example to .env.");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

/**
 * Seed: showcase quests, and exactly one account per role the product has.
 *
 * The account list below is authoritative — every user that is not in it is
 * deleted. That is the point of the file: after a seed the database holds
 * these accounts and nothing else, so "log in as an admin" or "log in as a
 * free account that has hit the wall" is always one known password away.
 *
 * There is deliberately no guest account. A guest is the absence of one: they
 * see the landing page, three hardcoded samples, and then a wall.
 */

const PASSWORD = process.env.SEED_PASSWORD ?? "demo";

type SeedAccount = {
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  plan: "FREE" | "EXPLORER" | "ULTRA";
  /** Free accounts burn their allowance; subscribers ignore it. */
  freeQuestsUsed: number;
  /** How many showcase quests to write into this account's history. */
  history: number;
  note: string;
};

const ACCOUNTS: SeedAccount[] = [
  {
    email: "admin@demo.com",
    name: "Admin",
    role: "ADMIN",
    plan: "ULTRA",
    freeQuestsUsed: 0,
    history: 4,
    note: "Admin — approval queue, quest authoring, places, reports",
  },
  {
    email: "free@demo.com",
    name: "Free",
    role: "USER",
    plan: "FREE",
    freeQuestsUsed: 3,
    history: 3,
    note: "Free — allowance spent, sits against the upgrade wall",
  },
  {
    email: "explorer@demo.com",
    name: "Explorer",
    role: "USER",
    plan: "EXPLORER",
    freeQuestsUsed: 3,
    history: 6,
    note: "Explorer €11 — unlimited, Europe, mail, board, 10 stickers",
  },
  {
    email: "ultra@demo.com",
    name: "Ultra",
    role: "USER",
    plan: "ULTRA",
    freeQuestsUsed: 3,
    history: 8,
    note: "Ultra €31 — everything, plus commissioned and multi-day quests",
  },
];

async function main() {
  const showcase = buildShowcaseQuests(20);
  console.log(`Generating ${showcase.length} showcase quests…`);

  await db.quest.deleteMany({ where: { isShowcase: true } });

  const quests = await Promise.all(
    showcase.map((quest, index) =>
      db.quest.create({
        data: {
          number: index + 1,
          title: quest.title,
          subtitle: quest.subtitle,
          description: quest.description,
          objective: quest.objective,
          bonus: quest.bonus,
          safetyNotes: quest.safetyNotes,
          location: quest.location,
          region: quest.region,
          country: quest.country,
          latitude: quest.latitude,
          longitude: quest.longitude,
          distance: quest.distance,
          duration: quest.duration,
          travelTime: quest.travelTime,
          difficulty: quest.difficulty,
          elevationGain: quest.elevationGain,
          terrain: quest.terrain,
          features: quest.features,
          mood: quest.mood,
          coverImage: quest.coverImage,
          routeData: quest.routeData as unknown as Prisma.InputJsonValue,
          signature: quest.signature,
          isShowcase: true,
        },
      }),
    ),
  );
  console.log(`✓ ${quests.length} showcase quests`);

  // Everything that is not one of the role accounts goes. Cascades take the
  // sessions, preferences, subscription and history with each row.
  // The role accounts and the demo crowd stay; everything else goes. Both are
  // seeded data, and a panel with nothing to manage cannot be judged working.
  const removed = await db.user.deleteMany({
    where: { NOT: { email: { endsWith: "@demo.com" } } },
  });
  if (removed.count > 0) console.log(`✓ removed ${removed.count} other account(s)`);

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  for (const account of ACCOUNTS) {
    const user = await db.user.upsert({
      where: { email: account.email },
      update: {
        name: account.name,
        role: account.role,
        passwordHash,
        freeQuestsUsed: account.freeQuestsUsed,
      },
      create: {
        email: account.email,
        name: account.name,
        role: account.role,
        passwordHash,
        freeQuestsUsed: account.freeQuestsUsed,
      },
    });

    await db.userPreferences.upsert({
      where: { userId: user.id },
      update: DEMO_PREFERENCES,
      create: { userId: user.id, ...DEMO_PREFERENCES },
    });

    // Paid tiers get a subscription row that reads as genuinely active, so the
    // gating matrix resolves from real state rather than a special case.
    if (account.plan === "FREE") {
      await db.subscription.deleteMany({ where: { userId: user.id } });
    } else {
      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
      const subscription = {
        plan: account.plan,
        status: "ACTIVE" as const,
        cancelAtPeriodEnd: false,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      };
      await db.subscription.upsert({
        where: { userId: user.id },
        update: subscription,
        create: { userId: user.id, ...subscription },
      });
    }

    await seedHistory(user.id, quests.slice(0, account.history));
    console.log(`✓ ${account.email.padEnd(26)} ${account.note}`);
  }

  const adminAccount = await db.user.findUnique({
    where: { email: "admin@demo.com" },
    select: { id: true },
  });
  const crowd = await seedCrowd(passwordHash, quests, adminAccount!.id);
  console.log(`✓ ${crowd.people} demo accounts with ${crowd.submissions} submissions`);

  console.log(`\nAll accounts share the password: ${PASSWORD}`);
  console.log("Log in with admin@demo.com / demo");
}

/* -------------------------------------------------------------------------- */
/* A crowd to manage                                                           */
/* -------------------------------------------------------------------------- */

const CROWD = [
  "Tomáš Krajčí", "Lucia Mihálik", "Peter Hrivnák", "Zuzana Bieliková",
  "Marek Dubovec", "Nina Sýkorová", "Jakub Vrábel", "Eva Hudecová",
  "Martin Šimko", "Katarína Rybárová", "Ondrej Lipták", "Simona Bartošová",
  "Adam Kollár", "Veronika Hlavatá", "Filip Zeman", "Dominika Uhrínová",
  "Richard Novák", "Alžbeta Kmeťová", "Michal Sedlák", "Petra Vargová",
];

/** What people actually write when they file proof. Dry, specific, uneven. */
const DECLINE_REASONS = [
  "The photos are all from the car park — we need one from the objective itself.",
  "Distance and ascent don't match the route; looks like a different trail.",
  "No shot of the summit marker, so there's nothing to check this against.",
  "The Strava track stops halfway. Re-file with the full activity.",
  "Photos have no date on them and the account is new — one more from the ridge would settle it.",
];

const NOTES = [
  "Left the car park at 05:10 in the dark. Cloud broke about ten minutes after we got to the top, which was the whole point. Chains were greasy but fine if you take your time.",
  "Longer than the map suggested — the last viewpoint is a good twenty minutes past where you think it is. Worth it. Nobody else up there.",
  "Rained the entire way up and the entire way down. Did the bonus anyway, mostly out of spite. Photo is mostly fog.",
  "Went up the quiet side from the village. Met one shepherd and about forty sheep. Back at the road by eleven for coffee as instructed.",
  "Got to the saddle and the wind was genuinely unpleasant, so we turned round. Filed as a retreat. Would go back in better weather.",
  "Did it as a night start with a headlamp. Descending in the dark on purpose is a very different experience and I'd recommend it.",
  "Straightforward. Ladders were dry, water was loud, done in under four hours including a long stop at the top.",
  "Took my daughter, who is nine and complained for the first hour and then not at all. She found the trig point before I did.",
];

/**
 * A crowd of accounts with real-looking history and a queue of submissions.
 *
 * The panel is unusable against an empty database — you cannot tell whether a
 * review deck works when there is nothing in it — so the seed produces a mid-
 * sized product: twenty people, a spread of plans, and submissions in all
 * three states with the pending ones weighted so the deck has work in it.
 */
async function seedCrowd(
  passwordHash: string,
  quests: { id: string }[],
  /** Who the seeded decisions are attributed to. */
  reviewerId: string,
) {
  // Deterministic, so a reseed produces the same demo rather than a new one.
  let n = 1337;
  const rand = () => ((n = (n * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)]!;

  let submissions = 0;

  for (const [index, name] of CROWD.entries()) {
    const email = `${name.split(" ")[0]!.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "")}${index}@demo.com`;
    const joinedAt = new Date(Date.now() - Math.floor(rand() * 90 + 1) * 24 * 3600 * 1000);

    const user = await db.user.upsert({
      where: { email },
      update: { name, passwordHash },
      create: {
        email,
        name,
        passwordHash,
        freeQuestsUsed: Math.floor(rand() * 4),
        createdAt: joinedAt,
      },
    });

    await db.userPreferences.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, ...DEMO_PREFERENCES },
    });

    // Roughly a third pay, which is a believable conversion rather than a
    // flattering one.
    const roll = rand();
    if (roll > 0.78) {
      await upsertSubscription(user.id, "ULTRA");
    } else if (roll > 0.62) {
      await upsertSubscription(user.id, "EXPLORER");
    } else {
      await db.subscription.deleteMany({ where: { userId: user.id } });
    }

    const owned = quests.slice(0, 2 + Math.floor(rand() * 6));
    await seedHistory(user.id, owned);

    // Proof for some of what they were issued, weighted towards pending so
    // the review deck has a queue to work through.
    await db.submission.deleteMany({ where: { userId: user.id } });
    for (const quest of owned.slice(0, 1 + Math.floor(rand() * 3))) {
      const status = rand() > 0.55 ? "PENDING" : rand() > 0.4 ? "APPROVED" : "REJECTED";
      const retreated = rand() > 0.88;
      const filedAt = new Date(Date.now() - Math.floor(rand() * 20 + 1) * 24 * 3600 * 1000);

      // At least one photo is required to file at all, so the demo data
      // carries one to three rather than sometimes none.
      const photoCount = 1 + Math.floor(rand() * 3);
      const photos = Array.from(
        { length: photoCount },
        (_, i) => `https://picsum.photos/seed/${user.id}-${quest.id}-${i}/640/480`,
      );

      await db.submission.create({
        data: {
          userId: user.id,
          questId: quest.id,
          note: pick(NOTES),
          photos,
          stravaUrl:
            rand() > 0.45 ? `https://www.strava.com/activities/${9000000000 + index * 37}` : null,
          distance: rand() > 0.25 ? Math.round((6 + rand() * 14) * 10) / 10 : null,
          elevation: rand() > 0.25 ? Math.round(300 + rand() * 900) : null,
          movingTime: rand() > 0.25 ? Math.round(120 + rand() * 260) : null,
          startedAt: filedAt,
          retreated,
          status: status as "PENDING" | "APPROVED" | "REJECTED",
          // A decided submission carries who decided it and when, and a
          // decline carries the reason — the customer's submissions page
          // shows that reason back to them, so seeding declines without one
          // left the most useful half of that page permanently blank.
          reviewedById: status === "PENDING" ? null : reviewerId,
          reviewedAt: status === "PENDING" ? null : new Date(filedAt.getTime() + 36 * 3600 * 1000),
          reviewNote: status === "REJECTED" ? pick(DECLINE_REASONS) : null,
          createdAt: filedAt,
        },
      });
      submissions += 1;
    }
  }

  return { people: CROWD.length, submissions };
}

async function upsertSubscription(userId: string, plan: "EXPLORER" | "ULTRA") {
  const now = new Date();
  const values = {
    plan,
    status: "ACTIVE" as const,
    cancelAtPeriodEnd: false,
    currentPeriodStart: now,
    currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 3600 * 1000),
  };
  await db.subscription.upsert({
    where: { userId },
    update: values,
    create: { userId, ...values },
  });
}

/** Give an account a plausible run of quests, the most recent one completed. */
async function seedHistory(userId: string, quests: { id: string }[]) {
  await db.questGeneration.deleteMany({ where: { userId } });
  await db.questHistory.deleteMany({ where: { userId } });
  await db.savedQuest.deleteMany({ where: { userId } });

  for (const [index, quest] of quests.entries()) {
    const generatedAt = new Date(Date.now() - (quests.length - index) * 6 * 24 * 3600 * 1000);
    await db.questGeneration.create({
      data: {
        userId,
        questId: quest.id,
        generationNumber: index + 1,
        generatedAt,
        generationParameters: { seed: `seed-${index}`, seeded: true } as Prisma.InputJsonValue,
      },
    });
    await db.questHistory.create({
      data: {
        userId,
        questId: quest.id,
        generatedAt,
        // Everything but the newest is done; the newest is the one in hand.
        completed: index < quests.length - 1,
        completedAt:
          index < quests.length - 1 ? new Date(generatedAt.getTime() + 8 * 3600 * 1000) : null,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
