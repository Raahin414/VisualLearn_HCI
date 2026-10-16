import Link from "next/link";
import { ArrowUpRight, Sprout } from "lucide-react";
export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" href="/" aria-label="VisualLearn home">
          <span className="brand-icon">
            <Sprout size={24} />
          </span>
          Visual<span>Learn</span>
          <span className="brand-dot">.</span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/courses">Explore lessons</Link>
          <Link href="/about">Our approach</Link>
        </nav>
        <Link className="research-link" href="/research">
          For researchers <ArrowUpRight size={15} />
        </Link>
      </div>
    </header>
  );
}
