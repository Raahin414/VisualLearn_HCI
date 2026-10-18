"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PASSWORD_HINT, passwordProblem } from "@/lib/security/password-policy";
type AuthLink = { kind: "invite" | "recovery"; token: string } | { error: string };
// Read once and removed from the address bar immediately; a re-run effect
// (e.g. React strict mode) reuses the captured value instead of re-reading.
let captured: AuthLink | null = null;
function readFragment(): AuthLink {
  const params = new URLSearchParams(window.location.hash.slice(1));
  if (params.get("error_code") || params.get("error"))
    return {
      error:
        params.get("error_code") === "otp_expired"
          ? "This link has already been used or has expired."
          : "This link is not valid.",
    };
  const token = params.get("access_token");
  const type = params.get("type");
  const expiresAt = Number(params.get("expires_at") || 0);
  if (!token || (type !== "invite" && type !== "recovery"))
    return { error: "Open this page from the link in your invitation or password email." };
  if (expiresAt && expiresAt * 1000 < Date.now())
    return { error: "This link has expired." };
  return { kind: type, token };
}
export function AcceptInvite() {
  const [link, setLink] = useState<AuthLink | null>(null);
  const [needCode, setNeedCode] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  useEffect(() => {
    // Supabase links may name localhost; the app's configured origin is used
    // for same-origin checks, so keep the fragment and switch host in dev.
    if (
      process.env.NODE_ENV === "development" &&
      window.location.hostname === "localhost"
    ) {
      window.location.replace(window.location.href.replace("//localhost", "//127.0.0.1"));
      return;
    }
    if (!captured) {
      captured = readFragment();
      history.replaceState(null, "", window.location.pathname);
    }
    const value = captured;
    queueMicrotask(() => setLink(value));
  }, []);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!link || "error" in link || busy) return;
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") || "");
    const problem =
      passwordProblem(password) ||
      (password !== form.get("confirm") ? "The two passwords do not match." : null);
    if (problem) return setError(problem);
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: link.token,
          password,
          ...(needCode ? { code: String(form.get("code") || "").trim() } : {}),
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (data.needCode) setNeedCode(true);
      if (!r.ok) throw new Error(data.error || "The password could not be set.");
      captured = null;
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The password could not be set.");
      setBusy(false);
    }
  }
  if (!link) return <p role="status">Checking your link…</p>;
  if ("error" in link)
    return (
      <>
        <h1>Link unavailable</h1>
        <p role="alert" className="form-error">
          {link.error}
        </p>
        <p>
          Ask the study administrator for a new invitation, or request a
          password reset from the sign-in page.
        </p>
        <Link className="text-link" href="/admin">
          Go to researcher sign-in →
        </Link>
      </>
    );
  return (
    <>
      <h1>{link.kind === "invite" ? "Set up your researcher account" : "Choose a new password"}</h1>
      <form className="study-form" onSubmit={submit} noValidate>
        <p>
          {link.kind === "invite"
            ? "Choose a password. Next you will add an authenticator app, which is required for every researcher."
            : "Choose a new password for your researcher account."}
        </p>
        <label>
          New password
          <input name="password" type="password" autoComplete="new-password" required maxLength={128} aria-describedby="password-hint" />
        </label>
        <span id="password-hint" className="fine-print">
          {PASSWORD_HINT}
        </span>
        <label>
          Repeat the password
          <input name="confirm" type="password" autoComplete="new-password" required maxLength={128} />
        </label>
        {needCode && (
          <label>
            Six-digit code from your authenticator
            <input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required />
          </label>
        )}
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <Button disabled={busy} type="submit">
          {busy ? "Saving…" : link.kind === "invite" ? "Set password and continue" : "Save new password"}
        </Button>
      </form>
    </>
  );
}
