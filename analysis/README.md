# Reproducible analysis scaffold

Install `analysis/requirements.txt` into an isolated Python environment. Download the nine authenticated export datasets into one folder. Do not add identifiable data or real research records to Git.

```text
python analysis/analyze.py path/to/exports path/to/analysis-output
```

The script joins de-identified IDs, summarizes observed objective percentages by arm and age, counts missing outcomes, and computes within-person change only for observed pairs. No missing scores are replaced with zero. No study results exist in this repository.

An optional `--fit-primary-model` fits `immediate ~ pre + C(arm_key) + C(age_band)` using HC3 uncertainty only after a registered analysis decision and at least 30 complete observations across all three arms. This numerical threshold is a technical guard, **not a power justification**. Age interaction, repeated-measures retention models, transfer-item analysis, blind recall reliability and sensitivity analyses require the finalized protocol and further analysis implementation.

The actual exported-data analysis is unrun because no approved observations or connected export database were provided. Do not report the scaffold as completed statistical analysis.
