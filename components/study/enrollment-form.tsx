"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
export function EnrollmentForm({
  consentVersion,
  consentText,
  studyContact,
  experimentId = "E1",
}: {
  consentVersion: string;
  consentText: string;
  studyContact: string;
  experimentId?: "E1";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const enrollmentKey = useRef<string | null>(null);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const storageKey =
      experimentId === "E1"
        ? "visuallearn-enrollment-key"
        : `visuallearn-enrollment-key:${experimentId}`;
    let key = enrollmentKey.current;
    try {
      key ??= sessionStorage.getItem(storageKey);
    } catch {}
    if (!key) {
      key = crypto.randomUUID();
    }
    enrollmentKey.current = key;
    try {
      sessionStorage.setItem(storageKey, key);
    } catch {}
    try {
      const response = await fetch("/api/study/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": key },
        body: JSON.stringify({
          ageBand: form.get("ageBand"),
          language: form.get("language"),
          languageComfort: Number(form.get("languageComfort")),
          familiarity: Number(form.get("familiarity")),
          voluntary: form.get("voluntary") === "on",
          dataUse: form.get("dataUse") === "on",
          contactViewed: form.get("contactViewed") === "on",
          consentVersion,
          experimentId,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error.message);
      router.push("/study/session");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to enroll. Please try again.",
      );
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="study-form">
      <div className="consent-copy">
        {consentText.split("\n").map((text, i) => (
          <p key={i}>{text}</p>
        ))}
      </div>
      <p>
        <strong>Study contact:</strong> {studyContact}
      </p>
      <p className="fine-print">Consent version: {consentVersion}</p>
      <label>
        Age band
        <select name="ageBand" required defaultValue="">
          <option value="" disabled>
            Select your age band
          </option>
          <option value="9-12">9–12 · participation unavailable</option>
          <option value="13-17">13–17 · participation unavailable</option>
          <option value="18-30">18–30</option>
        </select>
      </label>
      <label>
        Primary learning language
        <select name="language" required>
          <option>English</option>
          <option>Urdu</option>
          <option>Other</option>
          <option>Prefer not to say</option>
        </select>
      </label>
      <label>
        How comfortable are you learning in English?
        <select name="languageComfort" required defaultValue="">
          <option value="" disabled>
            Select one
          </option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
              {n === 1
                ? " · Very uncomfortable"
                : n === 5
                  ? " · Very comfortable"
                  : ""}
            </option>
          ))}
        </select>
      </label>
      <label>
        How familiar are you with the water cycle?
        <select name="familiarity" required defaultValue="">
          <option value="" disabled>
            Select one
          </option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
              {n === 1
                ? " · Never heard of it"
                : n === 5
                  ? " · Know it very well"
                  : ""}
            </option>
          ))}
        </select>
      </label>
      {[
        [
          "voluntary",
          "I understand participation is voluntary and I may withdraw.",
        ],
        [
          "dataUse",
          "I agree to the data use and interaction logging described above.",
        ],
        ["contactViewed", "I have read the study contact information."],
      ].map(([name, label]) => (
        <label key={name} className="check-field">
          <input type="checkbox" name={name} required />
          {label}
        </label>
      ))}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : "Consent and begin baseline assessment"}
      </Button>
    </form>
  );
}
