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
  "accommodation_used",
  "presentation_exposed",
  "active_time",
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
        accommodation: z.literal("transcript").optional(),
        groupIndex: z.number().int().min(0).max(4).optional(),
        activeMs: z.number().int().min(1).max(30000).optional(),
      })
      .strict(),
  })
  .strict()
  .superRefine((event, ctx) => {
    const exposure =
      event.eventType === "presentation_exposed" ||
      event.eventType === "active_time";
    if (
      exposure &&
      (!event.segmentId ||
        event.payload.groupIndex === undefined ||
        (event.eventType === "active_time" && !event.payload.activeMs))
    )
      ctx.addIssue({
        code: "custom",
        message: "Exposure events require a group, concept and valid interval.",
        path: ["payload"],
      });
    if (
      (!exposure &&
        (event.payload.groupIndex !== undefined ||
          event.payload.activeMs !== undefined)) ||
      (event.eventType === "presentation_exposed" &&
        event.payload.activeMs !== undefined)
    )
      ctx.addIssue({
        code: "custom",
        message: "Exposure fields require the matching event.",
        path: ["payload"],
      });
    if (
      event.eventType === "accommodation_used" &&
      (!event.segmentId || event.payload.accommodation !== "transcript")
    )
      ctx.addIssue({
        code: "custom",
        message: "Transcript accommodation requires a chapter.",
        path: ["payload"],
      });
    if (event.eventType !== "accommodation_used" && event.payload.accommodation)
      ctx.addIssue({
        code: "custom",
        message: "Accommodation payload requires the matching event.",
        path: ["payload"],
      });
  });
export const eventBatchSchema = z.array(eventSchema).min(1).max(50);
export type StudyEvent = z.infer<typeof eventSchema>;
