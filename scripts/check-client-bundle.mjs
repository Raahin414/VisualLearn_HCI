// Run after `npm run build`: fails if research answer keys, rationales,
// rubric anchors or server secrets appear in any browser-delivered asset.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
const root = path.resolve(".next/static");
const files = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (/\.(js|css|json|html|txt)$/.test(entry.name)) files.push(full);
  }
}
await walk(root).catch(() => {
  throw new Error("Build output not found. Run `npm run build` first.");
});
// Field names of the server-only bank plus distinctive rationale/rubric text.
const forbidden = [
  "correctAnswer",
  "courseAnswers",
  "correctCycle",
  "correctLabels",
  "rationale",
  "estimatedDifficulty",
  "spellingPenalty",
  "Water that cannot soak in",
  "Surrounding water vapor cools and condenses",
  "Liquid water changes to water vapor, e.g. with heat",
  "Warmth supplies energy and moving air carries vapor away",
  "Processes linked in a coherent order",
  "SESSION_SECRET",
  "DATABASE_URL",
  "SERVICE_ROLE",
];
const hits = [];
for (const file of files) {
  const text = await readFile(file, "utf8");
  for (const needle of forbidden)
    if (text.includes(needle)) hits.push(`${path.relative(".", file)}: ${needle}`);
}
if (hits.length) {
  console.error(`Server-only content found in browser assets:\n${hits.join("\n")}`);
  process.exit(1);
}
console.log(`Checked ${files.length} browser assets: no answer keys, rationales, rubrics or server secret names.`);
