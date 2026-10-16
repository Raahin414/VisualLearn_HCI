import { z } from "zod";
export const eventNames = [
  "lesson_started",
  "segment_entered",
  "segment_exited",
  "audio_started",
  "audio_paused",
  "audio_replayed",
  "audio_completed",
  "navigation_next",
  "navigation_back",
  "diagram_interacted",
  "scroll_checkpoint",
  "document_hidden",
  "document_visible",
  "quiz_started",
  "answer_submitted",
  "lesson_completed",
  "survey_submitted",
  "followup_completed",
] as const;
export const eventSchema = z
  .object({
    clientEventId: z.uuid(),
    eventType: z.enum(eventNames),
    segmentId: z
      .enum([
        "overview",
        "evaporation",
        "condensation",
        "precipitation",
        "collection",
      ])
      .optional(),
    elapsedMs: z.number().int().min(0).max(86_400_000),
    clientTime: z.iso.datetime(),
    payload: z
      .object({
        playbackPositionSeconds: z.number().min(0).max(3600).optional(),
        replayCount: z.number().int().min(0).max(10000).optional(),
        scrollPercent: z
          .union([z.literal(25), z.literal(50), z.literal(75), z.literal(100)])
          .optional(),
      })
      .strict(),
  })
  .strict();
export const eventBatchSchema = z.array(eventSchema).min(1).max(50);
export type StudyEvent = z.infer<typeof eventSchema>;
