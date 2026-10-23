import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { AuthLinkForwarder } from "@/components/admin/auth-link-forwarder";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "VisualLearn · Science and visual learning",
    template: "%s · VisualLearn",
  },
  description:
    "A narrated Water Cycle lesson and a draft HCI study platform for visual learning research.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthLinkForwarder />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <footer className="site-footer container">
          <span>VisualLearn · Visual learning research</span>
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
    </>
  );
}
