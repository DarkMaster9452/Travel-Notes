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
    note: "Explorer €11 — unlimited, worldwide, mail, board, stickers",
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
  const keep = ACCOUNTS.map((account) => account.email);
  const removed = await db.user.deleteMany({ where: { email: { notIn: keep } } });
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

  console.log(`\nAll ${ACCOUNTS.length} accounts share the password: ${PASSWORD}`);
  console.log("Log in with admin@demo.com / demo");
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
