import type { StudyStats } from "@/lib/admin/exports";
const names: Record<string, string> = {
  pre: "Baseline",
  immediate: "Immediate",
  plus_60m: "One hour",
  plus_7d: "Seven days",
};
/** Exact values accompany every bar. No imputed outcomes or significance claims. */
export function AnalysisCharts({ stats }: { stats: StudyStats }) {
  if (!stats.performance.length)
    return (
      <section aria-label="Descriptive charts">
        <h2>Descriptive charts</h2>
        <p>
          Charts appear after an assessment is submitted. Missing assessments
          are never drawn as zero scores.
        </p>
      </section>
    );
  if (stats.versions.length !== 1)
    return (
      <section aria-label="Descriptive charts">
        <h2>Descriptive charts</h2>
        <p>
          Multiple frozen cohorts are present. Use the export analysis to
          compare matching versions separately; charts are withheld to avoid
          pooling them.
        </p>
      </section>
    );
  return (
    <section aria-label="Descriptive charts">
      <h2>Observed scores by condition</h2>
      <p className="fine-print">
        {stats.experimentId} only · one frozen cohort · unadjusted means, not
        effects. Each row shows its own observed N. Missing outcomes are
        omitted.
      </p>
      <figure className="research-chart">
        <figcaption>Mean objective score, 0–100% correct</figcaption>
        {stats.performance
          .filter((row) => row.n > 0)
          .map((row) => (
            <div
              className="research-chart-row"
              key={`${row.arm_key}-${row.timepoint}`}
            >
              <span>
                {row.arm_key} · {names[row.timepoint] ?? row.timepoint}
              </span>
              <span className="research-chart-track" aria-hidden="true">
                <span
                  style={{
                    width: `${Math.max(0, Math.min(100, Number(row.mean_percent)))}%`,
                  }}
                />
              </span>
              <strong>
                {row.mean_percent}% <small>(N={row.n})</small>
              </strong>
            </div>
          ))}
      </figure>
      <h3>Within-person retention</h3>
      {!stats.retention.length ? (
        <p>No observed immediate/one-hour pairs yet.</p>
      ) : (
        <ul className="retention-pairs">
          {stats.retention.map((row) => (
            <li key={row.arm_key}>
              <strong>{row.arm_key}</strong>: {row.immediate}% immediate →{" "}
              {row.plus_60m}% one hour; change{" "}
              {Number(row.change) > 0 ? "+" : ""}
              {row.change} percentage points (paired N={row.paired}).
            </li>
          ))}
        </ul>
      )}
      <p className="fine-print">
        Paired means describe the people who returned. They do not account for
        baseline differences or explain missing follow-ups. Use the analysis
        script for cohort-specific distributions and missingness.
      </p>
    </section>
  );
}
