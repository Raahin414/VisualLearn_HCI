const tiers = [
  {
    name: "Low",
    count: 1,
    description:
      "Text, narration and one essential diagram. A focused presentation with minimal visual competition.",
  },
  {
    name: "Medium",
    count: 4,
    description:
      "The same lesson with supporting illustrations and callouts alongside the essential diagram.",
  },
  {
    name: "High",
    count: 9,
    description:
      "The same lesson with several supporting visuals, repeated labels and decorative details shown together.",
  },
];
export function DensityOverview() {
  return (
    <section
      className="density-overview"
      aria-labelledby="density-overview-heading"
    >
      <div className="eyebrow">THE STUDY</div>
      <h2 id="density-overview-heading">Same lesson, three densities.</h2>
      <div className="density-overview-grid">
        {tiers.map((tier) => (
          <article
            key={tier.name}
            className={`density-tier tier-${tier.name.toLowerCase()}`}
          >
            <div className="density-example" aria-hidden="true">
              {Array.from({ length: tier.count }, (_, index) => (
                <span key={index} />
              ))}
            </div>
            <h3>{tier.name}</h3>
            <p>{tier.description}</p>
          </article>
        ))}
      </div>
      <p className="density-invariant">
        <strong>Content and narration stay identical across all three.</strong>{" "}
        Only the visual density changes. We are testing the differences, not
        claiming one works best.
      </p>
    </section>
  );
}
