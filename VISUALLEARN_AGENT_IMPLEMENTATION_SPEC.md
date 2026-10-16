# VISUALLEARN — Complete Agent Implementation Specification

**Status:** Implementation-ready engineering plan; **research protocol, consent instruments, age bands, and recruitment pending supervisor/ethics approval**  
**Version:** 2.0 · 16 October 2026  
**Working title:** *VisualLearn: Visual Complexity, Comprehension and Retention in Interactive E-Learning Across Age Groups*  
**Audience:** Autonomous coding agents, engineering collaborators, HCI research supervisors and evaluators.  
**Project type:** Full-stack web application + reproducible HCI experiment; not a production-scale Khan Academy clone.

> **MANDATORY AGENT INSTRUCTION:** Read this entire document before making changes. Build the research-valid minimum viable product (MVP), not an unrelated EdTech demo. Preserve the invariants in §4; implement in the phase order in §17; use the acceptance tests in §18; log assumptions and unresolved decisions in `docs/DECISIONS.md`. Never invent study results, ethics approval, licensing permissions, or participants. A polished interface with invalid experimental controls is a failed implementation.

---

> **V2 ADDENDUM / PRECEDENCE:** Sections 23–35 extend the v1 core into a multi-experiment research platform. Where they conflict with older assumptions (notably assessment stages, delays, condition assignment, and the number of experimental factors), **the v2 sections take precedence**. Implement the primary simple experiment first, then activate additional registered experiments in phases. No agent should interpret the eight experiments as eight factors combined in one underpowered trial.

## 1. Executive summary

Build a polished, mobile-friendly, Khan Academy–inspired learning website where users complete a structured science lesson with narration, diagrams and quizzes. Its unique purpose is to **randomly assign participants to one of three controlled visual-density conditions** (low, medium, high) while keeping learning objectives, instructional wording, narration, assessment difficulty and essential interface functions constant. Collect pseudonymous browser interaction events, pretest results, immediate posttest results, brief self-reported cognitive-load/usability measures, and one-hour (plus optional seven-day) delayed retention results. Researchers can inspect participation and download anonymized datasets.

**First course:** The Water Cycle (evaporation, condensation, precipitation, collection); target 5–8 minutes, 4–6 segments. Additional science modules are stretch work only after the experiment is technically reliable.

**Core outcomes:**
1. A usable deployed learning platform, three visual variants, and robust instrumentation.
2. A dataset allowing exploratory comparisons of comprehension, perceived load, behavior and delayed retention across age bands.
3. Reproducible statistical analysis and transparent research limitations.

**Not in first release:** AI tutors, adaptive ML, recommendation engines, gamification or unrestricted external video content. Adaptation is a future research direction, not an empirically validated feature.

## 2. Provenance and evidence boundaries

**Source supplied by project team:** `Visual_Complexity_in_Learning_Interfaces.pptx` (12 slides). Its description of *Bali et al. (2026)* and findings is based on the team's presentation, **not independent verification of the original paper**. Obtain the primary paper and verify bibliographic details, measures and findings before quoting it in a report.

Presentation's specific baseline:
- The cited study varied pictures in narrated slides, reported recall effects for illustrated versus narrated-only points, and considered attention and language (slides 3–7).
- Team-identified extension gaps: static slides, only immediate recall, no direct observation of during-lesson browser behavior (slide 8).
- Team's proposed system: one narrated lesson, three densities, random condition assignment, dwell/pause/scroll/replay logging, immediate and delayed recall (slides 9–10).
- Expected output: functioning system, analyzable data and design guidance; adaptive density only as groundwork (slide 11).

**Design extensions recommended here, not established by the slides:** cross-age comparison (teacher feedback), pretest, age-stratified assignment, consent workflow, formal content versioning, transfer items, and full-stack architecture.

## 3. Research goal and preregistered questions

**Primary question:** How does controlled visual density in interactive e-learning affect immediate comprehension, after accounting for baseline knowledge?

**Secondary questions:**
- Do visual-density effects differ across three age bands (9–12, 13–17, 18–30)?
- What is retained seven days later?
- How does self-reported cognitive effort vary across conditions?
- Are replay, dwell and navigation patterns associated with outcomes? **Association is not attention measurement or causation.**

**Hypotheses (to confirm with supervisor before collecting data):**
- H1: visual condition is associated with different adjusted immediate learning outcomes (two-sided; do not presuppose medium wins).
- H2: effect sizes differ by age band (exploratory interaction).
- H3: delayed retention differs by condition (exploratory).

**Primary endpoint:** Percentage correct on the immediate posttest, analyzed with pretest score as a covariate. **Secondary:** delayed correct percentage, transfer-item accuracy, validated/age-appropriate self-report cognitive-load measure, task completion, and behavior summaries. Define one primary outcome in advance to avoid cherry-picking.

**Design:** Parallel, between-participant randomized experiment with three assigned interface conditions, stratified within age group. This departs from the **within-subject** procedure described for the cited slide study. Do not call it a direct replication.

**Sample planning:** Feasible pilot target 15–20 per age group (45–60 total, ~5–7/cell). This is **small and underpowered for reliable condition × age comparisons**. Report CIs and exploratory conclusions; perform a power analysis and recruit more if confirmatory claims are desired. No post hoc invention of sample size justification.

**Population risks:** Ages 9–17 are minors; require approved guardian consent, age-appropriate assent and authorized institutional oversight. Do not enroll minors until approval. Avoid collecting exact DOB; store age bands only unless an approved protocol explicitly needs precision. Participants may withdraw; define deletion procedure.

## 4. Experimental invariants (non-negotiable)

1. Each condition teaches identical canonical factual text, objectives, sequence and narration **audio bytes** (or identical TTS output frozen as assets).
2. Every participant can access the same essential controls: play, pause, replay, next/back, progress; buttons must occupy consistently accessible locations.
3. Quiz item objectives, scoring rules, instructions, availability and completion criteria are condition-independent; randomize equivalent question form only if forms are validated.
4. Change the experimental manipulation **visual density**, not reading difficulty, narration length, navigation privileges or quiz hints.
5. Maintain one canonical structured lesson and a deterministic condition-specific renderer. **Never maintain three independently authored lesson scripts.**
6. Every enrollment receives one server-side assignment, persisted across refresh and device reconnect. No client ability to pick a condition; no reassignment on retry.
7. Freeze research-facing lesson assets, question bank, assignment logic and protocol version before the main trial. Sessions record exact content/protocol versions and SHA-256 hashes.
8. All essential facts must remain comprehensible in the low condition. High density may include nonessential decoration but must not obstruct functionality or violate accessibility.
9. Avoid revealing the hypothesis or the assigned condition before assessments; offer debrief after completion.
10. Tracking is opt-in under consent, privacy-preserving and does not claim to measure gaze or cognitive attention.
11. Reject false completion claims; review integrity and real running tests before declaring done.

**Manipulation caution:** More relevant visuals and more decorative visuals are two different factors. This MVP combines them as a **visual-density package** and therefore cannot independently estimate the effect of visual *relevance*. Label conclusions accordingly. For a follow-up factorial experiment, independently vary `supportive_visuals` and `decorative_visuals` while preserving controls.

## 5. Content resources and licensing

**Candidate sources to investigate (not blanket permissions to copy):**
- PhET Interactive Simulations: https://phet.colorado.edu/en/simulations ; code https://github.com/phetsims — excellent simulation inspiration. Review **specific simulation's asset, code, attribution and noncommercial conditions**. Embedded external simulations may hide interaction events and resist manipulation; exclude from controlled experiment unless internal interactions are measurable and visuals can be condition-controlled.
- Oppia: https://www.oppia.org ; code https://github.com/oppia/oppia — lesson flow and guided practice inspiration. Software licensing != licensing for individual lesson assets.
- Kolibri: https://learningequality.org/kolibri/ ; code https://github.com/learningequality/kolibri — LMS architecture inspiration; likely too heavyweight to fork for this experimental MVP.
- Khan Perseus: https://github.com/Khan/perseus — optional interactive exercise renderer; not a license to copy Khan Academy courses.
- CK-12: https://www.ck12.org — education source material; inspect each resource's rights before copying.

**Default recommended content path:** Author original, fact-checked short explanatory copy and self-created SVG/CSS instructional graphics. Maintain `content/SOURCES.md` with URL, creator, title, license, checked date, license evidence, derivative status and attribution display location. Avoid embedding copyrighted videos or artwork without verified license. Agent may research further, but may not pretend third-party resources are unrestricted or bulk-scrape them.

### Course v1: Water Cycle

Canonical learning objectives:
- `LO1`: identify water's liquid-to-vapor transition as evaporation driven by heat.
- `LO2`: explain condensation as water vapor cooling into droplets.
- `LO3`: identify precipitation and explain it in basic terms.
- `LO4`: identify collection/runoff and explain that the cycle repeats.
- `LO5`: order steps correctly and reason about a new weather scenario.

Suggested segments (write scientifically accurate, age-readable scripts; review with an educator):
1. Hook + overview, one cycle diagram.
2. Sun and evaporation.
3. Cooling and condensation.
4. Precipitation.
5. Collection, runoff and repeat.
6. Summary and transition to assessment (optional).

**Lesson assets:** narration MP3/OGG, canonical text, essential diagram SVG, supportive explanatory overlays SVG, nonessential decorations (also accessible/alt-tagged appropriately), poster image fallback. All conditions use the same full narration. Important: avoid auto-playing sound without user initiation. Respect reduced-motion settings while holding displayed learning information constant.

### Visual-condition authoring matrix

| Property | Low | Medium | High |
|---|---|---|---|
| Canonical text / narration | Same | Same | Same |
| Essential instructional diagram | Yes | Yes | Yes |
| Supporting labels/arrows | Minimal | Moderate | Moderate / high |
| Nonessential decorations | None | Few or none | More, explicitly nonessential |
| Motion | Only conceptually necessary | Same core animation | Additional decorative motion, disable on reduced-motion preference |
| Core controls, functionality | Identical | Identical | Identical |
| Quiz access | Identical | Identical | Identical |

Define an explicit density specification per segment (`asset_count`, occupied fraction of viewport, visual edge density/labels, movement elements, relative color variation). Record actual conditions with screenshots at target viewport(s). Do not rely solely on arbitrary image counts.

## 6. UX and design system

**Look:** polished approachable education UI inspired by high-quality learning platforms, not an imitation of copyrighted brand identity. Cream/off-white main canvas, dark readable text, calm blue/teal educational accent, restrained surfaces, clear progress tracker, generous spacing, friendly custom illustrations; clean and not overloaded outside the intentional lesson stimuli.

**Usability:** keyboard operable, visible focus rings, semantic headings, 44px-equivalent touch targets, captions/transcript or equivalent narration access, color-contrast checks, alt text, no information conveyed by color alone, `prefers-reduced-motion`, responsive layout at 360/768/1280px. Avoid letting accessibility accommodations covertly change factual content. Record accommodation selection separately; report sensitivity analysis if needed.

**Student routes:**
- `/` welcome / explanation, no research hypothesis disclosure.
- `/courses` catalog (MVP: one fully working Water Cycle course).
- `/courses/water-cycle` objectives and duration.
- `/study/enroll` participant code, age band, preferred language, consent status; guardian approval workflow if required.
- `/study/pretest` baseline test before lesson exposure.
- `/study/lesson/[lessonId]` assigned condition; multi-segment lesson with progress and narration.
- `/study/posttest` immediate quiz, effort scale, subjective feedback.
- `/study/complete` follow-up instructions and anonymous token information.
- `/study/followup/[token]` delayed test, expires per protocol, ensure no answer/key leakage.
- `/study/debrief` after final participation.
- `/admin/login`, `/admin`, `/admin/participants`, `/admin/sessions`, `/admin/exports`, `/admin/content` (last route optional read-only).

**Research flow:** Enroll -> consent -> pretest -> server stratified randomization -> controlled lesson -> posttest and survey -> secure followup -> debrief. If supervisor prefers randomizing before pretest, document the reason; pretest still must occur prior to exposure.

**Course product affordances:** topic outline, segment completion, visual lesson progress, explanatory diagrams, short practice, success state. During research mode, avoid extra badges/streaks/confetti that could act as uncontrolled visual stimuli. A standalone demonstration mode may permit sample condition selection, but it must be structurally separated and never write demo sessions into research data.

## 7. Technology architecture

**Default:** Next.js (App Router), React, TypeScript strict, Tailwind CSS, shadcn/ui, Zod, PostgreSQL via Supabase, server routes/actions, Vitest, Playwright, React Testing Library, Recharts, Python/pandas/statsmodels for analysis. Prefer version-stable packages already compatible with current environment. No unnecessary microservices, workers or ML.

**Security boundaries:** Browser uses anon/public client only; sensitive writes go via server-validated endpoints with least privilege. Supabase service role key is SERVER-ONLY. Row Level Security enforced on every table; publicly readable tables tightly limited to published course metadata, if needed. Admin auth required and claims verified server-side. Never trust `condition`, `score`, participant ID or completion timestamps supplied by browser.

**Suggested layout:**

```text
visuallearn/
├── app/
│   ├── (marketing)/page.tsx
│   ├── courses/[slug]/page.tsx
│   ├── study/{enroll,pretest,posttest,complete}/page.tsx
│   ├── study/lesson/[lessonId]/page.tsx
│   ├── study/followup/[token]/page.tsx
│   ├── admin/{page.tsx,participants,sessions,exports}/
│   └── api/{enroll,pretest,assignment,events,assessment,followup}/route.ts
├── components/{lesson,study,ui,admin}/
├── lib/{content,experiment,tracking,db,auth,validation,scoring}/
├── content/{lessons,questions,SOURCES.md}/
├── public/{audio,visuals}/
├── db/{migrations,seed}/
├── tests/{unit,integration,e2e}/
├── analysis/{README.md,requirements.txt,analyze.py,templates}/
├── docs/{DECISIONS.md,RESEARCH_PROTOCOL.md,ETHICS.md,QA.md,DEPLOYMENT.md}/
├── .env.example
└── README.md
```

**Config flags:** `STUDY_ENABLED`, `DEMO_MODE`, `FOLLOWUP_DAYS=7`, `EVENT_BATCH_SIZE`, `ADMIN_ALLOWLIST`, `CONTENT_VERSION`, `PROTOCOL_VERSION`, `APP_BASE_URL`. Use a staging deployment with synthetic users and separate database. Never bring staging dummy participants into production analyses.

## 8. Database specification

Use UUID primary keys, UTC `timestamptz`, foreign keys and indexes. Apply migration files in source control. Keep identifiable contact details separate from research events; preferably do not collect any contact information, distribute return links via approved external channels. If follow-up contact is essential, encrypted separate table with strict permissions and retention schedule.

**Required tables:**

```sql
CREATE TYPE visual_condition AS ENUM ('low', 'medium', 'high');
CREATE TYPE assessment_stage AS ENUM ('pre', 'post', 'delayed');

CREATE TABLE experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  protocol_version text NOT NULL,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE lessons (
  id text PRIMARY KEY,
  title text NOT NULL,
  content_version text NOT NULL,
  content_sha256 text NOT NULL,
  published boolean NOT NULL DEFAULT false
);

CREATE TABLE participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_code text UNIQUE NOT NULL,
  age_band text NOT NULL CHECK (age_band IN ('9-12','13-17','18-30')),
  language_band text,
  consent_version text NOT NULL,
  consent_at timestamptz NOT NULL,
  guardian_authorization_verified boolean NOT NULL DEFAULT false,
  withdrawn_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES participants(id),
  experiment_id uuid NOT NULL REFERENCES experiments(id),
  condition visual_condition NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  algorithm_version text NOT NULL,
  UNIQUE(participant_id, experiment_id)
);

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES participants(id),
  lesson_id text NOT NULL REFERENCES lessons(id),
  assignment_id uuid NOT NULL REFERENCES assignments(id),
  content_version text NOT NULL,
  protocol_version text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'started',
  device_class text,
  accommodation_json jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id),
  client_event_id uuid NOT NULL UNIQUE,
  event_type text NOT NULL,
  segment_id text,
  elapsed_ms integer CHECK (elapsed_ms >= 0),
  client_time timestamptz,
  server_received_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX events_session_time_idx ON events(session_id, server_received_at);

CREATE TABLE questions (
  id text PRIMARY KEY,
  lesson_id text NOT NULL REFERENCES lessons(id),
  objective_id text NOT NULL,
  stage assessment_stage NOT NULL,
  format text NOT NULL,
  prompt_json jsonb NOT NULL,
  answer_key_json jsonb NOT NULL,
  item_version text NOT NULL
);

CREATE TABLE responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES participants(id),
  session_id uuid REFERENCES sessions(id),
  question_id text NOT NULL REFERENCES questions(id),
  stage assessment_stage NOT NULL,
  answer_json jsonb NOT NULL,
  is_correct boolean NOT NULL,
  answered_at timestamptz NOT NULL DEFAULT now(),
  duration_ms integer,
  UNIQUE(participant_id, question_id, stage)
);

CREATE TABLE surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES participants(id),
  instrument text NOT NULL,
  instrument_version text NOT NULL,
  stage assessment_stage NOT NULL,
  answers_json jsonb NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE followup_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL UNIQUE REFERENCES participants(id),
  token_hash text NOT NULL UNIQUE,
  available_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  redeemed_at timestamptz
);
```

**Implementation refinements required:** create robust server-side session ownership authentication (signed HttpOnly session cookie, CSRF protection where applicable), row access policies, scoring logic inaccessible to clients, and soft/hard participant withdrawal workflows. `questions.answer_key_json` must NEVER be exposed through public queries or preload payloads. Consider private schema for keys/admin-only resources. Real participants may have one designated session per experiment; add unique constraint matching finalized protocol. Do not store raw IP addresses, full user-agent fingerprints, or full URL parameters in event logs.

## 9. Deterministic assignment algorithm

**Requirement:** condition balanced within `age_band`, not globally only. Execute inside one database transaction / stored function or use serializable transaction / advisory lock per (`experiment_id`,`age_band`) to avoid concurrent assignment races. Count prior assignments per group; select among least-filled conditions with seeded secure random tie-breaking. Persist one assignment with unique constraint and return existing assignment upon retries. Define whether withdrawn participants count in balance before recruitment.

Pseudocode:

```ts
async function assignOnce(participantId: string, experimentId: string) {
  return await database.transaction(async (tx) => {
    const p = await tx.lockParticipant(participantId);
    if (!p.consentVerified) throw new Error('Consent required');
    const existing = await tx.getAssignment(participantId, experimentId);
    if (existing) return existing;
    await tx.lockAgeStratum(experimentId, p.ageBand);
    const counts = await tx.conditionCounts(experimentId, p.ageBand);
    const candidates = conditionsWithMinimumCount(counts);
    const condition = secureRandomChoice(candidates);
    return await tx.insertAssignment({participantId, experimentId, condition, algorithmVersion:'balanced-v1'});
  });
}
```

**Bias warning:** Do not expose counts or permit repeated enrollment to shop for a condition. If preventing duplicate participants is important, use approved procedures that do not require invasive personal data.

## 10. Canonical lesson schema and rendering

Store lesson in JSON / TS with Zod validation; components should be data-driven. Example:

```json
{
  "id": "water-cycle-v1",
  "version": "1.0.0",
  "title": "The Water Cycle",
  "language": "en",
  "narrationMode": "fixed-audio",
  "learningObjectives": ["LO1", "LO2", "LO3", "LO4", "LO5"],
  "segments": [
    {
      "id": "evaporation",
      "heading": "Evaporation",
      "body": "The Sun warms water. Some liquid water changes into water vapor and enters the air.",
      "audioSrc": "/audio/water-cycle/evaporation.mp3",
      "essential": [{"id":"cycle-base","src":"/visuals/cycle-base.svg","alt":"Water cycle with upward water vapor and downward rain"}],
      "supportive": [{"id":"evap-arrow","src":"/visuals/evap-arrow.svg","alt":"Arrow identifying rising water vapor"}],
      "decorative": [{"id":"sun-rays","src":"/visuals/sun-rays.svg","alt":"","decorative":true}],
      "durationSeconds": 65,
      "objectiveIds": ["LO1"]
    }
  ]
}
```

**Note:** This example is schematic, not complete lesson content. An agent must create all 4–6 complete segments, fact-check them, and build unique legitimate assessment questions. A single placeholder paragraph is not acceptable delivery. Use the same content object for all conditions. Render asset tiers based on server-trusted assignment; prevent switching variants mid-study. Render decorative images with empty alt text and `aria-hidden`, and ensure screen-reader access to core explanation across all conditions.

**Component boundaries:** `LessonShell`, `LessonHeader`, `NarrationPlayer`, `DiagramStage`, `SegmentPagination`, `ProgressBar`, `ExerciseCard`, `ResearchEventProvider`, `ConditionRenderer`, `ContentFallback`, `StudyBoundary`. No experimental condition logic scattered through CSS selectors; use a centralized `VisualCondition` configuration.

## 11. Tests and assessments

**Proposed item bank (supervisor validation required):** Build 8–12 items in each stage, aligned to LO1–LO5, with a mixture of recall, causal understanding, and transfer. Avoid a pretest identical to a posttest when that would prime answers. Use parallel question forms and item-level `objective_id` mappings where feasible. Document source, answer rationale, difficulty and review status.

Illustrative questions only:
- Recall: “Which process changes liquid water to water vapor?” Answer: Evaporation.
- Understanding: “Why can water droplets form on the outside of a cold glass?” Answer: Water vapor in air cools and condenses on the glass.
- Transfer: “After a warm puddle gets smaller without runoff, what likely happened?” Answer: Some of the water evaporated.

Do not contaminate the experiment by revealing answers in posttest feedback before the seven-day retention test. Show completion status but withhold answer rationales until debrief if approved. Score on the server with immutable answer keys. Record started/finished timestamps and missing responses. Survey scales must be age-appropriate and supported by cited validation or clearly labeled researcher-created exploratory items (do not call them validated if not).

## 12. Telemetry event contract

**Canonical event names:** `lesson_started`, `segment_entered`, `segment_exited`, `audio_started`, `audio_paused`, `audio_replayed`, `audio_completed`, `navigation_next`, `navigation_back`, `diagram_interacted`, `scroll_checkpoint`, `document_hidden`, `document_visible`, `quiz_started`, `answer_submitted`, `lesson_completed`, `survey_submitted`, `followup_completed`.

```json
{
  "clientEventId": "uuid-v4",
  "sessionId": "opaque-session-uuid",
  "eventType": "audio_replayed",
  "segmentId": "condensation",
  "elapsedMs": 184220,
  "clientTime": "2026-10-08T10:15:00.000Z",
  "payload": {"playbackPositionSeconds": 16.4, "replayCount": 2}
}
```

**Implementation requirements:** shared typed event schema; Zod validation; server authorization that session belongs to participant; allowlist event types/payload fields; bounded batch size and byte size; debounced scroll thresholds (25/50/75/100%), not continuous pointer coordinates; send batches at interval, navigation/unload via suitable mechanism; offline retry with capped queue; `clientEventId` deduplication; monotonic elapsed time plus authoritative server receive time; maintain server logs for rejected batches. Limit payload size. Never trust client-generated conditions or scores.

**Derived metrics:** visible active duration (not just wall-clock duration), pause count, replays per segment, backtracks, highest scroll checkpoint, completion, delayed return. Clearly distinguish browser visibility from cognitive attention. Document how missing/duplicate events are handled.

## 13. Privacy, safety, accessibility and ethics

- No testing with minors before institutional authorization, guardian consent and child assent. Explicitly mark this as **blocked pending approval**.
- Avoid collection of names, emails, DOB and precise locations in research tables. Age band and language band suffice for MVP.
- Consent screens must identify telemetry, retention, debrief, withdrawal and contact person. Approved wording provided by supervisor; agent writes **draft only**.
- Use non-reversible pseudonymous IDs. Optional contact details in separate, restricted/retention-limited storage only with approved consent.
- Provide participant withdrawal route; suppress withdrawn records from analysis and implement appropriate deletion according to approved protocol.
- Never display raw tokens in analytics URLs/logs. Store SHA-256 token hashes only; issue random high-entropy tokens with expiry, one-time use as appropriate.
- Rate-limit study and assessment endpoints, validate CSRF/session cookies, avoid cross-origin leaks, prevent answer-key exposure and parameter tampering.
- Enable suitable HTTPS, secure cookies, admin MFA if supported, database backups, and secret management.
- WCAG-oriented checks: text contrast, focus, keyboard, audio transcripts, adjustable playback, reduced motion, readable fonts, controls with accessible names.
- Visual accommodations can be a confounder. Make accommodations uniform and record them, never deny necessary access to satisfy experimental purity.

## 14. Admin analytics and export

Dashboard must provide:
- participant counts by age band × condition;
- enrollment funnel: consent -> pretest -> lesson -> posttest -> follow-up;
- session anomalies and event ingestion health;
- average immediate and delayed scores with descriptive confidence intervals where sample supports them;
- per-condition outcomes and attrition summaries;
- downloadable anonymized CSV: `participants.csv`, `sessions.csv`, `events.csv`, `responses.csv`, `surveys.csv`, `assignments.csv`, `data_dictionary.csv`.

**Privacy:** admin endpoints server-authenticated, no exposed raw identifiers in exported public reports, optionally map participant IDs to stable anonymized analysis keys. Dashboard cannot mislabel observational correlations as causal effects. No statistical-significance badges based on undersized datasets. Separate demonstration data from study data.

## 15. Analysis deliverables

Provide reproducible `analysis/analyze.py` and `analysis/README.md`. Export schema and example synthetic CSV fixtures. No fabricated empirical findings.

Analytic workflow:
1. Apply preregistered inclusion/exclusion criteria; list missingness and attrition by condition.
2. Describe baseline scores and language/device mix by condition and age band.
3. Primary estimate: adjusted posttest outcome as a function of condition, age band, condition×age interaction (if feasible) and pretest score. With small samples, prioritize simple prespecified models, point estimates, CIs and visualizations over overfit interaction models.
4. Secondary: repeated post/delayed score modeling with participant-level repeated-measures structure; account for item-level outcomes if using binary question data.
5. Plot group distributions and retention changes; clearly distinguish explanatory from exploratory associations.
6. Conduct sensitivity checks for missing delayed data, device type and language.
7. Report limitations: small cell counts, possible pretest priming, content specificity, age-related prior knowledge, visual density confounding helpful/decorative imagery, behavioral event measurement error.
8. Write `analysis/RESULTS_TEMPLATE.md` with placeholders **until data exist**.

Potential model (conceptual, not mandatory implementation syntax):

`post_score ~ condition + age_band + condition:age_band + pre_score`

Avoid presenting this as validated personalized adaptive learning. Design advice should be conditional on observed CIs and robustness.

## 16. API contracts and workflows

Minimum server endpoints (adjust routing consistently):

| Endpoint | Method | Purpose | Key safeguards |
|---|---|---|---|
| `/api/enroll` | POST | Create consented pseudonymous participant | consent version, age band, anti-duplicate, minors policy |
| `/api/pretest` | POST | Score/store baseline test | one-time submission, server keys |
| `/api/assignment` | POST/GET | Get/create assigned condition | transaction, participant ownership |
| `/api/session/start` | POST | Start study lesson | completed pretest, fixed version |
| `/api/events` | POST | Batch event ingestion | session auth, Zod, rate-limit, dedupe |
| `/api/assessment` | POST | Post/delayed answers | stage gating, one-time submission |
| `/api/followup` | POST | Redeem followup token | hash, expiry, eligibility |
| `/api/admin/exports` | GET | Download deidentified research data | admin only, audit trail |

Return consistent error envelopes `{ "error": { "code": "...", "message": "..." } }`; do not expose internal stack traces or answer keys. Use idempotency where retries are expected. Enforce transitions server-side, e.g. `consented -> pretest_complete -> assigned -> lesson_started -> lesson_complete -> posttest_complete -> followup_due -> followup_complete` (plus `withdrawn`).

## 17. Execution plan for coding agent

### Phase 0 — Audit / plan
- Inspect existing repo, package manager, deployment and configuration. **Do not wipe an existing project.**
- Verify study constraints with `docs/DECISIONS.md`; list research/ethics/licensing blockers.
- Generate implementation checklist with milestones; identify required secrets as `.env.example` placeholders.
- Provide brief architecture and schema review before invasive changes.

### Phase 1 — Scaffold and design
- Initialize Next.js strict TS app, linting, formatter, test runner and CI.
- Build branded reusable UI layout, catalog, course preview and navigation.
- Implement responsive/accessibility baselines and screenshot tests.
- Build safe seeded demo mode with clear `DEMO` banner.

### Phase 2 — Content + lesson rendering
- Create original, reviewed-ready Water Cycle script, 4–6 complete segments, high-quality custom SVGs and fixed audio assets (audio may require manual provision/recording; do not claim audio exists if it does not).
- Implement strict canonical schema and deterministic low/medium/high asset renderer.
- Unit tests asserting invariant content/audio/control parity across variants.
- Build lesson navigation with correct focus and media semantics.

### Phase 3 — Database and study lifecycle
- Add migration, seed, RLS, protected API, participant session auth and consent flow.
- Build pretest, assignment locking, session lifecycle, server-side quiz scoring.
- Add robust followup tokens; mock clock in tests to simulate day seven.
- Strictly prevent minors' live enrollment behind approval-config flag until authorized.

### Phase 4 — Instrumentation
- Create typed analytics tracker, deduplicated batching, visibility timing and safe storage.
- Simulate refresh, tab switching, poor network, duplicate POST and navigation interruption.
- Confirm research-mode and demo-mode data isolation.

### Phase 5 — Admin and analysis
- Authenticated dashboard, filtering, funnel, exports and data dictionary.
- Reproducible Python analysis script with synthetic fixtures only.
- Finalize content licensing/attribution registry and ethics/consent draft docs.

### Phase 6 — QA and deployment
- Run unit/integration/e2e suites; fix failures.
- Test mobile widths, keyboard-only, screen-reader smoke, reduced-motion and contrasting conditions.
- Deploy staging, smoke-test full end-to-end participation including simulated followup.
- Document deployment, operational rollback, migration and secret setup.
- Freeze protocol/content before real data collection; no undocumented post-freeze edits.

### Phase 7 — Human research (blocked until approved)
- Obtain supervisor protocol sign-off and applicable ethics approvals.
- Have educator review content/questions; pilot with eligible adults first.
- Recruit appropriately; perform study; collect delayed results; analyze without fabricating outcomes.

**Deliver at the end of each phase:** implemented features, changed files, test commands/results, screenshots where applicable, outstanding blockers and next actions. Mark TODOs explicitly instead of claiming false completion.

## 18. Automated tests and definition of done

**Unit test examples:**
- Low/medium/high conditions all render matching canonical text strings, media hashes, segment sequence, learning objectives and control buttons.
- Extra assets conform to allowed condition tiers and high does not accidentally render hidden text instructions.
- Consent required; age band validated; bad study transitions denied.
- A participant's repeated assignment returns the exact original row.
- Equal allocation counts per age band remain approximately balanced under concurrency.
- Answer keys never serialized to lesson/pretest client responses.
- Score computed server-side, non-editable by participant.
- Duplicate `clientEventId` inserts once; invalid event type rejected.
- Followup unavailable before due date; valid after due date; expired/used tokens denied.
- Withdrawal prevents further collection and marks data appropriately.

**Integration/e2e scenarios:**
1. New consenting adult -> pretest -> assigned condition -> lesson -> immediate quiz -> completion.
2. Refresh halfway through lesson; remain assigned to same condition and resume as specified.
3. Open in second tab; no second assignment or double session completion.
4. Drop connection and replay events; event records are not duplicated.
5. Followup with injected test clock at day 7; delayed answers recorded exactly once.
6. Unauthenticated user cannot view admin or answer keys.
7. Browser with reduced motion still sees the essential concept information.
8. Research mode cannot switch conditions; demo mode cannot affect export datasets.
9. Minor enrollment blocked if `MINOR_RESEARCH_APPROVED=false`.
10. Anonymized export rows join consistently and exclude withdrawn users as per approved policy.

**Acceptance checklist:**
- [ ] Full usable Water Cycle lesson, not placeholder slides.
- [ ] Three defensible, consistent controlled visual conditions.
- [ ] Real persistent PostgreSQL storage and migrations.
- [ ] Complete participant flow, condition assignment and tests.
- [ ] Delayed retention flow tested with mocked time.
- [ ] Robust event capture and complete data dictionary.
- [ ] Functional secured admin dashboard/exports.
- [ ] Passing lint, typecheck, unit and e2e tests.
- [ ] Security/consent/minor constraints satisfied.
- [ ] Clear README, deploy instructions, `.env.example`, citation/licensing register.
- [ ] No fake research results or claims of approval.

## 19. Decisions requiring supervisor/team sign-off

Record answers in `docs/DECISIONS.md`, preserving the proposed defaults and date:

| Decision | Proposed default | Why it matters |
|---|---|---|
| Main design | Between-subject, three conditions | Distinct from cited within-subject study |
| Manipulation | Visual-density package | Relevance and density not separately identified |
| Primary lesson | Water Cycle | Cross-age accessible, conceptually visual |
| Age groups | 9–12, 13–17, 18–30 | Minors, prior knowledge, recruitment |
| Sample size | 45–60 exploratory pilot | Small per-cell N; avoid power claims |
| Retention | 7 days | Follow-up logistics and attrition |
| Study language | English with recorded proficiency | Different language versions confound condition |
| Device policy | Desktop/laptop preferred; record device | Layout size changes visual density |
| Primary endpoint | Adjusted immediate posttest | Multiple comparisons control |
| Cognitive-load instrument | Supervisor-selected validated age-appropriate tool | Construct validity |
| Ethics/minors | Block live minor recruitment pending approval | Participant safety |
| Voiceover | Single frozen audio recording per segment | Narration identity across conditions |
| Research reporting | Exploratory effect estimates and CIs | Realistic inference with low N |

## 20. Initial sprint breakdown (actionable tickets)

**Sprint A (2–3 days):** repo audit, Next.js setup, component theme, homepage, `/courses`, `/courses/water-cycle`, lesson skeleton, responsive checks.

**Sprint B (2–3 days):** complete five content segments; SVG diagram and asset tiers; asset manifest/license register; MP3 placeholders clearly flagged until actual recorded files supplied; conditional rendering; content-parity tests.

**Sprint C (3–4 days):** migrations, auth/session, enrollment/consent draft, pretest/question system, age-stratified transactional assignment and stable resume.

**Sprint D (3–4 days):** narration player, event batching, progress, posttest, survey, retention tokens and simulated time tests.

**Sprint E (2–3 days):** admin metrics, exports, Python analysis scaffold and E2E audit, deployment docs.

Timeline is a planning estimate, **not a guarantee**; fix critical privacy and design validity issues before recruitment. Extra courses only after Sprint E passes.

## 21. Prompt for a coding agent (copy verbatim with this file attached)

> You are the lead full-stack engineer and research-software architect for VisualLearn. Read `VISUALLEARN_AGENT_IMPLEMENTATION_SPEC.md` end-to-end. Your job is to implement a complete, visually polished and experimentally valid web application, not merely a mockup. First inspect the repository and produce a short architecture/invariant audit and a phase checklist. Then work autonomously through Phases 1–6 in priority order, writing real source code, migrations, tests, docs, seeded demo assets, and reproducible analysis scaffolding. Use Next.js/React/TypeScript, Tailwind/shadcn, Supabase/PostgreSQL, typed telemetry, server-side scoring and secure assignment. Keep one canonical Water Cycle lesson and three invariant-preserving render variants. Make research mode and demo mode distinct. Never fabricate consent, approvals, content licenses, study subjects, statistical results, installed services or passing tests. Mark external dependencies and blocked human-research steps clearly. Execute tests and report exactly what passed, failed and could not be run, with commands, outputs and file paths. Keep the implementation deployable, accessible and thoroughly documented. If an existing codebase is present, adapt and preserve it rather than overwriting. Ask for input only when an unresolved decision would materially compromise scientific validity, participant safety, or required external credentials; otherwise document justified defaults and proceed. Finish with working app run instructions, migration instructions, test results, feature checklist and remaining blockers.

## 22. Definition of success

**Engineering success:** A new researcher can clone, configure, run and test the app; a participant can complete an authentic, beautifully designed educational lesson; the system automatically assigns a reproducible visual condition and reliably exports accurate pseudonymous data.

**Research success:** The team can explain exactly what changed across the interfaces, what remained controlled, how knowledge and retention were measured, and what statistical conclusions the study can and cannot support.

**Not success:** Merely copying Khan Academy's appearance, embedding untracked third-party content, making three different factual lessons, reporting click counts as attention, recruiting minors without permissions, or presenting synthetic scores as experiments.

---

### Quick-start commands (to generate/adapt after project initialization)

```bash
# Typical start; inspect the existing project before running commands.
npm install
cp .env.example .env.local
# Fill environment values. Apply versioned DB migrations using chosen tooling.
npm run dev
npm run lint
npm run typecheck
npm run test
npm run test:e2e
```

No actual project repository is created by this specification alone. The implementation agent must create or modify code and verify its execution in the target runtime.


---

# V2 IMPLEMENTATION ADDENDUM — MULTIMEDIA EXPERIMENTS, SURVEYS AND ONE-HOUR RECALL

## 23. Revised scope and evidence status

**Mandatory:** Keep everything in §§1–22 that does not conflict with this addendum: purpose, code organization, privacy/security, source/licensing registry, study lifecycle, design system, backend foundations, Water Cycle content, baseline metrics, CSV exports, and quality gates. Extend rather than throw away the original architecture.

**Why the revision exists:** The research question now includes audio, video, on-screen information density, color, animation, interaction, and multiple channels shown simultaneously. These should be studied as **separate causal manipulations** on the same learning platform, not randomly piled onto one lesson. The proposed mechanisms are hypotheses, **not established study results**. The original presentation covered static versus browser delivery, three visual densities, interaction logs, and immediate/delayed recall; the expanded multimedia experiments and one-hour follow-up are new team proposals requiring supervisor sign-off.

**Primary research question:** Which presentation characteristics (visual density, content modality, chunking, animation, color, interaction, and video) affect immediate comprehension, 60-minute retention, perceived cognitive load, engagement, and transfer, and do these effects vary by age?

**Research execution tiers:**
- **Tier P0 (must implement and conduct first):** E1 visual density with LOW / MEDIUM / HIGH conditions, pretest, immediate assessment, **one-hour follow-up**, and post-lesson surveys. Preserve 7-day follow-up as optional configuration.
- **Tier P1 (implement framework + one or two additional pilots):** E2 multimedia modality and E3 information chunking. Prefer between-participant randomization within each experiment.
- **Tier P2 (implemented only after P0 end-to-end validity):** E4 animation, E5 color/hierarchy, E6 interaction, E7 video format, E8 adaptive personalization (requires a distinct evaluation protocol).
- The **eight experiments are a roadmap**, not eight mandatory human studies. The app must expose all eight as configurable experimental definitions, with inactive/unapproved studies disabled and a detailed code-ready design for each.
- **No false certainty:** No claim of statistical power, "optimal" design, measured attention, or validated adaptive benefit without evidence.

## 24. Experiment registry and manipulation contracts

The system must permit registered studies with independent randomization, eligibility, content snapshots, measures, and analysis. Every experiment must define the **single primary independent variable**, conditions, invariant content, planned outcome, exclusion rules, assessment forms, duration, and current study status (draft / approved / recruiting / closed / archived).

| ID | Study | Primary independent variable | Conditions | Primary exploratory comparison | Confounds to prevent |
|---|---|---|---|---|---|
| E1 | Visual density | Density of visual material | low, medium, high | Adjusted immediate quiz score; 60-min score secondary | Wording, semantic content, duration, controls, diagram meaning |
| E2 | Modality | Presentation channel | text-only; audio-only; text+diagram; audio+diagram | Comprehension and mental effort by modality | Different spoken vs written scripts, audio speed, user language, different facts |
| E3 | Information overload | Amount of content displayed simultaneously | chunked; moderately grouped; all-at-once | Recall/effort with fixed total instructional material | Total word count, self-pacing, total exposure, scrolling amount |
| E4 | Animation | Motion in instructional diagram | static keyframes; step-through frames; continuous animated | Process understanding and transfer | Extra facts revealed only through motion, duration, narration |
| E5 | Color and hierarchy | Color strategy / salience | neutral/minimal; semantic highlights; saturated/decorative | Identification of relevant elements, mental effort | Contrast/accessibility, palette legibility, content not encoded solely by color |
| E6 | Interactivity | Learner control over identical information | passive observe; guided controls; manipulable simulation | Transfer score and behavioral measures | Unequal information, time on task, extra feedback |
| E7 | Video delivery | Medium used for same explanation | narrated video; narrated diagram sequence; interactive sequence | Comprehension/retention and usability | Speaker charisma, footage quality, pace, audio transcript, duration |
| E8 | Adaptation | Visual condition selection policy | fixed randomized; rules-based adaptive | Outcome differences under a preregistered policy | Selection bias, condition switching, feedback loops, incomparable exposure |

### E1 — Visual density
- Low: canonical text/audio + **essential** diagrams only.
- Medium: same core information plus **instructionally supportive** arrows/callouts/diagrams.
- High: same core information plus **additional visual density**, including nonessential illustrations, secondary labels, and decoration; do not create misleading science or unreadable contrast.
- Keep player, progress controls, navigation, and accessibility mechanisms the same.
- Record a visual-complexity audit for each stimulus: number of visible objects, labels, animated objects, occupied area, approximate visual salience, screenshots at defined viewport sizes, and independent reviewer notes.

### E2 — Modality (audio and images)
- Text-only: canonical written script and equivalent verbal description of necessary diagrams if required by learning objective.
- Audio-only: the **same script** read aloud with a blank/minimal content canvas; equivalent accessible transcript may be provided but doing so changes modality and must be recorded as an accommodation.
- Text + diagram: script shown on screen with the canonical explanatory diagram; no audio.
- Audio + diagram: same script in narration plus the diagram; avoid redundant full captions unless subtitles are a separately registered factor.
- Ensure identical factual propositions and objective coverage in each condition. Distinguish **audio narration** from **background music** (background music is excluded from P0/P1 and would be a separate nuisance factor).
- Test playback controls; store playback speed if variable, or lock consistently for the controlled study.

### E3 — Information overload and chunking
- Use identical words, examples, and visuals across all conditions.
- Chunked: one concept per screen; learner advances through several cards.
- Medium: two or three concept blocks visible at once.
- All-at-once: whole mini-lesson in one visually dense page.
- Set consistent navigation opportunity and study time policy; record total active time and number of exposures. Be aware chunking can alter navigation burden—measure it and document it as a limitation.
- Measure immediate/free recall, ordering of water-cycle stages, and a novel scenario question.

### E4 — Animation versus static
- Static: representative meaningful keyframes all available.
- Step-through: same frames displayed using Next/Previous controls.
- Animated: same states rendered continuously at a documented speed.
- All variants have matching informational states. Avoid seizure risks, excessive flashing, and mandatory motion; honor reduced-motion accommodations and tag those sessions separately.
- Outcome: explanation of process order and causal understanding, not just label memorization.

### E5 — Color / visual hierarchy
- Neutral: subdued color, clear headings, usable contrast.
- Semantic: restrained consistent coloring of evaporation, condensation, precipitation, collection; never meaning through color alone.
- Saturated: more accent colors and decorative salience without extra facts.
- Log palette tokens, contrast audits, and visual screenshot snapshots. Avoid deliberately inaccessible conditions. Measure target-finding time only if a separate bounded search task is administered.

### E6 — Interactivity
- Passive: see complete diagrams and explanations but cannot manipulate states.
- Guided: user progresses through the same state sequence.
- Manipulative: user can vary parameters of a simplified model (e.g., heat level) but **facts and quiz preparation stay equivalent**. This may also change depth of learning and is a legitimate treatment only when clearly acknowledged.
- Do not infer attention or comprehension directly from click counts. Log interactions as behavioral measures.

### E7 — Video format
- Same verified script, sequence, learning objectives, voice/narrator, and comparable total duration.
- Video format A: short narrated instructional video built from your own assets.
- Format B: synchronized narrated illustration/diagram slides.
- Format C: self-paced interactive lesson with equivalent narrated clips.
- Include a consistent subtitle policy or register subtitles as a separate experiment; do not silently change caption availability across conditions.
- Do not scrape third-party videos. License and attribution registry mandatory.

### E8 — Adaptive delivery (future research only)
- Control: fixed condition assigned at start, no adaptation.
- Treatment: pre-defined, transparent rule that changes density after a diagnostic interaction/quiz point.
- Specify the rule **before participants are recruited**, and record full policy decisions; do not call this "AI" unless an actual model is used.
- Primary feasibility deliverable is an adapter interface (`AdaptationPolicy`) behind a disabled feature flag. Human adaptive study requires separate approval, adequate design, and analysis of exposure histories.

### Assignment across studies
- A participant should generally enter **one experiment and one condition** during a primary study session. Avoid simultaneous condition switches, accidental repeated exposure to identical assessment answers, or mixed conditions without a registered factorial/crossover protocol.
- Balance assignment within age bands by experiment, not across all experiments globally. Use the existing transactional assignment contract for E1 and extend it for each study's enumerated conditions.
- Store `experiment_id`, `arm_key`, `content_hash`, `stimulus_version`, `randomization_version`, and access accommodations on every relevant session.
- Experiment activation and edits require admin approval. Freeze active stimuli/questions once recruitment begins; any revised version starts a new protocol/stimulus version.

## 25. Updated timeline: immediate + **one hour** + optional seven days

**Yes: the app must automatically deliver and score a quiz and surveys immediately after the lesson AND after one hour.** Define "one hour" **relative to server-recorded lesson completion**, not browser local time. Protocol default: `followup_at = lesson_completed_at + 60 minutes`. Choose a supervisor-approved grace window such as **+60 to +90 minutes after lesson completion**, configurable, and store whether submission was in-window, late, or missed. Never silently replace a missed one-hour score with an immediate score.

**Stage sequence:**
1. Consent/assent + pseudonymous participant registration.
2. Demographics/learning familiarity + optional language/proficiency self-report; capture no exact DOB for minors.
3. Pretest (baseline knowledge, ideally Form A).
4. Server-assigned lesson condition; full lesson with event logging.
5. **Immediate quiz (Form B)**, taken promptly after completion; comprehension/recall/transfer items, no answer feedback until the follow-up sequence is complete.
6. **Immediate questionnaire**: perceived effort, clarity, distraction, usability, optional engagement, accessibility issues.
7. Display completion/return instructions and a one-hour due window. The participant may close the app; no requirement to keep the tab open.
8. **One-hour quiz (Form C)**, unlocked by the server at the intended time. Test recall and application using *parallel* questions that probe the same objectives; no hints or answer previews.
9. **One-hour brief survey** about interim exposure/review and subjective recall effort. Mark if content was revisited or external resources used.
10. Optional **seven-day quiz (Form D)** for longer-term retention, separate from the required one-hour evaluation.
11. Aggregate and export analyzable data; honor withdrawal/deletion policies.

**Recall at both moments:** Include immediate free recall (e.g., "Name the stages and explain what happens in each") and a one-hour equivalent with a slightly different prompt; score using **predefined rubric**, ideally blind to condition, with adjudication for disagreements. Include objective items for scalable scoring (sequence ordering, MCQ, scenario interpretation). Avoid relying solely on the same repeated MCQs because of practice effects.

**Return UX:** At immediate completion, show `Return in ~60 minutes`, the actual date/time window, a copyable single-use or reusable secure study link, and the participant's anonymous code. Avoid public answer explanations before follow-up. A signed token can authenticate the return; retain only a hash in DB. Tokens must not leak in analytics or URLs recorded in event logs. If contact details aren't approved, do not promise email/SMS reminders. Optional local add-to-calendar file or copy instructions, without persistent external notifications, is acceptable.

**Missing follow-up:** Record `not_started`, `completed_in_window`, `completed_late`, `expired`, `withdrawn` separately. Treat missingness as an outcome-quality and attrition issue. No fabricated scores or automatic exclusion without registered rules.

## 26. Concrete study forms and content specifications

All questionnaires must be implemented as functional **forms with validation, keyboard support, save/submit state, server validation, idempotency, timestamps, and a clearly specified versioned schema**. An agent must not put placeholder "Question 1" text in the shipped prototype. Research wording below is **draft content**, not a claimed validated scale. Before publishing any scale under a validated name, verify authorized instrument wording, age appropriateness, interpretation, and citations; otherwise label it a "study-designed questionnaire".

### Form F0 — Participant and consent form (before all testing)
Fields:
- `participant_code` (automatically generated; no identifying name required).
- `age_band`: 9–12 / 13–17 / 18–30; supervisor can amend bands.
- `primary_learning_language`: selectable languages plus other/prefer not to say.
- `language_comfort` (1 very uncomfortable ... 5 very comfortable).
- `prior_topic_familiarity` (1 never heard ... 5 know it very well).
- `device_class` generated as coarse desktop/tablet/mobile; no fingerprinting.
- `participation_voluntary`, `data_use_acknowledgement`, `study_contact_information_viewed` booleans.
- For minors: record separate **guardian authorization verified** and **participant assent**. Implement consent workflows, but do not represent sample checkbox as adequate ethics compliance. Approval process is institution-specific.
- Withdraw button and plain-language explanation of data handling/retention.

### Form F1 — Pretest (Form A; ~3–5 minutes)
Build **8 objective questions** covering 4–5 learning objectives. Suggested Water Cycle item templates:
1. Water heated by the Sun can change into what? [water vapor]
2. Which process describes vapor cooling into liquid droplets? [condensation]
3. Which of these is precipitation? [rain/snow/hail falling from clouds]
4. What can happen to rainwater after it reaches the ground? [collection/runoff/infiltration]
5. Arrange four stages in a coherent cycle. [ordering; accept scientifically coherent starting points]
6. What supplies much of the energy that drives evaporation? [Sun]
7. Why might droplets appear on a cold surface? [condensation; distractors reviewed]
8. If a puddle shrinks on a warm dry day, what process may explain it? [evaporation]

Items must be authored in `content/questions/water-cycle/` with `id`, `form`, `type`, `objective_id`, `stem`, `options`, `correct_answer`, `rationale`, `rubric`, `estimated_difficulty`, `review_status`, and `version`. **Do not display** answer keys or rationales to learners before all assigned follow-ups.

### Form F2 — Immediate knowledge quiz (Form B; ~5 minutes)
- **8–10 items**: 4 recall/recognition, 2 sequencing/labeling, 2 conceptual, 1–2 transfer questions.
- Each item should be a parallel counterpart to a pretest objective, **not a direct duplicate**, and remain equivalent across all experimental arms.
- **Free-recall item:** "Without looking back at the lesson, describe the water cycle in your own words. Include the processes you remember and how they connect." Store verbatim response for rubric scoring.
- **Scenario item:** "Wet clothes dry faster outdoors on a sunny, breezy day. Which process helps explain this, and why?" Evaluate the explanation using a fixed rubric.
- Capture `started_at`, `submitted_at`, `duration_ms`, selected answers, skip flags, client connectivity state, and rubric version.

### Form F3 — Immediate experience questionnaire (2–3 minutes)
All Likert items: **1 Strongly disagree, 2 Disagree, 3 Neither, 4 Agree, 5 Strongly agree**, unless noted. Render one at a time on narrow screens or in accessible groups.
1. "The lesson was easy to follow." (clarity)
2. "There was too much information on the screen at once." (perceived overload)
3. "The diagrams or pictures helped me understand the lesson." (perceived support)
4. "I found it difficult to concentrate on the important parts." (perceived distraction)
5. "The pace of the lesson was comfortable." (pacing)
6. "The audio, if provided, helped me learn." (`not_applicable` allowed; modality-specific)
7. "The moving elements, if present, helped explain the topic." (`not_applicable`)
8. "The colors made important information easy to find." (`not_applicable` if color condition not applicable)
9. "I would be willing to learn another topic using this interface." (acceptability)
10. **Single-item mental effort:** "How much mental effort did this lesson require?" 1 very little to 9 very much (separate scale, explicit anchors).
11. Optional open response: "Which part was confusing or distracting, if any?"
12. Optional open response: "What helped you understand the lesson most?"

Do not sum unrelated questions into a "validated cognitive load score". Provide domain-level descriptive analytics, and keep single-item effort separate.

### Form F4 — One-hour retention quiz (Form C; ~5 minutes)
- Unlock according to server time, not client timers.
- Include **8–10 parallel items**, coverage matched to the immediate test.
- Example alternative process item: "Why can clouds form when moist air cools?" [condensation]
- Example scenario: "A covered glass containing ice develops water droplets on its outside. Explain where the droplets came from." [condensation of water vapor from surrounding air]
- Example free recall: "Without replaying the lesson, explain how water can move from a lake to a cloud and back to the ground. Name the processes you recall."
- Score with locked rubric; show no hints or correctness feedback until assessment completion.
- Use a **different item ordering** from Form B; balance complexity of parallel forms by expert review and a pilot. Parallel prompts do not automatically guarantee psychometric equivalence.

### Form F5 — One-hour short survey (1 minute)
1. "Since the lesson, did you review the topic anywhere?" Yes / No / Unsure.
2. "If yes, what did you use?" This website / notes / another website or video / discussion with someone / other / prefer not to say. Multiple choices allowed.
3. "Since the lesson, did you discuss the material with anyone?" Yes / No / prefer not to say.
4. "How confident are you in what you just remembered?" 1 not at all ... 5 extremely.
5. "How mentally effortful was recalling the material just now?" 1 very little ... 9 very much.
6. Optional: "Anything affected your ability to complete this test?" free text, length limit.

### Form F6 — Optional seven-day test (Form D)
- Use a separately reviewed parallel question set with the same learning objectives and difficulty target.
- Record interim study/review exposure, date/time, and completion status.
- Only enable if instructor approves and team can realistically follow up.

### Rubric for free recall (draft, supervisor review)
Five criteria scored 0/1/2 for a **10-point rubric**: (a) evaporation identified and explained, (b) condensation identified and explained, (c) precipitation identified and explained, (d) collection/runoff identified and explained, (e) causal connections and cyclicity. `0=not present/incorrect`, `1=partial/unclear`, `2=accurate`. Do **not** penalize spelling or language errors unless meaning is not recoverable. Keep anonymized response text; raters cannot see condition or age where avoidable. Store independent rater IDs, scores, discrepancy resolution, and version. If automatic rubric scoring is added, keep manual review as ground truth and do not claim reliable scoring without validation.

### Fairness and accessibility
- Offer consistent font scaling, captions/transcripts when required, keyboard access and reduced-motion settings; log them as accommodations. These can change a modality intervention, so document resulting protocol deviations rather than denying accessibility.
- Younger participants may need reading help; if provided, document standardized help and avoid leaking answers.
- Questionnaire versions and simple language must be approved for each age band. Don't compare age bands using different factual questions without an equating design.

## 27. Schema migration V2 (implement migration files; do not delete V1 data)

**V1 compatibility:** Existing `visual_condition` enum and `assignments.condition` remain for E1. For non-E1 studies, use generalized arm keys. V1 `assessment_stage` enum only supports `pre`,`post`,`delayed`; **do not reinterpret one-hour and seven-day as the same stage**. Introduce explicit timing and form identifiers now; clients must use the new identifiers.

Suggested PostgreSQL extension (adapt to existing migrations and Supabase security policies):

```sql
CREATE TYPE study_status AS ENUM ('draft','approved','recruiting','closed','archived');
CREATE TYPE assessment_timepoint AS ENUM ('pre','immediate','plus_60m','plus_7d');
CREATE TYPE followup_status AS ENUM
 ('not_started','completed_in_window','completed_late','expired','withdrawn');

ALTER TABLE experiments ADD COLUMN IF NOT EXISTS study_code text UNIQUE;
ALTER TABLE experiments ADD COLUMN IF NOT EXISTS status study_status NOT NULL DEFAULT 'draft';
ALTER TABLE experiments ADD COLUMN IF NOT EXISTS primary_outcome text;
ALTER TABLE experiments ADD COLUMN IF NOT EXISTS protocol_json jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE experiment_arms (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 experiment_id uuid NOT NULL REFERENCES experiments(id),
 arm_key text NOT NULL,
 label text NOT NULL,
 factor_config jsonb NOT NULL,
 active boolean NOT NULL DEFAULT true,
 UNIQUE(experiment_id,arm_key)
);

ALTER TABLE assignments ADD COLUMN IF NOT EXISTS arm_id uuid REFERENCES experiment_arms(id);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS stimulus_version text;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS stimulus_sha256 text;

CREATE TABLE assessment_forms (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 experiment_id uuid NOT NULL REFERENCES experiments(id),
 lesson_id text NOT NULL REFERENCES lessons(id),
 form_key text NOT NULL,
 timepoint assessment_timepoint NOT NULL,
 version text NOT NULL,
 published boolean NOT NULL DEFAULT false,
 config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
 UNIQUE(experiment_id,form_key,version)
);

CREATE TABLE assessment_attempts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 participant_id uuid NOT NULL REFERENCES participants(id),
 session_id uuid NOT NULL REFERENCES sessions(id),
 form_id uuid NOT NULL REFERENCES assessment_forms(id),
 timepoint assessment_timepoint NOT NULL,
 opened_at timestamptz,
 started_at timestamptz,
 submitted_at timestamptz,
 due_at timestamptz,
 allowed_from timestamptz,
 deadline_at timestamptz,
 status text NOT NULL DEFAULT 'not_started',
 total_score numeric,
 max_score numeric,
 scoring_version text,
 UNIQUE(participant_id,form_id)
);

CREATE TABLE assessment_answers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 attempt_id uuid NOT NULL REFERENCES assessment_attempts(id),
 question_id text NOT NULL REFERENCES questions(id),
 answer_json jsonb NOT NULL,
 submitted_at timestamptz NOT NULL DEFAULT now(),
 auto_score numeric,
 reviewed_score numeric,
 rubric_version text,
 UNIQUE(attempt_id,question_id)
);

CREATE TABLE scheduled_followups (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 participant_id uuid NOT NULL REFERENCES participants(id),
 session_id uuid NOT NULL REFERENCES sessions(id),
 timepoint assessment_timepoint NOT NULL,
 due_at timestamptz NOT NULL,
 allowed_from timestamptz NOT NULL,
 deadline_at timestamptz NOT NULL,
 status followup_status NOT NULL DEFAULT 'not_started',
 completed_at timestamptz,
 UNIQUE(session_id,timepoint)
);

CREATE TABLE survey_forms (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 experiment_id uuid NOT NULL REFERENCES experiments(id),
 form_key text NOT NULL,
 version text NOT NULL,
 stage assessment_timepoint NOT NULL,
 schema_json jsonb NOT NULL,
 published boolean NOT NULL DEFAULT false,
 UNIQUE(experiment_id,form_key,version)
);

CREATE TABLE survey_submissions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 form_id uuid NOT NULL REFERENCES survey_forms(id),
 participant_id uuid NOT NULL REFERENCES participants(id),
 session_id uuid NOT NULL REFERENCES sessions(id),
 answers_json jsonb NOT NULL,
 submitted_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(form_id,participant_id)
);

CREATE TABLE content_license_registry (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 asset_path text NOT NULL UNIQUE,
 source_url text,
 author text,
 license_spdx_or_label text,
 attribution text,
 redistribution_approved boolean NOT NULL DEFAULT false,
 verified_at timestamptz
);

CREATE TABLE free_recall_ratings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 answer_id uuid NOT NULL REFERENCES assessment_answers(id),
 rater_code text NOT NULL,
 rubric_version text NOT NULL,
 sub_scores jsonb NOT NULL,
 total_score numeric NOT NULL,
 rated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(answer_id,rater_code,rubric_version)
);
CREATE INDEX assessment_attempts_participant_idx ON assessment_attempts(participant_id,timepoint);
CREATE INDEX scheduled_followups_due_idx ON scheduled_followups(status,due_at);
```

**Migration notes:**
- Existing `questions.stage` and `responses.stage` are legacy-only; migrate legacy answers to `assessment_attempts` / `assessment_answers` with explicit timepoints. Do not lose earlier responses.
- Existing `surveys` may stay for backwards compatibility; new questionnaire submissions use `survey_forms` and `survey_submissions`.
- Postgres `ADD COLUMN IF NOT EXISTS` is not a substitute for tested reversible migration scripts. Agent must implement and test forward migrations, rollback strategy, indexes, and Supabase RLS.
- Questions may require a separate `question_items` content system for question versioning, multiple forms, secure keys, item randomization, and free-text scoring. Never expose answer keys via `SELECT *` on public `questions`.
- `assignments.condition` V1 is `NOT NULL`; for non-E1 experiments, migrate to allow NULL or provide a compatible generalized assignment model. **Do not insert fake low/medium/high values for other experiments.**
- Use unique constraints and idempotency keys for all scoring and survey submissions.
- Store exact server UTC due times and display the participant's locale time only as a convenience.

## 28. API endpoints and reliable workflow

All participant endpoints require a signed, HttpOnly, SameSite session cookie or approved equivalent. All admin routes require separate verified admin authorization. CSRF protection for mutation routes, strict zod validation, rate limits, bounded payloads, row-level security, and no answers in client bundles.

| Method | Endpoint | Purpose | Critical behavior |
|---|---|---|---|
| GET | `/api/studies` | Get active approved studies | Never leak draft/unapproved protocols to learners |
| POST | `/api/enroll` | Consent-checked enrollment | Idempotent, age/consent validation |
| POST | `/api/assign` | Atomic assignment | Generalized experiment arm, age strata |
| POST | `/api/pretest/submit` | Score baseline | First valid submission wins |
| GET | `/api/lesson/:id` | Fetch assigned stimulus | Serve only allowed arm and content version |
| POST | `/api/events/batch` | Ingest telemetry | Event IDs idempotent, bounded batches |
| POST | `/api/lesson/complete` | Complete session | Server timestamp, schedule one-hour follow-up atomically |
| GET | `/api/assessments/:timepoint` | Fetch eligible assessment | Server-side window checking; strip answer keys |
| POST | `/api/assessments/:timepoint/submit` | Submit graded test | Prevent resubmit; create score server-side |
| GET | `/api/surveys/:formKey` | Fetch survey schema | Versioned, arm-appropriate questions |
| POST | `/api/surveys/:formKey/submit` | Save questionnaire | Validate options/required fields; idempotent |
| GET | `/api/followup/status` | Show future due windows | No answer information, no forced page open |
| POST | `/api/withdraw` | Request withdrawal | Invalidate links and apply approved retention policy |
| GET | `/api/admin/stats` | Admin dashboard | De-identified aggregation, no public access |
| GET | `/api/admin/export` | CSV export | Admin only; audit export accesses |

**State machine:** `enrolled -> pretest_complete -> lesson_active -> lesson_complete -> immediate_test_complete -> immediate_survey_complete -> waiting_60m -> 60m_test_complete -> 60m_survey_complete -> finished` (optional waiting/completed 7d). Protect transitions server-side. If immediate survey not completed, still preserve the full session and handle return with a clearly documented recovery state.

**One-hour scheduler:** You do not need a background worker to make a follow-up work: persist eligibility timestamps and validate them on every request. For optional reminders, implement an approved scheduled job separately; a `setTimeout` in an open browser tab is not reliable. Late-return grace window and visibility must be tested with fake server clock.

**Return token:** Generate opaque cryptographically secure token; store a hash; rotate on use if using single-use token or bind reusable token to a securely maintained study session. Do not place tokens in analytics payloads or third-party referrers. Prefer copyable URL + anonymous participant code. Avoid collecting emails/phone unless specifically approved.

## 29. Lesson asset plan: real, buildable media

**P0 Water Cycle content** (4–6 segments, 5–8 minutes):
1. Overview: water constantly moves between Earth's surface and atmosphere.
2. Evaporation: solar energy changes some liquid water to vapor.
3. Condensation: cooled vapor forms droplets, contributing to clouds.
4. Precipitation: rain/snow/hail return water to surface.
5. Collection/runoff/infiltration: water collects and moves through surface/ground environments; cycle continues.

**Required files at MVP:**
- `content/lessons/water-cycle/v1.json` containing complete reviewed text, learning objectives, asset variants, and per-condition config.
- `public/audio/water-cycle/*.mp3` approved identical narration across density arms (if audio is a constant in E1). If audio cannot be recorded, do not fabricate mp3 files: mark a content blocker; test with a real locally recorded file or an approved TTS source with documented use rights.
- `public/illustrations/water-cycle/*.svg`: original, accurate, standalone diagrams with accessible text alternatives and essential/supportive/decorative tags.
- `public/animations/water-cycle/`: optional small deterministic SVG/CSS/Lottie animations; no unexpected autoplay or flashing.
- `public/video/water-cycle/`: own narrated video only for E7 when implemented; provide poster, caption file, transcript and license manifest.
- `content/questions/water-cycle/forms/{A,B,C,D}.json` reviewed parallel question banks.
- `content/surveys/{F0,F3,F5}.json` functional versioned form definitions.
- `docs/CONTENT_SOURCES.md` and `docs/STIMULUS_AUDIT.md` with source URLs, license validation, screenshots and known confounds.

**External material:** Educational ideas may be informed by PhET, Oppia, CK-12, Kolibri, and Perseus; these are **not automatically importable content**. Verify each *specific* asset and its license before copying or embedding. Prefer original diagrams/audio and openly licensed factual sources. Don't assume that a free-to-view lesson has permissive redistribution terms.

**UI requirements:** Polished and age-neutral Khan Academy–inspired app without copying its branding or proprietary resources. Responsive course overview, attractive progress navigation, keyboard-operable accessible media controls, thoughtfully designed visual lesson canvas, form state/error messages, researcher dashboard. The research stimulus must not accidentally vary font readability, facts, available controls, or colors when these aren't the manipulated factors.

## 30. Analytics dashboard and export specifications

**Admin dashboard tabs:**
1. **Study overview:** approved/draft studies, eligible participants, enrollment counts and randomization balance by arm/age.
2. **Research funnel:** enrollment -> pretest -> lesson -> immediate quiz -> immediate survey -> 60-min quiz -> 60-min survey -> optional 7d.
3. **Performance:** score distributions, adjusted descriptive means, recall rubric, transfer scores, completion times.
4. **Retention:** immediate versus one-hour scores, paired change, completion timing, external review exposures, optional 7-day results.
5. **Behavior:** active time, segment visits, pauses, replays, navigation, tab visibility changes (descriptive, not mind-reading).
6. **Survey responses:** question distributions, response completeness, mental effort separately, age and condition breakdowns.
7. **Data quality:** missing records, interrupted sessions, incompatible accommodations, content/protocol version mismatches, duplicate events, out-of-window attempts.
8. **Research export:** codebook, de-identified participants, arm assignments, item responses, rubric ratings, questionnaires, follow-ups, events, consent metadata excluding contact info, and protocol snapshots.

**CSV files**: `participants_deidentified.csv`, `assignments.csv`, `sessions.csv`, `assessment_attempts.csv`, `item_responses.csv`, `free_recall_ratings.csv`, `surveys.csv`, `followup_status.csv`, `events.csv`, plus `codebook.json` and `data_dictionary.md`.

**Plot examples:** grouped immediate and 60-minute scores by arm and age; within-participant retention changes; missingness by arm; mental effort distribution; time spent/replay histograms; score versus interaction metrics with caution against causal claims for observations.

**Statistics:** Preregister primary E1 contrast and exploratory age interaction. Immediate and 60-minute outcomes should be analyzed separately or in a repeated-measures model accounting for participant; adjust for baseline knowledge. Prefer confidence intervals/effect sizes, report small-sample uncertainty and missing follow-up patterns. Don't assume equal interval scaling for all survey data; don't present an invented "engagement score" as validated. Explicitly document comparisons and control multiplicity when needed.

## 31. Updated codebase layout (extend initial structure)

```text
visuallearn/
  app/
    (public)/courses/
    study/[studyCode]/enroll/
    study/[studyCode]/pretest/
    study/[studyCode]/lesson/
    study/[studyCode]/immediate/
    study/[studyCode]/waiting/
    study/[studyCode]/followup/
    study/[studyCode]/complete/
    admin/(dashboard)/
    api/{enroll,assign,events,lesson,assessments,surveys,followup,withdraw,admin}/
  components/
    learning/{LessonShell,ConditionRenderer,NarrationPlayer,DiagramCanvas,VideoPlayer,MediaTranscript}/
    experiments/{StudyGate,ConditionIndicatorDevOnly,ExperimentRenderer}/
    assessments/{QuizRunner,FreeRecallInput,OrderingQuestion,FeedbackGate}/
    surveys/{SurveyRenderer,LikertItem,MentalEffortItem,ConsentFlow}/
    admin/{StudyOverview,RecruitmentFunnel,RetentionChart,QualityWarnings,ExportPanel}/
  content/
    lessons/water-cycle/v1.json
    questions/water-cycle/forms/{A,B,C,D}.json
    surveys/{F0,F3,F5}.json
    experiment-definitions/{E1,E2,E3,E4,E5,E6,E7,E8}.json
  lib/
    study/{assignment,state-machine,followup-schedule,eligibility,experiment-registry}.ts
    assessments/{scoring,rubrics,form-validator}.ts
    telemetry/{event-schema,client-queue,ingestion}.ts
    security/{participant-session,return-token,authorization}.ts
    content/{loader,content-integrity,license-registry}.ts
    db/{client,queries}.ts
  public/{audio,illustrations,animations,video}/water-cycle/
  supabase/migrations/
  scripts/{seed,verify-content,export-study,run-analysis}/
  tests/{unit,integration,e2e,accessibility,fixtures}/
  research/{protocols,analysis,sample-data}/
  docs/{DECISIONS,IMPLEMENTATION_PROGRESS,CONTENT_SOURCES,STIMULUS_AUDIT,DATA_DICTIONARY,DEPLOYMENT,PRIVACY}/
  README.md
  .env.example
```

**Agent workflow:** Before creating directories, inspect the existing repository and reconcile with its framework; do not destroy functional components or source history. Create a feature branch when Git is present. Mark each deliverable in `docs/IMPLEMENTATION_PROGRESS.md`, citing files and test output. No hard-coded passwords, Supabase service-role keys in client code, or fabricated results.

## 32. Phased execution plan for Claude Code and Codex

**Phase 0 — Read/audit:** Read **all sections** of this file, inspect existing files, package scripts, env example, tests, and DB migrations. Produce concise `docs/DECISIONS.md` identifying blocked research approvals versus safe engineering decisions. Never pause for nonblocking questions; use explicit defaults from this spec.

**Phase 1 — Architecture and baseline:** Setup working Next.js/TypeScript app, migrations, session authentication, participant enrollment/consent UI, an admin-only area, lesson content engine, accessibility and error handling. Add `.env.example`, `.gitignore`, reproducible run commands.

**Phase 2 — Complete content:** Author fact-checked Water Cycle lesson, original SVG diagrams, approved audio, 3 density variants, full Form A/B/C question banks with explanations stored server-side, Form F0/F3/F5 survey schemas. Build correct condition renderer. No lorem ipsum, empty asset files, or TODO quizzes in MVP.

**Phase 3 — Research lifecycle:** Implement E1 age-stratified balanced assignment, state machine, pretest, lesson completion, immediate test and questionnaire, server-scheduled one-hour retention test and short survey. Add secure session recovery, delayed availability, status display, attempt idempotency, and missing/late distinctions.

**Phase 4 — Telemetry/admin:** Implement reliable event queue and ingestion, researcher dashboard, cohort comparisons, event analysis, anonymized CSV exports, codebook, analytics permission checks, withdrawal.

**Phase 5 — Experiment platform:** Seed typed valid definitions E1–E8 with E1 approved-for-technical-testing only (research status remains draft until ethics/supervisor approval); E2/E3 feature-complete only after E1 validated; E4–E8 behind disabled feature flags. Add renderer strategy interfaces so studies don't conflict.

**Phase 6 — Quality:** Run lint, typecheck, unit/integration tests, Playwright E2E, axe-core or equivalent accessibility audits, mobile/desktop visual checks, migration tests, return timing tests with fake clock, and export checks. Fix all critical errors. Write deployment/runbook and known limitations.

**Phase 7 — Research/human evaluation:** Explicitly blocked until ethics/consent requirements satisfied. Do not create synthetic participants and present them as genuine. Test synthetic fixture data with `SYNTHETIC` labels only.

**Required handoff between autonomous runs:** at end of each run update `docs/IMPLEMENTATION_PROGRESS.md` with completed work, commands run, passing/failing tests, blockers, next 3 precise tasks, current branch/commit, and unresolved research decisions. This prevents Claude/Codex context resets from losing implementation state.

## 33. Acceptance test matrix: minimum shippable implementation

| Test | Expected result |
|---|---|
| Enroll eligible adult | Creates consented pseudonymous participant and secure session |
| Enroll minor lacking verified authorization | Block study participation, preserve minimal/no unnecessary data |
| Two concurrent enrollments same age band | Balanced transactional assignment, no duplicate assignment |
| User refreshes midlesson | Same condition, same content hash, progress restored |
| Change viewport width | Content remains usable and scientifically equivalent |
| Low vs medium vs high content audit | Identical learning objectives, factual script and quiz bank; only declared stimulus layers differ |
| Complete lesson | Saves authoritative server completion timestamp, creates one-hour task exactly once |
| Follow-up opened 30 min later | Not allowed; due information shown without test content |
| Follow-up opened 60 min later | Eligible, Form C loads, answer keys never sent |
| Follow-up opened during approved grace | Labeled in-window; submission persisted once |
| Follow-up after deadline | Correct late/expired behavior; no silently fabricated score |
| Browser closed immediately after lesson | Follow-up still available on return via secure recovery mechanism |
| Immediate quiz submitted twice | Scores/answers not duplicated or overwritten |
| Attempt to query another participant's data | Access denied via authorization and RLS |
| Form F3 and F5 | All required fields validated; N/A works where applicable |
| Free-recall rating | Blind raters can independently score and log rubric version |
| Consent withdrawal | Participant blocked from future access and data handled per approved policy |
| Accessibility | Keyboard-only navigation, contrast, semantic markup, screen reader form labels, no harmful flashing |
| Export | Real database-backed anonymized CSVs with documented schemas, no PII/contact fields |
| E2–E8 disabled | Cannot accidentally expose underdeveloped conditions to participants |

**Non-negotiable CI checks:** `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:e2e`, `npm run build`, and DB migration/seed validation scripts documented in README. Agents may need to implement missing scripts; do not claim they ran unless outputs confirm it.

## 34. Supervisor decisions: explicitly do not invent answers

Record these as unresolved until approved (the app can use drafts/configs safely in development):
- Which age ranges can ethically be recruited, and whether child assent + guardian permission mechanisms are sufficient.
- Whether 60-minute test window is 60–90 minutes, 60–120 minutes, or another defined interval.
- Whether a seven-day follow-up is feasible/required and when to release score feedback.
- Whether E1 primary endpoint is adjusted immediate performance or one-hour retention; register **one primary endpoint** in the final protocol.
- Number of human participants, power/feasibility targets, and supported claims about age differences.
- Approved question banks, blind scoring rubric, language, cognitive-load scale provenance and age appropriateness.
- Whether follow-up reminders may use participant contact details and through which secure approved channel.
- Which optional experiments (E2–E8) will actually be run as human studies; do not promise statistical testing of all eight with one small cohort.
- External media licenses and permission to redistribute course content.

## 35. Master implementation prompt (paste into Claude Code / Codex)

> You are the principal full-stack engineer and research infrastructure developer implementing **VisualLearn**. First read `VISUALLEARN_AGENT_IMPLEMENTATION_SPEC.md` completely, including **v2 sections 23–35**, then inspect the repository before writing code. Preserve useful existing work. The v2 addendum overrides earlier conflicting v1 statements. The deliverable is a production-quality research MVP, not static mockups.
>
> Implement the P0 Water Cycle study end to end: accessible Next.js/TypeScript UI, canonical content with three controlled density variants, legitimate diagrams/narration, pseudonymous participant enrollment and consent flow, age-stratified randomized condition assignment, baseline pretest (Form A), immediate quiz (Form B) and immediate questionnaire (F3), **one-hour delayed quiz (Form C)** and short survey (F5), optional seven-day system hooks, securely persisted data and telemetry, admin dashboards and de-identified CSV exports. Define all E1–E8 experiment configurations and support adding experiment arms without rewriting the platform, but **activate only E1** until approved; E2/E3 are the next implementation priorities and E4–E8 must not block the P0 release. Complete tests including fake-clock one-hour unlock, refresh, duplicate submissions, study recovery, authorization and accessibility. Use real assets with licensing documentation. Never expose question answer keys to participants.
>
> Work incrementally in phases from §32. After each phase run relevant checks, fix failures, and update `docs/IMPLEMENTATION_PROGRESS.md` with exact commands/results, current files, blockers, and next tasks. If credentials, approvals, assets or human-subject permissions are missing, do not fabricate them; implement the safe dev/test path with documented placeholders and blockers. Don't create or submit human research data without approval. Finish with a working start guide, migrated DB, seed data, demoable study path, admin export, and honest list of any unresolved limitations.

**Document end — VisualLearn v2.0.**
