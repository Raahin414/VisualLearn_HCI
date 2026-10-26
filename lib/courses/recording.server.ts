import "server-only";
import { randomBytes, createHash } from "node:crypto";
import { z } from "zod";
import type { SQL } from "@/lib/study/service";
import { hashToken } from "@/lib/security/tokens";
import { getCourse, isCondition } from "./catalog";
import { courseAnswers } from "./answers.server";

export const courseVersion = (slug: string) => {
  const course = getCourse(slug);
  if (!course) throw new Error("Unknown course.");
  return `five-courses-v1-draft:${createHash("sha256").update(JSON.stringify({ course, answers: courseAnswers[slug] })).digest("hex")}`;
};
export const startSchema = z.object({
  courseSlug: z.string(),
  studentName: z.string().trim().min(2).max(120),
  erp: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9][A-Za-z0-9/_-]*$/),
  adult: z.literal(true), voluntary: z.literal(true), dataUse: z.literal(true),
  consentVersion: z.string().min(1),
}).strict();
export const answerSchema = z.object({ answers: z.array(z.number().int().min(0).max(3)).length(4) }).strict();
export class CourseClosedError extends Error {}

export async function courseGate(db: SQL) {
  const { rows } = await db.query<{
    enabled: boolean; content_approved: boolean; ethics_approved: boolean;
    consent_version: string | null; consent_text: string | null; study_contact: string | null;
  }>("select * from visuallearn.course_study_settings where id=true");
  const gate = rows[0];
  if (process.env.COURSE_RECORDING_ENABLED !== "true" || !gate?.enabled ||
      !gate.content_approved || !gate.ethics_approved || !gate.consent_version ||
      !gate.consent_text || !/\bname\b/i.test(gate.consent_text) || !/\bERP\b/i.test(gate.consent_text) || !gate.study_contact)
    throw new CourseClosedError("Course recording is closed pending research approval.");
  return gate;
}

export async function startCourse(db: SQL, input: unknown) {
  const data = startSchema.parse(input);
  const course = getCourse(data.courseSlug);
  if (!course) throw new Error("Unknown course.");
  const gate = await courseGate(db);
  if (data.consentVersion !== gate.consent_version) throw new Error("Consent version changed. Please review it again.");
  await db.query("select pg_advisory_xact_lock(hashtext($1))", [course.slug]);
  const counts = await db.query<{ density: string; n: number }>(
    "select density,count(*)::int n from visuallearn.course_attempts where course_slug=$1 group by density", [course.slug]);
  const used = new Map(counts.rows.map((row) => [row.density, row.n]));
  const smallest = Math.min(...["low","medium","high"].map((d) => used.get(d) ?? 0));
  const options = ["low","medium","high"].filter((d) => (used.get(d) ?? 0) === smallest);
  const density = options[randomBytes(1)[0] % options.length];
  if (!isCondition(density)) throw new Error("Density assignment failed.");
  const identity = await db.query<{ id: string }>(
    "insert into visuallearn.course_student_identity(student_name,erp) values($1,$2) returning id",
    [data.studentName, data.erp]);
  const token = randomBytes(32).toString("hex");
  await db.query(
    "insert into visuallearn.course_attempts(identity_id,course_slug,density,access_hash,content_version,consent_version,adult_attested,voluntary_accepted,data_use_accepted) values($1,$2,$3,$4,$5,$6,$7,$8,$9)",
    [identity.rows[0].id, course.slug, density, hashToken(token), courseVersion(course.slug), data.consentVersion, data.adult, data.voluntary, data.dataUse]);
  return { token, slug: course.slug };
}

export async function currentAttempt(db: SQL, token: string) {
  const { rows } = await db.query<{
    id: string; course_slug: string; density: string; score: number | null;
    submitted_at: Date | null; content_version: string;
  }>("select id,course_slug,density,score,submitted_at,content_version from visuallearn.course_attempts where access_hash=$1 and withdrawn_at is null", [hashToken(token)]);
  const attempt = rows[0];
  if (!attempt || !getCourse(attempt.course_slug) || attempt.content_version !== courseVersion(attempt.course_slug) || !isCondition(attempt.density))
    throw new Error("Course session unavailable.");
  return attempt;
}

export async function submitCourse(db: SQL, token: string, input: unknown) {
  const { answers } = answerSchema.parse(input);
  const attempt = await currentAttempt(db, token);
  if (attempt.submitted_at) return { score: attempt.score, total: 4 };
  const course = getCourse(attempt.course_slug)!;
  const score = answers.reduce((n, answer, index) => n + Number(answer === courseAnswers[course.slug][index]), 0);
  const updated = await db.query<{ score: number }>(
    "update visuallearn.course_attempts set answers=$2,score=$3,submitted_at=now() where id=$1 and submitted_at is null returning score",
    [attempt.id, JSON.stringify(answers), score]);
  return { score: updated.rows[0]?.score ?? (await currentAttempt(db, token)).score, total: 4 };
}
export async function withdrawCourse(db: SQL, token: string) {
  const attempt = await currentAttempt(db, token);
  await db.query("update visuallearn.course_attempts set withdrawn_at=now() where id=$1", [attempt.id]);
}
