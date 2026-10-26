import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { courses } from "@/lib/courses/catalog";
import { startCourse, currentAttempt, submitCourse, withdrawCourse } from "@/lib/courses/recording.server";
import type { SQL } from "@/lib/study/service";
import { studentRecords } from "@/lib/admin/student-records";

let db: PGlite;
const transaction = <T,>(run: (source: SQL) => Promise<T>) => db.transaction((client) => run(client as unknown as SQL));
const consent = (index: number, courseSlug = "photosynthesis") => ({
  courseSlug, studentName: `SYNTHETIC Student ${index}`, erp: `SYNTHETIC-${index}`,
  adult: true, voluntary: true, dataUse: true, consentVersion: "SYNTHETIC-COURSE",
});
describe("Five-course recorded workflow (disposable PostgreSQL semantics)", () => {
  beforeAll(async () => {
    db = new PGlite();
    for (const file of (await readdir("supabase/migrations")).filter((name) => /^\d{3}_.+\.sql$/.test(name)).sort())
      await db.exec(await readFile(`supabase/migrations/${file}`, "utf8"));
    process.env.COURSE_RECORDING_ENABLED = "true";
  }, 30000);
  afterAll(async () => { delete process.env.COURSE_RECORDING_ENABLED; await db?.close(); });
  it("has five distinct courses with the same questions for all three visual densities", () => {
    expect(courses).toHaveLength(5);
    expect(new Set(courses.map((course) => course.slug)).size).toBe(5);
    for (const course of courses) { expect(course.steps).toHaveLength(3); expect(course.questions).toHaveLength(4); }
  });
  it("does not collect identifiers while approval is missing", async () => {
    await expect(transaction((client) => startCourse(client, consent(1)))).rejects.toThrow(/closed/);
    expect((await db.query<{ n: number }>("select count(*)::int n from visuallearn.course_student_identity")).rows[0].n).toBe(0);
    const privileges = await db.query<{ can_read: boolean; can_update: boolean }>("select has_table_privilege('visuallearn_backend','visuallearn.course_study_settings','SELECT') can_read,has_table_privilege('visuallearn_backend','visuallearn.course_study_settings','UPDATE') can_update");
    expect(privileges.rows[0]).toEqual({ can_read: true, can_update: false });
  });
  it("balances assignments per course, saves scores, and keeps identifiers separate", async () => {
    await db.exec("update visuallearn.course_study_settings set enabled=true,content_approved=true,ethics_approved=true,consent_version='SYNTHETIC-COURSE',consent_text='SYNTHETIC only name and ERP',study_contact='SYNTHETIC' where id=true");
    const tokens: string[] = [];
    for (let index = 1; index <= 6; index++) tokens.push((await transaction((client) => startCourse(client, consent(index)))).token);
    const assignments = await Promise.all(tokens.map((token) => transaction((client) => currentAttempt(client, token))));
    expect(["low", "medium", "high"].map((density) => assignments.filter((attempt) => attempt.density === density).length)).toEqual([2, 2, 2]);
    const score = await transaction((client) => submitCourse(client, tokens[0], { answers: [1, 2, 0, 3] }));
    expect(score).toEqual({ score: 4, total: 4 });
    expect(await transaction((client) => submitCourse(client, tokens[0], { answers: [0, 0, 0, 0] }))).toEqual(score);
    const attempt = (await db.query<{ answers: number[]; score: number; consent_version: string; adult_attested: boolean }>("select answers,score,consent_version,adult_attested from visuallearn.course_attempts where score is not null")).rows[0];
    expect(attempt.score).toBe(4);
    expect(attempt.answers).toEqual([1, 2, 0, 3]);
    expect(attempt.consent_version).toBe("SYNTHETIC-COURSE");
    expect(attempt.adult_attested).toBe(true);
    const researcherRows = await transaction(studentRecords);
    expect(researcherRows).toHaveLength(6);
    expect(researcherRows.find((row) => row.erp === "SYNTHETIC-1")).toMatchObject({ course: "photosynthesis", score: 4, total: 4 });
    const identities = await db.query<{ student_name: string; erp: string }>("select student_name,erp from visuallearn.course_student_identity");
    expect(identities.rows).toHaveLength(6);
    expect((await db.query<Record<string, unknown>>("select * from visuallearn.course_attempts limit 1")).rows[0]).not.toHaveProperty("erp");
    const water = await transaction((client) => startCourse(client, consent(7, "water-cycle")));
    expect((await transaction((client) => currentAttempt(client, water.token))).course_slug).toBe("water-cycle");
    await transaction((client) => withdrawCourse(client, water.token));
    await expect(transaction((client) => currentAttempt(client, water.token))).rejects.toThrow(/unavailable/);
    expect(await transaction(studentRecords)).toHaveLength(6);
  });
});
