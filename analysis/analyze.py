"""Analyze actual de-identified exports; never generate or impute study outcomes."""
import argparse
from pathlib import Path
import pandas as pd


def load_exports(folder: Path):
    participants = pd.read_csv(folder / "participants_deidentified.csv")
    assignments = pd.read_csv(folder / "assignments.csv")
    sessions = pd.read_csv(folder / "sessions.csv")
    attempts = pd.read_csv(folder / "assessment_attempts.csv")
    completed = attempts.loc[attempts["submitted_at"].notna()].copy()
    completed["percent"] = 100 * completed["correct"] / completed["max_score"].replace(0, float("nan"))
    wide = completed.pivot(index="session_id", columns="timepoint", values="percent").reset_index()
    data = sessions.merge(participants, on="participant_id", validate="many_to_one", suffixes=("_session", "_participant"))
    data = data.merge(assignments[["participant_id", "arm_key"]], on="participant_id", validate="one_to_one")
    return data.merge(wide, on="session_id", how="left", validate="one_to_one")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("export_dir", type=Path)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("--fit-primary-model", action="store_true", help="Only after registration: immediate ~ pre + arm + age")
    args = parser.parse_args()
    data = load_exports(args.export_dir)
    if data.empty:
        raise SystemExit("No eligible observed records. No results were generated.")
    args.output_dir.mkdir(parents=True, exist_ok=True)
    stages = [s for s in ["pre", "immediate", "plus_60m"] if s in data.columns]
    summary = data.groupby(["age_band", "arm_key"], observed=True)[stages].agg(["count", "mean", "std"])
    summary.to_csv(args.output_dir / "descriptive_scores.csv")
    missing = data.groupby("arm_key", observed=True)[stages].agg(lambda x: x.isna().sum())
    missing.to_csv(args.output_dir / "missing_by_arm.csv")
    if {"immediate", "plus_60m"}.issubset(data.columns):
        paired = data.dropna(subset=["immediate", "plus_60m"]).copy()
        paired["change_60m_minus_immediate"] = paired["plus_60m"] - paired["immediate"]
        paired[["session_id", "arm_key", "age_band", "change_60m_minus_immediate"]].to_csv(args.output_dir / "observed_paired_change.csv", index=False)
    if args.fit_primary_model:
        import statsmodels.formula.api as smf
        if not {"pre", "immediate"}.issubset(data.columns):
            raise SystemExit("Baseline and immediate measurements are required. No model fitted.")
        complete = data.dropna(subset=["pre", "immediate", "arm_key", "age_band"])
        if len(complete) < 30 or complete["arm_key"].nunique() < 3:
            raise SystemExit("Too few complete observations or missing arms for this draft model. Review sample planning.")
        model = smf.ols("immediate ~ pre + C(arm_key) + C(age_band)", data=complete).fit(cov_type="HC3")
        ci = model.conf_int()
        result = pd.DataFrame({"estimate": model.params, "ci_low": ci[0], "ci_high": ci[1]})
        result.to_csv(args.output_dir / "draft_adjusted_estimates.csv")
    (args.output_dir / "READ_FIRST.txt").write_text(
        "Observed exports only. Missing scores were not imputed. Descriptive results are not evidence of optimal design. "
        "The primary model requires preregistration and scientific review. Small age-by-arm cells, follow-up attrition, "
        "pretest priming and visual relevance/density confounding limit inference. Behavioral events are not attention measurements.\n",
        encoding="utf-8",
    )
    print(f"Analyzed {len(data)} observed sessions. Review missingness and protocol before interpretation.")


if __name__ == "__main__":
    main()
