import type { responseReview } from "@/lib/admin/response-review";
export function ResponseReviewPanel({
  review,
  synthetic = false,
  compact = false,
}: {
  review: ReturnType<typeof responseReview>;
  synthetic?: boolean;
  compact?: boolean;
}) {
  const Heading = compact ? "h3" : "h2";
  const FlagHeading = compact ? "h4" : "h3";
  const flags = review.items.filter((item) => item.flagged > 0);
  return (
    <section
      aria-label={
        synthetic ? "SYNTHETIC response-based review" : "Response-based review"
      }
    >
      <Heading>
        {synthetic
          ? "Review prompts from your simulated answers"
          : "Response patterns to review"}
      </Heading>
      <p className="fine-print">
        {synthetic ? "SYNTHETIC browser answers only. " : ""}Draft rules:{" "}
        {review.version}. Counts use submitted answers within one presentation
        and frozen cohort. N/A and missing answers are excluded. No combined
        usability score is calculated.
      </p>
      {flags.map((item) => (
        <section
          key={`${item.cohort}-${item.form}-${item.id}`}
          className="response-review-item"
        >
          <FlagHeading>{item.title}</FlagHeading>
          <p>
            <strong>
              {item.flagged} of {item.eligible} eligible answers
            </strong>{" "}
            · {item.form} {item.formVersion} · {item.check}
          </p>
          <p>{item.action}</p>
          <details>
            <summary>Frozen cohort and presentation</summary>
            <p className="response-review-cohort">{item.cohort}</p>
          </details>
        </section>
      ))}
      {!flags.length && (
        <p>
          {review.items.length
            ? "No submitted answers met these draft thresholds. This does not establish that the interface has no usability problems."
            : "Review prompts appear after questionnaire responses are submitted."}
        </p>
      )}
    </section>
  );
}
