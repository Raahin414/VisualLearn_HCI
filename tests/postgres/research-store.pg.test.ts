// Real PostgreSQL 17 over TCP with separate pooled connections, using the
// application's own transaction helper and the non-owner runtime login.
// All participants are SYNTHETIC (consent version SYNTHETIC-LOCAL-CONSENT).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import pg from "pg";
import type { PoolClient } from "pg";
import { StudyService, type SQL } from "@/lib/study/service";
import { answerKey, publicQuestions } from "@/lib/assessments/questions.server";
import { exportQueries } from "@/lib/admin/exports";
const ownerUrl = process.env.PG_OWNER_URL!;
const appUrl = process.env.PG_APP_URL!;
if (!ownerUrl || !appUrl || !process.env.VISUALLEARN_SYNTHETIC_DB)
  throw new Error(
    "Run through `npm run test:pg` (disposable Docker database).",
  );
if (new URL(appUrl).hostname !== "127.0.0.1")
  throw new Error(
    "Refusing to run SYNTHETIC fixtures against a non-loopback database.",
  );
process.env.DATABASE_URL = appUrl;
const { transaction, getPool } = await import("@/lib/db/client");
const owner = new pg.Pool({ connectionString: ownerUrl, max: 4 });
let clock = new Date();
const tx = <T>(run: (s: StudyService) => Promise<T>) =>
  transaction((c: PoolClient) =>
    run(new StudyService(c as unknown as SQL, () => clock)),
  );
const consent = {
  ageBand: "18-30",
  language: "English",
  languageComfort: 4,
  familiarity: 2,
  voluntary: true,
  dataUse: true,
  contactViewed: true,
  consentVersion: "SYNTHETIC-LOCAL-CONSENT",
};
const written = {
  freeRecall:
    "SYNTHETIC recall: evaporation, condensation, precipitation, collection.",
  scenario: "SYNTHETIC scenario: warm moving air speeds evaporation.",
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
  confusing: "",
  helpful: "",
};
const f5 = {
  reviewed: "no",
  sources: [],
  discussed: "no",
  confidence: 3,
  recallEffort: 4,
  issues: "",
};
async function enroll() {
  return (await tx((s) => s.enroll(consent, crypto.randomUUID()))).sessionId;
}
async function toLessonComplete(id: string) {
  await tx((s) => s.submitAssessment(id, "pre", { answers: answerKey("A") }));
  for (let i = 0; i < 5; i++) await tx((s) => s.progress(id, { segment: i }));
  await tx((s) => s.completeLesson(id));
}
beforeAll(async () => {
  const { rows } = await owner.query("select current_database() db");
  expect(rows[0].db).toBe("visuallearn_synthetic");
});
afterAll(async () => {
  await owner.end();
  await getPool().end();
});
describe("Migrations and least-privilege runtime login", () => {
  it("records all migrations once and keeps the seed draft-only except the SYNTHETIC E1 fixture", async () => {
    const m = await owner.query(
      "select version from visuallearn_ops.migrations order by version",
    );
    expect(m.rows.map((r) => r.version)).toEqual(["001", "002", "003"]);
    const e = await owner.query(
      "select id,enabled,status,consent_version from visuallearn.experiments order by id",
    );
    expect(e.rows).toHaveLength(8);
    expect(e.rows.filter((r) => r.enabled).map((r) => r.id)).toEqual(["E1"]);
    expect(e.rows[0].consent_version).toMatch(/^SYNTHETIC/);
    expect(e.rows.slice(1).every((r) => r.status === "draft")).toBe(true);
  });
  it("runs the app as a non-owner without superuser, DDL or RLS bypass", async () => {
    const c = await getPool().connect();
    try {
      const me = await c.query(
        "select current_user u, r.rolsuper, r.rolbypassrls, r.rolcreaterole, r.rolcreatedb from pg_roles r where r.rolname=current_user",
      );
      expect(me.rows[0]).toEqual({
        u: "visuallearn_app",
        rolsuper: false,
        rolbypassrls: false,
        rolcreaterole: false,
        rolcreatedb: false,
      });
      const owners = await c.query(
        "select count(*)::int n from pg_tables where schemaname='visuallearn' and tableowner=current_user",
      );
      expect(owners.rows[0].n).toBe(0);
      for (const ddl of [
        "create table visuallearn.attack(x int)",
        "drop table visuallearn.events",
        "alter table visuallearn.participants disable row level security",
        "create table public.attack(x int)",
        "select * from visuallearn_ops.migrations",
        "create table public.attack2(x int)",
        "create role attacker",
      ])
        await expect(c.query(ddl)).rejects.toThrow(
          /permission denied|must be owner|must be/,
        );
    } finally {
      c.release();
    }
  });
  it("denies Supabase anon and authenticated roles any access to research tables", async () => {
    const c = await owner.connect();
    try {
      for (const role of ["anon", "authenticated"]) {
        await c.query("begin");
        await c.query(`set local role ${role}`);
        await expect(
          c.query("select * from visuallearn.participants"),
        ).rejects.toThrow(/permission denied/);
        await c.query("rollback");
        await c.query("begin");
        await c.query(`set local role ${role}`);
        await expect(
          c.query("select visuallearn.assign_once(gen_random_uuid())"),
        ).rejects.toThrow(/permission denied/);
        await c.query("rollback");
      }
      const rls = await c.query(
        "select count(*) filter (where not relrowsecurity)::int off from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='visuallearn' and c.relkind='r'",
      );
      expect(rls.rows[0].off).toBe(0);
    } finally {
      c.release();
    }
  });
});
describe("Concurrent enrollment and allocation", () => {
  it("enrolls two participants at the same moment into distinct balanced arms", async () => {
    const [a, b] = await Promise.all([enroll(), enroll()]);
    expect(a).not.toBe(b);
    await Promise.all(
      [a, b].map((id) =>
        tx((s) => s.submitAssessment(id, "pre", { answers: answerKey("A") })),
      ),
    );
    const arms = await Promise.all(
      [a, b].map((id) => tx((s) => s.getLesson(id))),
    );
    expect(arms[0].condition).not.toBe(arms[1].condition);
  });
  it("keeps allocation exactly balanced under 30 simultaneous pretest submissions", async () => {
    await owner.query("delete from visuallearn.events");
    const ids = await Promise.all(Array.from({ length: 30 }, () => enroll()));
    await Promise.all(
      ids.map((id) =>
        tx((s) => s.submitAssessment(id, "pre", { answers: answerKey("A") })),
      ),
    );
    const counts = await owner.query(
      "select arm_key,count(*)::int n from visuallearn.assignments a join visuallearn.participants p on p.id=a.participant_id where p.age_band='18-30' group by arm_key order by arm_key",
    );
    // 2 from the previous test + 30 here = 32 → 11/11/10 in some order.
    expect(counts.rows.map((r) => r.n).sort((x, y) => x - y)).toEqual([
      10, 11, 11,
    ]);
    const dupes = await owner.query(
      "select count(*)::int n from (select participant_id from visuallearn.assignments group by 1 having count(*)>1) d",
    );
    expect(dupes.rows[0].n).toBe(0);
  });
  it("collapses a double-clicked enrollment (same idempotency key, parallel) into one participant", async () => {
    const key = crypto.randomUUID();
    const results = await Promise.allSettled(
      [0, 1, 2].map(() => tx((s) => s.enroll(consent, key))),
    );
    const ids = results
      .filter((r) => r.status === "fulfilled")
      .map(
        (r) =>
          (r as PromiseFulfilledResult<{ sessionId: string }>).value.sessionId,
      );
    expect(ids.length).toBe(3);
    expect(new Set(ids).size).toBe(1);
  });
});
describe("Stable assignment, saved progress and duplicate submissions", () => {
  let id: string;
  it("persists the arm and chapter progress across new connections and a return-token reconnect", async () => {
    id = await enroll();
    await tx((s) => s.submitAssessment(id, "pre", { answers: answerKey("A") }));
    const first = await tx((s) => s.getLesson(id));
    await tx((s) => s.progress(id, { segment: 0 }));
    await tx((s) => s.progress(id, { segment: 2 }));
    const { token } = await tx((s) => s.issueReturnToken(id));
    const recovered = await tx((s) => s.recover(token));
    expect(recovered.sessionId).toBe(id);
    const again = await tx((s) => s.getLesson(id));
    expect(again.condition).toBe(first.condition);
    expect(again.progress).toBe(2);
    expect([...again.visited].sort()).toEqual([0, 2]);
    // A second pretest cannot reassign.
    const dup = await tx((s) =>
      s.submitAssessment(id, "pre", { answers: answerKey("A") }),
    );
    expect(dup.alreadySubmitted).toBe(true);
    expect((await tx((s) => s.getLesson(id))).condition).toBe(first.condition);
  });
  it("stores exactly one immediate attempt when two different submissions race", async () => {
    for (const i of [1, 3, 4]) await tx((s) => s.progress(id, { segment: i }));
    await tx((s) => s.completeLesson(id));
    const wrong = Object.fromEntries(
      publicQuestions("B").map((q) => [
        q.id,
        q.type === "mcq"
          ? 0
          : q.type === "ordering"
            ? [0, 1, 2, 3]
            : [4, 4, 4, 4],
      ]),
    );
    const results = await Promise.all([
      tx((s) =>
        s.submitAssessment(id, "immediate", {
          answers: answerKey("B"),
          ...written,
        }),
      ),
      tx((s) =>
        s.submitAssessment(id, "immediate", { answers: wrong, ...written }),
      ),
    ]);
    expect(results.filter((r) => r.alreadySubmitted)).toHaveLength(1);
    const rows = await owner.query(
      "select correct,item_scores,scenario_response,free_recall,form_version from visuallearn.assessment_attempts where session_id=$1 and timepoint='immediate'",
      [id],
    );
    expect(rows.rows).toHaveLength(1);
    const r = rows.rows[0];
    expect(Object.keys(r.item_scores)).toHaveLength(8);
    expect(r.correct).toBe(
      Object.values(r.item_scores as Record<string, number>).reduce(
        (a, b) => a + b,
        0,
      ),
    );
    expect(r.scenario_response).toMatch(/^SYNTHETIC scenario/);
    expect(r.form_version).toBe("2.0.0-draft");
  });
  it("accepts one F3 when the questionnaire is submitted twice concurrently", async () => {
    const res = await Promise.all([
      tx((s) => s.submitSurvey(id, "F3", f3)),
      tx((s) => s.submitSurvey(id, "F3", { ...f3, clarity: 1 })),
    ]);
    expect(res.filter((r) => r.alreadySubmitted)).toHaveLength(1);
    const n = await owner.query(
      "select count(*)::int n from visuallearn.survey_submissions where session_id=$1",
      [id],
    );
    expect(n.rows[0].n).toBe(1);
  });
});
describe("Server-owned one-hour follow-up timing", () => {
  it("blocks early, opens at +60m, closes after the grace window and ignores client time", async () => {
    const base = new Date("2026-10-18T09:00:00.000Z");
    clock = base;
    const id = await enroll();
    await toLessonComplete(id);
    await tx((s) =>
      s.submitAssessment(id, "immediate", {
        answers: answerKey("B"),
        ...written,
      }),
    );
    await tx((s) => s.submitSurvey(id, "F3", f3));
    const at = (ms: number) => (clock = new Date(base.getTime() + ms));
    const due = await owner.query(
      "select due_at,deadline_at from visuallearn.scheduled_followups where session_id=$1",
      [id],
    );
    expect(due.rows[0].due_at.toISOString()).toBe("2026-10-18T10:00:00.000Z");
    expect(due.rows[0].deadline_at.toISOString()).toBe(
      "2026-10-18T10:30:00.000Z",
    );
    at(59 * 60_000 + 59_000);
    await expect(tx((s) => s.assessment(id, "plus_60m"))).rejects.toThrow(
      /not available yet/,
    );
    // An early request leaves no opened attempt behind.
    const opened = await owner.query(
      "select count(*)::int n from visuallearn.assessment_attempts where session_id=$1 and timepoint='plus_60m'",
      [id],
    );
    expect(opened.rows[0].n).toBe(0);
    at(90 * 60_000 + 1);
    await expect(tx((s) => s.assessment(id, "plus_60m"))).rejects.toThrow(
      /expired/,
    );
    at(60 * 60_000);
    const form = await tx((s) => s.assessment(id, "plus_60m"));
    expect(JSON.stringify(form)).not.toMatch(/"correct\w*"|rationale/);
    at(90 * 60_000);
    await tx((s) =>
      s.submitAssessment(id, "plus_60m", {
        answers: answerKey("C"),
        ...written,
      }),
    );
    await tx((s) => s.submitSurvey(id, "F5", f5));
    const status = await owner.query(
      "select status from visuallearn.scheduled_followups where session_id=$1",
      [id],
    );
    expect(status.rows[0].status).toBe("completed_in_window");
    expect((await tx((s) => s.snapshot(id))).state).toBe("finished");
  });
  it("uses the real database clock path: an immediately requested follow-up is blocked", async () => {
    clock = new Date();
    const id = await enroll();
    await toLessonComplete(id);
    await tx((s) =>
      s.submitAssessment(id, "immediate", {
        answers: answerKey("B"),
        ...written,
      }),
    );
    await tx((s) => s.submitSurvey(id, "F3", f3));
    await expect(tx((s) => s.assessment(id, "plus_60m"))).rejects.toThrow(
      /not available yet/,
    );
  });
});
describe("Withdrawal and export integrity", () => {
  it("withdrawal revokes access and removes the participant from every export", async () => {
    clock = new Date();
    const id = await enroll();
    await toLessonComplete(id);
    const { token } = await tx((s) => s.issueReturnToken(id));
    await tx((s) => s.withdraw(id));
    await expect(tx((s) => s.snapshot(id))).rejects.toThrow(/withdrawn/);
    await expect(tx((s) => s.recover(token))).rejects.toThrow(
      /invalid or expired/,
    );
    await expect(tx((s) => s.ingestEvents(id, []))).rejects.toThrow(
      /withdrawn/,
    );
    const pid = (
      await owner.query(
        "select participant_id from visuallearn.sessions where id=$1",
        [id],
      )
    ).rows[0].participant_id;
    const c = await getPool().connect();
    try {
      for (const [name, sql] of Object.entries(exportQueries)) {
        const rows = (await c.query(sql)).rows;
        const text = JSON.stringify(rows);
        expect(text, name).not.toContain(pid);
        expect(text, name).not.toContain(id);
      }
    } finally {
      c.release();
    }
  });
  it("exports exactly the non-withdrawn database rows", async () => {
    const c = await getPool().connect();
    try {
      const expected = {
        participants_deidentified:
          "select count(*)::int n from visuallearn.participants where withdrawn_at is null",
        assignments:
          "select count(*)::int n from visuallearn.assignments a join visuallearn.participants p on p.id=a.participant_id where p.withdrawn_at is null",
        assessment_attempts:
          "select count(*)::int n from visuallearn.assessment_attempts t join visuallearn.sessions s on s.id=t.session_id join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null",
        surveys:
          "select count(*)::int n from visuallearn.survey_submissions q join visuallearn.sessions s on s.id=q.session_id join visuallearn.participants p on p.id=s.participant_id where p.withdrawn_at is null",
      } as const;
      for (const [name, countSql] of Object.entries(expected)) {
        const rows = (
          await c.query(exportQueries[name as keyof typeof exportQueries])
        ).rows;
        const n = (await owner.query(countSql)).rows[0].n;
        expect(rows.length, name).toBe(n);
        expect(n, name).toBeGreaterThan(0);
      }
    } finally {
      c.release();
    }
  });
});

describe("SYNTHETIC E2 concurrency over real PostgreSQL connections", () => {
  it("balances concurrent allocations across four arms and rejects cross-study links", async () => {
    await owner.query(
      "update visuallearn.experiments set enabled=true,pilot_reviewed=true,pilot_contract_version='modality-v1-draft',status='recruiting',content_approved=true,ethics_approved=true,consent_version='SYNTHETIC-LOCAL-CONSENT',consent_text='SYNTHETIC LOCAL TEST',study_contact='SYNTHETIC' where id='E2'",
    );
    try {
      const ids = await Promise.all(
        Array.from(
          { length: 12 },
          async () =>
            (
              await tx((s) =>
                s.enroll(
                  { ...consent, experimentId: "E2" },
                  crypto.randomUUID(),
                ),
              )
            ).sessionId,
        ),
      );
      await Promise.all(
        ids.map((id) =>
          tx((s) => s.submitAssessment(id, "pre", { answers: answerKey("A") })),
        ),
      );
      const counts = await owner.query(
        "select a.arm_key,count(*)::int n from visuallearn.assignments a join visuallearn.sessions s on s.assignment_id=a.id where s.id=any($1) group by a.arm_key",
        [ids],
      );
      expect(counts.rows).toHaveLength(4);
      expect(counts.rows.every((r) => r.n === 3)).toBe(true);
      const selected = ids[0];
      const views = await Promise.all(
        Array.from({ length: 4 }, () => tx((s) => s.getLesson(selected))),
      );
      expect(
        views.every(
          (v) =>
            JSON.stringify(v.presentation) ===
            JSON.stringify(views[0].presentation),
        ),
      ).toBe(true);
      expect(
        views.every(
          (v) =>
            new Date(v.lessonOpenedAt).getTime() ===
            new Date(views[0].lessonOpenedAt).getTime(),
        ),
      ).toBe(true);
      await expect(
        owner.query(
          "update visuallearn.sessions set experiment_id='E1' where id=$1",
          [selected],
        ),
      ).rejects.toThrow(/foreign key/);
      const e1 = await enroll();
      await tx((s) =>
        s.submitAssessment(e1, "pre", { answers: answerKey("A") }),
      );
      const assignment = (
        await owner.query(
          "select assignment_id from visuallearn.sessions where id=$1",
          [e1],
        )
      ).rows[0].assignment_id;
      await expect(
        owner.query(
          "update visuallearn.sessions set assignment_id=$2 where id=$1",
          [selected, assignment],
        ),
      ).rejects.toThrow(/foreign key|unique/);
      await Promise.all(ids.map((id) => tx((s) => s.withdraw(id))));
      await tx((s) => s.withdraw(e1));
    } finally {
      await owner.query(
        "update visuallearn.experiments set enabled=false,status='draft',pilot_reviewed=false,pilot_contract_version=null,content_approved=false,ethics_approved=false where id='E2'",
      );
    }
  });
});
