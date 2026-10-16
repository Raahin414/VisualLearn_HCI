"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
type PublicQuestion = { id: string; stem: string; options: string[] };
export function PracticeQuiz({ questions }: { questions: PublicQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{
    correct: number;
    total: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/demo/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error?.message || "Unable to score. Please try again.",
        );
      setResult(data);
      window.scrollTo({ top: 0, behavior: "instant" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
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
    <form onSubmit={submit}>
      {questions.map((q, i) => (
        <fieldset className="quiz-card" key={q.id}>
          <legend>
            {i + 1}. {q.stem}
          </legend>
          {q.options.map((option, index) => (
            <label key={option} className="quiz-option">
              <input
                type="radio"
                name={q.id}
                value={index}
                required
                checked={answers[q.id] === index}
                onChange={() => setAnswers((a) => ({ ...a, [q.id]: index }))}
              />
              <span>{option}</span>
            </label>
          ))}
        </fieldset>
      ))}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy}>
        {busy ? "Checking…" : "Check my understanding"}
        <ArrowRight size={17} />
      </Button>
      <p className="fine-print" style={{ marginTop: 16 }}>
        Practice results are not research outcomes.
      </p>
    </form>
  );
}
