import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Headphones,
  MoveUpRight,
  Layers3,
  Eye,
  Leaf,
} from "lucide-react";
import { WaterDiagram } from "@/components/learning/water-diagram";
import { Button } from "@/components/ui/button";
import { DensityOverview } from "@/components/learning/density-overview";
export default function Home() {
  return (
    <main id="main">
      <section className="container hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="tiny-line" /> SCIENCE THROUGH VISUAL LEARNING
          </div>
          <h1>
            Science,
            <br />
            <span>step by step.</span>
          </h1>
          <p>
            Explore five science courses. Each teaches the same lesson in three
            visual densities, followed by an identical knowledge check.
          </p>
          <div className="hero-actions">
            <Button asChild>
              <Link href="/courses">
                Explore the courses <ArrowRight size={18} />
              </Link>
            </Button>
            <span className="hero-note">Public demo · No account required</span>
          </div>
        </div>
        <div className="hero-art">
          <div className="art-top">
            <span>
              <span className="status-dot" /> THE WATER CYCLE
            </span>
            <BookOpen size={18} aria-hidden="true" />
          </div>
          <WaterDiagram condition="high" />
          <div className="art-caption">
            <span className="round-icon">
              <Leaf size={19} />
            </span>
            <div>
              <strong>Four processes, one continuous cycle</strong>
              <span>Earth science · Five narrated chapters</span>
            </div>
            <span className="art-arrow">
              <MoveUpRight size={21} />
            </span>
          </div>
        </div>
      </section>
      <section className="principles-strip">
        <div className="container principles">
          <div>
            <Eye />
            <span>See the idea</span>
            <p>Read the explanation alongside its diagram.</p>
          </div>
          <div>
            <Layers3 />
            <span>Build it step by step</span>
            <p>Move between chapters and replay narration.</p>
          </div>
          <div>
            <BookOpen />
            <span>Make it stick</span>
            <p>Try a separate practice quiz after the lesson.</p>
          </div>
        </div>
      </section>
      <section className="container discoveries">
        <div className="section-heading">
          <div>
            <div className="eyebrow">FEATURED COURSE</div>
            <h2>The Water Cycle</h2>
          </div>
          <Link href="/courses" className="text-link">
            Explore lessons <ArrowRight size={17} />
          </Link>
        </div>
        <Link href="/courses/water-cycle" className="featured-course">
          <div className="course-art">
            <WaterDiagram condition="medium" />
            <span className="course-tag">EARTH SCIENCE</span>
          </div>
          <div className="course-info">
            <span className="pill">EARTH SCIENCE</span>
            <h3>The Water Cycle</h3>
            <p>
              Learn about evaporation, condensation, precipitation and
              collection.
            </p>
            <div className="course-meta">
              <span>
                <Clock3 size={15} /> 5–8 min
              </span>
              <span>
                <BookOpen size={15} /> 5 chapters
              </span>
              <span>
                <Headphones size={15} /> Narrated
              </span>
            </div>
            <span className="text-link">
              View lesson <ArrowRight size={18} />
            </span>
          </div>
        </Link>
      </section>
      <div className="container">
        <DensityOverview />
      </div>
      <section className="container approach-note">
        <span className="round-icon">
          <BookOpen size={21} />
        </span>
        <div>
          <h3>About the research project</h3>
          <p>
            We’re exploring how visual design shapes learning. You can try our
            lesson demo freely; research participation is a separate,
            consent-based experience.
          </p>
        </div>
        <Link href="/about" className="text-link">
          Meet VisualLearn <ArrowRight size={18} />
        </Link>
      </section>
    </main>
  );
}
