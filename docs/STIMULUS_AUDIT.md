# Draft E1 stimulus audit

M1 shared shell (`density-v4-draft`, 2026-10-24): shared typography, form surfaces, spacing, focus and metadata readability change uniformly. The canonical JSON, WAVs, objective/question wording, lesson SVG source and assessment diagram color tokens remain unchanged. The manifest now also hashes the root layout, site header, public lesson player and shared button primitive. A shared status fix reads cached native audio metadata/error state at mount; callback buttons wait for hydration while native links remain usable. These fixes emit no new telemetry or playback commands. Before and after screenshots are retained in `docs/screenshots/m1-before/` and `docs/screenshots/m1-after/`; completed verification is recorded in QA. These changes are draft and do not grant research approval.

Canonical source: five Water Cycle segments, version 1.0.0-draft. Text, order, objectives, full audio bytes, essential diagram labels, colors and shell controls are identical across density variants. The single `densityConfig` controls only two SVG groups. No extra conditions are randomized together.

| Tier | Essential landscape + four process labels/arrows | Supportive group | Decorative group |
|---|---|---|---|
| Low | Yes | No | No |
| Medium | Yes | 3 callouts, leader lines and 2 additional arrows | No |
| High | Yes | Identical to medium | 4 trees, 4 water ripples, 2 birds, 2 shrubs and 5 small accent dots |

SVG canvas is 800×470 and scales identically. All conditions retain the same occupied canvas area; object/edge density increases within it. There is no animation, so animated object count is zero. Exact edge density, occupied-object area, salience/color variance and independent scientific ratings are not measured yet. Do not claim that this draft audit validates the manipulation. All segments currently share the same essential whole-cycle diagram with emphasized process text; segment-specific instructional variations may improve the final stimuli.

`docs/screenshots/lesson-{low,medium,high}-{360,768,1280}.png` records the overview at target viewport widths after browser QA. Other segment screenshot matrices and independent reviewer notes remain pending. Reduced motion preserves all facts because motion is not required by these stimuli.

Known confounds: supportive and decorative density form a package; they cannot identify visual relevance independently. Viewport changes density; device policy needs registration. Public demo access may allow outside review; F5 asks about interim exposure. Native audio controls vary by browser/OS and need staging device checks.

Local milestone: `density-v2-draft` changes the shared shell (narration status, progress, assessment drafts) uniformly, preserving canonical copy, SVG tiers and audio bytes. The manifest includes shared player/assessment/study UI sources. Hash changes must reject stale research sessions rather than silently adopt new stimuli. No human trial was active during this change.

Assessment v2 (`density-v3-draft`, 2026-10-18): the shared assessment and questionnaire UI changed identically for every condition (ordering selects, a neutral labeling diagram, staged written answers, questionnaire drafts). The labeling diagram is an assessment stimulus with one fixed rendering; it does not vary with density. Canonical lesson text, lesson diagram tiers and audio bytes are unchanged.


## E2 modality-v1-draft audit (engineering, not approval)

| Arm | Canonical written body | Existing canonical WAV | Essential canonical diagram | Optional transcript |
|---|---|---|---|---|
| text-only | Visible | Absent | Absent | Body already visible |
| audio-only | Hidden by default | Present, fixed 1x | Absent | Explicit recorded accommodation |
| text-diagram | Visible | Absent | Present, low tier | Body already visible |
| audio-diagram | Hidden by default | Present, fixed 1x | Present, low tier | Explicit recorded accommodation |

The same canvas height is reserved at a given viewport in every arm. No supportive/decorative diagram layer, extra narration fact or music is added. The canonical body is the narration generator's input, and automated rendering checks compare every text-arm paragraph to that source for all five segments. These checks establish source parity; they do not replace independent listening or educational equivalence review. Narration and source JSON byte hashes match the committed E1 manifest.

Orientation headings and shared progression/withdrawal controls remain available in all arms. Audio controls naturally add a different control surface; native media controls still vary by device. Audio-arm transcript use changes effective modality and must be considered in the reviewed analysis plan. Self-pacing, scrolling/reading/listening duration and accommodation use are unresolved design/analysis limits, not evidence of equal attentive exposure. No automatic exclusion rule or fixed minimum dwell time has been invented.

Screenshots at 360/768/1280 are stored under `docs/screenshots/m2/` using browser-only SYNTHETIC fixtures. They represent the initial assigned presentation, before accommodation is requested. Axe and keyboard checks are engineering evidence only; screen-reader/device review, audio redistribution rights, objective equivalence and pilot suitability remain unapproved.


## E3 chunking-v1-draft audit (engineering, not approval)

The canonical five concept blocks are partitioned as [1,1,1,1,1], [3,2] or [5]. Each block retains the same heading/body/key idea/diagram description, essential low-tier diagram and WAV. No supportive/decorative density layer is added. SVG definition prefixes avoid duplicate IDs on multi-concept pages without changing shapes, labels, colors or meaning; default E1/E2 output keeps its existing IDs. All audio controls are fixed 1x and only one narration can play in a visible group.

Source paragraph/media parity and complete canonical ordering are automated across every arm. Screenshots in `docs/screenshots/m3/` capture initial groups at 360/768/1280 using browser-only SYNTHETIC fixtures. Repeated orientation controls, scrolling, page transitions, simultaneous graphic area and native-media layout vary with grouping and viewport. No equal attentive exposure claim follows from equal total content. The proposed self-paced policy and client-visible-time/group-display proxies require independent review. Every human approval, actual pilot, device/screen-reader review and narration-rights determination remains open.
