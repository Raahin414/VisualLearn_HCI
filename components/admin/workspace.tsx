"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { StudyStats } from "@/lib/admin/exports";
import { Dashboard } from "./dashboard";
import { RatingPanel } from "./rating-panel";
async function post(path: string, body: unknown) {
  const r = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok)
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : data.error?.message || "Request failed.",
    );
  return data;
}
export function AdminWorkspace({
  configured,
  signedIn,
  initialStats,
  initialMfa,
}: {
  configured: boolean;
  signedIn: boolean;
  initialStats?: StudyStats;
  initialMfa: "enroll" | "verify" | null;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mfa, setMfa] = useState(initialMfa);
  const [enrollment, setEnrollment] = useState<{
    factorId: string;
    qrCode?: string;
    secret: string;
  } | null>(null);
  const [tab, setTab] = useState<"overview" | "rating" | "exports">("overview");
  const [forgot, setForgot] = useState<"closed" | "open" | "sent">("closed");
  async function run(task: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }
  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await run(async () => {
      const data = await post("/api/admin/login", {
        email: form.get("email"),
        password: form.get("password"),
      });
      if (data.signedIn) window.location.reload();
      else setMfa(data.mfa);
    });
  }
  async function verify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") || "").trim();
    await run(async () => {
      await post("/api/admin/mfa", {
        action: "verify",
        code,
        ...(enrollment ? { factorId: enrollment.factorId } : {}),
      });
      window.location.reload();
    });
  }
  const signOut = () =>
    run(async () => {
      await post("/api/admin/logout", {});
      window.location.reload();
    });
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
  const errorBox = error && (
    <p role="alert" className="form-error">
      {error}
    </p>
  );
  if (!signedIn && mfa)
    return (
      <div className="study-form">
        <h2>Two-step verification</h2>
        {mfa === "enroll" && !enrollment ? (
          <>
            <p>
              Researcher accounts must use an authenticator app. Set one up to
              continue. This is required before any study data is shown.
            </p>
            <Button
              disabled={busy}
              onClick={() =>
                run(async () =>
                  setEnrollment(
                    await post("/api/admin/mfa", { action: "enroll" }),
                  ),
                )
              }
            >
              Set up authenticator
            </Button>
          </>
        ) : (
          <form className="study-form" onSubmit={verify}>
            {enrollment && (
              <>
                <p>
                  Scan this code with your authenticator app, or enter the setup
                  key manually.
                </p>
                {enrollment.qrCode && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={enrollment.qrCode}
                    alt="Authenticator setup QR code"
                    width={240}
                    height={240}
                    // White quiet zone so phone cameras can scan the dense code.
                    style={{
                      background: "#ffffff",
                      padding: 16,
                      border: "1px solid var(--line)",
                      borderRadius: 8,
                      boxSizing: "content-box",
                      maxWidth: "calc(100% - 34px)",
                      height: "auto",
                    }}
                  />
                )}
                <label>
                  Setup key
                  <input readOnly value={enrollment.secret} />
                </label>
              </>
            )}
            <label>
              Six-digit code from your authenticator
              <input
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                required
              />
            </label>
            <Button disabled={busy} type="submit">
              {busy ? "Verifying…" : "Verify and continue"}
            </Button>
          </form>
        )}
        {errorBox}
        <Button variant="ghost" disabled={busy} onClick={signOut}>
          Cancel and sign out
        </Button>
      </div>
    );
  if (!signedIn && forgot !== "closed")
    return (
      <form
        className="study-form"
        onSubmit={(e) => {
          e.preventDefault();
          const email = new FormData(e.currentTarget).get("email");
          void run(async () => {
            await post("/api/admin/recover", { email });
            setForgot("sent");
          });
        }}
      >
        <h2>Reset your password</h2>
        {forgot === "sent" ? (
          <p role="status">
            If that address belongs to a researcher account, a reset link is on
            its way. Open it in this browser. You will need your authenticator
            app.
          </p>
        ) : (
          <>
            <label>
              Email
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
              />
            </label>
            {errorBox}
            <Button disabled={busy} type="submit">
              {busy ? "Sending…" : "Send reset link"}
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          type="button"
          onClick={() => setForgot("closed")}
        >
          Back to sign-in
        </Button>
      </form>
    );
  if (!signedIn)
    return (
      <form className="study-form" onSubmit={login}>
        <p>
          Sign in with an authorized Supabase researcher account. A second
          factor (authenticator app) is required.
        </p>
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
        {errorBox}
        <Button disabled={busy} type="submit">
          {busy ? "Signing in…" : "Sign in"}
        </Button>
        <Button
          variant="ghost"
          type="button"
          onClick={() => {
            setError("");
            setForgot("open");
          }}
        >
          Forgot password?
        </Button>
      </form>
    );
  const stats = initialStats!;
  return (
    <>
      <p className="lead">
        Database-backed research overview. Descriptive summaries only; no
        significance tests or causal claims.
      </p>
      <p>
        Visual-density study: low, medium and high. Dashboard and exports
        include E1 records only.
      </p>
      <div className="admin-tabs" role="group" aria-label="Workspace sections">
        {(
          [
            ["overview", "Overview & quality"],
            ["rating", "Blind scoring"],
            ["exports", "Exports & codebook"],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            variant="outline"
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
          >
            {label}
          </Button>
        ))}
      </div>
      {tab === "overview" && <Dashboard stats={stats} />}
      {tab === "rating" && <RatingPanel />}
      {tab === "exports" && <Exports />}
      {errorBox}
      <Button variant="outline" disabled={busy} onClick={signOut}>
        Sign out
      </Button>
    </>
  );
}
const datasets = [
  "participants_deidentified",
  "assignments",
  "sessions",
  "assessment_attempts",
  "item_responses",
  "written_responses",
  "free_recall_ratings",
  "rating_adjudications",
  "surveys",
  "followup_status",
  "events",
];
function Exports() {
  return (
    <section>
      <h2>De-identified research exports</h2>
      <p>
        Withdrawn participants are excluded from every file. Written responses
        are verbatim and need disclosure review before sharing. Every download
        is recorded in the audit log.
      </p>
      <div className="export-links">
        {(
          [
            ["json", "codebook.json"],
            ["md", "data_dictionary.md"],
          ] as const
        ).map(([format, file]) => (
          <a
            key={format}
            href={`/api/admin/codebook?format=${format}`}
            className="text-link"
          >
            {file} ↓
          </a>
        ))}
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
    </section>
  );
}
