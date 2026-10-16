import { publicQuestions } from "@/lib/assessments/questions.server";
import { PracticeQuiz } from "@/components/assessments/practice-quiz";
export const metadata = { title: "Water Cycle · Practice" };
export default function Practice() {
  return (
    <main id="main" className="container page-content quiz-shell">
      <div className="eyebrow">PUBLIC DEMO / A MOMENT TO REFLECT</div>
      <h1 className="page-title">Connect the dots.</h1>
      <p className="lead">Eight questions to revisit what you’ve discovered.</p>
      <div className="notice">
        This is practice, separate from the research study. Your answers are
        scored without being saved. Questions are draft and await educator
        review.
      </div>
      <PracticeQuiz questions={publicQuestions("P")} />
    </main>
  );
}
