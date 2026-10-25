# Reproducible export analysis

No human observations or findings exist. Checked-in SYNTHETIC-results are software fixture outputs, not a study.

Use Python with analysis/requirements.txt. Download the current authenticated CSV exports (including complete frozen session metadata) into one private folder. Do not put human or identifying data in Git. Run `python analysis/analyze.py path/to/exports path/to/output`. The script detects SYNTHETIC consent versions automatically, refuses mixed synthetic/human records, and labels every output by data kind. `--synthetic` additionally refuses anything except SYNTHETIC inputs.

## Reproduce the local example

```powershell
npm run test:pg
python -m unittest discover -s analysis -p 'test_*.py'
python analysis/analyze.py .local/m4-synthetic-exports analysis/SYNTHETIC-results --synthetic
```

The PostgreSQL suite exports actual disposable SYNTHETIC rows through the app's own de-identification/CSV functions. These are integration fixtures, not fabricated empirical findings. The output manifest records input SHA-256 hashes and the response-rule source hash/version. Random allocation ties may change example group counts between runs.

Outputs: cohort codebook, descriptive scores by arm/age/timepoint, missingness, paired observed one-hour change, separate effort items, response-based review prompts/counts, score distribution plots, paired retention plots and missingness plot. Every example file and plot title says SYNTHETIC. Missing values stay missing; zero is retained as an observed score. People without assignment remain in attrition summaries. Optional unassigned seven-day tasks are not counted as missed. Duplicate attempts, invalid scores, mismatched study identity and mixed form versions within one frozen cohort are rejected.

Current exports contain E1 only. The experiment identifier is retained for stable joins and historical format compatibility. Cohorts separate protocol, canonical/media/question hashes, stimulus source/hash, presentation, optional bank and grace window. Questionnaire rules also separate form/version and arm. The shared response-review-v1-draft JSON defines transparent cutoffs, not validated scales or optimal interface advice. N/A/missing/malformed values never enter numeric denominators as zero. No automatic exclusions, diagnoses, causal claims or adaptation occur. Review text needs disclosure screening before any external sharing.

The optional --fit-primary-model fits the existing draft immediate ~ pre + arm + age model with HC3 intervals only for one E1 frozen cohort and at least 30 complete observations across three arms. These guards are not scientific registration or a power justification. Do not use the flag before the supervisor registers the model; it was not run for the example. Age interactions, repeated-measures models, rubric reliability, approved sensitivity analysis and scientific interpretation remain human protocol work. Small cells and attrition require caution; descriptive charts do not supply confidence intervals.
