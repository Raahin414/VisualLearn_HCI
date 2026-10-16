import Link from "next/link";
import { ArrowRight, Check, Clock3, Headphones } from "lucide-react";
import { WaterDiagram } from "@/components/learning/water-diagram";
import { lesson } from "@/lib/content/lesson";
import { Button } from "@/components/ui/button";
export default function Course() {
  return (
    <main id="main" className="container page-content">
      <Link className="breadcrumb" href="/courses">
        ← All lessons
      </Link>
      <div className="course-detail">
        <div>
          <div className="eyebrow">EARTH SCIENCE / OUR CONNECTED PLANET</div>
          <h1 className="page-title">
            The Water Cycle<span className="period">.</span>
          </h1>
          <p className="lead">
            A drop of water has a story to tell.
            <br />
            Let’s follow it from Earth to sky, and back again.
          </p>
          <div className="course-meta">
            <span>
              <Clock3 size={17} />
              5–8 minutes
            </span>
            <span>
              <Headphones size={17} />
              Audio + transcript
            </span>
          </div>
          <Button asChild>
            <Link href="/demo/water-cycle">
              Start the lesson demo <ArrowRight size={18} />
            </Link>
          </Button>
          <p className="fine-print">
            No account needed. Demo progress stays in this browser.
          </p>
        </div>
        <WaterDiagram condition="high" />
      </div>
      <div className="detail-bottom">
        <section>
          <div className="eyebrow">WHAT YOU’LL DISCOVER</div>
          <h2>Five ideas. One connected story.</h2>
          <ul className="objectives">
            {lesson.learningObjectives.map((x) => (
              <li key={x}>
                <Check size={18} />
                {x}
              </li>
            ))}
          </ul>
        </section>
        <section className="outline-card">
          <h3>Your journey</h3>
          {lesson.segments.map((s, i) => (
            <div key={s.id}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <p>{s.shortTitle}</p>
              <span>~1 min</span>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
