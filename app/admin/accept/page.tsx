import { AcceptInvite } from "@/components/admin/accept-invite";
export const metadata = {
  title: "Researcher account",
  robots: { index: false, follow: false },
};
export default function AcceptPage() {
  return (
    <main id="main" className="container prose-page">
      <div className="eyebrow">RESEARCHER ACCESS</div>
      <AcceptInvite />
    </main>
  );
}
