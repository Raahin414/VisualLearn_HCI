# Draft E1 stimulus audit

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
