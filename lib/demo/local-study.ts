import { z } from "zod";
import { conditions, lesson, type Condition } from "@/lib/content/lesson";
import {
  followupEligibility,
  followupWindow,
  sevenDayWindow,
} from "@/lib/study/lifecycle";
import {
  f3Schema,
  f3ModalitySchema,
  f5Schema,
} from "@/lib/assessments/surveys";
import {
  presentationSchema,
  visibleSegments,
  type DemoExperiment,
} from "@/lib/study/presentation";
import { eventBatchSchema } from "@/lib/telemetry/schema";
import { validateDraft, type PublicQuestion } from "@/lib/assessments/draft";
import { sevenDayPrompts } from "@/lib/assessments/seven-day";
import { writtenPrompts } from "@/lib/assessments/written-prompts";
export const LOCAL_DEMO_KEY = "visuallearn-SYNTHETIC-local-study-v3";
const LEGACY_DEMO_KEY = "visuallearn-SYNTHETIC-local-study-v2";
export const fallbackExperiments: DemoExperiment[] = [
  {
    id: "E1",
    name: "Visual density",
    arms: conditions.map((key) => ({
      key,
      label: key,
      presentation: {
        kind: "density",
        version: "SYNTHETIC-density",
        density: key,
      },
    })),
  },
];
const submission = z
  .object({
    answers: z.record(
      z.string(),
      z.union([
        z.number().int().min(0).max(7),
        z.array(z.number().int().min(0).max(7)).max(8),
      ]),
    ),
    freeRecall: z.string().trim().max(6000).optional(),
    scenario: z.string().trim().max(3000).optional(),
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
  "waiting_7d",
  "7d_test_complete",
  "finished",
  "withdrawn",
] as const;
const recordSchema = z
  .object({
    kind: z.literal("SYNTHETIC"),
    version: z.literal(3),
    sevenDay: z.boolean().default(false),
    publicCode: z.string().startsWith("SYNTHETIC-"),
    experimentId: z.enum(["E1", "E2", "E3"]),
    armKey: z.string().min(1).max(40),
    condition: z.enum(conditions).nullable(),
    presentation: presentationSchema,
    transcriptSegments: z.array(z.string().max(40)).max(5),
    state: z.enum(states),
    progress: z.number().int().min(0).max(4),
    visited: z.array(z.number().int().min(0).max(4)).max(5),
    offsetMs: z
      .number()
      .min(0)
      .max(9 * 24 * 60 * 60_000),
    lessonCompletedAt: z.iso.datetime().nullable(),
    submissions: z.object({
      pre: storedSubmission.optional(),
      immediate: storedSubmission.optional(),
      plus_60m: storedSubmission.optional(),
      plus_7d: storedSubmission.optional(),
    }),
    surveys: z.object({
      F3: f3ModalitySchema.optional(),
      F5: f5Schema.optional(),
      F6: f5Schema.optional(),
    }),
    eventCount: z.number().int().nonnegative(),
    activeTimeMs: z.number().int().nonnegative().default(0),
    exposures: z.number().int().nonnegative().default(0),
    seenEventIds: z.array(z.uuid()).max(2000).default([]),
  })
  .strict();
export type LocalStudyRecord = z.infer<typeof recordSchema>;
export type DemoBanks = Record<"A" | "B" | "C", PublicQuestion[]> & {
  D?: PublicQuestion[];
};
const stages = {
  pre: "A",
  immediate: "B",
  plus_60m: "C",
  plus_7d: "D",
} as const;
function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
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
    private experiments: DemoExperiment[] = fallbackExperiments,
  ) {
    let raw: string | null = null;
    try {
      raw = storage.getItem(LOCAL_DEMO_KEY) ?? storage.getItem(LEGACY_DEMO_KEY);
    } catch {
      this.storageAvailable = false;
    }
    // Preserve valid v2 E1 fixtures; this is browser SYNTHETIC data only.
    let candidate = raw ? safeJson(raw) : null;
    if (
      candidate &&
      typeof candidate === "object" &&
      "version" in candidate &&
      candidate.version === 2 &&
      "condition" in candidate
    ) {
      const condition = z.enum(conditions).safeParse(candidate.condition);
      if (condition.success)
        candidate = {
          ...candidate,
          version: 3,
          experimentId: "E1",
          armKey: condition.data,
          presentation: {
            kind: "density",
            version: "SYNTHETIC-density",
            density: condition.data,
          },
          transcriptSegments: [],
        };
    }
    const parsed = candidate ? recordSchema.safeParse(candidate) : null;
    if (parsed?.success) this.record = parsed.data;
    else if (parsed)
      try {
        storage.removeItem(LOCAL_DEMO_KEY);
      } catch {}
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
    this.startExperiment("E1", condition);
  }
  startExperiment(
    experimentId: "E1" | "E2" | "E3",
    armKey: string,
    sevenDay = false,
  ) {
    const definition = this.experiments.find((e) => e.id === experimentId);
    const arm = definition?.arms.find((a) => a.key === armKey);
    if (!arm) throw new Error("Choose a registered simulated presentation.");
    if (this.record)
      throw new Error("Reset the simulated session before starting another.");
    this.record = {
      kind: "SYNTHETIC",
      version: 3,
      sevenDay,
      publicCode: `SYNTHETIC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      experimentId,
      armKey,
      condition:
        arm.presentation.kind === "density" ? arm.presentation.density : null,
      presentation: presentationSchema.parse(arm.presentation),
      transcriptSegments: [],
      state: "enrolled",
      progress: 0,
      visited: [],
      offsetMs: 0,
      lessonCompletedAt: null,
      submissions: {},
      surveys: {},
      eventCount: 0,
      activeTimeMs: 0,
      exposures: 0,
      seenEventIds: [],
    };
    this.publish();
  }
  reset() {
    this.record = null;
    this.publish();
    try {
      this.storage.removeItem(LEGACY_DEMO_KEY);
    } catch {}
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
  private window(sevenDay = false) {
    const r = this.active();
    if (!r.lessonCompletedAt)
      throw new Error("Complete the simulated lesson first.");
    return sevenDay
      ? sevenDayWindow(new Date(r.lessonCompletedAt), 60)
      : followupWindow(new Date(r.lessonCompletedAt));
  }
  advanceTo(target: "due" | "expired") {
    const r = this.active();
    if (r.state !== "waiting_60m" && r.state !== "waiting_7d")
      throw new Error(
        "Clock controls are available only while waiting for follow-up.",
      );
    const w = this.window(r.state === "waiting_7d");
    const desired =
      target === "due" ? w.dueAt.getTime() : w.deadlineAt.getTime() + 1;
    r.offsetMs = Math.max(r.offsetMs, desired - this.clock());
    this.publish();
  }
  async request(action: string, input?: unknown): Promise<unknown> {
    const r = this.active();
    let result: unknown = { accepted: true };
    if (action === "session") {
      const w = r.lessonCompletedAt
        ? this.window(
            r.state === "waiting_7d" || r.state === "7d_test_complete",
          )
        : null;
      return {
        publicCode: r.publicCode,
        sevenDay: r.sevenDay,
        experimentId: r.experimentId,
        state: r.state,
        progress: r.progress,
        visited: r.visited,
        serverTime: this.now().toISOString(),
        followup: w
          ? {
              due_at: w.dueAt.toISOString(),
              deadline_at: w.deadlineAt.toISOString(),
              status: r.submissions[
                r.state === "waiting_7d" || r.state === "7d_test_complete"
                  ? "plus_7d"
                  : "plus_60m"
              ]
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
        presentation: r.presentation,
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
      r.visited = [
        ...new Set([...r.visited, ...visibleSegments(r.presentation, segment)]),
      ];
      result = { saved: true, visited: r.visited };
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
        .enum(["pre", "immediate", "plus_60m", "plus_7d"])
        .parse(action.split("/")[1]);
      if (stage === "plus_7d" && !r.sevenDay)
        throw new Error("Optional seven-day simulation is disabled.");
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
          plus_7d: "waiting_7d",
        }[stage]
      )
        throw new Error("Complete the current stage first.");
      if (stage === "plus_60m" || stage === "plus_7d") {
        const w = this.window(stage === "plus_7d");
        const availability = followupEligibility(
          this.now(),
          w.dueAt,
          w.deadlineAt,
        );
        if (availability !== "eligible")
          throw new Error(
            availability === "expired"
              ? "The simulated follow-up window has expired."
              : `The ${stage === "plus_7d" ? "seven-day" : "one-hour"} follow-up is not available yet.`,
          );
      }
      const questions = this.banks[stages[stage]];
      if (!questions) throw new Error("The simulated form is unavailable.");
      const { freeRecall: freeRecallPrompt, scenario: scenarioPrompt } =
        stage === "plus_7d" ? sevenDayPrompts : writtenPrompts[stage];
      if (input === undefined)
        return {
          submitted: false,
          questions,
          freeRecallPrompt,
          scenarioPrompt,
        };
      const data = submission.parse(input);
      const error = validateDraft(
        {
          answers: data.answers,
          freeRecall: data.freeRecall || "",
          scenario: data.scenario || "",
        },
        questions,
        stage !== "pre",
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
          plus_7d: "7d_test_complete",
        } as const
      )[stage];
    } else if (
      action === "survey/F3" ||
      action === "survey/F5" ||
      action === "survey/F6"
    ) {
      const form = action.endsWith("F3")
        ? "F3"
        : action.endsWith("F6")
          ? "F6"
          : "F5";
      if (r.surveys[form]) return { accepted: true, alreadySubmitted: true };
      if (
        r.state !==
        (form === "F3"
          ? "immediate_test_complete"
          : form === "F5"
            ? "60m_test_complete"
            : "7d_test_complete")
      )
        throw new Error("Complete the assessment first.");
      if (form === "F3") {
        r.surveys.F3 = (
          r.experimentId === "E2" ? f3ModalitySchema : f3Schema
        ).parse(input);
        r.state = "waiting_60m";
      } else {
        r.surveys[form] = f5Schema.parse(input);
        r.state = form === "F5" && r.sevenDay ? "waiting_7d" : "finished";
      }
    } else if (action === "events") {
      const events = eventBatchSchema.parse(input);
      for (const event of events)
        if (event.eventType === "accommodation_used") {
          if (
            r.presentation.kind !== "modality" ||
            r.presentation.text ||
            event.payload.accommodation !== "transcript" ||
            !event.segmentId
          )
            throw new Error("Invalid simulated accommodation event.");
          r.transcriptSegments = [
            ...new Set([...r.transcriptSegments, event.segmentId]),
          ];
        }
      for (const event of events) {
        if (r.seenEventIds.includes(event.clientEventId)) continue;
        if (
          event.eventType === "presentation_exposed" ||
          event.eventType === "active_time"
        ) {
          const segment = lesson.segments.findIndex(
            (segment) => segment.id === event.segmentId,
          );
          if (
            r.presentation.kind !== "chunking" ||
            segment < 0 ||
            event.payload.groupIndex !==
              r.presentation.groups.findIndex((group) =>
                group.includes(segment),
              )
          )
            throw new Error("Invalid simulated exposure event.");
          if (event.eventType === "presentation_exposed") r.exposures++;
          else r.activeTimeMs += event.payload.activeMs!;
        }
        r.seenEventIds = [...r.seenEventIds, event.clientEventId].slice(-2000);
        r.eventCount++;
      }
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
