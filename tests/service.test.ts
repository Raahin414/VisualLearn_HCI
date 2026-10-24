import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { StudyService, type SQL } from "@/lib/study/service";
import { answerKey } from "@/lib/assessments/questions.server";
import { exportQueries, studyStats } from "@/lib/admin/exports";
const correct = (form: "A" | "B" | "C") => answerKey(form);
const scenario = "SYNTHETIC: evaporation turns liquid water into vapor.";
const consent = {
  ageBand: "18-30",
  language: "English",
  languageComfort: 4,
  familiarity: 2,
  voluntary: true,
  dataUse: true,
  contactViewed: true,
  consentVersion: "SYNTHETIC-consent",
};
const f3 = {
  clarity: 4,
  overload: 2,
  support: 4,
  distraction: 2,
  pacing: 4,
  audio: 4,
  motion: "not_applicable",
  color: 3,
  acceptability: 4,
  mentalEffort: 5,
};
let db: PGlite;
let clock = new Date("2026-10-16T10:00:00Z");
let id: string;
let service: StudyService;
async function tx<T>(run: (s: StudyService) => Promise<T>) {
  return db.transaction(async (sql) =>
    run(new StudyService(sql as unknown as SQL, () => clock)),
  );
}
describe("Synthetic E1 lifecycle using real PostgreSQL semantics", () => {
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(
      await readFile("supabase/migrations/001_research_foundation.sql", "utf8"),
    );
    await db.exec(
      await readFile(
        "supabase/migrations/002_assessment_v2_rating.sql",
        "utf8",
      ),
    );
    await db.exec(
      await readFile("supabase/migrations/003_modality_foundation.sql", "utf8"),
    );
    await db.exec(await readFile("supabase/seed.sql", "utf8"));
    service = new StudyService(db as unknown as SQL, () => clock);
  }, 30000);
  afterAll(async () => {
    await db.close();
  });
  it("fails closed before approval and always blocks minors", async () => {
    await expect(
      tx((s) => s.enroll(consent, crypto.randomUUID())),
    ).rejects.toThrow(/not approved/);
    await db.exec(
      "update visuallearn.experiments set enabled=true,status='recruiting',content_approved=true,ethics_approved=true,consent_version='SYNTHETIC-consent',consent_text='SYNTHETIC TEST CONSENT, NOT HUMAN APPROVAL',study_contact='SYNTHETIC TEST CONTACT' where id='E1'",
    );
    await expect(
      tx((s) =>
        s.enroll({ ...consent, ageBand: "13-17" }, crypto.randomUUID()),
      ),
    ).rejects.toThrow(/Minor enrollment/);
  });
  it("enrolls once with a retry key and exposes no baseline keys", async () => {
    const key = crypto.randomUUID();
    const one = await tx((s) => s.enroll(consent, key));
    const two = await tx((s) => s.enroll(consent, key));
    id = one.sessionId;
    expect(two.sessionId).toBe(id);
    const form = await tx((s) => s.assessment(id, "pre"));
    expect(JSON.stringify(form)).not.toMatch(/correctAnswer|rationale/);
    await expect(tx((s) => s.getLesson(id))).rejects.toThrow(/only during/);
  });
  it("scores baseline before assigning and preserves assignment over refresh", async () => {
    await tx((s) => s.submitAssessment(id, "pre", { answers: correct("A") }));
    const one = await service.getLesson(id);
    const two = await service.getLesson(id);
    expect(one.condition).toBe(two.condition);
    const duplicate = await tx((s) =>
      s.submitAssessment(id, "pre", { answers: {} }),
    );
    expect(duplicate.alreadySubmitted).toBe(true);
  });
  it("requires all chapters and schedules exactly one server-owned followup", async () => {
    await expect(tx((s) => s.completeLesson(id))).rejects.toThrow(
      /Visit every chapter/,
    );
    for (let i = 0; i < 5; i++) await tx((s) => s.progress(id, { segment: i }));
    await tx((s) => s.completeLesson(id));
    clock = new Date("2026-10-16T10:03:00Z");
    await tx((s) => s.completeLesson(id));
    const snapshot = await service.snapshot(id);
    expect(new Date(snapshot.followup!.due_at).toISOString()).toBe(
      "2026-10-16T11:00:00.000Z",
    );
    await expect(tx((s) => s.getLesson(id))).rejects.toThrow(/only during/);
  });
  it("persists immediate answers once, withholds scores and validates survey", async () => {
    await expect(
      tx((s) =>
        s.submitAssessment(id, "immediate", {
          answers: correct("B"),
          freeRecall: " ".repeat(40),
          scenario,
        }),
      ),
    ).rejects.toThrow();
    const result = await tx((s) =>
      s.submitAssessment(id, "immediate", {
        answers: correct("B"),
        freeRecall:
          "SYNTHETIC explanation of the processes and how they connect.",
        scenario,
      }),
    );
    expect(result).not.toHaveProperty("correct");
    await tx((s) =>
      s.submitAssessment(id, "immediate", {
        answers: {},
        freeRecall: "SYNTHETIC overwrite attempt",
      }),
    );
    const attempt = await db.query<{ correct: number; free_recall: string }>(
      "select correct,free_recall from visuallearn.assessment_attempts where session_id=$1 and timepoint='immediate'",
      [id],
    );
    expect(attempt.rows[0].correct).toBe(8);
    expect(attempt.rows[0].free_recall).not.toContain("overwrite");
    await expect(tx((s) => s.submitSurvey(id, "F3", {}))).rejects.toThrow();
    await tx((s) => s.submitSurvey(id, "F3", f3));
  });
  it("deduplicates telemetry and restores the session through a hashed return token", async () => {
    const event = {
      clientEventId: crypto.randomUUID(),
      eventType: "document_hidden",
      elapsedMs: 5000,
      clientTime: clock.toISOString(),
      payload: {},
    };
    await tx((s) => s.ingestEvents(id, [event, event]));
    const count = await db.query<{ n: number }>(
      "select count(*)::int n from visuallearn.events where session_id=$1",
      [id],
    );
    expect(count.rows[0].n).toBe(1);
    const token = await tx((s) => s.issueReturnToken(id));
    expect((await service.recover(token.token)).sessionId).toBe(id);
    const stored = await db.query<{ token_hash: string }>(
      "select token_hash from visuallearn.return_tokens where session_id=$1",
      [id],
    );
    expect(stored.rows[0].token_hash).not.toBe(token.token);
  });
  it("blocks the delayed form before due, then completes C and F5 at 60m", async () => {
    clock = new Date("2026-10-16T10:30:00Z");
    await expect(tx((s) => s.assessment(id, "plus_60m"))).rejects.toThrow(
      /not available yet/,
    );
    clock = new Date("2026-10-16T11:00:00Z");
    const form = await tx((s) => s.assessment(id, "plus_60m"));
    expect(form.questions).toHaveLength(8);
    await tx((s) =>
      s.submitAssessment(id, "plus_60m", {
        answers: correct("C"),
        freeRecall:
          "SYNTHETIC delayed explanation of the repeating water cycle.",
        scenario,
      }),
    );
    await tx((s) =>
      s.submitSurvey(id, "F5", {
        reviewed: "no",
        sources: [],
        discussed: "no",
        confidence: 3,
        recallEffort: 4,
      }),
    );
    expect((await service.snapshot(id)).state).toBe("finished");
  });
  it("withdrawal invalidates all access and return tokens", async () => {
    const token = await tx((s) => s.issueReturnToken(id));
    await tx((s) => s.withdraw(id));
    await expect(service.snapshot(id)).rejects.toThrow(/withdrawn/);
    await expect(service.recover(token.token)).rejects.toThrow(
      /invalid or expired/,
    );
  });
  it("queries every real export dataset and excludes the withdrawn synthetic session", async () => {
    for (const sql of Object.values(exportQueries))
      expect((await db.query(sql)).rows).toHaveLength(0);
    const stats = await studyStats(db as unknown as SQL);
    expect(stats.balance).toEqual([]);
    expect(stats.performance).toEqual([]);
  });
});
