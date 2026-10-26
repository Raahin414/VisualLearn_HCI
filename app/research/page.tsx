import Link from "next/link";
import { DensityOverview } from "@/components/learning/density-overview";
export default function Research() {
  return (
    <main id="main" className="container page-content">
      <div className="eyebrow">VISUALLEARN RESEARCH</div>
      <h1 className="page-title">Five courses. Three visual densities each.</h1>
      <p className="lead">
        The original Water Cycle study measures comprehension and one-hour
        retention. Four new courses add a draft immediate knowledge check.
        Their results will be analyzed separately until a shared protocol is approved.
      </p>
      <div className="notice">
        Research enrollment and recorded course taking remain closed until
        protocol, identity consent, content and required approvals are ready.
        Course previews are available without enrollment.
      </div>
      <DensityOverview />
      <section
        className="study-process"
        aria-labelledby="study-process-heading"
      >
        <h2 id="study-process-heading">How participation works</h2>
        <p>The sequence below describes the original Water Cycle research study.</p>
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
          The additional courses use a shorter flow: approved name/ERP consent,
          assigned density, three lesson parts and a four-question check. The
          student records appear only in the authenticated researcher portal.
        </p>
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
