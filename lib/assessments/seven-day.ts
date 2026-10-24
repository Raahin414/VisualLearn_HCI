// Learner-safe optional follow-up metadata; keys stay in questions.server.ts.
export const SEVEN_DAY_VERSION = "1.0-seven-day-draft";
export const SEVEN_DAY_SURVEY_VERSION = "1.0-seven-day-exposure-draft";
export const sevenDayPrompts = {
  freeRecall:
    "Thinking back to the lesson last week, describe how water travels between the ground and the atmosphere. Explain the processes you remember and how the cycle continues.",
  scenario:
    "Two equally wet cloths are hung outside. One is in warm moving air and the other in cool still air. Where does their water go as they dry, and why might the first cloth dry sooner?",
} as const;
