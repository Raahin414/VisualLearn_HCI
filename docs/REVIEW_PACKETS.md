# External reviews and approvals (E1 Water Cycle)

**Status on 2026-10-18: none of these reviews or approvals has been obtained.** This file prepares them; it is not evidence that any happened. Record each outcome (reviewer role, date, decision, version reviewed) in [DECISIONS.md](DECISIONS.md) and keep recruitment closed until every blocking row is approved.

| # | Review | Owner (role) | Blocking for | Status |
|---|---|---|---|---|
| 1 | Educator review of lesson and question banks | Subject educator | Freezing stimuli | Not started |
| 2 | Narration redistribution rights or replacement | Project lead | Any participant use | Not started |
| 3 | Supervisor protocol approval | Supervisor | Ethics submission | Not started |
| 4 | Consent, contact, withdrawal, retention, deletion, debrief | Supervisor + ethics office | Ethics submission | Draft procedures below |
| 5 | Ethics approval | Institutional ethics board | Any recruitment | Not submitted |
| 6 | Guardian consent and child assent process | Ethics board | Any minor | Blocked; minors stay disabled in code |

## Current E1 presentation review (25 October 2026)

The project is limited to low/medium/high visual density. Review the shared density renderer and fresh docs/screenshots/e1/ captures: one essential diagram at low, two supporting process illustrations at medium, four plus decoration at high. Canonical text/audio and assessment banks are unchanged. Review the scrolling burden and repeated process labels as part of the density manipulation. Historical multi-experiment plans do not add scope or supply approval.

## 1. Educator review packet

Give the reviewer: `content/lessons/water-cycle/v1.json` (canonical text), the three density screenshots in `docs/screenshots/`, and `codebook.json` downloaded from the researcher workspace (all A/B/C items with keys, rationales, item blueprint and both rubrics). Ask them to confirm, item by item:

- Scientific accuracy of every lesson sentence and keyed answer; age-appropriate wording for 18–30 (and, separately, any future band).
- Every assessed fact is taught in the lesson (the test suite checks process terms only, not meaning).
- Parallelism: matching difficulty of A/B/C at each blueprint position (1–4 recall, 5 ordering, 6 labeling, 7 conceptual, 8 transfer). Note B-1/C-1 name evaporation, which may cue the written scenario even though written answers are locked first.
- Ordering scoring (any rotation correct, all-or-nothing) and labeling scoring (all four markers correct) versus partial credit.
- Free-recall (10-point) and scenario (4-point) rubric anchors; whether a calibration set of example answers should be written before rating.

Any change creates a new bank version (`2.x`), re-freezes hashes (`node scripts/verify-content.mjs --write`) and invalidates sessions enrolled on older versions.

## 2. Narration

The five WAV files were synthesized locally with Windows System.Speech ("Microsoft David Desktop"). Their redistribution terms for a public research website are unconfirmed. Options: (a) obtain written confirmation that this output may be redistributed for the study, (b) record a human narrator with a signed release, or (c) use a TTS service whose terms explicitly allow redistribution. Replacing audio requires identical script text, a new content version, regenerated hashes and re-running all checks. Do not edit canonical copy casually.

## 3. Supervisor decisions (spec §34; record each answer)

Research questions and the single primary outcome (draft: adjusted immediate percentage correct) · age groups (draft: adults 18–30 only) · sample plan and power reasoning (draft pilot 45–60 total is exploratory) · questionnaires F3/F5 (study-designed, not validated scales) · follow-up window (draft: +60 to +90 minutes, strict expiry) · late-return policy · seven-day form D (disabled) · when to release scores/answers (draft: only at debrief) · device/viewport policy · whether follow-up reminders may use contact details (draft: no contact details collected).

## 4. Draft participant procedures (for supervisor and ethics review — not approved)

- **Consent text and contact:** the database fields `consent_version`, `consent_text` and `study_contact` stay empty until approved wording exists. The app refuses enrollment while they are empty.
- **Withdrawal (implemented):** a participant can withdraw at any time from the study screen. Access and return links stop immediately, follow-ups are marked withdrawn and every export excludes the participant. Allocation counts still include them to prevent condition shopping.
- **Retention and deletion (needs approval):** proposed default is to keep de-identified research data until the end of the approved retention period and to delete withdrawn participants' rows (including written responses) within 30 days of withdrawal; backups expire on the provider's schedule. M4 provides an inactive, tested deletion mechanism; no retention delay is configured by default. Review its scope, private aggregate allocation counts, institutional deletion-request records and backup expiry before enabling the operator flag. The proposed 30-day period is not an approved or configured policy.
- **Debrief (needs approval):** proposed debrief after F5 explains the three visual-density conditions, that assignment was random and that scores are withheld until all follow-ups close. The marked review draft is in components/study/draft-debrief.tsx through /dev/study only; it is not participant-active. Review feedback timing separately when optional D is assigned.
- **Data collected:** age band, language, language comfort, topic familiarity, answers, written responses, questionnaire answers and lesson interaction events. No names, emails, exact dates of birth, IP addresses or device fingerprints.

## 5–6. Ethics and minors

Submit only after rows 1–4 are complete. Real enrollment needs, in the database, `status='recruiting'`, `enabled=true`, `content_approved=true`, `ethics_approved=true` plus approved consent text and contact, and `STUDY_ENABLED=true` in the deployment. Setting these is a recorded decision, not a configuration step. Minors are rejected in code regardless of these flags until a verified guardian-consent and assent mechanism is approved and implemented.


## M4 review additions (all pending)

Give the educator the updated protected codebook containing D, its written prompts and unchanged rubrics. Review D equivalence, scientific wording, scoring and potential cues independently; matching blueprints do not validate forms. Give the supervisor the proposed C/F5 then D/F6 sequence, exact seven-day anchor and an unfilled grace-window decision. Approve optional consent wording and feedback/debrief release timing before any activation. The seven-day and retention gates remain false/null.

Review response-review-v1-draft in content/review-heuristics.json: the cutoffs and review prompts are transparent study-designed heuristics, not validated instrument thresholds or diagnoses. Keep questionnaire forms, versions and presentations separate; do not turn these prompts into automatic exclusions or stimulus changes. No human approval, contact, signature, reviewer decision or pilot is invented by the engineering checks.
