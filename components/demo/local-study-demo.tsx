"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LocalStudy,
  type DemoBanks,
  type LocalStudyRecord,
} from "@/lib/demo/local-study";
import { StudyRunner } from "@/components/study/study-runner";
import { Button } from "@/components/ui/button";
import { conditions, type Condition } from "@/lib/content/lesson";
import { z } from "zod";
export function LocalStudyDemo({ banks }: { banks: DemoBanks }) {
  const [model, setModel] = useState<LocalStudy | null>(null);
  const [record, setRecord] = useState<LocalStudyRecord | null>(null);
  const [condition, setCondition] = useState<Condition>("medium");
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    let storage: Pick<Storage, "getItem" | "setItem" | "removeItem">;
    try {
      storage = localStorage;
    } catch {
      storage = {
        getItem: () => null,
        setItem: () => {
          throw new Error("Storage unavailable");
        },
        removeItem: () => {},
      };
    }
    const instance = new LocalStudy(storage, banks);
    const unsubscribe = instance.subscribe(() =>
      setRecord(instance.getRecord()),
    );
    queueMicrotask(() => {
      setModel(instance);
      setRecord(instance.getRecord());
    });
    return unsubscribe;
  }, [banks]);
  const transport = useCallback(
    async (action: string, input?: unknown) => {
      try {
        return await model!.request(action, input);
      } catch (error) {
        if (error instanceof z.ZodError)
          throw new Error(
            error.issues[0]?.message || "Please check your responses.",
          );
        throw error;
      }
    },
    [model],
  );
  function change(run: () => void) {
    try {
      run();
      setError("");
      setRevision((x) => x + 1);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to update the demonstration.",
      );
    }
  }
  return (
    <main id="main">
      <section
        className="dev-toolbar container"
        aria-label="Development simulation controls"
      >
        <div className="eyebrow">DEVELOPMENT ONLY · SYNTHETIC BROWSER DATA</div>
        <h1>Walk through the study.</h1>
        <p>
          This simulation uses the participant screens and draft forms. It makes
          no research API calls and does not test PostgreSQL, authentication or
          scoring. No human study record is created.
        </p>
        {!record ? (
          <div className="dev-actions">
            <label>
              Simulated visual condition
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as Condition)}
              >
                {conditions.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <Button
              disabled={!model}
              onClick={() => change(() => model!.start(condition))}
            >
              Start simulated session
            </Button>
          </div>
        ) : (
          <div className="dev-actions">
            <span className="pill">
              {record.publicCode} · {record.state}
            </span>
            <Button
              variant="outline"
              disabled={record.state !== "waiting_60m"}
              onClick={() => change(() => model!.advanceTo("due"))}
            >
              Advance to +60 minutes
            </Button>
            <Button
              variant="outline"
              disabled={record.state !== "waiting_60m"}
              onClick={() => change(() => model!.advanceTo("expired"))}
            >
              Advance past deadline
            </Button>
            <Button
              variant="ghost"
              onClick={() => change(() => model!.reset())}
            >
              Reset simulated session
            </Button>
          </div>
        )}
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        {model && !model.storageAvailable && (
          <p className="form-error">
            Browser storage is unavailable. Keep this tab open; this simulation
            may not survive refresh.
          </p>
        )}
        <Link className="text-link" href="/demo/water-cycle">
          Explore the public lesson demo →
        </Link>
      </section>
      {record && record.state !== "withdrawn" && model && (
        <StudyRunner key={revision} transport={transport} localDemo />
      )}
      <section
        className="container demo-researcher"
        aria-label="Simulated researcher overview"
      >
        <div className="eyebrow">LOCAL RESEARCHER PREVIEW</div>
        <h2>
          {record
            ? "One simulated session. Clear checkpoints."
            : "No simulated session yet."}
        </h2>
        <p>
          Browser fixture only · no empirical outcomes, scores or validated
          measures. The real researcher dashboard remains protected.
        </p>
        {record ? (
          <>
            <div className="demo-metrics">
              <div>
                <strong>{record.visited.length} / 5</strong>
                <span>Chapters visited</span>
              </div>
              <div>
                <strong>{Object.keys(record.submissions).length} / 3</strong>
                <span>Assessments submitted</span>
              </div>
              <div>
                <strong>{Object.keys(record.surveys).length} / 2</strong>
                <span>Questionnaires submitted</span>
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Checkpoint</th>
                  <th>Simulated status</th>
                </tr>
              </thead>
              <tbody>
                {(["pre", "immediate", "plus_60m"] as const).map((stage) => (
                  <tr key={stage}>
                    <td>
                      {stage === "pre"
                        ? "Baseline A"
                        : stage === "immediate"
                          ? "Immediate B"
                          : "One-hour C"}
                    </td>
                    <td>
                      {record.submissions[stage]
                        ? "Submission recorded · not graded"
                        : "Not submitted"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="fine-print">
              Free recall is captured as draft text; this simulation does not
              rate it. Reset deletes the fixture from this browser.
            </p>
          </>
        ) : (
          <p>
            Start the session above to see its checkpoints here. Nothing is
            pre-populated as a completed study.
          </p>
        )}
      </section>
    </main>
  );
}
