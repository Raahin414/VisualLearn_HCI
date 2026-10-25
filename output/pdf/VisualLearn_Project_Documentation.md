# VisualLearn
## Experimental plan for the E1 visual-density study

### Research question

Does the amount of visual material on a learning page affect how well students understand and remember the same lesson? We will compare three presentations of one Water Cycle course. The main outcomes are immediate learning and one-hour retention; we will also ask how clear, distracting and mentally demanding the lesson felt.

### Study design

This is one **between-participant experiment**. Each volunteer sees only one assigned version: low, medium or high visual density. All versions contain the same five chapters, factual text, narration recordings, learning objectives, essential diagram meaning, navigation controls and assessment questions. Students cannot choose or change their assigned version during the study.

| Assigned version | Visual presentation |
| Low | Core text, narration and one essential whole-cycle diagram |
| Medium | The same core material, plus supporting callouts and two process illustrations |
| High | The same core material, plus four process illustrations, repeated labels and decorative details |

Added illustrations repeat ideas already explained in the shared lesson. They do not add facts needed to answer the tests. We will review screenshots and lesson accuracy before using these versions with participants.

### What we expect to learn

More visuals may support understanding, but they may also compete for attention. We will compare the measured outcomes rather than assume that medium density is best. This experiment tests the **whole visual-density package**; it cannot separately measure the effects of useful illustrations, repeated labels and decoration.

### Current status

The E1 application and research workflow are implemented and have been tested with synthetic data. We have **not conducted a human participant study** or obtained results. Teacher/supervisor review, any required ethics approval, an approved pilot and a final analysis plan must come before recruitment.

---
# Participant procedure

### Before recruitment

We will agree on the participant target, sample size, recruitment method, device and language policy, study timing, consent wording, data retention and analysis plan with our teacher/supervisor. An educator will review the lesson, answer keys and rubrics. We will test the hosted workflow using synthetic records and pilot it only after the required approvals.

### The planned participant journey

| Step | What the participant does | What the study records |
| 1. Consent | Reads the information sheet and agrees voluntarily | Consent and eligibility decision |
| 2. Baseline | Answers an eight-item quiz before the research lesson | Starting knowledge, age band and prior familiarity |
| 3. Assignment | Receives one saved density from the server | Low, medium or high condition |
| 4. Lesson | Studies the same five Water Cycle chapters | Chapter progress and limited interaction events |
| 5. Immediate test | Writes recall and scenario answers, then takes an eight-item quiz and experience survey | Immediate learning and reported experience |
| 6. One-hour test | Returns for a parallel quiz, written answers and brief follow-up survey | Delayed retention and interim topic review |

The current enrollment flow accepts adults aged 18-30. Minors remain blocked unless a separate guardian/assent process is reviewed and implemented. Participation is voluntary, and a participant may withdraw.

### Assignment and control of timing

After the baseline quiz, the server balances assignment among the three versions within age bands, using randomness to break ties. The saved condition persists when a participant refreshes or returns. The one-hour test opens **60 minutes after server-recorded lesson completion**. The draft completion window is from +60 to +90 minutes; the final window and late policy require approval. A secure return link supports the delayed visit.

The optional seven-day test is outside the required E1 procedure and remains disabled until separately reviewed. It will not replace a missing one-hour result.

---
# Measurements and scoring

### Learning outcomes

| Time | Measures | Purpose |
| Before lesson (A) | Eight objective questions | Record starting knowledge |
| Immediately after (B) | Written recall, scenario explanation, eight objective questions | Measure immediate learning |
| One hour later (C) | Parallel written and objective questions | Measure retention |

Objective questions cover the same blueprint: factual recall, process order, diagram labeling, concepts and transfer to a new example. Each item is worth one point, giving an objective score out of eight at A, B and C. Matching topics alone does not prove the forms have equal difficulty; we will review them before the main study.

Written recall has a 10-point rubric and the scenario has a 4-point rubric. Two researchers will rate written answers independently without seeing the assigned density, then resolve disagreements using the rubric. At B, written answers come before the objective questions so that answer choices do not cue the open responses. Correct answers are withheld during the assessment sequence.

### Experience and behavior measures

The immediate questionnaire asks about clarity, overload, distraction, pacing and effort. The one-hour questionnaire asks whether the student reviewed or discussed the topic between tests. These are project-designed questions, not validated psychological scales. We will describe their responses separately from test scores.

The application also records limited navigation, audio and page-visibility events. They may help explain patterns of use, but they do not prove that a student paid attention. Screen size, scrolling, English comfort and prior familiarity will be documented because they may affect the experience.

### Main comparison

Our draft primary outcome is the **immediate objective score as a percentage**, compared across the three assigned densities while accounting for baseline score. We will also compare one-hour retention, written-answer scores and experience responses as secondary outcomes. The final primary endpoint, sample size, statistical model and uncertainty reporting will be fixed before main-study data collection.

---
# Analysis and research safeguards

### Planned analysis

- Check enrollment, condition balance, completed lessons and missing follow-ups. Report each condition's participant count and baseline score before interpreting outcomes.
- Compare the primary immediate score across low, medium and high density, adjusting for baseline knowledge according to the approved analysis plan. Report estimates and uncertainty.
- Examine one-hour scores, change from immediate performance, written rubric scores and questionnaire responses as secondary findings.
- Inspect missingness and sensitivity to missed follow-ups. Do not turn missing answers into zero scores. Keep different frozen lesson versions in separate cohorts.
- Explain limitations: the visual changes come as packages; participants may use different screen sizes; the one-hour interval and unvalidated experience questions limit generalization.

No statistical conclusion will be presented as a human finding until an approved study has actually collected participant data. Synthetic demonstrations and tests are labeled separately.

### Data handling

Study records use pseudonymous identifiers. PostgreSQL/Supabase stores consent, saved assignment, answers, scores, timing and questionnaire responses. Researchers use protected sign-in with two-factor authentication; exported data excludes withdrawn participants. Withdrawal also disables participant return access. Written answers will be checked for volunteered identifying details before external sharing.

The retention, deletion, backup and sharing procedures need review before recruitment. We will document incomplete responses and follow-up loss transparently. Participants receive the approved debrief after the required sequence, with feedback timing set by the final protocol.

### Approval gates

Before the main experiment: confirm lesson accuracy and narration rights; review eligibility, consent, assessment equivalence and rubric; agree on sample plan, timing, privacy and analysis; complete accessibility checks and a hosted synthetic workflow; obtain required approvals; then run an approved pilot and resolve its problems.

---
# Application and project deliverables

### How the application supports the experiment

The website provides the Water Cycle lesson, narration, responsive density views, progress recovery, assessments and a participant return link. The server controls assignment, answer scoring, follow-up eligibility and duplicate submission handling. A separate public lesson and practice quiz let visitors explore the material without entering the research study.

Researchers can inspect progress and condition balance, rate open answers, resolve scoring disagreements and export de-identified E1 data. The same shared lesson content drives every density, making the visual presentation the controlled difference. Research records remain in a private database rather than in a student's browser.

### Implementation and verification

The application uses Next.js, React and TypeScript, with PostgreSQL/Supabase for research records and Python for later analysis. Automated checks cover assignment persistence, timing, secure access, data integrity and key accessibility behavior. Manual educator, device and screen-reader reviews remain part of preparation for human testing.

### What we will submit

- The working E1 application with three visual-density versions of one course.
- The reviewed study protocol, consent materials, assessments, rubrics and analysis plan.
- Testing evidence, an approved pilot record and the final participant study only if authorization is obtained.
- A results report that distinguishes measured findings, missing data, limitations and synthetic demonstrations.

Our immediate next step is to complete the reviews and approval gates, then run the approved pilot. The experiment remains E1 only; there is no need to build eight separate experiments for this project.
