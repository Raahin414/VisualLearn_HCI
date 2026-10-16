"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  emptyDraft,
  readDraft,
  validateDraft,
  type AssessmentDraft,
  type PublicQuestion,
} from "@/lib/assessments/draft";
export function AssessmentForm({
  questions,
  freeRecallPrompt,
  draftKey,
  submitLabel = "Submit assessment",
  onSubmit,
}: {
  questions: PublicQuestion[];
  freeRecallPrompt?: string | null;
  draftKey: string;
  submitLabel?: string;
  onSubmit: (draft: AssessmentDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<AssessmentDraft>(emptyDraft);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [canSave, setCanSave] = useState(true);
  const submitting = useRef(false);
  const prefix = useId();
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    let saved = emptyDraft();
    let available = true;
    try {
      saved = readDraft(sessionStorage.getItem(draftKey), questions);
    } catch {
      available = false;
    }
    queueMicrotask(() => {
      setDraft(saved);
      setCanSave(available);
      setReady(true);
    });
  }, [draftKey, questions]);
  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(draftKey, JSON.stringify(draft));
    } catch {
      queueMicrotask(() => setCanSave(false));
    }
  }, [draft, draftKey, ready]);
  const answered = questions.filter(
    (q) => draft.answers[q.id] !== undefined,
  ).length;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current || !ready) return;
    const invalid = validateDraft(draft, questions, !!freeRecallPrompt);
    if (invalid) {
      setError(invalid.message);
      formRef.current
        ?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
          invalid.questionId === "freeRecall"
            ? "textarea"
            : `input[data-question="${questions.findIndex((q) => q.id === invalid.questionId)}"]`,
        )
        ?.focus();
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      await onSubmit(draft);
      try {
        sessionStorage.removeItem(draftKey);
      } catch {}
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Submission failed. Your answers are still here; please try again.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <form ref={formRef} onSubmit={submit} noValidate aria-busy={busy}>
      <div className="assessment-progress">
        <div>
          <strong>
            {answered} of {questions.length} answered
          </strong>
          <span role="status">
            {ready
              ? canSave
                ? "Draft saved in this tab"
                : "Browser storage unavailable · keep this tab open"
              : "Restoring draft…"}
          </span>
        </div>
        <progress
          aria-label="Assessment progress"
          value={answered}
          max={questions.length}
        />
      </div>
      {questions.map((q, i) => (
        <fieldset disabled={busy || !ready} className="quiz-card" key={q.id}>
          <legend>
            {i + 1}. {q.stem}
          </legend>
          {q.options.map((option, index) => (
            <label key={option} className="quiz-option">
              <input
                id={`${prefix}-${i}-${index}`}
                type="radio"
                data-question={i}
                name={q.id}
                value={index}
                required
                checked={draft.answers[q.id] === index}
                onChange={() =>
                  setDraft((d) => ({
                    ...d,
                    answers: { ...d.answers, [q.id]: index },
                  }))
                }
              />
              <span>{option}</span>
            </label>
          ))}
        </fieldset>
      ))}
      {freeRecallPrompt && (
        <label className="recall-field">
          {freeRecallPrompt}
          <textarea
            name="freeRecall"
            required
            disabled={busy || !ready}
            maxLength={6000}
            rows={6}
            value={draft.freeRecall}
            onChange={(e) =>
              setDraft((d) => ({ ...d, freeRecall: e.target.value }))
            }
          />
          <span className="fine-print">
            {draft.freeRecall.length.toLocaleString()} / 6,000 characters · at
            least 20 required
          </span>
        </label>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy || !ready}>
        {busy ? "Submitting…" : submitLabel}
      </Button>
    </form>
  );
}
