import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { renderToStaticMarkup } from "react-dom/server";
import { StudyService, type SQL } from "@/lib/study/service";
import {
  answerKey,
  publicQuestions,
  questionBanks,
} from "@/lib/assessments/questions.server";
import {
  SEVEN_DAY_VERSION,
  sevenDayPrompts,
} from "@/lib/assessments/seven-day";
import { sevenDayWindow, followupEligibility } from "@/lib/study/lifecycle";
import { exportRows, studyStats } from "@/lib/admin/exports";
import { dataDictionary } from "@/lib/admin/codebook";
import { LocalStudy } from "@/lib/demo/local-study";
import { DraftDebrief } from "@/components/study/draft-debrief";
import { AnalysisCharts } from "@/components/admin/analysis-charts";
const consent = {
  studentName: "Synthetic Student",
  erp: "SYNTHETIC-M4",
  ageBand: "18-30",
  language: "English",
  languageComfort: 4,
  familiarity: 2,
  voluntary: true,
  dataUse: true,
  contactViewed: true,
  consentVersion: "SYNTHETIC-M4",
};
const written = {
  freeRecall:
    "SYNTHETIC: evaporation, condensation, precipitation and collection form a cycle.",
  scenario: "SYNTHETIC: warmth and moving air help water evaporate.",
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
const exposure = {
  reviewed: "no",
  sources: [],
  discussed: "no",
  confidence: 3,
  recallEffort: 4,
};
let db: PGlite;
let now = new Date("2026-10-24T10:00:00Z");
const tx = <T,>(run: (s: StudyService) => Promise<T>) =>
  db.transaction((sql) =>
    run(new StudyService(sql as unknown as SQL, () => now)),
  );
let optional: string;
let completedAt: Date;
beforeAll(async () => {
  db = new PGlite();
  for (const file of (await readdir("supabase/migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.exec(await readFile(`supabase/migrations/${file}`, "utf8"));
  await db.exec(await readFile("supabase/seed.sql", "utf8"));
  await db.exec(
    "update visuallearn.experiments set enabled=true,status='recruiting',content_approved=true,ethics_approved=true,consent_version='SYNTHETIC-M4',consent_text='SYNTHETIC ONLY name and ERP',study_contact='SYNTHETIC' where id='E1'",
  );
}, 30000);
afterAll(async () => {
  await db?.close();
});
describe("M4 optional lifecycle and privacy (disposable PGlite)", () => {
  it("keeps optional follow-up and physical deletion closed without reviews", async () => {
    const gates = (
      await db.query(
        "select seven_day_enabled,seven_day_reviewed,seven_day_window_minutes,retention_approved,withdrawal_retention_days from visuallearn.experiments where id='E1'",
      )
    ).rows[0];
    expect(gates).toEqual({
      seven_day_enabled: false,
      seven_day_reviewed: false,
      seven_day_window_minutes: null,
      retention_approved: false,
      withdrawal_retention_days: null,
    });
    await expect(
      db.exec(
        "update visuallearn.experiments set seven_day_enabled=true where id='E1'",
      ),
    ).rejects.toThrow(/check constraint/);
    const id = (await tx((s) => s.enroll(consent, crypto.randomUUID())))
      .sessionId;
    await expect(tx((s) => s.assessment(id, "plus_7d"))).rejects.toThrow(
      /not assigned/,
    );
    await expect(
      db.query("select visuallearn.purge_withdrawn($1,'SYNTHETIC',false)", [
        (
          await db.query<{ participant_id: string }>(
            "select participant_id from visuallearn.sessions where id=$1",
            [id],
          )
        ).rows[0].participant_id,
      ]),
    ).rejects.toThrow(/disabled/);
  });
  it("freezes the separately reviewed D contract and preserves the one-hour schedule", async () => {
    await db.exec(
      "update visuallearn.experiments set seven_day_enabled=true,seven_day_reviewed=true,seven_day_form_version='1.0-seven-day-draft',seven_day_window_minutes=60 where id='E1'",
    );
    optional = (await tx((s) => s.enroll(consent, crypto.randomUUID())))
      .sessionId;
    await db.exec(
      "update visuallearn.experiments set seven_day_enabled=false,seven_day_reviewed=false,seven_day_window_minutes=null where id='E1'",
    );
    await tx((s) =>
      s.submitAssessment(optional, "pre", { answers: answerKey("A") }),
    );
    for (let segment = 0; segment < 5; segment++)
      await tx((s) => s.progress(optional, { segment }));
    completedAt = new Date(now);
    await tx((s) => s.completeLesson(optional));
    await tx((s) => s.completeLesson(optional));
    const windows = (
      await db.query<{ timepoint: string; due_at: Date }>(
        "select timepoint,due_at from visuallearn.scheduled_followups where session_id=$1 order by timepoint",
        [optional],
      )
    ).rows;
    expect(windows).toHaveLength(2);
    expect(new Date(windows[0].due_at).getTime() - completedAt.getTime()).toBe(
      3600000,
    );
    expect(new Date(windows[1].due_at).getTime() - completedAt.getTime()).toBe(
      7 * 86400000,
    );
    await tx((s) =>
      s.submitAssessment(optional, "immediate", {
        answers: answerKey("B"),
        ...written,
      }),
    );
    await tx((s) => s.submitSurvey(optional, "F3", f3));
    now = new Date(completedAt.getTime() + 3600000);
    await tx((s) =>
      s.submitAssessment(optional, "plus_60m", {
        answers: answerKey("C"),
        ...written,
      }),
    );
    await tx((s) => s.submitSurvey(optional, "F5", exposure));
    expect((await tx((s) => s.snapshot(optional))).state).toBe("waiting_7d");
  });
  it("denies early D, admits exact server due time, records D/F6 separately and deduplicates", async () => {
    await expect(tx((s) => s.assessment(optional, "plus_7d"))).rejects.toThrow(
      /not available yet/,
    );
    now = sevenDayWindow(completedAt, 60).dueAt;
    const form = await tx((s) => s.assessment(optional, "plus_7d"));
    expect(form.questions?.every((q) => q.form === "D")).toBe(true);
    expect(JSON.stringify(form)).not.toMatch(
      /correctAnswer|correctCycle|correctLabels|rationale/,
    );
    expect(form.freeRecallPrompt).toBe(sevenDayPrompts.freeRecall);
    await tx((s) =>
      s.submitAssessment(optional, "plus_7d", {
        answers: answerKey("D"),
        ...written,
      }),
    );
    expect(
      (await tx((s) => s.submitAssessment(optional, "plus_7d", {})))
        .alreadySubmitted,
    ).toBe(true);
    await tx((s) => s.submitSurvey(optional, "F6", exposure));
    expect((await tx((s) => s.snapshot(optional))).state).toBe("finished");
    const rows = (
      await db.query(
        "select form_key,form_version,correct from visuallearn.assessment_attempts where session_id=$1 and timepoint='plus_7d'",
        [optional],
      )
    ).rows;
    expect(rows).toEqual([
      { form_key: "D", form_version: SEVEN_DAY_VERSION, correct: 8 },
    ]);
    const data = await exportRows(db as unknown as SQL, "sessions");
    expect(data.columns.every((key) => key in dataDictionary.sessions)).toBe(
      true,
    );
  });
  it("enforces a separately supplied deadline without substituting missing scores", () => {
    const w = sevenDayWindow(new Date("2026-10-24T10:00:00Z"), 60);
    expect(w.dueAt.toISOString()).toBe("2026-10-31T10:00:00.000Z");
    expect(followupEligibility(w.deadlineAt, w.dueAt, w.deadlineAt)).toBe(
      "eligible",
    );
    expect(
      followupEligibility(new Date(+w.deadlineAt + 1), w.dueAt, w.deadlineAt),
    ).toBe("expired");
    expect(() => sevenDayWindow(completedAt, 0)).toThrow();
  });
  it("requires withdrawal, the approved policy and delay; deletion is atomic and preserves allocation totals", async () => {
    const participant = (
      await db.query<{ participant_id: string }>(
        "select participant_id from visuallearn.sessions where id=$1",
        [optional],
      )
    ).rows[0].participant_id;
    await expect(
      db.query(
        "select visuallearn.purge_withdrawn($1,'SYNTHETIC-POLICY',true)",
        [participant],
      ),
    ).rejects.toThrow(/Approved retention/);
    await db.exec(
      "update visuallearn.experiments set retention_approved=true,retention_policy_version='SYNTHETIC-POLICY',withdrawal_retention_days=30 where id='E1'",
    );
    await expect(
      db.query(
        "select visuallearn.purge_withdrawn($1,'SYNTHETIC-POLICY',true)",
        [participant],
      ),
    ).rejects.toThrow(/not eligible/);
    await tx((s) => s.withdraw(optional));
    await expect(
      db.query(
        "select visuallearn.purge_withdrawn($1,'SYNTHETIC-POLICY',true)",
        [participant],
      ),
    ).rejects.toThrow(/not eligible/);
    await db.query(
      "update visuallearn.participants set withdrawn_at=now()-interval '31 days' where id=$1",
      [participant],
    );
    await expect(
      db.transaction(async (sql) => {
        await sql.query(
          "select visuallearn.purge_withdrawn($1,'SYNTHETIC-POLICY',true)",
          [participant],
        );
        throw new Error("SYNTHETIC rollback");
      }),
    ).rejects.toThrow(/rollback/);
    expect(
      (
        await db.query("select id from visuallearn.participants where id=$1", [
          participant,
        ])
      ).rows,
    ).toHaveLength(1);
    expect(
      (await db.query("select * from visuallearn.deleted_allocation_counts"))
        .rows,
    ).toHaveLength(0);
    await db.query(
      "select visuallearn.purge_withdrawn($1,'SYNTHETIC-POLICY',true)",
      [participant],
    );
    expect(
      (
        await db.query("select id from visuallearn.participants where id=$1", [
          participant,
        ])
      ).rows,
    ).toHaveLength(0);
    for (const table of [
      "events",
      "return_tokens",
      "scheduled_followups",
      "assessment_attempts",
      "survey_submissions",
    ])
      expect(
        (
          await db.query(
            `select * from visuallearn.${table} where session_id=$1`,
            [optional],
          )
        ).rows,
      ).toHaveLength(0);
    expect(
      (
        await db.query(
          "select sum(n)::int n from visuallearn.deleted_allocation_counts",
        )
      ).rows[0],
    ).toEqual({ n: 1 });
    expect(
      (
        await db.query(
          "select visuallearn.purge_withdrawn($1,'SYNTHETIC-POLICY',true) deleted",
          [participant],
        )
      ).rows[0],
    ).toEqual({ deleted: false });
    const stats = await studyStats(db as unknown as SQL);
    expect(stats.balance).toHaveLength(0);
  });
});
it("D has a matched draft blueprint and unique keyed projections, not a renamed C", () => {
  const blueprint = (form: "A" | "D") =>
    questionBanks[form].map((q) => [
      q.type,
      q.skill,
      q.objectiveId,
      q.estimatedDifficulty,
    ]);
  expect(blueprint("D")).toEqual(blueprint("A"));
  expect(questionBanks.D.every((q) => q.version === SEVEN_DAY_VERSION)).toBe(
    true,
  );
  expect(
    questionBanks.D.filter((q) => q.type === "mcq").every(
      (d) => !questionBanks.C.some((c) => c.stem === d.stem),
    ),
  ).toBe(true);
  expect(JSON.stringify(publicQuestions("D"))).not.toMatch(
    /correctAnswer|rationale/,
  );
  expect(renderToStaticMarkup(<DraftDebrief />)).toContain("Not approved");
});

it("migration 005 preserves existing study records and leaves optional policies unset", async () => {
  const legacy = new PGlite();
  try {
    for (const file of (await readdir("supabase/migrations")).filter((file) => /^00[1-4]_/.test(file)).sort())
      await legacy.exec(await readFile(`supabase/migrations/${file}`, "utf8"));
    await legacy.exec(await readFile("supabase/seed.sql", "utf8"));
    const participant = (await legacy.query<{ id: string }>("insert into visuallearn.participants(public_code,experiment_id,age_band,language,consent_version,f0,withdrawn_at) values('SYNTHETIC-M4-UPGRADE','E1','18-30','English','SYNTHETIC','{}',now()) returning id")).rows[0].id;
    const session = (await legacy.query<{ id: string }>("insert into visuallearn.sessions(participant_id,content_version,content_sha256,protocol_version,stimulus_version,media_manifest_sha256,question_bank_sha256,stimulus_sha256,followup_window_minutes) values($1,'legacy','legacy','legacy','shared-v6-draft','legacy','legacy','legacy',30) returning id", [participant])).rows[0].id;
    await legacy.query("insert into visuallearn.assessment_attempts(session_id,timepoint,form_key,form_version,submitted_at,correct,max_score,free_recall) values($1,'immediate','B','2.0.0-draft',now(),4,8,'SYNTHETIC preserved written response')", [session]);
    const before = (await legacy.query("select s.stimulus_version,s.question_bank_sha256,p.withdrawn_at,t.free_recall,t.correct from visuallearn.sessions s join visuallearn.participants p on p.id=s.participant_id join visuallearn.assessment_attempts t on t.session_id=s.id")).rows;
    await legacy.exec(await readFile("supabase/migrations/005_optional_followup_privacy.sql", "utf8"));
    expect((await legacy.query("select s.stimulus_version,s.question_bank_sha256,p.withdrawn_at,t.free_recall,t.correct from visuallearn.sessions s join visuallearn.participants p on p.id=s.participant_id join visuallearn.assessment_attempts t on t.session_id=s.id")).rows).toEqual(before);
    expect((await legacy.query("select seven_day_form_version,seven_day_bank_sha256,seven_day_window_minutes from visuallearn.sessions")).rows[0]).toEqual({ seven_day_form_version: null, seven_day_bank_sha256: null, seven_day_window_minutes: null });
    expect((await legacy.query("select count(*)::int n from visuallearn.experiments where seven_day_enabled or retention_approved")).rows[0]).toEqual({ n: 0 });
  } finally { await legacy.close(); }
}, 30000);
it("optional browser simulation reaches D/F6 without SQL, grading or research requests", async () => {
  const storage = new Map<string, string>();
  const model = new LocalStudy(
    {
      getItem: (k) => storage.get(k) ?? null,
      setItem: (k, v) => {
        storage.set(k, v);
      },
      removeItem: (k) => {
        storage.delete(k);
      },
    },
    {
      A: publicQuestions("A"),
      B: publicQuestions("B"),
      C: publicQuestions("C"),
      D: publicQuestions("D"),
    },
  );
  model.startExperiment("E1", "medium", true);
  await model.request("assessment/pre", { answers: answerKey("A") });
  for (let segment = 0; segment < 5; segment++)
    await model.request("progress", { segment });
  await model.request("complete", {});
  await model.request("assessment/immediate", {
    answers: answerKey("B"),
    ...written,
  });
  await model.request("survey/F3", f3);
  model.advanceTo("due");
  await model.request("assessment/plus_60m", {
    answers: answerKey("C"),
    ...written,
  });
  await model.request("survey/F5", exposure);
  await expect(model.request("assessment/plus_7d")).rejects.toThrow(
    /not available/,
  );
  model.advanceTo("due");
  await model.request("assessment/plus_7d", {
    answers: answerKey("D"),
    ...written,
  });
  await model.request("survey/F6", exposure);
  expect(model.getRecord()?.state).toBe("finished");
  expect(JSON.stringify(model.getRecord())).not.toMatch(
    /correctAnswer|rationale|"correct":/,
  );
});
it("charts preserve zero scores and suppress pooled comparisons across frozen cohorts", async () => {
  const stats = await studyStats(db as unknown as SQL);
  const populated = {
    ...stats,
    versions: [
      {
        protocol_version: "SYNTHETIC",
        stimulus_version: "SYNTHETIC",
        question_bank_sha256: "SYNTHETIC",
        n: 1,
      },
    ],
    performance: [
      { timepoint: "immediate", arm_key: "low", n: 1, mean_percent: "0.0" },
    ],
  };
  expect(renderToStaticMarkup(<AnalysisCharts stats={populated} />)).toContain(
    "0.0%",
  );
  const mixed = renderToStaticMarkup(
    <AnalysisCharts
      stats={{
        ...populated,
        versions: [...populated.versions, ...populated.versions],
      }}
    />,
  );
  expect(mixed).toContain("withheld");
  expect(mixed).not.toContain("research-chart-track");
});
