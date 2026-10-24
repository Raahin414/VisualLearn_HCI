import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { renderToStaticMarkup } from "react-dom/server";
import { lesson } from "@/lib/content/lesson";
import { ModalityLesson } from "@/components/learning/modality-lesson";
import {
  demoExperiments,
  presentationFor,
  MODALITY_VERSION,
} from "@/lib/study/presentation.server";
import { StudyService, type SQL } from "@/lib/study/service";
import { answerKey } from "@/lib/assessments/questions.server";
import { studyStats, exportRows } from "@/lib/admin/exports";
import { LocalStudy } from "@/lib/demo/local-study";
import { publicQuestions } from "@/lib/assessments/questions.server";
import { dataDictionary } from "@/lib/admin/codebook";
import {
  f3Schema,
  f3ModalitySchema,
  MODALITY_SURVEY_VERSION,
} from "@/lib/assessments/surveys";
const arms = ["text-only", "audio-only", "text-diagram", "audio-diagram"];
const consent = {
  experimentId: "E2",
  ageBand: "18-30",
  language: "English",
  languageComfort: 4,
  familiarity: 2,
  voluntary: true,
  dataUse: true,
  contactViewed: true,
  consentVersion: "SYNTHETIC-E2",
};
const f3 = {
  clarity: 4,
  overload: 2,
  support: "not_applicable",
  distraction: 2,
  pacing: 4,
  audio: "not_applicable",
  motion: "not_applicable",
  color: "not_applicable",
  acceptability: 4,
  mentalEffort: 5,
};
let db: PGlite;
let clock = new Date("2026-10-24T08:00:00Z");
const tx = <T,>(run: (s: StudyService) => Promise<T>) =>
  db.transaction((sql) =>
    run(new StudyService(sql as unknown as SQL, () => clock)),
  );
const accommodation = () => ({
  clientEventId: crypto.randomUUID(),
  eventType: "accommodation_used",
  segmentId: "overview",
  elapsedMs: 0,
  clientTime: clock.toISOString(),
  payload: { accommodation: "transcript" },
});
describe("SYNTHETIC E2 contract (PGlite, not hosted participants)", () => {
  beforeAll(async () => {
    db = new PGlite();
    for (const name of [
      "001_research_foundation",
      "002_assessment_v2_rating",
      "003_modality_foundation",
    ])
      await db.exec(await readFile(`supabase/migrations/${name}.sql`, "utf8"));
    await db.exec(
      await readFile("supabase/migrations/004_chunking_foundation.sql", "utf8"),
    );
    await db.exec(await readFile("supabase/seed.sql", "utf8"));
  }, 30000);
  afterAll(async () => {
    await db?.close();
  });
  it("stays closed, blocks incomplete pilot contracts, and leaves E3�E8 disabled", async () => {
    await expect(
      tx((s) => s.enroll(consent, crypto.randomUUID())),
    ).rejects.toThrow(/not approved/);
    await expect(
      db.exec("update visuallearn.experiments set enabled=true where id='E2'"),
    ).rejects.toThrow(/check constraint/);
    await expect(
      db.exec(
        "update visuallearn.experiments set enabled=true,pilot_reviewed=true where id='E2'",
      ),
    ).rejects.toThrow(/check constraint/);
    for (const id of ["E3", "E4", "E5", "E6", "E7", "E8"])
      await expect(
        db.query(
          "update visuallearn.experiments set enabled=true where id=$1",
          [id],
        ),
      ).rejects.toThrow(/check constraint/);
    await db.exec(
      `update visuallearn.experiments set enabled=true,pilot_reviewed=true,pilot_contract_version='${MODALITY_VERSION}',status='recruiting',content_approved=true,ethics_approved=true,consent_version='SYNTHETIC-E2',consent_text='SYNTHETIC LOCAL TEST ONLY',study_contact='SYNTHETIC' where id='E2'`,
    );
    await expect(
      tx((s) =>
        s.enroll({ ...consent, ageBand: "13-17" }, crypto.randomUUID()),
      ),
    ).rejects.toThrow(/Minor enrollment/);
  });
  it("keeps modality questionnaire N/A distinct from E1 numeric support", () => {
    expect(f3Schema.safeParse(f3).success).toBe(false);
    expect(f3ModalitySchema.safeParse(f3).success).toBe(true);
  });
  it("renders every canonical paragraph in text arms, uses unchanged audio sources and has no hidden alternate channels", async () => {
    const generator = await readFile("scripts/generate-narration.ps1", "utf8");
    expect(generator).toContain("$visualSynth.Speak($visualSegment.body)");
    for (const arm of arms) {
      const p = presentationFor("E2", arm);
      if (p.kind !== "modality") throw new Error("wrong projection");
      for (const segment of lesson.segments) {
        const html = renderToStaticMarkup(
          <ModalityLesson
            segment={segment}
            presentation={p}
            busy={false}
            onAudio={() => {}}
            onTranscript={() => {}}
          />,
        );
        expect(html.includes("<audio")).toBe(p.audio);
        expect(html.includes('role="img"')).toBe(p.diagram);
        if (p.audio) expect(html).toContain(segment.audioSrc);
        const text = html
          .replace(/<[^>]*>/g, "")
          .replaceAll("&#x27;", "'")
          .replaceAll("&quot;", '"')
          .replaceAll("&amp;", "&");
        for (const paragraph of segment.body.split("\n\n"))
          expect(text.includes(paragraph)).toBe(p.text);
        expect(html).not.toMatch(/data-tier="(supportive|decorative)"/);
      }
    }
    expect(
      demoExperiments()
        .find((e) => e.id === "E2")
        ?.arms.map((a) => a.key),
    ).toEqual(arms);
    expect(() => presentationFor("E2", "low")).toThrow();
  });
  it("allocates all four arms once, isolates summaries, records accommodation and preserves timing/withdrawal", async () => {
    const seen = new Set<string>();
    for (let i = 0; i < 4; i++) {
      const key = crypto.randomUUID();
      const { sessionId: id } = await tx((s) => s.enroll(consent, key));
      expect((await tx((s) => s.enroll(consent, key))).sessionId).toBe(id);
      await expect(
        tx((s) => s.ingestEvents(id, [accommodation()])),
      ).rejects.toThrow(/saved assignment/);
      await tx((s) =>
        s.submitAssessment(id, "pre", { answers: answerKey("A") }),
      );
      const view = await tx((s) => s.getLesson(id));
      const row = (
        await db.query<{ arm_key: string }>(
          "select a.arm_key from visuallearn.assignments a join visuallearn.sessions s on s.assignment_id=a.id where s.id=$1",
          [id],
        )
      ).rows[0];
      seen.add(row.arm_key);
      expect(view.condition).toBeNull();
      expect(view.presentation).toEqual(presentationFor("E2", row.arm_key));
      clock = new Date(clock.getTime() + 1000);
      expect((await tx((s) => s.getLesson(id))).lessonOpenedAt).toEqual(
        view.lessonOpenedAt,
      );
      expect(JSON.stringify(view)).not.toMatch(
        /correctAnswer|rationale|rubric/,
      );
      const event = accommodation();
      if (view.presentation.kind === "modality" && !view.presentation.audio)
        await expect(
          tx((s) =>
            s.ingestEvents(id, [
              { ...event, eventType: "audio_started", payload: {} },
            ]),
          ),
        ).rejects.toThrow(/channel/);
      if (view.presentation.kind === "modality" && !view.presentation.diagram)
        await expect(
          tx((s) =>
            s.ingestEvents(id, [
              { ...event, eventType: "diagram_interacted", payload: {} },
            ]),
          ),
        ).rejects.toThrow(/channel/);
      if (view.presentation.kind === "modality" && view.presentation.audio) {
        await tx((s) => s.ingestEvents(id, [event]));
        const first = (
          await db.query<{ accommodations: unknown }>(
            "select accommodations from visuallearn.sessions where id=$1",
            [id],
          )
        ).rows[0].accommodations;
        clock = new Date(clock.getTime() + 1000);
        await tx((s) => s.ingestEvents(id, [event]));
        await tx((s) =>
          s.ingestEvents(id, [{ ...event, segmentId: "evaporation" }]),
        );
        expect(
          (
            await db.query<{ accommodations: unknown }>(
              "select accommodations from visuallearn.sessions where id=$1",
              [id],
            )
          ).rows[0].accommodations,
        ).toEqual(first);
        expect(
          (
            await db.query<{ n: number }>(
              "select count(*)::int n from visuallearn.events where session_id=$1",
              [id],
            )
          ).rows[0].n,
        ).toBe(1);
      } else
        await expect(tx((s) => s.ingestEvents(id, [event]))).rejects.toThrow(
          /accommodation/,
        );
      for (let segment = 0; segment < 5; segment++)
        await tx((s) => s.progress(id, { segment }));
      await tx((s) => s.completeLesson(id));
      await tx((s) =>
        s.submitAssessment(id, "immediate", {
          answers: answerKey("B"),
          freeRecall: "SYNTHETIC recall of the water cycle.",
          scenario: "SYNTHETIC explanation of evaporation.",
        }),
      );
      await tx((s) => s.submitSurvey(id, "F3", f3));
      expect(
        (
          await db.query<{ form_version: string }>(
            "select form_version from visuallearn.survey_submissions where session_id=$1",
            [id],
          )
        ).rows[0].form_version,
      ).toBe(MODALITY_SURVEY_VERSION);
      await expect(tx((s) => s.assessment(id, "plus_60m"))).rejects.toThrow(
        /not available yet/,
      );
      if (i === 3) {
        await tx((s) => s.withdraw(id));
        await expect(tx((s) => s.getLesson(id))).rejects.toThrow(/withdrawn/);
      }
    }
    expect([...seen].sort()).toEqual([...arms].sort());
    const scoped = await studyStats(db as unknown as SQL, "E2");
    expect(scoped.funnel[0].n).toBe(3);
    expect((await studyStats(db as unknown as SQL, "E1")).funnel[0].n).toBe(0);
    for (const name of ["participants_deidentified", "sessions"] as const) {
      const exported = await exportRows(db as unknown as SQL, name);
      expect(exported.rows).toHaveLength(3);
      expect(exported.rows.every((r) => r.experiment_id === "E2")).toBe(true);
      for (const column of exported.columns)
        expect(dataDictionary[name][column]).toBeTruthy();
    }
  });
});

it("upgrades legacy E1 rows without inventing timestamps, versions or approvals", async () => {
  const legacy = new PGlite();
  try {
    for (const name of ["001_research_foundation", "002_assessment_v2_rating"])
      await legacy.exec(
        await readFile(`supabase/migrations/${name}.sql`, "utf8"),
      );
    await legacy.exec(await readFile("supabase/seed.sql", "utf8"));
    const p = (
      await legacy.query<{ id: string }>(
        "insert into visuallearn.participants(public_code,experiment_id,age_band,language,consent_version,f0) values('SYNTHETIC-LEGACY','E1','18-30','English','SYNTHETIC','{}') returning id",
      )
    ).rows[0].id;
    await legacy.query(
      "insert into visuallearn.sessions(participant_id,content_version,content_sha256,protocol_version,stimulus_version,media_manifest_sha256,question_bank_sha256,stimulus_sha256,followup_window_minutes) values($1,'legacy','legacy','legacy','density-v4-draft','legacy','legacy','legacy',30)",
      [p],
    );
    await legacy.exec(
      await readFile("supabase/migrations/003_modality_foundation.sql", "utf8"),
    );
    const row = (
      await legacy.query(
        "select experiment_id,presentation_version,lesson_opened_at,stimulus_version from visuallearn.sessions",
      )
    ).rows[0];
    expect(row).toEqual({
      experiment_id: "E1",
      presentation_version: "density-v4-draft",
      lesson_opened_at: null,
      stimulus_version: "density-v4-draft",
    });
    expect(
      (
        await legacy.query<{ n: number }>(
          "select count(*)::int n from visuallearn.experiments where not enabled and not pilot_reviewed",
        )
      ).rows[0].n,
    ).toBe(8);
  } finally {
    await legacy.close();
  }
}, 30000);

it("simulates all E2 arms in browser storage without grading or research persistence", async () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
  const banks = {
    A: publicQuestions("A"),
    B: publicQuestions("B"),
    C: publicQuestions("C"),
  };
  for (const arm of arms) {
    const model = new LocalStudy(storage, banks, Date.now, demoExperiments());
    model.startExperiment("E2", arm);
    await model.request("assessment/pre");
    await model.request("assessment/pre", { answers: answerKey("A") });
    const view = (await model.request("lesson")) as { presentation: unknown };
    expect(view.presentation).toEqual(presentationFor("E2", arm));
    const restored = new LocalStudy(
      storage,
      banks,
      Date.now,
      demoExperiments(),
    );
    expect(restored.getRecord()?.armKey).toBe(arm);
    expect(JSON.stringify(restored.getRecord())).not.toMatch(
      /correctAnswer|rationale|correctScore/,
    );
    model.reset();
  }
});
