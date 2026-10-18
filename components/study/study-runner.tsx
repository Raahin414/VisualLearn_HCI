"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AssessmentForm } from "@/components/assessments/assessment-form";
import type {
  AssessmentDraft,
  PublicQuestion,
} from "@/lib/assessments/draft";
import { SurveyForm } from "@/components/surveys/survey-form";
import type { SurveyDraft } from "@/lib/assessments/survey-draft";
import { NarrationPlayer } from "@/components/learning/narration-player";
import { FollowupStatus } from "./followup-status";
import { safeSessionStorage } from "@/lib/browser-storage";
import { Button } from "@/components/ui/button";
import { WaterDiagram } from "@/components/learning/water-diagram";
import { lesson, type Condition } from "@/lib/content/lesson";
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
  questions?: PublicQuestion[];
  freeRecallPrompt?: string | null;
  scenarioPrompt?: string | null;
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
export type StudyTransport = typeof api;
// The return token is removed from the URL once read, so it is used only once.
let pendingRecovery: Promise<unknown> | null = null;
export function StudyRunner({
  transport = api,
  localDemo = false,
}: {
  transport?: StudyTransport;
  localDemo?: boolean;
}) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [condition, setCondition] = useState<Condition>("low");
  const [segment, setSegment] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [returnLink, setReturnLink] = useState("");
  const [withdrawn, setWithdrawn] = useState(false);
  const queue = useRef<EventQueue | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const reload = useCallback(async () => {
    const state: Snapshot = await transport("session");
    setSnapshot(state);
    setForm(null);
    if (state.state === "lesson_active") {
      const info = await transport("lesson");
      setCondition(info.condition);
      setSegment(info.progress);
      await transport("progress", { segment: info.progress });
      setSnapshot({
        ...state,
        visited: [...new Set([...state.visited, info.progress])],
      });
    } else {
      const stage = {
        enrolled: "pre",
        lesson_complete: "immediate",
        waiting_60m: "plus_60m",
      }[state.state as "enrolled" | "lesson_complete" | "waiting_60m"];
      if (stage && state.state !== "waiting_60m")
        setForm(await transport(`assessment/${stage}`));
    }
  }, [transport]);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = window.location.hash.slice(1);
        if (token) {
          history.replaceState(null, "", window.location.pathname);
          pendingRecovery = transport("recover", { token }).finally(() => {
            pendingRecovery = null;
          });
        }
        // A re-run effect (e.g. React strict mode) must wait for the same
        // recovery instead of loading the session before its cookie exists.
        if (pendingRecovery) await pendingRecovery;
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
  }, [reload, transport]);
  const publicCode = snapshot?.publicCode;
  useEffect(() => {
    if (!publicCode || withdrawn) return;
    const events = new EventQueue(
      safeSessionStorage(),
      async (batch) => {
        try {
          await transport("events", batch);
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
  }, [publicCode, withdrawn, transport]);
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
    await act(async () => {
      queue.current?.add(
        next > segment ? "navigation_next" : "navigation_back",
        lesson.segments[segment].id as "overview",
      );
      queue.current?.add(
        "segment_exited",
        lesson.segments[segment].id as "overview",
      );
      await transport("progress", { segment: next });
      setSnapshot((p) =>
        p
          ? {
              ...p,
              progress: next,
              visited: [...new Set([...p.visited, next])],
            }
          : p,
      );
      setSegment(next);
      requestAnimationFrame(() => heading.current?.focus());
      queue.current?.add(
        "segment_entered",
        lesson.segments[next].id as "overview",
      );
    });
  }
  async function submitAssessment(draft: AssessmentDraft) {
    const stage =
      snapshot!.state === "enrolled"
        ? "pre"
        : snapshot!.state === "lesson_complete"
          ? "immediate"
          : "plus_60m";
    setBusy(true);
    try {
      await transport(`assessment/${stage}`, {
        answers: draft.answers,
        ...(form?.freeRecallPrompt
          ? { freeRecall: draft.freeRecall.trim() }
          : {}),
        ...(form?.scenarioPrompt ? { scenario: draft.scenario.trim() } : {}),
      });
      queue.current?.add("answer_submitted");
      await reload();
    } finally {
      setBusy(false);
    }
  }
  async function submitSurvey(answers: SurveyDraft) {
    const form = snapshot!.state === "immediate_test_complete" ? "F3" : "F5";
    setBusy(true);
    try {
      await transport(`survey/${form}`, answers);
      queue.current?.add("survey_submitted");
      await reload();
    } finally {
      setBusy(false);
    }
  }
  const Main = localDemo ? "section" : "main";
  if (withdrawn)
    return (
      <Main
        id={localDemo ? undefined : "main"}
        className="container prose-page"
      >
        <h1>
          {localDemo ? "Simulated session discarded." : "You have withdrawn."}
        </h1>
        <p>
          {localDemo
            ? "Only simulated browser data was involved. Use the demo controls to start again."
            : "Future collection and return links are disabled. The researcher will handle previously collected data under the approved consent policy."}
        </p>
        <Link href="/" className="text-link">
          Return home →
        </Link>
      </Main>
    );
  const current = lesson.segments[segment];
  return (
    <Main
      id={localDemo ? undefined : "main"}
      className="container page-content quiz-shell"
    >
      <div className="eyebrow">
        {localDemo ? "SIMULATED SESSION" : "STUDY SESSION"}{" "}
        {snapshot ? `/ ${snapshot.publicCode}` : ""}
      </div>
      {error && (
        <div role="alert" className="form-error">
          {error}
          <Button variant="ghost" disabled={busy} onClick={() => act(reload)}>
            Retry saved session
          </Button>
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
              <h1 ref={heading} tabIndex={-1}>
                {current.heading}
              </h1>
              <progress
                className="study-chapter-progress"
                aria-label="Lesson chapters visited"
                value={snapshot.visited.length}
                max={5}
              />
              <div className="lesson-canvas">
                <WaterDiagram condition={condition} active={current.id} />
                <p className="diagram-caption">{current.diagramDescription}</p>
              </div>
              <NarrationPlayer
                key={current.id}
                src={current.audioSrc}
                title={current.shortTitle}
                pauseWhen={busy}
                onEvent={(event, position) =>
                  queue.current?.add(event, current.id as "overview", {
                    playbackPositionSeconds: position,
                  })
                }
              />
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
                        await transport("complete", {});
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
              <AssessmentForm
                key={snapshot.state}
                questions={form.questions}
                freeRecallPrompt={form.freeRecallPrompt}
                scenarioPrompt={form.scenarioPrompt}
                draftKey={`visuallearn-${localDemo ? "simulation" : "study"}-${snapshot.publicCode}-${snapshot.state}-v2`}
                onSubmit={submitAssessment}
              />
            </>
          ) : snapshot.state === "immediate_test_complete" ||
            snapshot.state === "60m_test_complete" ? (
            <>
              <h1 className="page-title">Your experience.</h1>
              <p className="lead">
                Study-designed questionnaire. Answer based on your experience.
              </p>
              <SurveyForm
                key={snapshot.state}
                form={
                  snapshot.state === "immediate_test_complete" ? "F3" : "F5"
                }
                draftKey={`visuallearn-${localDemo ? "simulation" : "study"}-${snapshot.publicCode}-${snapshot.state}-survey-v2`}
                onSubmit={submitSurvey}
              />
            </>
          ) : snapshot.state === "waiting_60m" ? (
            <>
              <h1 className="page-title">Thank you. See you in an hour.</h1>
              <p className="lead">
                {localDemo
                  ? "This demonstration is saved in this browser. Use the development clock controls above to test the follow-up."
                  : "You can close this page. Your next assessment is scheduled on the server."}
              </p>
              {snapshot.followup && (
                <FollowupStatus
                  followup={snapshot.followup}
                  serverTime={snapshot.serverTime}
                  localDemo={localDemo}
                />
              )}
              <Button
                disabled={busy}
                onClick={() =>
                  act(async () => {
                    setForm(await transport("assessment/plus_60m"));
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
              <h1 className="page-title">
                {localDemo
                  ? "Simulated workflow complete."
                  : "Your participation is complete."}
              </h1>
              <p className="lead">
                {localDemo
                  ? "You have demonstrated baseline, lesson, immediate assessment, F3, one-hour recall and F5. No research record or scientific result was created."
                  : "Thank you for contributing. Scores and explanations are withheld until the researcher’s approved debrief."}
              </p>
            </>
          ) : null}
          {!localDemo &&
            ["waiting_60m", "immediate_test_complete"].includes(
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
                      const result = await transport("return-token", {});
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
                    await transport("withdraw", {});
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
    </Main>
  );
}
