# Content and asset register

Checked 2026-10-16. All scientific copy and vector drawing code were authored for this project. They await educator review. No claim of institutional approval or psychometric equivalence is made.

| Material | Source / creator | Rights and evidence | Derivative / attribution |
|---|---|---|---|
| Water-cycle concepts | USGS Water Science School: https://www.usgs.gov/water-science-school/water-cycle and https://www.usgs.gov/water-science-school/science/evaporation-and-water-cycle | Factual reference only; no USGS artwork or prose copied | Original explanatory text; reference in README |
| Five lesson scripts | VisualLearn implementation | Original text; project owner should choose a repository license | `content/lessons/water-cycle/v1.json` |
| Water-cycle drawing / density layers | VisualLearn implementation | Original JSX/SVG paths; no external illustrations | `components/learning/water-diagram.tsx`; full text alternative provided |
| Development WAV narration | Windows System.Speech / Microsoft David Desktop | Generated from canonical scripts on this machine; voice redistribution rights **not verified**. Replace or obtain approval before distributing as study stimuli | `public/audio/water-cycle/*.wav`; hashes in asset-manifest; review warning in demo |
| A/B/C objective items, free recall, questionnaires | VisualLearn implementation based on supplied project requirements | Original draft item wording; supervisor/educator review needed; no validated-scale claim | Server-only item bank and survey schema |
| UI icons | Lucide (`lucide-react`) | ISC license in installed package; installed package license is reproducible via package-lock | Code-generated UI iconography; no third-party lesson media |
| UI primitive | Radix Slot + CVA | MIT / Apache-2.0 respectively; package license metadata in lock/install | shadcn-style button composition, adapted original styling |

The repository does not yet declare a blanket license. Third-party package licenses remain their own. Do not infer distribution permission for the Windows voice from the existence of locally generated files.
