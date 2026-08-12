/**
 * Prints a batch of generated quests to the terminal.
 * Useful for eyeballing the generator without starting the app:
 *   npx tsx scripts/preview-quests.ts
 */
import { buildShowcaseQuests } from "../prisma/seed-data";

const quests = buildShowcaseQuests(20);

for (const q of quests) {
  console.log(
    `${q.title.padEnd(30)} | ${q.location} (${q.region}) | ${q.distance}km ${q.duration}min ${q.difficulty} +${q.elevationGain}m | ${q.routeData.timing} | ${q.travelTime}min away`,
  );
}

console.log(`\nunique locations: ${new Set(quests.map((q) => q.routeData.locationId)).size}/${quests.length}`);
console.log(`unique titles:    ${new Set(quests.map((q) => q.title)).size}/${quests.length}`);
console.log(`\nSAMPLE\n${quests[0].subtitle}\n${quests[0].description}\nOBJECTIVE: ${quests[0].objective}\nBONUS: ${quests[0].bonus}\nSAFETY: ${quests[0].safetyNotes}`);
