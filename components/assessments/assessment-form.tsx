"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  emptyDraft,
  isComplete,
  readDraft,
  validateDraft,
  validateWritten,
  wordCount,
  RECALL_MAX,
  SCENARIO_MAX,
  WRITTEN_MIN,
  type Answer,
  type AssessmentDraft,
  type PublicQuestion,
} from "@/lib/assessments/draft";
import { LabelingInput, OrderingInput } from "./item-inputs";
export function AssessmentForm({
  questions,
  freeRecallPrompt,
  scenarioPrompt,
  draftKey,
  submitLabel = "Submit assessment",
  onSubmit,
}: {
  questions: PublicQuestion[];
  freeRecallPrompt?: string | null;
  scenarioPrompt?: string | null;
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
  const hasWritten = !!(freeRecallPrompt || scenarioPrompt);
  const writtenOpen = hasWritten && !draft.writtenDone;
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
  const answered = questions.filter((q) =>
    isComplete(q, draft.answers[q.id]),
  ).length;
  const setAnswer = (id: string, value: Answer) =>
    setDraft((d) => ({ ...d, answers: { ...d.answers, [id]: value } }));
  function focusField(questionId: string) {
    formRef.current
      ?.querySelector<HTMLElement>(
        questionId === "freeRecall" || questionId === "scenario"
          ? `textarea[name="${questionId}"]`
          : `[data-question="${questionId}"]`,
      )
      ?.focus();
  }
  function continueToQuestions() {
    const invalid = validateWritten(draft, !!freeRecallPrompt, !!scenarioPrompt);
    if (invalid) {
      setError(invalid.message);
      focusField(invalid.questionId);
      return;
    }
    setError("");
    setDraft((d) => ({ ...d, writtenDone: true }));
    requestAnimationFrame(() => focusField(questions[0]?.id ?? ""));
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current || !ready) return;
    if (writtenOpen) return continueToQuestions();
    const invalid = validateDraft(
      draft,
      questions,
      !!freeRecallPrompt,
      !!scenarioPrompt,
    );
    if (invalid) {
      setError(invalid.message);
      focusField(invalid.questionId);
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
  const status = ready
    ? canSave
      ? "Draft saved in this tab"
      : "Browser storage unavailable · keep this tab open"
    : "Restoring draft…";
  return (
    <form ref={formRef} onSubmit={submit} noValidate aria-busy={busy}>
      <div className="assessment-progress">
        <div>
          <strong>
            {writtenOpen
              ? "Part 1 of 2 · written answers"
              : `${answered} of ${questions.length} answered`}
          </strong>
          <span role="status">{status}</span>
        </div>
        <progress
          aria-label="Assessment progress"
          value={writtenOpen ? 0 : answered}
          max={questions.length}
        />
      </div>
      {hasWritten && (
        <section className="written-step" aria-labelledby={`${prefix}-written`}>
          <h2 id={`${prefix}-written`}>
            {writtenOpen ? "Part 1: In your own words" : "Part 1: saved"}
          </h2>
          {writtenOpen ? (
            <p className="fine-print">
              Answer these before the multiple-part questions. After you
              continue, your written answers are kept as they are.
            </p>
          ) : (
            <p className="fine-print">
              Your written answers are kept and will be submitted with part 2.
            </p>
          )}
          {freeRecallPrompt && (
            <WrittenField
              name="freeRecall"
              prompt={freeRecallPrompt}
              value={draft.freeRecall}
              max={RECALL_MAX}
              locked={!writtenOpen}
              disabled={busy || !ready}
              onChange={(v) => setDraft((d) => ({ ...d, freeRecall: v }))}
            />
          )}
          {scenarioPrompt && (
            <WrittenField
              name="scenario"
              prompt={scenarioPrompt}
              value={draft.scenario}
              max={SCENARIO_MAX}
              locked={!writtenOpen}
              disabled={busy || !ready}
              onChange={(v) => setDraft((d) => ({ ...d, scenario: v }))}
            />
          )}
        </section>
      )}
      {!writtenOpen &&
        questions.map((q, i) => (
          <fieldset disabled={busy || !ready} className="quiz-card" key={q.id}>
            <legend>
              {i + 1}. {q.stem}
            </legend>
            {q.type === "ordering" ? (
              <OrderingInput
                question={q}
                value={draft.answers[q.id] as number[] | undefined}
                disabled={busy || !ready}
                onChange={(v) => setAnswer(q.id, v)}
              />
            ) : q.type === "labeling" ? (
              <LabelingInput
                question={q}
                value={draft.answers[q.id] as number[] | undefined}
                disabled={busy || !ready}
                onChange={(v) => setAnswer(q.id, v)}
              />
            ) : (
              q.options.map((option, index) => (
                <label key={option} className="quiz-option">
                  <input
                    id={`${prefix}-${i}-${index}`}
                    type="radio"
                    data-question={index === 0 ? q.id : undefined}
                    name={q.id}
                    value={index}
                    required
                    checked={draft.answers[q.id] === index}
                    onChange={() => setAnswer(q.id, index)}
                  />
                  <span>{option}</span>
                </label>
              ))
            )}
          </fieldset>
        ))}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy || !ready}>
        {writtenOpen
          ? "Continue to part 2"
          : busy
            ? "Submitting…"
            : submitLabel}
      </Button>
    </form>
  );
}
function WrittenField({
  name,
  prompt,
  value,
  max,
  locked,
  disabled,
  onChange,
}: {
  name: "freeRecall" | "scenario";
  prompt: string;
  value: string;
  max: number;
  locked: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  if (locked)
    return (
      <div className="recall-field">
        <span>{prompt}</span>
        <p className="written-locked">{value}</p>
      </div>
    );
  return (
    <label className="recall-field">
      {prompt}
      <textarea
        name={name}
        required
        disabled={disabled}
        maxLength={max}
        rows={name === "freeRecall" ? 7 : 4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="fine-print">
        {wordCount(value).toLocaleString()} words ·{" "}
        {value.length.toLocaleString()} / {max.toLocaleString()} characters ·
        at least {WRITTEN_MIN} characters required. Spelling is not marked.
      </span>
    </label>
  );
}
