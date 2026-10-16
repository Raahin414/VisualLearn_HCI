import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "VisualLearn · Make room for understanding",
    template: "%s · VisualLearn",
  },
  description:
    "Explore science one clear idea at a time. An original visual learning experience and HCI research platform.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <footer className="site-footer container">
          <span>VisualLearn · A little curiosity goes a long way.</span>
          <div>
            <LinkFooter />
          </div>
        </footer>
      </body>
    </html>
  );
}
function LinkFooter() {
  return (
    <>
      <a href="/about">About this project</a>
      <a href="/privacy">Privacy & accessibility</a>
      <span>Built for understanding.</span>
    </>
  );
}
