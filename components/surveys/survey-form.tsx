"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { f3Items, f5Sources } from "@/lib/assessments/surveys";
import {
  answeredCount,
  readSurveyDraft,
  surveyRequired,
  surveySubmission,
  validateSurveyDraft,
  type SurveyDraft,
  type SurveyFormKey,
  type SurveyValue,
} from "@/lib/assessments/survey-draft";
export function SurveyForm({
  form,
  draftKey,
  onSubmit,
}: {
  form: SurveyFormKey;
  draftKey: string;
  onSubmit: (answers: SurveyDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<SurveyDraft>({});
  const [ready, setReady] = useState(false);
  const [canSave, setCanSave] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    let saved: SurveyDraft = {};
    let available = true;
    try {
      saved = readSurveyDraft(sessionStorage.getItem(draftKey), form);
    } catch {
      available = false;
    }
    queueMicrotask(() => {
      setDraft(saved);
      setCanSave(available);
      setReady(true);
    });
  }, [draftKey, form]);
  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(draftKey, JSON.stringify(draft));
    } catch {
      queueMicrotask(() => setCanSave(false));
    }
  }, [draft, draftKey, ready]);
  const set = (key: string, value: SurveyValue) =>
    setDraft((d) => ({ ...d, [key]: value }));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current || !ready) return;
    const invalid = validateSurveyDraft(form, draft);
    if (invalid) {
      setError(invalid.message);
      formRef.current
        ?.querySelector<HTMLElement>(`[name="${invalid.field}"]`)
        ?.focus();
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      await onSubmit(surveySubmission(form, draft));
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
  const disabled = busy || !ready;
  const total = surveyRequired[form].length;
  const done = answeredCount(form, draft);
  return (
    <form
      ref={formRef}
      onSubmit={submit}
      className="study-form"
      noValidate
      aria-busy={busy}
    >
      <div className="assessment-progress">
        <div>
          <strong>
            {done} of {total} required answered
          </strong>
          <span role="status">
            {ready
              ? canSave
                ? "Draft saved in this tab"
                : "Browser storage unavailable · keep this tab open"
              : "Restoring draft…"}
          </span>
        </div>
        <progress aria-label="Questionnaire progress" value={done} max={total} />
      </div>
      {form === "F3" ? (
        <>
          {f3Items.map(([key, text]) => (
            <Scale
              key={key}
              name={key}
              label={text}
              na={["audio", "motion", "color"].includes(key)}
              value={draft[key]}
              disabled={disabled}
              onChange={(v) => set(key, v)}
            />
          ))}
          <Scale
            name="mentalEffort"
            label="How much mental effort did this lesson require?"
            max={9}
            value={draft.mentalEffort}
            disabled={disabled}
            onChange={(v) => set("mentalEffort", v)}
          />
          <TextField
            name="confusing"
            label="Which part was confusing or distracting, if any? (optional)"
            value={draft.confusing}
            disabled={disabled}
            onChange={(v) => set("confusing", v)}
          />
          <TextField
            name="helpful"
            label="What helped you understand the lesson most? (optional)"
            value={draft.helpful}
            disabled={disabled}
            onChange={(v) => set("helpful", v)}
          />
        </>
      ) : (
        <>
          <label>
            Since the lesson, did you review the topic anywhere?
            <select
              name="reviewed"
              required
              disabled={disabled}
              value={String(draft.reviewed ?? "")}
              onChange={(e) => set("reviewed", e.target.value)}
            >
              <option value="" disabled>
                Select one
              </option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="unsure">Unsure</option>
            </select>
          </label>
          <fieldset disabled={disabled || draft.reviewed !== "yes"}>
            <legend>
              If yes, what did you use? Choose all that apply.
            </legend>
            {f5Sources.map(([value, label]) => {
              const selected = Array.isArray(draft.sources)
                ? draft.sources
                : [];
              return (
                <label key={value} className="check-field">
                  <input
                    type="checkbox"
                    name="sources"
                    value={value}
                    checked={selected.includes(value)}
                    onChange={(e) =>
                      set(
                        "sources",
                        e.target.checked
                          ? [...selected, value]
                          : selected.filter((s) => s !== value),
                      )
                    }
                  />
                  {label}
                </label>
              );
            })}
          </fieldset>
          <label>
            Since the lesson, did you discuss the material with anyone?
            <select
              name="discussed"
              required
              disabled={disabled}
              value={String(draft.discussed ?? "")}
              onChange={(e) => set("discussed", e.target.value)}
            >
              <option value="" disabled>
                Select one
              </option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </label>
          <Scale
            name="confidence"
            label="How confident are you in what you just remembered?"
            value={draft.confidence}
            disabled={disabled}
            onChange={(v) => set("confidence", v)}
          />
          <Scale
            name="recallEffort"
            max={9}
            label="How mentally effortful was recalling the material just now?"
            value={draft.recallEffort}
            disabled={disabled}
            onChange={(v) => set("recallEffort", v)}
          />
          <TextField
            name="issues"
            label="Anything affected your ability to complete this test? (optional)"
            value={draft.issues}
            disabled={disabled}
            onChange={(v) => set("issues", v)}
          />
        </>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <Button disabled={disabled} type="submit">
        {busy ? "Submitting…" : "Submit questionnaire"}
      </Button>
    </form>
  );
}
function TextField({
  name,
  label,
  value,
  disabled,
  onChange,
}: {
  name: string;
  label: string;
  value: SurveyValue | undefined;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <textarea
        name={name}
        maxLength={2000}
        disabled={disabled}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function Scale({
  name,
  label,
  max = 5,
  na = false,
  value,
  disabled,
  onChange,
}: {
  name: string;
  label: string;
  max?: number;
  na?: boolean;
  value: SurveyValue | undefined;
  disabled: boolean;
  onChange: (value: number | "not_applicable") => void;
}) {
  return (
    <fieldset className="scale-field" disabled={disabled}>
      <legend>{label}</legend>
      <p>
        {max === 9
          ? "1 Very little · 9 Very much"
          : name === "confidence"
            ? "1 Not at all · 5 Extremely"
            : "1 Strongly disagree · 2 Disagree · 3 Neither · 4 Agree · 5 Strongly agree"}
      </p>
      <div>
        {Array.from({ length: max }, (_, i) => (
          <label key={i}>
            <input
              type="radio"
              name={name}
              value={i + 1}
              required
              checked={value === i + 1}
              onChange={() => onChange(i + 1)}
            />
            {i + 1}
          </label>
        ))}
        {na && (
          <label>
            <input
              type="radio"
              name={name}
              value="not_applicable"
              checked={value === "not_applicable"}
              onChange={() => onChange("not_applicable")}
            />
            N/A
          </label>
        )}
      </div>
    </fieldset>
  );
}
