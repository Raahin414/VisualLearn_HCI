"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { AssessmentForm } from "./assessment-form";
import type {
  AssessmentDraft,
  PublicQuestion,
} from "@/lib/assessments/draft";
import { Button } from "@/components/ui/button";
export function PracticeQuiz({ questions }: { questions: PublicQuestion[] }) {
  const [result, setResult] = useState<{
    correct: number;
    total: number;
  } | null>(null);
  async function submit(draft: AssessmentDraft) {
    const response = await fetch("/api/demo/practice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft.answers),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(
        data.error?.message ||
          "Unable to score. Your answers are saved; please try again.",
      );
    setResult(data);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  if (result)
    return (
      <section className="result-box" role="status">
        <CheckCircle2 size={32} />
        <h2>A little more connected.</h2>
        <p>
          You answered {result.correct} of {result.total} questions correctly.
        </p>
        <p>
          Learning takes time. Return to the lesson to explore the ideas again.
        </p>
        <Button asChild>
          <Link href="/demo/water-cycle">
            Revisit the lesson <ArrowRight size={17} />
          </Link>
        </Button>
        <p>
          <Link href="/courses" className="text-link">
            Back to all lessons →
          </Link>
        </p>
      </section>
    );
  return (
    <>
      <AssessmentForm
        questions={questions}
        draftKey="visuallearn-practice-P-v1"
        submitLabel="Check my understanding"
        onSubmit={submit}
      />
      <p className="fine-print" style={{ marginTop: 16 }}>
        Practice results are not research outcomes. Drafts stay in this browser
        tab until submitted.
      </p>
    </>
  );
}
