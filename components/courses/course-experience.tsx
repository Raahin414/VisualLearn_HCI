"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Course, Condition } from "@/lib/courses/catalog";
import { conditions } from "@/lib/courses/catalog";
import "./course-experience.css";

type Attempt = { course_slug: string; density: Condition; score: number | null; submitted_at: string | null };
export function CourseExperience({ course, consent }: { course: Course; consent: { version: string; text: string; contact: string } | null }) {
  const [previewDensity, setPreviewDensity] = useState<Condition>("medium");
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(4).fill(-1));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { let active = true; fetch("/api/course/session", { cache: "no-store" }).then(async (response) => {
    if (!response.ok) return; const saved: Attempt = await response.json();
    if (active && saved.course_slug === course.slug) setAttempt(saved);
  }).catch(() => {}); return () => { active = false; }; }, [course.slug]);
  const density = attempt?.density ?? previewDensity;
  async function start(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/course/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        courseSlug: course.slug, studentName: data.get("studentName"), erp: data.get("erp"),
        adult: data.get("adult") === "on", voluntary: data.get("voluntary") === "on",
        dataUse: data.get("dataUse") === "on", consentVersion: consent?.version,
      }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      const session = await fetch("/api/course/session", { cache: "no-store" });
      if (!session.ok) throw new Error("Unable to load assigned course.");
      setAttempt(await session.json()); setStep(0);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to start."); }
    finally { setBusy(false); }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/course/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setAttempt((current) => current && ({ ...current, score: result.score, submitted_at: new Date().toISOString() }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save quiz."); }
    finally { setBusy(false); }
  }
  async function withdraw() {
    if (!window.confirm("Withdraw this recorded attempt? It will no longer appear in research results.")) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/course/withdraw", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!response.ok) throw new Error("Unable to withdraw. Please try again.");
      setAttempt(null); setAnswers(Array(4).fill(-1));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to withdraw."); }
    finally { setBusy(false); }
  }
  const current = course.steps[step];
  return <main id="main" className="container page-content course-experience">
    <Link href="/courses" className="breadcrumb">← All courses</Link>
    <div className="eyebrow">{course.category.toUpperCase()} · THREE VISUAL DENSITIES</div>
    <h1 className="page-title">{course.title}</h1>
    <p className="lead">{course.summary}</p>
    {course.slug === "water-cycle" && <p><Link className="text-link" href="/demo/water-cycle">Start the full narrated Water Cycle demo →</Link></p>}
    {!attempt && consent && <section className="course-panel">
      <h2>Start a recorded course</h2>
      <p>Your density is assigned when you start. Your name and ERP are visible only to authorized researchers.</p>
      <div className="consent-copy">{consent.text.split("\n").map((line, index) => <p key={index}>{line}</p>)}</div>
      <p>Study contact: {consent.contact}</p>
      <form className="study-form" onSubmit={start}>
        <label>Full name<input name="studentName" autoComplete="name" required minLength={2} maxLength={120} /></label>
        <label>ERP / student ID<input name="erp" required minLength={2} maxLength={40} pattern="[A-Za-z0-9][A-Za-z0-9/_-]*" /></label>
        <label className="check-field"><input name="adult" type="checkbox" required />I am at least 18 years old.</label>
        <label className="check-field"><input name="voluntary" type="checkbox" required />I understand participation is voluntary.</label>
        <label className="check-field"><input name="dataUse" type="checkbox" required />I agree to the stated use of my responses and identifiers.</label>
        <button className="button button-primary" disabled={busy}>Start assigned course</button>
      </form>
    </section>}
    {!attempt && !consent && <p className="notice">Recorded participation is closed. You can preview all three visual versions below; preview quiz scores are not saved.</p>}
    {!attempt && <div className="density-picker"><label htmlFor="course-density">Preview visual density</label><select id="course-density" value={previewDensity} onChange={(e) => setPreviewDensity(e.target.value as Condition)}>{conditions.map((condition) => <option key={condition} value={condition}>{condition}</option>)}</select></div>}
    {attempt && <p className="notice">Assigned visual density: <strong>{density}</strong>. It stays the same throughout this course.</p>}
    <section className="course-panel" aria-label="Course lesson">
      <p className="eyebrow">PART {step + 1} OF {course.steps.length}</p><h2>{current.title}</h2>
      <div className={`course-visual course-visual-${density}`} aria-label={`Key concepts: ${current.labels.join(", ")}`}>
        {current.labels.map((label, index) => <div className="course-visual-node" key={label}>
          <span aria-hidden="true">{index + 1}</span><strong>{label}</strong>
          {density !== "low" && <small>Key concept</small>}
        </div>)}
      </div>
      {density !== "low" && <div className={`course-visual-detail course-visual-detail-${density}`} aria-label="Supporting visual labels">
        {Array.from({ length: density === "medium" ? 2 : 4 }, (_, index) => <div className="course-support-card" key={index}>
          <span className="course-support-shape" aria-hidden="true" />
          <strong>{current.labels[index % current.labels.length]}</strong>
        </div>)}
      </div>}
      <p>{current.body}</p>
      <div className="course-navigation"><button className="button button-outline" disabled={step === 0} onClick={() => setStep(step - 1)}>Previous</button><button className="button button-primary" disabled={step === course.steps.length - 1} onClick={() => setStep(step + 1)}>Next</button></div>
    </section>
    <section className="course-panel"><h2>Knowledge check</h2><p>The questions are identical for every density.</p>
      {attempt?.submitted_at ? <p role="status">Saved result: {attempt.score} of {course.questions.length} correct.</p> : <form onSubmit={attempt ? submit : (event) => { event.preventDefault(); setError("Preview answers are not recorded. Start a recorded course when participation opens."); }}>
        {course.questions.map((question, index) => <fieldset key={question.prompt} className="course-question"><legend>{index + 1}. {question.prompt}</legend>{question.options.map((option, choice) => <label key={option}><input type="radio" name={`question-${index}`} required checked={answers[index] === choice} onChange={() => setAnswers((prior) => prior.map((answer, position) => position === index ? choice : answer))} />{option}</label>)}</fieldset>)}
        <button className="button button-primary" disabled={busy || answers.some((answer) => answer < 0)}>{attempt ? "Submit and save score" : "Submit preview"}</button>
      </form>}
    </section>
    {attempt && <button type="button" className="button button-outline" disabled={busy} onClick={withdraw}>Withdraw this attempt</button>}
    {error && <p role="alert" className="form-error">{error}</p>}
  </main>;
}
