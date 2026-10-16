"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
const datasets = [
  "participants_deidentified",
  "assignments",
  "sessions",
  "assessment_attempts",
  "item_responses",
  "free_recall_ratings",
  "surveys",
  "followup_status",
  "events",
];
type Stats = {
  balance: { age_band: string; arm_key: string; n: number }[];
  funnel: { state: string; n: number }[];
  performance: {
    timepoint: string;
    arm_key: string;
    n: number;
    mean_percent: string;
  }[];
  quality: { awaiting_submission: number; expired: number };
};
export function AdminWorkspace({
  configured,
  signedIn,
  initialStats,
}: {
  configured: boolean;
  signedIn: boolean;
  initialStats?: Stats;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in.");
      setBusy(false);
    }
  }
  if (!configured)
    return (
      <>
        <p className="lead">Administrator authentication is not configured.</p>
        <p>
          This route exposes no participant data. Configure Supabase Auth, the
          administrator UUID allowlist and the research database to enable this
          workspace.
        </p>
        <div className="notice">
          No participant counts, scores or study results are fabricated for this
          screen.
        </div>
      </>
    );
  if (!signedIn)
    return (
      <form className="study-form" onSubmit={login}>
        <p>Sign in with an authorized Supabase researcher account.</p>
        <label>
          Email
          <input name="email" type="email" required autoComplete="username" />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </label>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <Button disabled={busy} type="submit">
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    );
  const stats = initialStats!;
  return (
    <>
      <p className="lead">
        Database-backed research overview. Descriptive summaries only.
      </p>
      <h2>Allocation by age and condition</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Age band</th>
            <th>Condition</th>
            <th>Participants</th>
          </tr>
        </thead>
        <tbody>
          {stats.balance.map((r) => (
            <tr key={r.age_band + r.arm_key}>
              <td>{r.age_band}</td>
              <td>{r.arm_key}</td>
              <td>{r.n}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!stats.balance.length && (
        <p>No eligible participant assignments have been recorded.</p>
      )}
      <h2>Session stages</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Current stage</th>
            <th>Sessions</th>
          </tr>
        </thead>
        <tbody>
          {stats.funnel.map((r) => (
            <tr key={r.state}>
              <td>{r.state}</td>
              <td>{r.n}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Observed assessment performance</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Timepoint</th>
            <th>Condition</th>
            <th>N</th>
            <th>Mean %</th>
          </tr>
        </thead>
        <tbody>
          {stats.performance.map((r) => (
            <tr key={r.timepoint + r.arm_key}>
              <td>{r.timepoint}</td>
              <td>{r.arm_key}</td>
              <td>{r.n}</td>
              <td>{r.mean_percent}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Incomplete attempts: {stats.quality.awaiting_submission}. Expired
        follow-ups: {stats.quality.expired}.
      </p>
      <h2>De-identified research exports</h2>
      <p>
        Withdrawn records are excluded. Free text needs manual disclosure review
        before sharing. Export actions are audited.
      </p>
      <div className="export-links">
        {datasets.map((name) => (
          <a
            key={name}
            href={`/api/admin/export?table=${name}`}
            className="text-link"
          >
            {name}.csv ↓
          </a>
        ))}
      </div>
      <Button
        variant="outline"
        onClick={async () => {
          await fetch("/api/admin/logout", { method: "POST" });
          window.location.reload();
        }}
      >
        Sign out
      </Button>
    </>
  );
}
