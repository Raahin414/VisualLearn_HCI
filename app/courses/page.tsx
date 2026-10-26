import Link from "next/link";
import { courses } from "@/lib/courses/catalog";
export default function Courses() {
  return <main id="main" className="container page-content">
    <div className="eyebrow">COURSE CATALOG</div>
    <h1 className="page-title">Five science courses</h1>
    <p className="lead">Each course teaches the same material in low, medium, or high visual density. The knowledge check stays identical across the three versions.</p>
    <div className="catalog-grid">
      {courses.map((course) => <Link className="catalog-card" href={`/courses/${course.slug}`} key={course.slug}>
        <div className="catalog-card-content"><span className="eyebrow">{course.category.toUpperCase()}</span>
          <h2>{course.title}</h2><p>{course.summary}</p><span className="text-link">Explore course →</span>
        </div></Link>)}
    </div>
  </main>;
}
