import Link from "next/link";
import { ArrowRight, Clock3, BookOpen } from "lucide-react";
import { WaterDiagram } from "@/components/learning/water-diagram";
export default function Courses() {
  return (
    <main id="main" className="container page-content">
      <div className="eyebrow">LESSON CATALOG</div>
      <h1 className="page-title">
        Science lessons
      </h1>
      <p className="lead">
        Start with the Water Cycle: five narrated chapters, diagrams and a practice quiz.
      </p>
      <div className="catalog-grid">
        <Link className="catalog-card" href="/courses/water-cycle">
          <WaterDiagram />
          <div className="catalog-card-content">
            <span className="eyebrow">EARTH SCIENCE · BEGINNER FRIENDLY</span>
            <h2>The Water Cycle</h2>
            <p>Discover how water connects our planet, one change at a time.</p>
            <div className="course-meta">
              <span>
                <Clock3 size={16} />
                5–8 min
              </span>
              <span>
                <BookOpen size={16} />5 chapters
              </span>
            </div>
            <span className="text-link">
              Explore lesson <ArrowRight size={18} />
            </span>
          </div>
        </Link>
        <div className="catalog-note">
          <span className="big-number">01</span>
          <h2>One complete lesson</h2>
          <p>
            Read each chapter, listen to its narration and use the transcript at any time.
            The practice quiz is separate from research participation.
          </p>
        </div>
      </div>
    </main>
  );
}
