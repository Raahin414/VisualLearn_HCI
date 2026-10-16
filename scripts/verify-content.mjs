import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const root = new URL("../", import.meta.url);
const hash = (data) => createHash("sha256").update(data).digest("hex");
const raw = await readFile(
  new URL("content/lessons/water-cycle/v1.json", root),
);
const lesson = JSON.parse(raw);
const audio = [];
for (const s of lesson.segments) {
  const data = await readFile(new URL(`public${s.audioSrc}`, root));
  if (
    data.toString("ascii", 0, 4) !== "RIFF" ||
    data.toString("ascii", 8, 12) !== "WAVE"
  )
    throw new Error(`Invalid WAV: ${s.id}`);
  let position = 12,
    bytesPerSecond = 0,
    dataLength = 0;
  while (position + 8 <= data.length) {
    const chunk = data.toString("ascii", position, position + 4);
    const size = data.readUInt32LE(position + 4);
    if (chunk === "fmt ") bytesPerSecond = data.readUInt32LE(position + 16);
    if (chunk === "data") dataLength = size;
    position += 8 + size + (size % 2);
  }
  if (!bytesPerSecond || dataLength < 1000)
    throw new Error(`Empty WAV: ${s.id}`);
  audio.push({
    id: s.id,
    path: s.audioSrc,
    sha256: hash(data),
    bytes: data.length,
    seconds: Math.round((dataLength / bytesPerSecond) * 100) / 100,
    voice: "Microsoft David Desktop / Windows System.Speech",
    status: "development-only-review-required",
  });
}
const manifest = {
  contentVersion: lesson.version,
  contentSha256: hash(raw),
  narration: audio,
  stimulus: await Promise.all(
    [
      "components/learning/water-diagram.tsx",
      "lib/content/lesson.ts",
      "app/globals.css",
      "lib/assessments/surveys.ts",
      "components/learning/narration-player.tsx",
      "components/study/study-runner.tsx",
      "components/assessments/assessment-form.tsx",
      "lib/assessments/draft.ts",
    ].map(async (path) => ({
      path,
      sha256: hash(
        (await readFile(new URL(path, root), "utf8")).replaceAll("\r\n", "\n"),
      ),
    })),
  ),
};
const target = new URL("content/asset-manifest.json", root);
if (process.argv.includes("--write")) {
  await mkdir(new URL("content/", root), { recursive: true });
  await writeFile(target, JSON.stringify(manifest, null, 2) + "\n");
  console.log("Wrote frozen content/audio hashes.");
} else {
  const frozen = JSON.parse(await readFile(target));
  if (JSON.stringify(manifest) !== JSON.stringify(frozen))
    throw new Error(
      "Content/audio changed. Review stimulus version before freezing new hashes.",
    );
  console.log(
    `Verified ${lesson.segments.length} canonical segments and fixed WAV files (${audio.reduce((n, a) => n + a.seconds, 0).toFixed(1)} seconds).`,
  );
}
