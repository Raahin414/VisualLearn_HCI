import Link from "next/link";
import { DensityOverview } from "@/components/learning/density-overview";
export default function Research() {
  return (
    <main id="main" className="container page-content">
      <div className="eyebrow">VISUALLEARN RESEARCH</div>
      <h1 className="page-title">One lesson. Three visual densities.</h1>
      <p className="lead">
        We are studying how visual density relates to comprehension, retention
        and reported effort in the same Water Cycle course.
      </p>
      <div className="notice">
        Research enrollment remains closed until the protocol, consent, content
        and required approvals are ready. The public demo is available without
        enrollment.
      </div>
      <DensityOverview />
      <section
        className="study-process"
        aria-labelledby="study-process-heading"
      >
        <h2 id="study-process-heading">How participation works</h2>
        <ol>
          <li>Read the approved study information and give consent.</li>
          <li>Complete a baseline quiz before seeing the lesson.</li>
          <li>Receive one server-assigned density: low, medium or high.</li>
          <li>
            Study all five chapters, then complete immediate recall, questions
            and a short experience survey.
          </li>
          <li>
            Return for a different quiz one hour after lesson completion and
            report any topic review.
          </li>
        </ol>
        <p>
          The same text, audio, learning objectives, controls and assessment
          rules apply in every condition. No condition is claimed to work best.
          Browser interactions are behavior indicators, not attention
          measurements.
        </p>
        <p>
          <Link className="button button-primary" href="/study/enroll">
            Participation status
          </Link>
        </p>
        <p>
          <Link className="text-link" href="/study/session">
            Return to my study
          </Link>
        </p>
        <p>
          <Link className="text-link" href="/demo/water-cycle">
            Compare the public lesson previews
          </Link>
        </p>
        <p>
          <Link className="text-link" href="/admin">
            Researcher access
          </Link>
        </p>
      </section>
    </main>
  );
}
