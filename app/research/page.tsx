import Link from "next/link";
import { experiments } from "@/lib/study/registry";
export default function Research() {
  return (
    <main id="main" className="container page-content">
      <div className="eyebrow">VISUALLEARN RESEARCH</div>
      <h1 className="page-title">
        Research studies
      </h1>
      <p className="lead">
        A platform for studying learning interfaces. Protocols are draft;
        recruitment is closed.
      </p>
      <div className="notice">
        Public demos are available. Human participation awaits supervisor and
        ethics approval, reviewed content and configured research
        infrastructure.
      </div>
      <div className="research-grid">
        {experiments.map((e) => (
          <article className="research-card" key={e.id}>
            <span className="eyebrow">
              {e.id} · {e.technicalTesting ? "TECHNICAL TESTING" : "ROADMAP"}
            </span>
            <h2>{e.name}</h2>
            <p>{e.factor}</p>
            <span className="pill">Draft · disabled for recruitment</span>
          </article>
        ))}
      </div>
      <Link className="text-link" href="/study/enroll">
        Study participation status →
      </Link>
      <p>
        <Link className="text-link" href="/admin">
          Researcher access →
        </Link>
      </p>
    </main>
  );
}
