import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

import { buildShowcaseQuests, DEMO_PREFERENCES } from "./seed-data";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set — copy .env.example to .env.");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

/**
 * Idempotent seed: showcase quests for the marketing pages, and (unless you
 * opt out) a demo account with history so the dashboard has something to show
 * during development.
 *
 * Set SEED_DEMO_USER=false to seed showcase content only.
 */
async function main() {
  const showcase = buildShowcaseQuests(20);
  console.log(`Generating ${showcase.length} showcase quests…`);

  await db.quest.deleteMany({ where: { isShowcase: true } });

  const created = await Promise.all(
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
  console.log(`✓ ${created.length} showcase quests`);

  if (process.env.SEED_DEMO_USER === "false") {
    console.log("Skipping demo account (SEED_DEMO_USER=false).");
    return;
  }

  const email = process.env.SEED_DEMO_EMAIL ?? "demo@sidequest.app";
  const password = process.env.SEED_DEMO_PASSWORD ?? "SideQuest!2026";

  const user = await db.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Demo Explorer",
      passwordHash: await bcrypt.hash(password, 12),
      onboardedAt: new Date(),
      freeQuestsUsed: 1,
    },
  });

  await db.userPreferences.upsert({
    where: { userId: user.id },
    update: DEMO_PREFERENCES,
    create: { userId: user.id, ...DEMO_PREFERENCES },
  });

  // Give the demo account a plausible history: six quests, two saved, one done.
  const demoQuests = created.slice(0, 6);
  await db.questGeneration.deleteMany({ where: { userId: user.id } });
  await db.questHistory.deleteMany({ where: { userId: user.id } });
  await db.savedQuest.deleteMany({ where: { userId: user.id } });

  for (const [index, quest] of demoQuests.entries()) {
    const generatedAt = new Date(Date.now() - (demoQuests.length - index) * 6 * 24 * 3600 * 1000);
    await db.questGeneration.create({
      data: {
        userId: user.id,
        questId: quest.id,
        generationNumber: index + 1,
        generatedAt,
        generationParameters: { seed: `demo-${index}`, seeded: true } as Prisma.InputJsonValue,
      },
    });
    await db.questHistory.create({
      data: {
        userId: user.id,
        questId: quest.id,
        generatedAt,
        completed: index === 0,
        completedAt: index === 0 ? new Date(generatedAt.getTime() + 8 * 3600 * 1000) : null,
        saved: index < 2,
      },
    });
    if (index < 2) {
      await db.savedQuest.create({ data: { userId: user.id, questId: quest.id, savedAt: generatedAt } });
    }
  }

  console.log(`✓ Demo account ready — ${email} / ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
