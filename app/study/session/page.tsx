import { StudyRunner } from "@/components/study/study-runner";
import { StudyErrorBoundary } from "@/components/study/study-error-boundary";
export const metadata = {
  title: "Study session",
  robots: { index: false, follow: false },
};
export default function Session() {
  return (
    <StudyErrorBoundary>
      <StudyRunner />
    </StudyErrorBoundary>
  );
}
