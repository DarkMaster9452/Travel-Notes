/**
 * Emits the seed as plain SQL.
 *
 * `prisma/seed.ts` is the normal path; this exists for environments where the
 * Postgres wire protocol isn't reachable (locked-down CI, HTTP-only tunnels)
 * and the SQL has to be applied through another channel.
 *
 *   npx tsx scripts/emit-seed-sql.ts > seed.sql
 */
import { randomUUID } from "node:crypto";

import { buildShowcaseQuests, DEMO_PREFERENCES } from "../prisma/seed-data";

const q = (value: string) => `'${value.replace(/'/g, "''")}'`;
const arr = (values: string[]) => `ARRAY[${values.map(q).join(",")}]::text[]`;
const json = (value: unknown) => `${q(JSON.stringify(value))}::jsonb`;

const statements: string[] = [];
const quests = buildShowcaseQuests(20);
const questIds = quests.map(() => `sq_${randomUUID().replace(/-/g, "").slice(0, 20)}`);

statements.push(`DELETE FROM "quests" WHERE "is_showcase" = true`);

quests.forEach((quest, index) => {
  statements.push(
    `INSERT INTO "quests" ("id","number","title","subtitle","description","objective","bonus","safety_notes","location","region","country","latitude","longitude","distance","duration","travel_time","difficulty","elevation_gain","terrain","features","mood","cover_image","route_data","signature","is_showcase") VALUES (${q(questIds[index]!)},${index + 1},${q(quest.title)},${q(quest.subtitle)},${q(quest.description)},${q(quest.objective)},${q(quest.bonus)},${q(quest.safetyNotes)},${q(quest.location)},${q(quest.region)},${q(quest.country)},${quest.latitude},${quest.longitude},${quest.distance},${quest.duration},${quest.travelTime ?? "NULL"},${q(quest.difficulty)}::"Difficulty",${quest.elevationGain},${arr(quest.terrain)},${arr(quest.features)},${q(quest.mood)},${q(quest.coverImage)},${json(quest.routeData)},${q(quest.signature)},true)`,
  );
});

if (process.env.SEED_DEMO_USER !== "false") {
  const userId = `sq_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
  const email = process.env.SEED_DEMO_EMAIL ?? "demo@sidequest.app";
  // Pre-computed bcrypt hash of the demo password; the plaintext never ships.
  const passwordHash =
    process.env.SEED_DEMO_HASH ?? "$2b$12$0000000000000000000000000000000000000000000000000000";

  statements.push(`DELETE FROM "users" WHERE "email" = ${q(email)}`);
  statements.push(
    `INSERT INTO "users" ("id","email","name","password_hash","free_quests_used","onboarded_at","updated_at") VALUES (${q(userId)},${q(email)},'Demo Explorer',${q(passwordHash)},1,now(),now())`,
  );
  statements.push(
    `INSERT INTO "user_preferences" ("id","user_id","home_location","home_latitude","home_longitude","max_distance","preferred_distance","difficulty","preferred_terrain","preferred_activity","preferred_environment","time_available","transport","quest_style","sunset_preference","water_preference","elevation_preference","updated_at") VALUES (${q(`sq_${randomUUID().replace(/-/g, "").slice(0, 20)}`)},${q(userId)},${q(DEMO_PREFERENCES.homeLocation)},${DEMO_PREFERENCES.homeLatitude},${DEMO_PREFERENCES.homeLongitude},${DEMO_PREFERENCES.maxDistance},${DEMO_PREFERENCES.preferredDistance},${q(DEMO_PREFERENCES.difficulty)}::"DifficultyPreference",${arr(DEMO_PREFERENCES.preferredTerrain)},${arr(DEMO_PREFERENCES.preferredActivity)},${arr(DEMO_PREFERENCES.preferredEnvironment)},${q(DEMO_PREFERENCES.timeAvailable)}::"TimeAvailable",${q(DEMO_PREFERENCES.transport)}::"Transport",${q(DEMO_PREFERENCES.questStyle)}::"QuestStyle",${q(DEMO_PREFERENCES.sunsetPreference)}::"Ternary",${q(DEMO_PREFERENCES.waterPreference)}::"Ternary",${q(DEMO_PREFERENCES.elevationPreference)}::"Ternary",now())`,
  );

  questIds.slice(0, 6).forEach((questId, index) => {
    const days = (6 - index) * 6;
    const at = `now() - interval '${days} days'`;
    statements.push(
      `INSERT INTO "quest_generations" ("id","user_id","quest_id","generation_number","generated_at","generation_parameters") VALUES (${q(`sq_${randomUUID().replace(/-/g, "").slice(0, 20)}`)},${q(userId)},${q(questId)},${index + 1},${at},${json({ seed: `demo-${index}`, seeded: true })})`,
    );
    statements.push(
      `INSERT INTO "quest_history" ("id","user_id","quest_id","completed","completed_at","saved","generated_at") VALUES (${q(`sq_${randomUUID().replace(/-/g, "").slice(0, 20)}`)},${q(userId)},${q(questId)},${index === 0},${index === 0 ? at : "NULL"},${index < 2},${at})`,
    );
    if (index < 2) {
      statements.push(
        `INSERT INTO "saved_quests" ("id","user_id","quest_id","saved_at") VALUES (${q(`sq_${randomUUID().replace(/-/g, "").slice(0, 20)}`)},${q(userId)},${q(questId)},${at})`,
      );
    }
  });
}

if (process.env.EMIT_JSON === "true") {
  console.log(JSON.stringify(statements));
} else {
  console.log(statements.map((s) => `${s};`).join("\n\n"));
}
