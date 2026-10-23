import type { StudyStats } from "@/lib/admin/exports";
function Table({
  caption,
  head,
  rows,
  empty,
}: {
  caption: string;
  head: string[];
  rows: (string | number)[][];
  empty: string;
}) {
  return (
    <div className="table-scroll" role="region" aria-label={caption} tabIndex={0}>
      <table className="data-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p>{empty}</p>}
    </div>
  );
}
const qualityLabels: Record<string, string> = {
  opened_not_submitted: "Assessments opened but not submitted",
  expired_followups: "One-hour follow-ups expired unanswered",
  submitted_after_deadline: "Follow-ups submitted after the deadline",
  stalled_lessons: "Lessons active for more than 3 hours",
  missing_immediate_survey: "Immediate survey missing 30+ minutes after quiz",
  completed_without_events: "Completed lessons with no telemetry events",
  withdrawn_excluded: "Withdrawn participants (excluded everywhere)",
};
export function Dashboard({ stats }: { stats: StudyStats }) {
  return (
    <>
      <h2>Allocation by age band and condition</h2>
      <Table
        caption="Allocation"
        head={["Age band", "Condition", "Participants"]}
        rows={stats.balance.map((r) => [r.age_band, r.arm_key, r.n])}
        empty="No eligible participant assignments have been recorded."
      />
      <h2>Research funnel</h2>
      <Table
        caption="Funnel"
        head={["Checkpoint reached", "Sessions"]}
        rows={stats.funnel.map((r) => [r.step, r.n])}
        empty="No sessions."
      />
      <h2>Observed objective scores</h2>
      <Table
        caption="Performance"
        head={["Timepoint", "Condition", "N", "Mean % correct"]}
        rows={stats.performance.map((r) => [r.timepoint, r.arm_key, r.n, r.mean_percent])}
        empty="No submitted assessments."
      />
      <h2>Retention: immediate vs one hour</h2>
      <p className="fine-print">
        Paired participants only. Descriptive means; small samples need
        confidence intervals from the analysis script, not this table.
      </p>
      <Table
        caption="Retention"
        head={["Condition", "Paired N", "Immediate %", "One-hour %", "Mean change (points)"]}
        rows={stats.retention.map((r) => [r.arm_key, r.paired, r.immediate, r.plus_60m, r.change])}
        empty="No participant has completed both timepoints."
      />
      <Table
        caption="Follow-up status"
        head={["Condition", "Follow-up status", "Sessions"]}
        rows={stats.followups.map((r) => [r.arm_key, r.status.replaceAll("_", " "), r.n])}
        empty="No follow-ups scheduled."
      />
      <h2>Data quality</h2>
      <Table
        caption="Data quality checks"
        head={["Check", "Count"]}
        rows={Object.entries(stats.quality).map(([k, v]) => [qualityLabels[k] ?? k, v])}
        empty="No checks available."
      />
      <Table
        caption="Versions in use"
        head={["Protocol", "Stimulus", "Question bank", "Sessions"]}
        rows={stats.versions.map((r) => [r.protocol_version, r.stimulus_version, r.question_bank_sha256, r.n])}
        empty="No sessions."
      />
      <p className="fine-print">
        More than one version row means sessions were enrolled under different
        frozen materials; analyse them separately.
      </p>
      <h2>Written-response scoring coverage</h2>
      <Table
        caption="Rating coverage"
        head={["Response type", "Responses", "Rated by 2+", "Need adjudication", "Adjudicated"]}
        rows={stats.ratings.map((r) => [r.response_kind.replace("_", " "), r.responses, r.rated_twice, r.needs_adjudication, r.adjudicated])}
        empty="No written responses yet."
      />
    </>
  );
}
