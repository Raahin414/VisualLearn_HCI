import Link from "next/link";
import { ArrowRight, Clock3, BookOpen } from "lucide-react";
import { WaterDiagram } from "@/components/learning/water-diagram";
export default function Courses() {
  return (
    <main id="main" className="container page-content">
      <div className="eyebrow">A GOOD PLACE TO WONDER</div>
      <h1 className="page-title">
        Explore a little.
        <br />
        <em>Understand a lot.</em>
      </h1>
      <p className="lead">
        One thoughtful lesson. Five connected discoveries. Start with the world
        around you.
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
          <h2>Start with a single idea.</h2>
          <p>
            We’re beginning with one complete science lesson so every detail
            gets the care it deserves. More topics can grow from here.
          </p>
        </div>
      </div>
    </main>
  );
}
