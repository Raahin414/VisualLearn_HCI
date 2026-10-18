"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
type Rubric = {
  kind: "free_recall" | "scenario";
  version: string;
  maxScore: number;
  criteria: { key: string; label: string; anchors: [string, string, string] }[];
};
type Item = { handle: string; prompt: string; text: string };
type Queue = { rubric: Rubric; remaining: number; item: Item | null };
type Adjudication = {
  rubric: Rubric;
  items: (Item & {
    ratings: { rater_code: string; sub_scores: Record<string, number>; total_score: number }[];
  })[];
};
async function api(path: string, body?: unknown) {
  const r = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok)
    throw new Error(
      typeof data.error === "string" ? data.error : data.error?.message || "Request failed.",
    );
  return data;
}
function Criteria({
  rubric,
  scores,
  onChange,
  name,
}: {
  rubric: Rubric;
  scores: Record<string, number>;
  onChange: (key: string, v: number) => void;
  name: string;
}) {
  return (
    <div className="rating-grid">
      {rubric.criteria.map((c) => (
        <fieldset key={c.key} className="scale-field">
          <legend>{c.label}</legend>
          <div>
            {c.anchors.map((anchor, v) => (
              <label key={v}>
                <input
                  type="radio"
                  name={`${name}-${c.key}`}
                  checked={scores[c.key] === v}
                  onChange={() => onChange(c.key, v)}
                />
                {v} · {anchor}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
export function RatingPanel() {
  const [kind, setKind] = useState<Rubric["kind"]>("free_recall");
  const [queue, setQueue] = useState<Queue | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [adj, setAdj] = useState<Adjudication | null>(null);
  const [final, setFinal] = useState<Record<string, Record<string, number>>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setError("");
    try {
      const [q, a] = await Promise.all([
        api(`/api/admin/rating?kind=${kind}`),
        api(`/api/admin/adjudication?kind=${kind}`),
      ]);
      setQueue(q);
      setAdj(a);
      setScores({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load responses.");
    }
  }, [kind]);
  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);
  async function save(path: string, body: unknown) {
    setBusy(true);
    setError("");
    try {
      await api(path, body);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  }
  const complete = (r: Rubric, s: Record<string, number>) =>
    r.criteria.every((c) => Number.isInteger(s[c.key]));
  return (
    <section data-loaded-kind={queue?.rubric.kind}>
      <h2>Blind scoring of written responses</h2>
      <p>
        You see only the response and its prompt. Condition, age band, other
        raters and your account identity are hidden; your ratings are stored
        under a pseudonymous rater code. Rubrics are drafts awaiting review. Do
        not penalize spelling unless meaning is unrecoverable.
      </p>
      <label>
        Response type{" "}
        <select value={kind} onChange={(e) => setKind(e.target.value as Rubric["kind"])}>
          <option value="free_recall">Free recall (0–10)</option>
          <option value="scenario">Scenario explanation (0–4)</option>
        </select>
      </label>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {queue && (
        <>
          <p className="fine-print">
            {queue.remaining} response{queue.remaining === 1 ? "" : "s"} awaiting your rating ·
            rubric {queue.rubric.version}
          </p>
          {queue.item ? (
            <div className="study-form">
              <p className="fine-print">Response {queue.item.handle}</p>
              <p>
                <strong>Prompt:</strong> {queue.item.prompt}
              </p>
              <p className="rating-response">{queue.item.text}</p>
              <Criteria
                name="rate"
                rubric={queue.rubric}
                scores={scores}
                onChange={(k, v) => setScores((s) => ({ ...s, [k]: v }))}
              />
              <Button
                disabled={busy || !complete(queue.rubric, scores)}
                onClick={() =>
                  save("/api/admin/rating", { handle: queue.item!.handle, kind, scores })
                }
              >
                Save rating ({Object.values(scores).reduce((a, b) => a + b, 0)} /{" "}
                {queue.rubric.maxScore})
              </Button>
            </div>
          ) : (
            <p>No responses are waiting for your rating.</p>
          )}
        </>
      )}
      <h2>Adjudication</h2>
      <p>
        Responses rated by two or more raters with any criterion disagreement.
        Record the agreed scores after discussion.
      </p>
      {adj && !adj.items.length && <p>No disagreements need adjudication.</p>}
      {adj?.items.map((item) => (
        <div key={item.handle} className="study-form written-step">
          <p className="fine-print">Response {item.handle}</p>
          <p>
            <strong>Prompt:</strong> {item.prompt}
          </p>
          <p className="rating-response">{item.text}</p>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rater</th>
                  {adj.rubric.criteria.map((c) => (
                    <th key={c.key}>{c.label}</th>
                  ))}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {item.ratings.map((r) => (
                  <tr key={r.rater_code}>
                    <td>{r.rater_code}</td>
                    {adj.rubric.criteria.map((c) => (
                      <td key={c.key}>{r.sub_scores[c.key]}</td>
                    ))}
                    <td>{r.total_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Criteria
            name={`adj-${item.handle}`}
            rubric={adj.rubric}
            scores={final[item.handle] ?? {}}
            onChange={(k, v) =>
              setFinal((f) => ({ ...f, [item.handle]: { ...f[item.handle], [k]: v } }))
            }
          />
          <Button
            disabled={busy || !complete(adj.rubric, final[item.handle] ?? {})}
            onClick={() =>
              save("/api/admin/adjudication", {
                handle: item.handle,
                kind,
                scores: final[item.handle],
              })
            }
          >
            Record agreed scores
          </Button>
        </div>
      ))}
    </section>
  );
}
