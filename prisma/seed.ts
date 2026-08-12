import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set — copy .env.example to .env.");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

/**
 * Development seed: an admin, a few players, the current weekly challenge and
 * two closed ones with approved submissions so the feed, the leaderboard and
 * the review queue all have something to show.
 *
 * Set SEED_DEMO_USERS=false to seed challenges only.
 */

/** Tiny inline JPEG stand-ins so the feed has images without binary fixtures. */
function placeholderPhoto(hue: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="hsl(${hue},30%,38%)"/>
      <stop offset="100%" stop-color="hsl(${hue},35%,14%)"/>
    </linearGradient></defs>
    <rect width="800" height="600" fill="url(#g)"/>
    <path d="M0 430 L180 300 L300 380 L430 250 L560 360 L680 290 L800 400 L800 600 L0 600Z" fill="hsl(${hue},30%,10%)" opacity="0.85"/>
    <path d="M0 500 L200 420 L360 470 L520 400 L700 470 L800 440 L800 600 L0 600Z" fill="hsl(${hue},25%,7%)"/>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function mondayOfWeek(offsetWeeks: number): Date {
  const date = new Date();
  const day = date.getDay();
  const diff = (day + 6) % 7; // days since Monday
  date.setDate(date.getDate() - diff + offsetWeeks * 7);
  date.setHours(8, 0, 0, 0);
  return date;
}

function sundayClose(monday: Date): Date {
  const close = new Date(monday);
  close.setDate(close.getDate() + 6);
  close.setHours(23, 59, 0, 0);
  return close;
}

const QUESTS = [
  {
    week: 0,
    title: "Kráľova hoľa",
    location: "Kráľova hoľa",
    region: "Nízke Tatry",
    description:
      "Vystúp na Kráľovu hoľu (1 948 m) a odfoť sa pri vrcholovom kríži. Ideálne pri východe slnka.",
    category: "SUMMIT" as const,
    points: 250,
    latitude: 48.8853,
    longitude: 20.1372,
  },
  {
    week: -1,
    title: "Šútovský vodopád",
    location: "Šútovský vodopád",
    region: "Malá Fatra",
    description:
      "Dôjdi k Šútovskému vodopádu a odfoť sa tak, aby bolo vidieť celý stĺpec vody za tebou.",
    category: "WATERFALL" as const,
    points: 180,
    latitude: 49.1372,
    longitude: 19.0447,
  },
  {
    week: -2,
    title: "Čachtický hrad",
    location: "Čachtický hrad",
    region: "Malé Karpaty",
    description:
      "Vyjdi k zrúcanine Čachtického hradu a odfoť sa pri vonkajšom obrannom múre.",
    category: "CASTLE" as const,
    points: 200,
    latitude: 48.7239,
    longitude: 17.7625,
  },
];

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@stopa.app";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "StopaAdmin!2026";

  const admin = await db.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      email: adminEmail,
      name: "Tím STOPA",
      role: "ADMIN",
      passwordHash: await bcrypt.hash(adminPassword, 12),
      rulesAcceptedAt: new Date(),
    },
  });

  const created = [];
  for (const spec of QUESTS) {
    const publishedAt = mondayOfWeek(spec.week);
    const closesAt = sundayClose(publishedAt);

    const existing = await db.weeklyQuest.findFirst({ where: { title: spec.title } });
    const quest = existing
      ? await db.weeklyQuest.update({
          where: { id: existing.id },
          data: { publishedAt, closesAt, points: spec.points },
        })
      : await db.weeklyQuest.create({
          data: { ...spec, week: undefined, publishedAt, closesAt, createdById: admin.id } as never,
        });

    created.push(quest);
  }
  console.log(`✓ ${created.length} weekly challenges`);

  if (process.env.SEED_DEMO_USERS === "false") {
    console.log(`✓ Admin ready — ${adminEmail} / ${adminPassword}`);
    return;
  }

  const players = [
    { email: "zuzka@stopa.app", name: "Zuzka H.", hue: 150 },
    { email: "marek@stopa.app", name: "Marek P.", hue: 205 },
    { email: "ivana@stopa.app", name: "Ivana K.", hue: 95 },
  ];

  const password = process.env.SEED_DEMO_PASSWORD ?? "StopaHrac!2026";
  const closedQuests = created.filter((q) => q.closesAt < new Date());

  for (const [index, spec] of players.entries()) {
    const user = await db.user.upsert({
      where: { email: spec.email },
      update: {},
      create: {
        email: spec.email,
        name: spec.name,
        passwordHash: await bcrypt.hash(password, 12),
        rulesAcceptedAt: new Date(),
      },
    });

    // Approved submissions on the closed challenges, so the feed and the
    // leaderboard are populated; points are recomputed from them below.
    let total = 0;
    for (const [qIndex, quest] of closedQuests.entries()) {
      if (qIndex > index) continue;

      await db.submission.upsert({
        where: { userId_questId: { userId: user.id, questId: quest.id } },
        update: {},
        create: {
          userId: user.id,
          questId: quest.id,
          photo: placeholderPhoto(spec.hue + qIndex * 25),
          caption:
            qIndex === 0
              ? "Hore bolo veterno, ale výhľad stál za to."
              : "Cesta hore rýchlo ubehla, dole to bolo horšie.",
          difficulty: qIndex === 0 ? "MODERATE" : "HARD",
          comparison: qIndex === 0 ? "FIRST" : "HARDER",
          status: "APPROVED",
          pointsAwarded: quest.points,
          adminNote: qIndex === 0 ? "Super uhol na tejto fotke!" : null,
          adminNotePublic: true,
          reviewedAt: new Date(),
          reviewedById: admin.id,
        },
      });

      total += quest.points;
    }

    await db.user.update({ where: { id: user.id }, data: { points: total } });
  }

  // One pending submission so the admin review queue isn't empty.
  const activeQuest = created.find((q) => q.publishedAt <= new Date() && q.closesAt > new Date());
  const firstPlayer = await db.user.findUnique({ where: { email: players[0]!.email } });

  if (activeQuest && firstPlayer) {
    await db.submission.upsert({
      where: { userId_questId: { userId: firstPlayer.id, questId: activeQuest.id } },
      update: {},
      create: {
        userId: firstPlayer.id,
        questId: activeQuest.id,
        photo: placeholderPhoto(30),
        caption: "Vrcholový kríž o pol siedmej ráno. Zima, ale oplatilo sa.",
        difficulty: "HARD",
        comparison: "HARDER",
        status: "PENDING",
      },
    });
  }

  console.log(`✓ Admin — ${adminEmail} / ${adminPassword}`);
  console.log(`✓ Players — ${players.map((p) => p.email).join(", ")} / ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
