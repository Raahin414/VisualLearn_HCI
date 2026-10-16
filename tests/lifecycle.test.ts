import { describe, it, expect, vi, afterEach } from "vitest";
import {
  canTransition,
  enrollmentSchema,
  followupEligibility,
  followupWindow,
} from "@/lib/study/lifecycle";
import {
  newReturnToken,
  hashToken,
  signSession,
  verifySession,
} from "@/lib/security/tokens";
import { eventBatchSchema, eventSchema } from "@/lib/telemetry/schema";
import { f3Schema, f5Schema } from "@/lib/assessments/surveys";
import { canRecruit, experiments } from "@/lib/study/registry";
describe("Server timing and lifecycle", () => {
  afterEach(() => vi.useRealTimers());
  it("unlocks at exactly 60 minutes, then expires after the configured window", () => {
    vi.useFakeTimers();
    const completion = new Date("2026-10-16T10:00:00Z");
    vi.setSystemTime(completion);
    const { dueAt, deadlineAt } = followupWindow(completion);
    expect(dueAt.toISOString()).toBe("2026-10-16T11:00:00.000Z");
    vi.advanceTimersByTime(30 * 60_000);
    expect(followupEligibility(new Date(), dueAt, deadlineAt)).toBe(
      "not_yet_available",
    );
    vi.advanceTimersByTime(30 * 60_000);
    expect(followupEligibility(new Date(), dueAt, deadlineAt)).toBe("eligible");
    vi.advanceTimersByTime(30 * 60_000);
    expect(followupEligibility(new Date(), dueAt, deadlineAt)).toBe("eligible");
    vi.advanceTimersByTime(1);
    expect(followupEligibility(new Date(), dueAt, deadlineAt)).toBe("expired");
    expect(
      followupEligibility(new Date(), dueAt, deadlineAt, false, true),
    ).toBe("withdrawn");
  });
  it("rejects skipped and withdrawn transitions", () => {
    expect(canTransition("enrolled", "lesson_complete")).toBe(false);
    expect(canTransition("lesson_active", "lesson_complete")).toBe(true);
    expect(canTransition("withdrawn", "lesson_active")).toBe(false);
  });
  it("requires explicit consent and rejects unrecognized fields", () => {
    expect(enrollmentSchema.safeParse({ ageBand: "18-30" }).success).toBe(
      false,
    );
    expect(
      enrollmentSchema.safeParse({ ageBand: "100", voluntary: true }).success,
    ).toBe(false);
  });
  it("keeps every experiment draft and unable to recruit", () => {
    expect(experiments).toHaveLength(8);
    expect(experiments.every((e) => !canRecruit(e.id))).toBe(true);
  });
});
describe("Security contracts", () => {
  const secret = "test-secret-that-has-at-least-32-bytes";
  const id = "12345678-1234-1234-1234-123456789abc";
  it("verifies genuine sessions and rejects tampering and expiry", () => {
    const cookie = signSession(id, secret, 1000);
    expect(verifySession(cookie, secret, 1001)).toBe(id);
    expect(verifySession(cookie + "x", secret, 1001)).toBeNull();
    expect(verifySession(cookie, secret, 9 * 24 * 60 * 60_000)).toBeNull();
    expect(() => signSession(id, "weak")).toThrow();
  });
  it("creates high entropy return secrets and stores only their hashes", () => {
    const a = newReturnToken(),
      b = newReturnToken();
    expect(a.token).not.toBe(b.token);
    expect(a.token.length).toBeGreaterThan(40);
    expect(a.hash).toBe(hashToken(a.token));
    expect(a.hash).not.toContain(a.token);
  });
  it("rejects telemetry PII, arbitrary event types and oversized batches", () => {
    const valid = {
      clientEventId: crypto.randomUUID(),
      eventType: "audio_paused",
      elapsedMs: 100,
      clientTime: new Date().toISOString(),
      payload: { playbackPositionSeconds: 3 },
    };
    expect(eventSchema.safeParse(valid).success).toBe(true);
    expect(
      eventSchema.safeParse({ ...valid, payload: { email: "x@example.com" } })
        .success,
    ).toBe(false);
    expect(
      eventSchema.safeParse({ ...valid, eventType: "gaze_detected" }).success,
    ).toBe(false);
    expect(eventBatchSchema.safeParse(Array(51).fill(valid)).success).toBe(
      false,
    );
  });
  it("validates exploratory questionnaires without conflating scales", () => {
    const data = {
      clarity: 4,
      overload: 2,
      support: 4,
      distraction: 2,
      pacing: 4,
      audio: "not_applicable",
      motion: "not_applicable",
      color: 3,
      acceptability: 4,
      mentalEffort: 9,
    };
    expect(f3Schema.safeParse(data).success).toBe(true);
    expect(f3Schema.safeParse({ ...data, mentalEffort: 10 }).success).toBe(
      false,
    );
    expect(
      f5Schema.safeParse({
        reviewed: "yes",
        sources: [],
        discussed: "no",
        confidence: 3,
        recallEffort: 5,
      }).success,
    ).toBe(false);
  });
});
