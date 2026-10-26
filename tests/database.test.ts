import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
let db: PGlite;
describe("PostgreSQL migration and data boundaries", () => {
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
    await db.exec(
      await readFile("supabase/migrations/004_chunking_foundation.sql", "utf8"),
    );
    await db.exec(
      await readFile(
        "supabase/migrations/005_optional_followup_privacy.sql",
        "utf8",
      ),
    );
    await db.exec(
      await readFile("supabase/migrations/006_e1_only.sql", "utf8"),
    );
    await db.exec(await readFile("supabase/migrations/007_student_identity.sql", "utf8"));
    await db.exec(await readFile("supabase/migrations/008_course_runs.sql", "utf8"));
    await db.exec(await readFile("supabase/seed.sql", "utf8"));
  }, 30000);
  afterAll(async () => {
    await db?.close();
  });
  it("seeds only the E1 draft study without human data and seed is idempotent", async () => {
    await db.exec(await readFile("supabase/seed.sql", "utf8"));
    const e = await db.query<{ n: number }>(
      "select count(*)::int n from visuallearn.experiments where not enabled and status='draft'",
    );
    expect(e.rows[0].n).toBe(1);
    const p = await db.query<{ n: number }>(
      "select count(*)::int n from visuallearn.participants",
    );
    expect(p.rows[0].n).toBe(0);
  });
  it("balances and persists assignments per age stratum", async () => {
    await db.exec(
      "update visuallearn.experiments set enabled=true where id='E1'",
    );
    for (const age of ["18-30", "13-17"])
      for (let i = 0; i < 9; i++) {
        const p = await db.query<{ id: string }>(
          "insert into visuallearn.participants(public_code,experiment_id,age_band,language,consent_version,f0) values($1,'E1',$2,'English','SYNTHETIC','{}') returning id",
          [`SYNTHETIC-${age}-${i}`, age],
        );
        const one = await db.query<{ id: string }>(
          "select visuallearn.assign_once($1) id",
          [p.rows[0].id],
        );
        const two = await db.query<{ id: string }>(
          "select visuallearn.assign_once($1) id",
          [p.rows[0].id],
        );
        expect(two.rows[0].id).toBe(one.rows[0].id);
      }
    const counts = await db.query<{ n: number }>(
      "select count(*)::int n from visuallearn.assignments a join visuallearn.participants p on p.id=a.participant_id group by age_band,arm_key",
    );
    expect(counts.rows).toHaveLength(6);
    expect(counts.rows.every((c) => c.n === 3)).toBe(true);
  });
  it("enforces RLS and no public table privileges", async () => {
    const tables = await db.query<{ relrowsecurity: boolean }>(
      "select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='visuallearn' and c.relkind='r'",
    );
    expect(tables.rows.length).toBeGreaterThan(10);
    expect(tables.rows.every((t) => t.relrowsecurity)).toBe(true);
    await db.exec(
      "create role synthetic_anon nologin; set role synthetic_anon",
    );
    await expect(
      db.query("select * from visuallearn.participants"),
    ).rejects.toThrow(/permission denied/);
    await db.exec("reset role");
  });
  it("disallows accidental activation of roadmap experiments", async () => {
    await expect(
      db.query(
        "insert into visuallearn.experiments(id,name,protocol_version,primary_outcome,arms,enabled) values('E4','RETIRED','test','test',array['static'],true)",
      ),
    ).rejects.toThrow(/check constraint/);
  });
  it("rejects withdrawn participant assignment", async () => {
    const p = await db.query<{ id: string }>(
      "insert into visuallearn.participants(public_code,experiment_id,age_band,language,consent_version,f0,withdrawn_at) values('SYNTHETIC-withdrawn','E1','18-30','English','SYNTHETIC','{}',now()) returning id",
    );
    await expect(
      db.query("select visuallearn.assign_once($1)", [p.rows[0].id]),
    ).rejects.toThrow(/unavailable/);
  });
});
