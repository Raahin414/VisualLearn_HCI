import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Headphones,
  MoveUpRight,
  Sparkles,
  Layers3,
  Eye,
  Leaf,
} from "lucide-react";
import { WaterDiagram } from "@/components/learning/water-diagram";
import { Button } from "@/components/ui/button";
export default function Home() {
  return (
    <main id="main">
      <section className="container hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="tiny-line" /> BIG IDEAS. CLEARER PICTURES.
          </div>
          <h1>
            A little wonder.
            <br />A world of
            <br />
            <span>understanding.</span>
          </h1>
          <p>
            See how things work. Connect the dots.
            <br /> Discover science through lessons that bring
            <br className="desktop-break" /> every idea into focus.
          </p>
          <div className="hero-actions">
            <Button asChild>
              <Link href="/courses">
                Find your next discovery <ArrowRight size={18} />
              </Link>
            </Button>
            <span className="hero-note">
              Free to explore. Made for curious minds.
            </span>
          </div>
        </div>
        <div className="hero-art">
          <div className="art-top">
            <span>
              <span className="status-dot" /> A WORLD IN MOTION
            </span>
            <Sparkles size={18} />
          </div>
          <WaterDiagram condition="high" />
          <div className="art-caption">
            <span className="round-icon">
              <Leaf size={19} />
            </span>
            <div>
              <strong>One planet. Endless connections.</strong>
              <span>Follow the water. See the bigger picture.</span>
            </div>
            <span className="art-arrow">
              <MoveUpRight size={21} />
            </span>
          </div>
          <div className="floating-note">
            <span>☀</span> It all starts with curiosity.
          </div>
        </div>
      </section>
      <section className="principles-strip">
        <div className="container principles">
          <div>
            <Eye />
            <span>See the idea</span>
            <p>Thoughtful visuals, real understanding.</p>
          </div>
          <div>
            <Layers3 />
            <span>Build it step by step</span>
            <p>Small discoveries that fit together.</p>
          </div>
          <div>
            <BookOpen />
            <span>Make it stick</span>
            <p>Pause, reflect, and put ideas to work.</p>
          </div>
        </div>
      </section>
      <section className="container discoveries">
        <div className="section-heading">
          <div>
            <div className="eyebrow">FOLLOW YOUR CURIOSITY</div>
            <h2>Your next “oh, I get it.”</h2>
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
            <span className="pill">YOUR FIRST DISCOVERY</span>
            <h3>The Water Cycle</h3>
            <p>
              From a sunlit lake to a cloud overhead. Follow water’s remarkable
              journey around our planet.
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
              Take the journey <ArrowRight size={18} />
            </span>
          </div>
        </Link>
      </section>
      <section className="container approach-note">
        <span className="round-icon">
          <Sparkles size={21} />
        </span>
        <div>
          <h3>Thoughtful learning. Thoughtful research.</h3>
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
