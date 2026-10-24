"use client";
import { useEffect, useState } from "react";
import { followupEligibility } from "@/lib/study/lifecycle";
export function FollowupStatus({
  followup,
  serverTime,
  localDemo = false,
}: {
  followup: { due_at: string; deadline_at: string; status: string };
  serverTime: string;
  localDemo?: boolean;
}) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const timer = setInterval(
      () => setElapsed(performance.now() - start),
      1000,
    );
    return () => clearInterval(timer);
  }, [serverTime]);
  const now = new Date(new Date(serverTime).getTime() + elapsed);
  const due = new Date(followup.due_at);
  const deadline = new Date(followup.deadline_at);
  const status = followupEligibility(now, due, deadline);
  const minutes = Math.max(
    0,
    Math.ceil((due.getTime() - now.getTime()) / 60000),
  );
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const remaining =
    days > 0
      ? `${days} day${days === 1 ? "" : "s"}${hours ? ` and ${hours} hour${hours === 1 ? "" : "s"}` : ""}`
      : minutes >= 120
        ? `${Math.ceil(minutes / 60)} hours`
        : `${minutes} minute${minutes === 1 ? "" : "s"}`;
  return (
    <section className="followup-status" aria-label="Follow-up schedule">
      <strong>
        {status === "eligible"
          ? "Your return window is open"
          : status === "expired"
            ? "Your return window has expired"
            : `Available in about ${remaining}`}
      </strong>
      <p>
        Return between{" "}
        <time dateTime={followup.due_at}>{due.toLocaleString()}</time> and{" "}
        <time dateTime={followup.deadline_at}>{deadline.toLocaleString()}</time>
        .
      </p>
      <p className="fine-print">
        Times are shown in your device’s time zone.{" "}
        {localDemo
          ? "The simulated clock is for development only."
          : "This countdown is a guide; the server checks eligibility on every request."}{" "}
        {status === "expired"
          ? "Earlier responses are preserved; no missing score is invented."
          : ""}
      </p>
    </section>
  );
}
