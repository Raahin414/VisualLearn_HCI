import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { renderToStaticMarkup } from "react-dom/server";
import { lesson } from "@/lib/content/lesson";
import { ChunkedLesson } from "@/components/learning/chunked-lesson";
import {
  presentationFor,
  CHUNKING_VERSION,
  SOURCE_VERSION,
} from "@/lib/study/presentation.server";
import { presentationSchema, visibleSegments } from "@/lib/study/presentation";
import { StudyService, type SQL } from "@/lib/study/service";
import { answerKey } from "@/lib/assessments/questions.server";
import { exportRows, studyStats } from "@/lib/admin/exports";
import { dataDictionary } from "@/lib/admin/codebook";
import { LocalStudy } from "@/lib/demo/local-study";
import { demoExperiments } from "@/lib/study/presentation.server";
import { publicQuestions } from "@/lib/assessments/questions.server";
const arms = ["chunked", "grouped", "all-at-once"];
const consent = {
  experimentId: "E3",
  ageBand: "18-30",
  language: "English",
  languageComfort: 4,
  familiarity: 2,
  voluntary: true,
  dataUse: true,
  contactViewed: true,
  consentVersion: "SYNTHETIC-E3",
};
let db: PGlite;
const tx = <T,>(run: (service: StudyService) => Promise<T>) =>
  db.transaction((sql) => run(new StudyService(sql as unknown as SQL)));
describe("SYNTHETIC E3 contract (PGlite and static renderer)", () => {
  beforeAll(async () => {
    db = new PGlite();
    for (const name of (await readdir("supabase/migrations"))
      .filter((name) => name.endsWith(".sql"))
      .sort())
      await db.exec(await readFile(`supabase/migrations/${name}`, "utf8"));
    await db.exec(await readFile("supabase/seed.sql", "utf8"));
  }, 30000);
  afterAll(async () => {
    await db?.close();
  });
  it("keeps E3 closed until its pilot version and time policy are reviewed; E4-E8 stay disabled", async () => {
    await expect(
      tx((s) => s.enroll(consent, crypto.randomUUID())),
    ).rejects.toThrow(/not approved/);
    await expect(
      db.exec(
        "update visuallearn.experiments set enabled=true,pilot_reviewed=true,pilot_contract_version='chunking-v1-draft' where id='E3'",
      ),
    ).rejects.toThrow(/check constraint/);
    for (const id of ["E4", "E5", "E6", "E7", "E8"])
      await expect(
        db.query(
          "update visuallearn.experiments set enabled=true where id=$1",
          [id],
        ),
      ).rejects.toThrow(/check constraint/);
    await db.exec(
      "update visuallearn.experiments set enabled=true,pilot_reviewed=true,pilot_contract_version='chunking-v1-draft',study_time_policy='self-paced-no-minimum-v1',status='recruiting',content_approved=true,ethics_approved=true,consent_version='SYNTHETIC-E3',consent_text='SYNTHETIC LOCAL TEST ONLY',study_contact='SYNTHETIC' where id='E3'",
    );
    await expect(
      tx((s) =>
        s.enroll({ ...consent, ageBand: "13-17" }, crypto.randomUUID()),
      ),
    ).rejects.toThrow(/Minor enrollment/);
  });
  it("partitions identical scripts/media in canonical order and gives every SVG unique references", () => {
    const expected = [1, 3, 5];
    arms.forEach((arm, armIndex) => {
      const p = presentationFor("E3", arm);
      if (p.kind !== "chunking") throw new Error("Wrong kind");
      expect(p.groups[0]).toHaveLength(expected[armIndex]);
      expect(p.groups.flat()).toEqual([0, 1, 2, 3, 4]);
      const markup = p.groups
        .map((indices, groupIndex) =>
          renderToStaticMarkup(
            <ChunkedLesson
              indices={indices}
              groupIndex={groupIndex}
              busy={false}
              emit={() => {}}
            />,
          ),
        )
        .join("");
      for (const segment of lesson.segments) {
        expect(markup).toContain(segment.audioSrc);
        for (const paragraph of segment.body.split("\n\n"))
          expect(
            markup
              .replaceAll("&#x27;", "'")
              .replaceAll("&quot;", '"')
              .replaceAll("&amp;", "&"),
          ).toContain(paragraph);
      }
      expect(markup.match(/<audio /g) ?? []).toHaveLength(5);
      expect(markup.match(/role="img"/g) ?? []).toHaveLength(5);
      expect(markup).not.toMatch(/data-tier="(supportive|decorative)"/);
      const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map(
        (match) => match[1],
      );
      expect(new Set(ids).size).toBe(ids.length);
      expect(
        presentationSchema.safeParse({
          ...p,
          groups: [
            [0, 1],
            [1, 3, 4],
          ],
        }).success,
      ).toBe(false);
      expect(visibleSegments(p, 4)).toEqual(p.groups.at(-1));
    });
  });
  it("persists each arm, server-derived visits, deduplicated exposure proxies, version separation and withdrawal", async () => {
    const seen = new Set<string>();
    for (let index = 0; index < 3; index++) {
      const key = crypto.randomUUID();
      const { sessionId: id } = await tx((s) => s.enroll(consent, key));
      expect((await tx((s) => s.enroll(consent, key))).sessionId).toBe(id);
      await tx((s) =>
        s.submitAssessment(id, "pre", { answers: answerKey("A") }),
      );
      const view = await tx((s) => s.getLesson(id));
      if (view.presentation.kind !== "chunking") throw new Error("Wrong kind");
      const row = (
        await db.query<{ arm_key: string }>(
          "select a.arm_key from visuallearn.assignments a join visuallearn.sessions s on s.assignment_id=a.id where s.id=$1",
          [id],
        )
      ).rows[0];
      seen.add(row.arm_key);
      expect((await tx((s) => s.getLesson(id))).presentation).toEqual(
        view.presentation,
      );
      for (const group of view.presentation.groups) {
        const visited = await tx((s) => s.progress(id, { segment: group[0] }));
        expect(
          group.every((segment) => visited.visited.includes(segment)),
        ).toBe(true);
      }
      const event = {
        clientEventId: crypto.randomUUID(),
        eventType: "presentation_exposed",
        segmentId: "overview",
        elapsedMs: 0,
        clientTime: new Date().toISOString(),
        payload: { groupIndex: 0 },
      };
      const active = {
        ...event,
        clientEventId: crypto.randomUUID(),
        eventType: "active_time",
        payload: { groupIndex: 0, activeMs: 1200 },
      };
      await tx((s) => s.ingestEvents(id, [event, active]));
      await tx((s) => s.ingestEvents(id, [event, active]));
      await expect(
        tx((s) =>
          s.ingestEvents(id, [
            {
              ...event,
              clientEventId: crypto.randomUUID(),
              payload: { groupIndex: 4 },
            },
          ]),
        ),
      ).rejects.toThrow(/does not match/);
      const metrics = (
        await db.query(
          "select stimulus_version,presentation_version,active_time_ms,presentation_exposures,exposure_measure_version,study_time_policy from visuallearn.sessions where id=$1",
          [id],
        )
      ).rows[0];
      expect(metrics).toMatchObject({
        stimulus_version: SOURCE_VERSION,
        presentation_version: CHUNKING_VERSION,
        active_time_ms: 1200,
        presentation_exposures: 1,
        exposure_measure_version: "visible-interval-v1",
        study_time_policy: "self-paced-no-minimum-v1",
      });
      await tx((s) => s.completeLesson(id));
      await expect(tx((s) => s.assessment(id, "plus_60m"))).rejects.toThrow();
      if (index === 2) {
        await tx((s) => s.withdraw(id));
        await expect(tx((s) => s.ingestEvents(id, [active]))).rejects.toThrow(
          /withdrawn/,
        );
      }
    }
    expect([...seen].sort()).toEqual([...arms].sort());
    expect((await studyStats(db as unknown as SQL, "E3")).funnel[0].n).toBe(2);
    expect((await studyStats(db as unknown as SQL, "E1")).funnel[0].n).toBe(0);
    const exported = await exportRows(db as unknown as SQL, "sessions");
    expect(exported.rows).toHaveLength(2);
    for (const column of exported.columns)
      expect(dataDictionary.sessions[column]).toBeTruthy();
  });
});

it("preserves legacy versions and distinguishes uncollected activity from measured zero on upgrade", async () => {
  const legacy = new PGlite();
  try {
    for (const name of [
      "001_research_foundation",
      "002_assessment_v2_rating",
      "003_modality_foundation",
    ])
      await legacy.exec(
        await readFile(`supabase/migrations/${name}.sql`, "utf8"),
      );
    await legacy.exec(await readFile("supabase/seed.sql", "utf8"));
    const participant = (
      await legacy.query<{ id: string }>(
        "insert into visuallearn.participants(public_code,experiment_id,age_band,language,consent_version,f0) values('SYNTHETIC-UPGRADE4','E1','18-30','English','SYNTHETIC','{}') returning id",
      )
    ).rows[0].id;
    await legacy.query(
      "insert into visuallearn.sessions(participant_id,content_version,content_sha256,protocol_version,stimulus_version,media_manifest_sha256,question_bank_sha256,stimulus_sha256,followup_window_minutes) values($1,'legacy','legacy','legacy','density-v4-draft','legacy','legacy','legacy',30)",
      [participant],
    );
    await legacy.exec(
      await readFile("supabase/migrations/004_chunking_foundation.sql", "utf8"),
    );
    const row = (
      await legacy.query(
        "select stimulus_version,presentation_version,active_time_ms,presentation_exposures,exposure_measure_version,study_time_policy from visuallearn.sessions",
      )
    ).rows[0];
    expect(row).toEqual({
      stimulus_version: "density-v4-draft",
      presentation_version: "density-v4-draft",
      active_time_ms: 0,
      presentation_exposures: 0,
      exposure_measure_version: null,
      study_time_policy: null,
    });
  } finally {
    await legacy.close();
  }
}, 30000);

it("keeps grouped browser simulation isolated and retries exposure events without double counting", async () => {
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
  };
  const model = new LocalStudy(
    storage,
    {
      A: publicQuestions("A"),
      B: publicQuestions("B"),
      C: publicQuestions("C"),
    },
    Date.now,
    demoExperiments(),
  );
  model.startExperiment("E3", "grouped");
  await model.request("assessment/pre", { answers: answerKey("A") });
  await model.request("progress", { segment: 0 });
  expect(model.getRecord()?.visited).toEqual([0, 1, 2]);
  const event = {
    clientEventId: crypto.randomUUID(),
    eventType: "presentation_exposed",
    segmentId: "overview",
    elapsedMs: 0,
    clientTime: new Date().toISOString(),
    payload: { groupIndex: 0 },
  };
  await model.request("events", [event]);
  await model.request("events", [event]);
  expect(model.getRecord()?.exposures).toBe(1);
  const restored = new LocalStudy(
    storage,
    {
      A: publicQuestions("A"),
      B: publicQuestions("B"),
      C: publicQuestions("C"),
    },
    Date.now,
    demoExperiments(),
  );
  expect(restored.getRecord()?.exposures).toBe(1);
  expect(JSON.stringify(restored.getRecord())).not.toMatch(
    /correctAnswer|rationale/,
  );
});
