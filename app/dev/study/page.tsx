import { notFound } from "next/navigation";
import { publicQuestions } from "@/lib/assessments/questions.server";
import { LocalStudyDemo } from "@/components/demo/local-study-demo";
import { demoExperiments } from "@/lib/study/presentation.server";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Local study simulation",
  robots: { index: false, follow: false },
};
export default function LocalDemo() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <LocalStudyDemo
      experiments={demoExperiments()}
      banks={{
        A: publicQuestions("A"),
        B: publicQuestions("B"),
        C: publicQuestions("C"),
      }}
    />
  );
}
