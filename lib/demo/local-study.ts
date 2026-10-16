import { z } from "zod";
import { conditions, lesson, type Condition } from "@/lib/content/lesson";
import { followupEligibility, followupWindow } from "@/lib/study/lifecycle";
import { f3Schema, f5Schema } from "@/lib/assessments/surveys";
import { eventBatchSchema } from "@/lib/telemetry/schema";
import { validateDraft, type PublicQuestion } from "@/lib/assessments/draft";
export const LOCAL_DEMO_KEY = "visuallearn-SYNTHETIC-local-study-v1";
const submission = z
  .object({
    answers: z.record(z.string(), z.number().int().min(0).max(3)),
    freeRecall: z.string().trim().max(6000).optional(),
  })
  .strict();
const storedSubmission = submission.extend({ submittedAt: z.iso.datetime() });
const states = [
  "enrolled",
  "lesson_active",
  "lesson_complete",
  "immediate_test_complete",
  "waiting_60m",
  "60m_test_complete",
  "finished",
  "withdrawn",
] as const;
const recordSchema = z
  .object({
    kind: z.literal("SYNTHETIC"),
    version: z.literal(1),
    publicCode: z.string().startsWith("SYNTHETIC-"),
    condition: z.enum(conditions),
    state: z.enum(states),
    progress: z.number().int().min(0).max(4),
    visited: z.array(z.number().int().min(0).max(4)).max(5),
    offsetMs: z
      .number()
      .min(0)
      .max(24 * 60 * 60_000),
    lessonCompletedAt: z.iso.datetime().nullable(),
    submissions: z.object({
      pre: storedSubmission.optional(),
      immediate: storedSubmission.optional(),
      plus_60m: storedSubmission.optional(),
    }),
    surveys: z.object({ F3: f3Schema.optional(), F5: f5Schema.optional() }),
    eventCount: z.number().int().nonnegative(),
  })
  .strict();
export type LocalStudyRecord = z.infer<typeof recordSchema>;
export type DemoBanks = Record<"A" | "B" | "C", PublicQuestion[]>;
const stages = { pre: "A", immediate: "B", plus_60m: "C" } as const;
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
/** Browser-only simulation. No database, authentication or grading substitute. */
export class LocalStudy {
  private record: LocalStudyRecord | null = null;
  private listeners = new Set<() => void>();
  storageAvailable = true;
  constructor(
    private storage: StorageLike,
    private banks: DemoBanks,
    private clock: () => number = Date.now,
  ) {
    try {
      const raw = storage.getItem(LOCAL_DEMO_KEY);
      if (raw) this.record = recordSchema.parse(JSON.parse(raw));
    } catch {
      this.storageAvailable = false;
    }
  }
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  getRecord() {
    return this.record ? structuredClone(this.record) : null;
  }
  private publish() {
    try {
      if (this.record)
        this.storage.setItem(LOCAL_DEMO_KEY, JSON.stringify(this.record));
      else this.storage.removeItem(LOCAL_DEMO_KEY);
    } catch {
      this.storageAvailable = false;
    }
    for (const listener of this.listeners) listener();
  }
  start(condition: Condition) {
    z.enum(conditions).parse(condition);
    if (this.record)
      throw new Error("Reset the simulated session before starting another.");
    this.record = {
      kind: "SYNTHETIC",
      version: 1,
      publicCode: `SYNTHETIC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      condition,
      state: "enrolled",
      progress: 0,
      visited: [],
      offsetMs: 0,
      lessonCompletedAt: null,
      submissions: {},
      surveys: {},
      eventCount: 0,
    };
    this.publish();
  }
  reset() {
    this.record = null;
    this.publish();
  }
  private active() {
    if (!this.record) throw new Error("Start a simulated session first.");
    if (this.record.state === "withdrawn")
      throw new Error("This simulated session was discarded.");
    return this.record;
  }
  private now() {
    return new Date(this.clock() + (this.record?.offsetMs || 0));
  }
  private window() {
    const r = this.active();
    if (!r.lessonCompletedAt)
      throw new Error("Complete the simulated lesson first.");
    return followupWindow(new Date(r.lessonCompletedAt));
  }
  advanceTo(target: "due" | "expired") {
    const r = this.active();
    if (r.state !== "waiting_60m")
      throw new Error(
        "Clock controls are available only while waiting for follow-up.",
      );
    const w = this.window();
    const desired =
      target === "due" ? w.dueAt.getTime() : w.deadlineAt.getTime() + 1;
    r.offsetMs = Math.max(r.offsetMs, desired - this.clock());
    this.publish();
  }
  async request(action: string, input?: unknown): Promise<unknown> {
    const r = this.active();
    let result: unknown = { accepted: true };
    if (action === "session") {
      const w = r.lessonCompletedAt ? this.window() : null;
      return {
        publicCode: r.publicCode,
        state: r.state,
        progress: r.progress,
        visited: r.visited,
        serverTime: this.now().toISOString(),
        followup: w
          ? {
              due_at: w.dueAt.toISOString(),
              deadline_at: w.deadlineAt.toISOString(),
              status: r.submissions.plus_60m
                ? "completed_in_window"
                : followupEligibility(this.now(), w.dueAt, w.deadlineAt) ===
                    "expired"
                  ? "expired"
                  : "not_started",
            }
          : null,
      };
    }
    if (action === "lesson") {
      if (r.state !== "lesson_active")
        throw new Error("The simulated lesson is not active.");
      return {
        condition: r.condition,
        progress: r.progress,
        visited: r.visited,
      };
    }
    if (action === "progress") {
      if (r.state !== "lesson_active")
        throw new Error("The simulated lesson is not active.");
      const { segment } = z
        .object({ segment: z.number().int().min(0).max(4) })
        .strict()
        .parse(input);
      r.progress = segment;
      r.visited = [...new Set([...r.visited, segment])];
    } else if (action === "complete") {
      if (!r.lessonCompletedAt) {
        if (
          r.state !== "lesson_active" ||
          r.visited.length !== lesson.segments.length
        )
          throw new Error(
            "Visit every chapter before completing the simulated lesson.",
          );
        r.lessonCompletedAt = this.now().toISOString();
        r.state = "lesson_complete";
      }
    } else if (action.startsWith("assessment/")) {
      const stage = z
        .enum(["pre", "immediate", "plus_60m"])
        .parse(action.split("/")[1]);
      if (r.submissions[stage])
        return input === undefined
          ? { submitted: true }
          : { accepted: true, alreadySubmitted: true };
      if (
        r.state !==
        {
          pre: "enrolled",
          immediate: "lesson_complete",
          plus_60m: "waiting_60m",
        }[stage]
      )
        throw new Error("Complete the current stage first.");
      if (stage === "plus_60m") {
        const w = this.window();
        const availability = followupEligibility(
          this.now(),
          w.dueAt,
          w.deadlineAt,
        );
        if (availability !== "eligible")
          throw new Error(
            availability === "expired"
              ? "The simulated follow-up window has expired."
              : "The one-hour follow-up is not available yet.",
          );
      }
      const questions = this.banks[stages[stage]];
      const freeRecallPrompt =
        stage === "pre"
          ? null
          : stage === "immediate"
            ? "Without looking back, describe the water cycle in your own words. Include the processes you remember and how they connect."
            : "Without replaying the lesson, explain how water can move from a lake to a cloud and back to the ground. Name the processes you recall.";
      if (input === undefined)
        return { submitted: false, questions, freeRecallPrompt };
      const data = submission.parse(input);
      const error = validateDraft(
        { answers: data.answers, freeRecall: data.freeRecall || "" },
        questions,
        stage !== "pre",
      );
      if (error) throw new Error(error.message);
      if (Object.keys(data.answers).length !== questions.length)
        throw new Error("Submit only the supplied question IDs.");
      r.submissions[stage] = { ...data, submittedAt: this.now().toISOString() };
      r.state = (
        {
          pre: "lesson_active",
          immediate: "immediate_test_complete",
          plus_60m: "60m_test_complete",
        } as const
      )[stage];
    } else if (action === "survey/F3" || action === "survey/F5") {
      const form = action.endsWith("F3") ? "F3" : "F5";
      if (r.surveys[form]) return { accepted: true, alreadySubmitted: true };
      if (
        r.state !==
        (form === "F3" ? "immediate_test_complete" : "60m_test_complete")
      )
        throw new Error("Complete the assessment first.");
      if (form === "F3") {
        r.surveys.F3 = f3Schema.parse(input);
        r.state = "waiting_60m";
      } else {
        r.surveys.F5 = f5Schema.parse(input);
        r.state = "finished";
      }
    } else if (action === "events") {
      r.eventCount += eventBatchSchema.parse(input).length;
    } else if (action === "withdraw") {
      r.state = "withdrawn";
      result = { withdrawn: true };
    } else
      throw new Error(
        "This action is not supported by the browser simulation.",
      );
    this.publish();
    return result;
  }
}
