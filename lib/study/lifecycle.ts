import { z } from "zod";
export const ageBandSchema = z.enum(["9-12", "13-17", "18-30"]);
export const enrollmentSchema = z
  .object({
    studentName: z.string().trim().min(2).max(120),
    erp: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9][A-Za-z0-9/_-]*$/),
    ageBand: ageBandSchema,
    language: z.enum(["English", "Urdu", "Other", "Prefer not to say"]),
    languageComfort: z.number().int().min(1).max(5),
    familiarity: z.number().int().min(1).max(5),
    voluntary: z.literal(true),
    dataUse: z.literal(true),
    contactViewed: z.literal(true),
    consentVersion: z.string().min(1).max(80),
    experimentId: z.literal("E1").default("E1"),
  })
  .strict();
export type StudyState =
  | "enrolled"
  | "lesson_active"
  | "lesson_complete"
  | "immediate_test_complete"
  | "waiting_60m"
  | "60m_test_complete"
  | "waiting_7d"
  | "7d_test_complete"
  | "finished"
  | "withdrawn";
export const transitionMap: Record<StudyState, StudyState[]> = {
  enrolled: ["lesson_active", "withdrawn"],
  lesson_active: ["lesson_complete", "withdrawn"],
  lesson_complete: ["immediate_test_complete", "withdrawn"],
  immediate_test_complete: ["waiting_60m", "withdrawn"],
  waiting_60m: ["60m_test_complete", "withdrawn"],
  "60m_test_complete": ["finished", "waiting_7d", "withdrawn"],
  waiting_7d: ["7d_test_complete", "withdrawn"],
  "7d_test_complete": ["finished", "withdrawn"],
  finished: ["withdrawn"],
  withdrawn: [],
};
export function canTransition(from: StudyState, to: StudyState) {
  return transitionMap[from].includes(to);
}
export function followupWindow(completedAt: Date, graceMinutes = 30) {
  if (
    !Number.isFinite(completedAt.getTime()) ||
    !Number.isInteger(graceMinutes) ||
    graceMinutes < 1 ||
    graceMinutes > 1440
  )
    throw new Error("Invalid follow-up schedule");
  const dueAt = new Date(completedAt.getTime() + 60 * 60_000);
  return {
    dueAt,
    deadlineAt: new Date(dueAt.getTime() + graceMinutes * 60_000),
  };
}
export function followupEligibility(
  now: Date,
  dueAt: Date,
  deadlineAt: Date,
  completed = false,
  withdrawn = false,
) {
  if (withdrawn) return "withdrawn";
  if (completed) return "completed_in_window";
  if (now < dueAt) return "not_yet_available";
  if (now > deadlineAt) return "expired";
  return "eligible";
}
/** No default seven-day grace: a reviewed protocol must supply it. */
export function sevenDayWindow(completedAt: Date, graceMinutes: number) {
  const window = followupWindow(completedAt, graceMinutes);
  const shift = (7 * 24 - 1) * 60 * 60_000;
  return {
    dueAt: new Date(window.dueAt.getTime() + shift),
    deadlineAt: new Date(window.deadlineAt.getTime() + shift),
  };
}
