# Draft protocol snapshot

**Not approved. No recruitment authorized.** Based on the supplied v2 specification dated 2026-10-16.

E1 is a between-participant study of three visual-density packages. Canonical factual content, audio, objectives and essential controls stay constant. Randomize within age stratum after baseline, using least-filled arms with secure random tie-breaking under a PostgreSQL transaction/advisory lock. Retain withdrawn assignments in allocation counts.

Timeline: F0 consent/background → A baseline → assigned five-segment lesson → B immediate + free recall → F3 exploratory questionnaire → C at server lesson completion +60 minutes + free recall → F5 review/exposure survey → completion. Draft window closes +90 minutes. Late attempts are rejected, not assigned zero or silently substituted. Seven-day participation is engineered but disabled pending the separate reviews below.

Draft primary endpoint: adjusted immediate objective percentage. Confirm one endpoint before collection. Forms A/B/C (v2.0.0-draft) share one blueprint of eight objective items (four recall MCQs, ordering, diagram labeling, conceptual, transfer); B and C add a written evaporation scenario (4-point rubric) and free recall (10-point rubric), answered before the objective items. Shared structure is not proof of psychometric equivalence; expert review and a pilot are required. F3/F5 are study-designed drafts, not validated scales. No composite engagement or cognitive load score is calculated.

Population, sample size/power, age bands, instruments, accessible accommodations, viewport policy, language support, final time window/late policy, ethics, consent contact, audio redistribution and debrief must be approved. Minor enrollment is blocked. E2 is implemented as a closed draft modality contract. E3 is implemented as a closed draft chunking contract; E4-E8 remain disabled roadmap definitions; they are separate experiments, not crossed factors in E1.


## E2 draft pilot contract - modality-v1-draft

Engineering supports four assigned presentations of the same five canonical scripts: text-only, audio-only, text-diagram and audio-diagram. The text is the narration source; audio uses the existing recordings at fixed 1x speed. No background music or alternate factual script is added. Essential diagrams are identical in diagram arms; no density decoration is introduced. Text-only scripts describe the cycle's necessary propositions; independent educator review must still confirm objective equivalence.

Audio-arm transcripts are available on explicit request as an accessibility accommodation and recorded per segment. They must not be silently treated as pure audio exposure in analysis. A participant may always use the accommodation. No participant is excluded automatically for using it; preregister the analysis policy. F3 uses a separately versioned N/A option for diagram support across all arms. Do not pool E1/E2 means or scales without an approved analysis plan.

Navigation is self-paced across five segments with the same completion and assessment sequence. The one-hour follow-up remains server-owned. First lesson request, segment/navigation and audio events are exposure proxies; they do not establish attentive study time. Segment headings/navigation are retained for orientation in every arm. Assessments and feedback policies are identical across arms, with answer keys on the server.

E2 remains draft and closed. The versioned pilot gate is additional to ethics/content approval, reviewed consent/contact and explicit recruiting status. Source/transcript parity and synthetic tests are engineering evidence, not human pilot results or approval. Required reviews: objective/factual parity, narration listening/rights, accessibility accommodation policy, questionnaire suitability, exposure/timing/navigation limits and preregistered estimand.


## E3 draft pilot contract - chunking-v1-draft

Three independent arms present the same five concept blocks: one at a time; groups of three then two; or all five in one page. Each block uses identical canonical words, example, key idea, essential diagram and fixed-1x narration. Only one narration is active at a time. All arms are self-paced, with no imposed minimum dwell time, and retain previous/next navigation plus the same immediate and server-owned one-hour assessments. Content/objective and item/rubric bytes are unchanged. This is a proposed engineering contract, not approved pilot methodology or preregistration.

Record group display/revisit counts and visible-document intervals as exposure proxies. A presented group is not proof that every concept was read. Different scrolling/navigation burden, native controls, hidden-tab listening, repeated orientations, browser suspension and multiple tabs limit interpretation; register a viewport and analysis policy before recruitment. Do not force equal attentive exposure, infer attention from document visibility, automatically exclude participants or change the one-hour clock based on these proxies. F3 remains the original instrument because every E3 arm has diagram and audio; its review remains open.

Recruitment remains closed. Review the proposed time/group policy, objective equivalence, narration rights/listening, accessibility/viewport behavior, exposure limitations, outcome/analysis plan and pilot suitability. E4-E8 remain disabled. No ethics, supervisor or educator approval has been recorded.


## M4 optional follow-up and draft review mechanisms

No activation or approval is recorded. Optional D has eight distinct objective items matching the A/B/C blueprint, plus separately worded free recall and evaporation scenario. It uses the existing server-only rubrics, with blind rating support. Enrollment freezes D version/hash and a separately reviewed grace window; no window is supplied by default. Lesson completion schedules +60m as before and, only for an opted-in session, +7 UTC days. C/F5 must finish before D opens. D and its F6 interim-exposure questionnaire have separate rows and versions; one-hour missingness is never replaced by a seven-day score. This proposed sequence and grace policy need supervisor approval and updated consent before use.

The development simulator demonstrates D/F6 with an explicitly SYNTHETIC one-hour grace, tab draft recovery and isolated clock controls. The participant API has no clock override. Debrief copy is a marked development review draft in /dev/study; no participant debrief or answer release is active. Review explanation, contact, retention wording and feedback timing, particularly when D is assigned.

Response-based heuristics are researcher review prompts, not outcomes, validated scales or adaptive policy. Definitions and cutoffs are versioned in content/review-heuristics.json. Flagged/eligible counts retain questionnaire version, study and frozen presentation. N/A/missing values are excluded from the denominator, not scored zero. Review prompts never change recruitment, assignment, assessment eligibility, stimuli or inclusion criteria.
