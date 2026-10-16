import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="container prose-page">
      <h1>A little off the path.</h1>
      <p>We couldn’t find that page.</p>
      <Link href="/courses" className="button button-primary">
        Explore lessons →
      </Link>
    </main>
  );
}
