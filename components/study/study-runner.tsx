"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WaterDiagram } from "@/components/learning/water-diagram";
import { lesson, type Condition } from "@/lib/content/lesson";
import { f3Items } from "@/lib/assessments/surveys";
import { EventQueue } from "@/lib/telemetry/client-queue";
import type { StudyState } from "@/lib/study/lifecycle";
type Snapshot = {
  publicCode: string;
  state: StudyState;
  progress: number;
  visited: number[];
  followup: { due_at: string; deadline_at: string; status: string } | null;
  serverTime: string;
};
type Form = {
  submitted: boolean;
  questions?: { id: string; stem: string; options: string[] }[];
  freeRecallPrompt?: string | null;
};
async function api(action: string, input?: unknown) {
  const response = await fetch(`/api/study/${action}`, {
    method: input === undefined ? "GET" : "POST",
    headers:
      input === undefined ? undefined : { "Content-Type": "application/json" },
    body: input === undefined ? undefined : JSON.stringify(input),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Please try again.");
  return data;
}
export function StudyRunner() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [condition, setCondition] = useState<Condition>("low");
  const [segment, setSegment] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [returnLink, setReturnLink] = useState("");
  const [withdrawn, setWithdrawn] = useState(false);
  const queue = useRef<EventQueue | null>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const reload = useCallback(async () => {
    const state: Snapshot = await api("session");
    setSnapshot(state);
    setForm(null);
    if (state.state === "lesson_active") {
      const info = await api("lesson");
      setCondition(info.condition);
      setSegment(info.progress);
      await api("progress", { segment: info.progress });
    } else {
      const stage = {
        enrolled: "pre",
        lesson_complete: "immediate",
        waiting_60m: "plus_60m",
      }[state.state as "enrolled" | "lesson_complete" | "waiting_60m"];
      if (stage && state.state !== "waiting_60m")
        setForm(await api(`assessment/${stage}`));
    }
  }, []);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = window.location.hash.slice(1);
        if (token) {
          history.replaceState(null, "", window.location.pathname);
          await api("recover", { token });
        }
        if (active) await reload();
      } catch (e) {
        if (active)
          setError(
            e instanceof Error ? e.message : "Unable to open the study.",
          );
      }
    })();
    return () => {
      active = false;
    };
  }, [reload]);
  const publicCode = snapshot?.publicCode;
  useEffect(() => {
    if (!publicCode || withdrawn) return;
    const events = new EventQueue(
      sessionStorage,
      async (batch) => {
        try {
          await api("events", batch);
          return true;
        } catch {
          return false;
        }
      },
      `visuallearn-research-events-${publicCode}`,
    );
    queue.current = events;
    const timer = setInterval(() => void events.flush(), 5000);
    const visibility = () => {
      events.add(document.hidden ? "document_hidden" : "document_visible");
      void events.flush();
    };
    const unload = () => void events.flush();
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", unload);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", unload);
      void events.flush();
    };
  }, [publicCode, withdrawn]);
  async function act(run: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await run();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function navigate(next: number) {
    audio.current?.pause();
    await act(async () => {
      queue.current?.add(
        next > segment ? "navigation_next" : "navigation_back",
        lesson.segments[segment].id as "overview",
      );
      queue.current?.add(
        "segment_exited",
        lesson.segments[segment].id as "overview",
      );
      await api("progress", { segment: next });
      setSegment(next);
      queue.current?.add(
        "segment_entered",
        lesson.segments[next].id as "overview",
      );
    });
  }
  async function submitAssessment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = new FormData(e.currentTarget);
    const stage =
      snapshot!.state === "enrolled"
        ? "pre"
        : snapshot!.state === "lesson_complete"
          ? "immediate"
          : "plus_60m";
    const answers = Object.fromEntries(
      form!.questions!.map((q) => [q.id, Number(values.get(q.id))]),
    );
    await act(async () => {
      await api(`assessment/${stage}`, {
        answers,
        ...(form?.freeRecallPrompt
          ? { freeRecall: String(values.get("freeRecall")) }
          : {}),
      });
      queue.current?.add("answer_submitted");
      await reload();
    });
  }
  async function submitSurvey(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = new FormData(e.currentTarget);
    const immediate = snapshot!.state === "immediate_test_complete";
    let answers: Record<string, unknown>;
    if (immediate) {
      answers = Object.fromEntries(
        f3Items.map(([key]) => [
          key,
          values.get(key) === "not_applicable"
            ? "not_applicable"
            : Number(values.get(key)),
        ]),
      );
      answers.mentalEffort = Number(values.get("mentalEffort"));
      answers.confusing = String(values.get("confusing") || "");
      answers.helpful = String(values.get("helpful") || "");
    } else {
      answers = {
        reviewed: values.get("reviewed"),
        sources: values.getAll("sources"),
        discussed: values.get("discussed"),
        confidence: Number(values.get("confidence")),
        recallEffort: Number(values.get("recallEffort")),
        issues: String(values.get("issues") || ""),
      };
    }
    await act(async () => {
      await api(`survey/${immediate ? "F3" : "F5"}`, answers);
      queue.current?.add("survey_submitted");
      await reload();
    });
  }
  if (withdrawn)
    return (
      <main id="main" className="container prose-page">
        <h1>You have withdrawn.</h1>
        <p>
          Future collection and return links are disabled. The researcher will
          handle previously collected data under the approved consent policy.
        </p>
        <Link href="/" className="text-link">
          Return home →
        </Link>
      </main>
    );
  const current = lesson.segments[segment];
  return (
    <main id="main" className="container page-content quiz-shell">
      <div className="eyebrow">
        STUDY SESSION {snapshot ? `/ ${snapshot.publicCode}` : ""}
      </div>
      {error && (
        <div role="alert" className="form-error">
          {error}
        </div>
      )}
      {!snapshot ? (
        <>
          <h1 className="page-title">Return to your study.</h1>
          <p>
            Open your secure return link, or return using the browser in which
            you enrolled.
          </p>
          <Link className="text-link" href="/study/enroll">
            Participation status →
          </Link>
        </>
      ) : (
        <>
          {snapshot.state === "lesson_active" ? (
            <article className="lesson-main">
              <p className="eyebrow">CHAPTER {segment + 1} OF 5</p>
              <h1>{current.heading}</h1>
              <div className="lesson-canvas">
                <WaterDiagram condition={condition} active={current.id} />
                <p className="diagram-caption">{current.diagramDescription}</p>
              </div>
              <div className="audio-bar">
                <audio
                  ref={audio}
                  key={current.id}
                  src={current.audioSrc}
                  controls
                  aria-label={`Narration: ${current.shortTitle}`}
                  onPlay={() =>
                    queue.current?.add(
                      "audio_started",
                      current.id as "overview",
                    )
                  }
                  onPause={() =>
                    queue.current?.add("audio_paused", current.id as "overview")
                  }
                  onEnded={() =>
                    queue.current?.add(
                      "audio_completed",
                      current.id as "overview",
                    )
                  }
                />
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (audio.current) {
                      audio.current.currentTime = 0;
                      void audio.current
                        .play()
                        .catch(() =>
                          setError(
                            "Audio is unavailable. Please use the complete transcript.",
                          ),
                        );
                      queue.current?.add(
                        "audio_replayed",
                        current.id as "overview",
                      );
                    }
                  }}
                >
                  Replay
                </Button>
              </div>
              <details open className="transcript">
                <summary>Read the full explanation</summary>
                <div className="transcript-content">
                  {current.body.split("\n\n").map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </details>
              <div className="key-idea">
                <p>{current.keyIdea}</p>
              </div>
              <div className="lesson-nav">
                <Button
                  variant="outline"
                  disabled={busy || segment === 0}
                  onClick={() => navigate(segment - 1)}
                >
                  Previous
                </Button>
                <span>Chapter {segment + 1} of 5</span>
                {segment < 4 ? (
                  <Button disabled={busy} onClick={() => navigate(segment + 1)}>
                    Next chapter
                  </Button>
                ) : (
                  <Button
                    disabled={busy}
                    onClick={() =>
                      act(async () => {
                        await api("complete", {});
                        queue.current?.add("lesson_completed");
                        await reload();
                      })
                    }
                  >
                    Complete lesson
                  </Button>
                )}
              </div>
            </article>
          ) : form?.questions ? (
            <>
              <h1 className="page-title">
                {snapshot.state === "enrolled"
                  ? "Before we begin."
                  : snapshot.state === "waiting_60m"
                    ? "What stayed with you?"
                    : "A moment to recall."}
              </h1>
              <p>
                No correctness feedback is released during the study. Please
                work independently.
              </p>
              <form onSubmit={submitAssessment}>
                {form.questions.map((q, i) => (
                  <fieldset key={q.id} className="quiz-card">
                    <legend>
                      {i + 1}. {q.stem}
                    </legend>
                    {q.options.map((o, index) => (
                      <label className="quiz-option" key={o}>
                        <input
                          type="radio"
                          name={q.id}
                          value={index}
                          required
                        />
                        {o}
                      </label>
                    ))}
                  </fieldset>
                ))}
                {form.freeRecallPrompt && (
                  <label className="recall-field">
                    {form.freeRecallPrompt}
                    <textarea
                      name="freeRecall"
                      required
                      minLength={20}
                      maxLength={6000}
                      rows={6}
                    />
                  </label>
                )}
                <Button type="submit" disabled={busy}>
                  Submit assessment
                </Button>
              </form>
            </>
          ) : snapshot.state === "immediate_test_complete" ||
            snapshot.state === "60m_test_complete" ? (
            <>
              <h1 className="page-title">Your experience.</h1>
              <p className="lead">
                Study-designed questionnaire. Answer based on your experience.
              </p>
              <form onSubmit={submitSurvey} className="study-form">
                {snapshot.state === "immediate_test_complete" ? (
                  <>
                    {f3Items.map(([key, text]) => (
                      <Scale
                        key={key}
                        name={key}
                        label={text}
                        na={["audio", "motion", "color"].includes(key)}
                      />
                    ))}
                    <Scale
                      name="mentalEffort"
                      label="How much mental effort did this lesson require?"
                      max={9}
                    />
                    <label>
                      Which part was confusing or distracting, if any?
                      <textarea name="confusing" maxLength={2000} />
                    </label>
                    <label>
                      What helped you understand the lesson most?
                      <textarea name="helpful" maxLength={2000} />
                    </label>
                  </>
                ) : (
                  <>
                    <label>
                      Since the lesson, did you review the topic anywhere?
                      <select name="reviewed" required defaultValue="">
                        <option value="" disabled>
                          Select one
                        </option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                        <option value="unsure">Unsure</option>
                      </select>
                    </label>
                    <fieldset>
                      <legend>If yes, what did you use?</legend>
                      {[
                        ["this_website", "This website"],
                        ["notes", "Notes"],
                        [
                          "another_website_or_video",
                          "Another website or video",
                        ],
                        ["discussion", "Discussion"],
                        ["other", "Other"],
                        ["prefer_not_to_say", "Prefer not to say"],
                      ].map(([v, label]) => (
                        <label key={v} className="check-field">
                          <input type="checkbox" name="sources" value={v} />
                          {label}
                        </label>
                      ))}
                    </fieldset>
                    <label>
                      Since the lesson, did you discuss the material with
                      anyone?
                      <select name="discussed" required>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                        <option value="prefer_not_to_say">
                          Prefer not to say
                        </option>
                      </select>
                    </label>
                    <Scale
                      name="confidence"
                      label="How confident are you in what you just remembered?"
                    />
                    <Scale
                      name="recallEffort"
                      max={9}
                      label="How mentally effortful was recalling the material just now?"
                    />
                    <label>
                      Anything affected your ability to complete this test?
                      <textarea name="issues" maxLength={2000} />
                    </label>
                  </>
                )}
                <Button disabled={busy} type="submit">
                  Submit questionnaire
                </Button>
              </form>
            </>
          ) : snapshot.state === "waiting_60m" ? (
            <>
              <h1 className="page-title">Thank you. See you in an hour.</h1>
              <p className="lead">
                You can close this page. Your next assessment is scheduled on
                the server.
              </p>
              {snapshot.followup && (
                <div className="notice">
                  Return between{" "}
                  <strong>
                    {new Date(snapshot.followup.due_at).toLocaleString()}
                  </strong>{" "}
                  and{" "}
                  <strong>
                    {new Date(snapshot.followup.deadline_at).toLocaleString()}
                  </strong>{" "}
                  (your device’s time zone). The server decides availability.
                </div>
              )}
              <Button
                disabled={busy}
                onClick={() =>
                  act(async () => {
                    setForm(await api("assessment/plus_60m"));
                  })
                }
              >
                Check follow-up availability
              </Button>
              <p className="fine-print">
                Keep your anonymous participant code: {snapshot.publicCode}
              </p>
            </>
          ) : snapshot.state === "finished" ? (
            <>
              <h1 className="page-title">Your participation is complete.</h1>
              <p className="lead">
                Thank you for contributing. Scores and explanations are withheld
                until the researcher’s approved debrief.
              </p>
            </>
          ) : null}
          {["waiting_60m", "immediate_test_complete"].includes(
            snapshot.state,
          ) && (
            <section className="return-panel">
              <h2>Save a secure return link</h2>
              <p>
                Anyone with this link can access your study session. Keep it
                private.
              </p>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() =>
                  act(async () => {
                    const result = await api("return-token", {});
                    setReturnLink(
                      `${location.origin}/study/session#${result.token}`,
                    );
                  })
                }
              >
                Create return link
              </Button>
              {returnLink && (
                <>
                  <label>
                    Private return link
                    <input
                      readOnly
                      value={returnLink}
                      onFocus={(e) => e.currentTarget.select()}
                    />
                  </label>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      act(async () => {
                        await navigator.clipboard.writeText(returnLink);
                      })
                    }
                  >
                    Copy link
                  </Button>
                </>
              )}
            </section>
          )}
          <details className="withdraw-panel">
            <summary>Withdraw from the study</summary>
            <p>
              Withdrawal stops future access and collection. Previously
              collected data is handled under the consent policy.
            </p>
            <label className="check-field">
              <input id="confirm-withdraw" type="checkbox" />I understand and
              want to withdraw.
            </label>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => {
                if (
                  (
                    document.getElementById(
                      "confirm-withdraw",
                    ) as HTMLInputElement
                  )?.checked
                )
                  void act(async () => {
                    await api("withdraw", {});
                    queue.current?.clear();
                    setWithdrawn(true);
                  });
                else
                  setError(
                    "Confirm that you want to withdraw using the checkbox.",
                  );
              }}
            >
              Confirm withdrawal
            </Button>
          </details>
        </>
      )}
    </main>
  );
}
function Scale({
  name,
  label,
  max = 5,
  na = false,
}: {
  name: string;
  label: string;
  max?: number;
  na?: boolean;
}) {
  return (
    <fieldset className="scale-field">
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
            <input type="radio" name={name} value={i + 1} required />
            {i + 1}
          </label>
        ))}
        {na && (
          <label>
            <input type="radio" name={name} value="not_applicable" />
            N/A
          </label>
        )}
      </div>
    </fieldset>
  );
}
