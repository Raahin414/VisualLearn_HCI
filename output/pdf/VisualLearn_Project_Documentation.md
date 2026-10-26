# VisualLearn
## Five science courses, three visual densities

### Project aim

VisualLearn is an HCI project about how the amount of visual material affects learning. Students can study five science courses: Water Cycle, Photosynthesis, Electric Circuits, Human Digestion and the Solar System. Each course has low, medium and high visual-density presentations. Within a course, the explanatory text and knowledge-check questions are identical across the three versions.

### The visual comparison

| Version | What changes on screen |
| Low | One key-concept graphic with minimal decoration |
| Medium | The same core material plus two supporting visual-label cards |
| High | The same core material plus four supporting cards and repeated labels |

The original narrated Water Cycle lesson has its own five-chapter E1 workflow and richer diagrams. The four new courses use three shorter sections and an immediate four-question quiz. Their current graphics and questions are drafts for educator review. We will not combine the new quiz scores with the older Water Cycle baseline and one-hour scores as if they were the same measure.

### Current state

The five course pages, three density previews, server-assigned recorded attempts, private PostgreSQL storage and researcher Student records view are implemented locally. Recorded participation remains disabled until consent, lesson content, identifier handling and required research approvals are reviewed. No human results are claimed.

---
# Experimental plan

### Research question and design decision

Our planned comparison is whether students assigned to low, medium or high visual density differ in immediate quiz performance within the same course. The density is the experimental factor. Course topic can also affect performance, so we will compare conditions within a course and report each course separately. Before recruitment, the supervisor must decide whether each student takes one course or several, and if several, how to counterbalance course order and account for repeated scores from the same student.

### Before any student is recruited

- An educator will check factual accuracy, question wording, answer keys and whether the added visual cards repeat only facts already taught in the common text.
- The teacher/supervisor will approve the primary outcome, sample target, recruitment method, eligibility, course order, repeated-attempt policy, analysis model and the exact consent/debrief wording.
- The consent will explicitly explain collection and retention of student name and ERP, quiz answers, assigned density and timestamps. Institutional ethics approval will be obtained if required. Only adults can enter the current recorded flow; minors need a separately approved process.
- We will apply the additive database migrations, configure the restricted application login, test a synthetic run on the deployed site and rehearse backup/restore. Real recording gates will stay closed until these steps are complete.

### Assignment and controls

The server assigns the least-used density for the chosen course, with a random tie-break. The student cannot select a density for a recorded attempt. Assignment and result are saved in PostgreSQL. The public preview lets visitors switch densities, but its answers are not recorded. All versions of a course use the same text and four questions. The added visual cards alter visual density, not the facts being taught.

---
# Student procedure and records

### Planned recorded course journey

| Step | Student action | Saved record |
| 1. Choose | Opens one of the five courses | Selected course |
| 2. Identify and consent | Enters full name and ERP, confirms adult status and voluntary participation | Private identity row and consent version |
| 3. Assignment | Starts the course in a server-assigned density | Low, medium or high density |
| 4. Study | Reads the three shared lesson sections | Course attempt and start time |
| 5. Knowledge check | Answers four identical multiple-choice questions | Answers, score out of four and submission time |
| 6. Withdraw, if desired | Withdraws the attempt | Withdrawal time; attempt is excluded from researcher results |

The browser receives an opaque, HttpOnly attempt cookie. Only its hash is stored in the database. A student can refresh the current course and resume the attempt. Answer keys and scoring run on the server. Name and ERP are stored in a separate private identity table, not in the course result row. ERP is self-reported, so the protocol must address duplicate entries or impersonation before recruitment.

### Researcher portal

Researchers sign in through Supabase Auth with an allowlisted account and authenticator-based MFA. The Student records tab shows name, ERP, course, density, progress, score and start time; viewing it is audited. Names and ERP are omitted from de-identified research exports. The original Water Cycle E1 records also gain private name/ERP storage for new enrollments; historical participants without it remain preserved.

---
# Measurements and analysis

### Main five-course measure

The immediate knowledge check has four objective items per course. A response is scored on the server as correct or incorrect; the total ranges from zero to four. We will report condition counts and score distributions for each course. The draft primary comparison is the difference in mean immediate score between low, medium and high density within a course, with uncertainty intervals and the approved model. We will not assume a density works best before seeing approved study data.

### Important limits

The five-course flow currently has no pretest, one-hour follow-up or experience questionnaire. It cannot establish learning gain or retention from these four-item scores alone. Course difficulty differs, and repeated course attempts may create practice effects. Density changes are a package of added cards, labels and page space, so the effect of any single visual element cannot be isolated. The new visual cards are draft concept graphics rather than validated scientific illustrations.

### Original Water Cycle E1 protocol

The existing Water Cycle research sequence remains separate: approved consent, eight-item baseline A, saved density assignment, five narrated chapters, immediate written and objective B plus experience survey, then parallel C and a follow-up survey one hour after server-recorded lesson completion. Its draft primary outcome is immediate percentage correct adjusted for baseline knowledge; delayed retention is a secondary outcome. It requires its own approved consent and narration rights. We will not pool its scores with the shorter course checks.

### Reporting

The final report will state how many students started and completed each course and density, missing/withdrawn records, score summaries, the approved comparisons and limitations. Synthetic test data will be labeled and excluded from human findings. No finding or causal claim is presented before the approved experiment is run.

---
# Application, safeguards and next steps

### Application structure

The website is built with Next.js, React and TypeScript. PostgreSQL/Supabase stores private student identities, assigned course attempts and quiz results. A protected researcher portal displays records; public previews work without a database. Automated local checks cover five course routes, visual-density invariance, balanced assignment, saved scoring, withdrawal, E1 regression behavior, accessibility checks and server-only answer keys.

### Safeguards

Both the original E1 study and the new course-recording flow are closed by default. Each needs approved database consent/content/ethics settings plus its deployment flag. Passwords and database owner credentials are not part of student pages. Student names and ERP are not included in CSV research exports. Withdrawal excludes an attempt from researcher results; a final retention and physical-deletion procedure still needs institutional approval.

### Remaining work

- Review the four new courses, their visual graphics and all question banks with an educator.
- Finalize the design, consent for name/ERP, retention, sample plan and ethics requirements with the teacher/supervisor.
- Apply migrations 007-008, configure restricted Vercel variables and run a synthetic hosted student-to-researcher test.
- Run a backup/restore drill and an approved pilot; correct issues before recruitment.
- Collect results only after approval, then analyze and report each course transparently.

E2-E8 are not needed. The project tests visual density across five courses, with the original Water Cycle follow-up protocol kept distinct from the newer immediate-quiz flow.
