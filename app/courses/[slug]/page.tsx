import { notFound } from "next/navigation";
import { getCourse } from "@/lib/courses/catalog";
import { CourseExperience } from "@/components/courses/course-experience";
import { transaction } from "@/lib/db/client";
import { courseGate } from "@/lib/courses/recording.server";
import type { SQL } from "@/lib/study/service";
export const dynamic = "force-dynamic";
export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const course = getCourse((await params).slug);
  if (!course) notFound();
  let consent: { version: string; text: string; contact: string } | null = null;
  if (process.env.COURSE_RECORDING_ENABLED === "true" && process.env.DATABASE_URL) {
    try { const gate = await transaction((client) => courseGate(client as unknown as SQL));
      consent = { version: gate.consent_version!, text: gate.consent_text!, contact: gate.study_contact! };
    } catch {}
  }
  return <CourseExperience course={course} consent={consent} />;
}
