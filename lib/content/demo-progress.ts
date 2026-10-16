import { z } from "zod";
import { conditions, lesson } from "./lesson";
const index = z
  .number()
  .int()
  .min(0)
  .max(lesson.segments.length - 1);
export const demoProgressSchema = z
  .object({
    segment: index,
    condition: z.enum(conditions),
    visited: z.array(index).max(50),
  })
  .strict();
export function readDemoProgress(raw: string | null) {
  try {
    const p = demoProgressSchema.parse(JSON.parse(raw || "null"));
    return { ...p, visited: [...new Set([...p.visited, p.segment])] };
  } catch {
    return { segment: 0, condition: "medium" as const, visited: [0] };
  }
}
