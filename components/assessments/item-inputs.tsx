"use client";
import type {
  LabelSlot,
  PublicLabeling,
  PublicOrdering,
} from "@/lib/assessments/draft";
// Positions only. The diagram is identical for every form and visual
// condition, has no text labels and never encodes an answer by color.
const markerAt: Record<LabelSlot, [number, number]> = {
  s1: [452, 150],
  s2: [300, 40],
  s3: [168, 112],
  s4: [262, 166],
  s5: [36, 226],
};
export function LabelDiagram({ question }: { question: PublicLabeling }) {
  const titleId = `${question.id}-diagram-title`;
  return (
    <figure className="label-diagram">
      <svg
        viewBox="0 0 480 270"
        role="img"
        aria-labelledby={titleId}
        focusable="false"
      >
        <title id={titleId}>
          Unlabeled water cycle diagram with {question.markers.length} numbered
          markers. Each marker is described in the list below.
        </title>
        <rect width="480" height="270" fill="var(--diagram-sky)" />
        <circle cx="54" cy="44" r="22" fill="var(--diagram-sun)" />
        <path
          d="M0 150 Q110 92 190 150 T300 205 L300 270 L0 270 Z"
          fill="var(--diagram-land)"
        />
        <path
          d="M0 205 L300 205 L300 270 L0 270 Z"
          fill="var(--diagram-soil)"
          opacity="0.55"
        />
        <path d="M296 205 Q390 196 480 205 L480 270 L296 270 Z" fill="var(--diagram-water)" />
        <g fill="var(--diagram-cloud)" stroke="var(--diagram-ink)" strokeWidth="1.5">
          <ellipse cx="220" cy="54" rx="58" ry="24" />
          <ellipse cx="180" cy="62" rx="32" ry="18" />
          <ellipse cx="262" cy="62" rx="34" ry="18" />
        </g>
        <g stroke="var(--diagram-ink)" strokeWidth="2.5" fill="none" strokeLinecap="round">
          {[360, 392, 424].map((x) => (
            <path
              key={x}
              d={`M${x} 192 q-7 -10 0 -20 q7 -10 0 -20 q-7 -10 0 -20`}
            />
          ))}
          {[360, 392, 424].map((x) => (
            <path key={`h${x}`} d={`M${x - 6} 138 l6 -10 l6 10`} />
          ))}
          {[190, 214, 238, 262].map((x, i) => (
            <path key={x} d={`M${x} ${88 + (i % 2) * 8} l-6 16`} />
          ))}
          <path d="M150 140 Q215 158 250 185 T300 206" strokeWidth="4" />
          <path d="M292 200 l9 6 l-11 3" />
          {[70, 104, 138].map((x) => (
            <g key={x}>
              <path d={`M${x} 212 v26`} />
              <path d={`M${x - 6} 232 l6 8 l6 -8`} />
            </g>
          ))}
        </g>
        {question.markers.map((m, i) => {
          const [x, y] = markerAt[m.slot];
          return (
            <g key={m.slot} aria-hidden="true">
              <circle cx={x} cy={y} r="17" fill="var(--diagram-marker)" />
              <text
                x={x}
                y={y + 7}
                textAnchor="middle"
                fontSize="20"
                fontWeight="700"
                fill="var(--diagram-marker-text)"
              >
                {i + 1}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
export function OrderingInput({
  question,
  value,
  disabled,
  onChange,
}: {
  question: PublicOrdering;
  value: number[] | undefined;
  disabled: boolean;
  onChange: (next: number[]) => void;
}) {
  const current = value ?? question.steps.map(() => -1);
  const duplicates = new Set(
    current.filter((v, i) => v >= 0 && current.indexOf(v) !== i),
  );
  return (
    <div className="order-grid">
      {current.map((selected, position) => (
        <label key={position} className="order-row">
          <span>Step {position + 1}</span>
          <select
            data-question={position === 0 ? question.id : undefined}
            disabled={disabled}
            value={selected}
            aria-invalid={duplicates.has(selected) || undefined}
            onChange={(e) =>
              onChange(
                current.map((v, i) =>
                  i === position ? Number(e.target.value) : v,
                ),
              )
            }
          >
            <option value={-1}>Choose a step</option>
            {question.steps.map((step, index) => (
              <option key={step} value={index}>
                {step}
              </option>
            ))}
          </select>
        </label>
      ))}
      {duplicates.size > 0 && (
        <p className="fine-print field-hint">
          Each step should be used once. A step is selected more than once.
        </p>
      )}
    </div>
  );
}
export function LabelingInput({
  question,
  value,
  disabled,
  onChange,
}: {
  question: PublicLabeling;
  value: number[] | undefined;
  disabled: boolean;
  onChange: (next: number[]) => void;
}) {
  const current = value ?? question.markers.map(() => -1);
  return (
    <>
      <LabelDiagram question={question} />
      <div className="order-grid">
        {question.markers.map((marker, i) => (
          <label key={marker.slot} className="order-row">
            <span>{marker.description}</span>
            <select
              data-question={i === 0 ? question.id : undefined}
              disabled={disabled}
              value={current[i]}
              onChange={(e) =>
                onChange(
                  current.map((v, j) => (j === i ? Number(e.target.value) : v)),
                )
              }
            >
              <option value={-1}>Choose a process</option>
              {question.options.map((option, index) => (
                <option key={option} value={index}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </>
  );
}
