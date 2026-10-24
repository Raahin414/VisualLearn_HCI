import Link from "next/link";
import { EnrollmentForm } from "@/components/study/enrollment-form";
import { transaction } from "@/lib/db/client";
import { StudyService, type SQL } from "@/lib/study/service";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Enroll({
  searchParams,
}: {
  searchParams: Promise<{ study?: string }>;
}) {
  const requested = (await searchParams).study ?? "E1";
  if (requested !== "E1" && requested !== "E2") notFound();
  const experimentId = requested;
  let info: Awaited<ReturnType<StudyService["gate"]>> | null = null;
  if (
    process.env.STUDY_ENABLED === "true" &&
    process.env.DATABASE_URL &&
    process.env.SESSION_SECRET &&
    Buffer.byteLength(process.env.SESSION_SECRET) >= 32
  ) {
    try {
      info = await transaction((client) =>
        new StudyService(client as unknown as SQL).gate(experimentId),
      );
    } catch {}
  }
  if (info)
    return (
      <main id="main" className="container prose-page">
        <div className="eyebrow">STUDY PARTICIPATION</div>
        <h1>Your choice to participate.</h1>
        <p className="lead">
          Please read the approved study information before deciding.
        </p>
        <EnrollmentForm
          experimentId={experimentId}
          consentVersion={info.consent_version!}
          consentText={info.consent_text!}
          studyContact={info.study_contact!}
        />
        <Link className="text-link" href="/study/session">
          Return to an existing session →
        </Link>
      </main>
    );
  return (
    <main id="main" className="container prose-page">
      <div className="eyebrow">PARTICIPATION STATUS</div>
      <h1>Research enrollment is closed.</h1>
      <p className="lead">
        The study is in development. We aren’t collecting participant data yet.
      </p>
      <p>
        Enrollment will open only after the research protocol, consent
        materials, content and required infrastructure have been approved and
        tested. Minors require a separately authorized guardian-consent and
        assent process.
      </p>
      <Link className="button button-primary" href="/demo/water-cycle">
        Explore the public lesson demo →
      </Link>
      <p>
        <Link href="/study/session" className="text-link">
          Return to an existing study session →
        </Link>
      </p>
    </main>
  );
}
