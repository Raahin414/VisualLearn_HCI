import { densityConfig, type Condition } from "@/lib/content/lesson";
import { WaterDiagram } from "./water-diagram";

const processes = [
  "Evaporation",
  "Condensation",
  "Precipitation",
  "Collection",
];

/** Repeats facts already in the canonical lesson; no extra instruction. */
export function DensityVisuals({
  condition,
  active,
  description,
}: {
  condition: Condition;
  active: string;
  description: string;
}) {
  const config = densityConfig[condition];
  return (
    <div
      className={`density-visuals density-${condition}`}
      data-density={condition}
    >
      <div className="lesson-canvas">
        <WaterDiagram condition={condition} active={active} />
        <p className="diagram-caption">{description}</p>
      </div>
      {config.supportive && (
        <div
          className="density-support"
          data-density-support="true"
          aria-label="Supporting water-cycle illustrations"
        >
          {processes.slice(0, config.supportingPanels).map((process, index) => (
            <figure className="density-process" key={process}>
              <svg
                viewBox="0 0 160 84"
                role="img"
                aria-label={`${process} illustration`}
              >
                <rect
                  x="8"
                  y="63"
                  width="144"
                  height="13"
                  rx="6"
                  fill="#c8dfd8"
                />
                {index === 0 ? (
                  <>
                    <circle cx="125" cy="22" r="13" fill="#f0c16b" />
                    <path
                      d="M25 58q12-10 24 0t24 0t24 0"
                      fill="none"
                      stroke="#276f77"
                      strokeWidth="3"
                    />
                    <path
                      d="M50 48V17m-6 8 6-8 6 8m20 23V17m-6 8 6-8 6 8"
                      fill="none"
                      stroke="#276f77"
                      strokeWidth="3"
                    />
                  </>
                ) : index === 1 ? (
                  <>
                    <path
                      d="M39 48c-18 0-20-24-3-28 4-20 31-22 41-6 22-15 47 1 42 18 21 13 6 23-7 23H44"
                      fill="#e5efed"
                      stroke="#276f77"
                      strokeWidth="2"
                    />
                    {[53, 76, 99].map((x) => (
                      <circle key={x} cx={x} cy="38" r="4" fill="#66a3a4" />
                    ))}
                  </>
                ) : index === 2 ? (
                  <>
                    <path
                      d="M39 32c-16 0-17-20-1-23 5-14 24-14 33-3 24-11 43 4 39 16 20 7 7 17-5 17H42"
                      fill="#d5e6e2"
                      stroke="#276f77"
                      strokeWidth="2"
                    />
                    {[53, 76, 99].map((x) => (
                      <path
                        key={x}
                        d={`M${x} 44l-5 11m2 5-3 6`}
                        stroke="#276f77"
                        strokeWidth="3"
                      />
                    ))}
                  </>
                ) : (
                  <>
                    <path
                      d="m18 37 35 18 38-27 49 29"
                      fill="none"
                      stroke="#6a9174"
                      strokeWidth="5"
                    />
                    <ellipse cx="78" cy="62" rx="35" ry="9" fill="#76afb4" />
                    <path
                      d="m100 40-12 13m0-7v7h7"
                      fill="none"
                      stroke="#276f77"
                      strokeWidth="2"
                    />
                  </>
                )}
              </svg>
              <figcaption>{process}</figcaption>
            </figure>
          ))}
        </div>
      )}
      {config.decorative && (
        <div
          className="density-decoration"
          data-density-decoration="true"
          aria-hidden="true"
        >
          {Array.from({ length: 12 }, (_, index) => (
            <span key={index} />
          ))}
        </div>
      )}
    </div>
  );
}
