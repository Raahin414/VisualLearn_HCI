"""Describe actual exports by frozen cohort; never generate or impute outcomes."""
import argparse
import hashlib
import json
from pathlib import Path
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

STAGES = ["pre", "immediate", "plus_60m", "plus_7d"]
COHORT = ["experiment_id", "protocol_version", "content_sha256", "media_manifest_sha256", "question_bank_sha256", "stimulus_version", "stimulus_sha256", "presentation_version", "seven_day_bank_sha256", "seven_day_window_minutes"]


def read_csv(folder, name, columns=()):
    try:
        return pd.read_csv(folder / f"{name}.csv")
    except pd.errors.EmptyDataError:
        return pd.DataFrame(columns=columns)


def load_exports(folder):
    people = read_csv(folder, "participants_deidentified")
    sessions = read_csv(folder, "sessions")
    assigned = read_csv(folder, "assignments", ["participant_id", "experiment_id", "arm_key"])
    attempts = read_csv(folder, "assessment_attempts", ["session_id", "timepoint", "submitted_at", "correct", "max_score", "form_version"])
    if people.empty or sessions.empty:
        raise ValueError("No eligible exported sessions. No results generated.")
    if not set(COHORT).issubset(sessions.columns):
        raise ValueError("Current frozen cohort metadata is required. Re-export sessions.")
    synthetic = people.consent_version.astype(str).str.startswith("SYNTHETIC")
    if synthetic.any() and not synthetic.all():
        raise ValueError("Never combine SYNTHETIC and human records.")
    data = sessions.merge(people[["participant_id", "experiment_id", "age_band", "language"]], on=["participant_id", "experiment_id"], validate="many_to_one")
    if len(data) != len(sessions):
        raise ValueError("Session/participant study identities do not match.")
    data = data.merge(assigned[["participant_id", "experiment_id", "arm_key"]], on=["participant_id", "experiment_id"], how="left", validate="one_to_one")
    data["arm_key"] = data.arm_key.fillna("unassigned")
    for col in COHORT:
        data[col] = data[col].fillna("not_assigned").astype(str)
    data["cohort"] = data[COHORT].apply(lambda row: hashlib.sha256(json.dumps(row.tolist()).encode()).hexdigest()[:16], axis=1)
    if attempts.duplicated(["session_id", "timepoint"]).any():
        raise ValueError("Duplicate session/timepoint attempts.")
    complete = attempts.loc[attempts.submitted_at.notna()].copy()
    if not complete.timepoint.isin(STAGES).all():
        raise ValueError("Unknown timepoint.")
    for col in ["correct", "max_score"]:
        complete[col] = pd.to_numeric(complete[col], errors="raise")
    if complete[["correct", "max_score"]].isna().any().any() or ((complete.max_score <= 0) | (complete.correct < 0) | (complete.correct > complete.max_score)).any():
        raise ValueError("Invalid observed score range.")
    complete["percent"] = 100 * complete.correct / complete.max_score
    matched = complete.merge(data[["session_id", "cohort"]], on="session_id", validate="many_to_one")
    if len(matched) != len(complete):
        raise ValueError("Attempt lies outside the session export.")
    if (matched.groupby(["cohort", "timepoint"]).form_version.nunique() > 1).any():
        raise ValueError("Mixed assessment versions within a frozen cohort; separate exports.")
    wide = complete.pivot(index="session_id", columns="timepoint", values="percent").reindex(columns=STAGES).reset_index()
    return data.merge(wide, on="session_id", how="left", validate="one_to_one"), bool(synthetic.all())


def analyze(folder, output, require_synthetic=False, fit_primary=False):
    data, synthetic = load_exports(folder)
    if require_synthetic and not synthetic:
        raise ValueError("--synthetic requires exclusively SYNTHETIC consent versions.")
    kind = "SYNTHETIC" if synthetic else "OBSERVED"
    output.mkdir(parents=True, exist_ok=True)
    def csv(frame, name):
        frame = frame.copy(); frame.insert(0, "data_kind", kind)
        frame.to_csv(output / f"{kind}_{name}.csv", index=False)
    summary, missing, paired, effort = [], [], [], []
    for number, (cohort, group) in enumerate(data.groupby("cohort", sort=True), 1):
        for (arm, age), block in group.groupby(["arm_key", "age_band"], dropna=False):
            for stage in STAGES:
                if stage == "plus_7d" and (block.seven_day_bank_sha256 == "not_assigned").all():
                    continue
                values = block[stage].dropna()
                common = dict(cohort=cohort, experiment_id=block.iloc[0].experiment_id, arm_key=arm, age_band=age, timepoint=stage)
                summary.append(dict(**common, observed_n=len(values), mean_percent=values.mean(), sd_percent=values.std()))
                missing.append(dict(**common, assigned_n=len(block), observed_n=len(values), missing_n=int(block[stage].isna().sum())))
        pairs = group.dropna(subset=["immediate", "plus_60m"])
        for _, row in pairs.iterrows():
            paired.append(dict(cohort=cohort, experiment_id=row.experiment_id, session_id=row.session_id, arm_key=row.arm_key, age_band=row.age_band, change_60m_minus_immediate=row.plus_60m-row.immediate))
        fig, ax = plt.subplots(figsize=(10, 5), layout="constrained")
        positions, labels = [], []
        for arm_index, (arm, block) in enumerate(group.groupby("arm_key")):
            for stage_index, stage in enumerate(STAGES):
                values = block[stage].dropna()
                if not values.empty:
                    x = arm_index * 5 + stage_index
                    ax.scatter([x] * len(values), values, s=32, alpha=.65, color="#27665b")
                    positions.append(x); labels.append(f"{arm}\n{stage}\nN={len(values)}")
        ax.set_xticks(positions, labels, fontsize=8); ax.set_ylim(-3, 103)
        ax.set_ylabel("Observed objective % correct")
        ax.set_title(f"{kind} / {group.iloc[0].experiment_id} / cohort {number}\nDescriptive observations; no missing scores imputed")
        fig.savefig(output / f"{kind}_cohort_{number:02}_scores.png", dpi=150); plt.close(fig)
        if not pairs.empty:
            fig, ax = plt.subplots(figsize=(7, 5), layout="constrained")
            for _, row in pairs.iterrows():
                ax.plot([0, 1], [row.immediate, row.plus_60m], marker="o", alpha=.5, color="#27665b")
            ax.set_xticks([0, 1], ["Immediate", "One hour"]); ax.set_ylim(-3, 103)
            ax.set_ylabel("Observed objective % correct")
            ax.set_title(f"{kind} / cohort {number} / paired N={len(pairs)}\nReturners only; no causal claim")
            fig.savefig(output / f"{kind}_cohort_{number:02}_paired.png", dpi=150); plt.close(fig)
    surveys = read_csv(folder, "surveys", ["session_id", "form_key", "form_version", "answers_json"])
    for _, row in surveys.merge(data[["session_id", "cohort", "experiment_id", "arm_key"]], on="session_id", validate="many_to_one").iterrows():
        answers = json.loads(row.answers_json)
        field = "mentalEffort" if row.form_key == "F3" else "recallEffort"
        if field in answers:
            effort.append(dict(cohort=row.cohort, experiment_id=row.experiment_id, arm_key=row.arm_key, form_key=row.form_key, form_version=row.form_version, measure=field, value=answers[field]))
    rules_path = Path(__file__).resolve().parent.parent / "content" / "review-heuristics.json"
    rules = json.loads(rules_path.read_text(encoding="utf-8"))
    flags = []
    joined = surveys.merge(data[["session_id", "cohort", "experiment_id", "arm_key"]], on="session_id", validate="many_to_one")
    for keys, group in joined.groupby(["cohort", "experiment_id", "arm_key", "form_key", "form_version"]):
        for rule in rules["rules"]:
            if keys[3] not in rule["forms"]:
                continue
            values = [json.loads(row.answers_json).get(rule["field"]) for _, row in group.iterrows()]
            if isinstance(rule["threshold"], (int, float)):
                values = [v for v in values if type(v) is int and rule["min"] <= v <= rule["max"]]
                marked = sum(v >= rule["threshold"] if rule["operator"] == "gte" else v <= rule["threshold"] for v in values)
            else:
                values = [v for v in values if isinstance(v, str) and v in rule["allowed"]]
                marked = sum(v == rule["threshold"] for v in values)
            if values:
                flags.append(dict(zip(["cohort", "experiment_id", "arm_key", "form_key", "form_version"], keys), rule_version=rules["version"], rule=rule["id"], eligible=len(values), flagged=marked, check=rule["check"], review_prompt=rule["action"]))
    csv(pd.DataFrame(flags, columns=["cohort", "experiment_id", "arm_key", "form_key", "form_version", "rule_version", "rule", "eligible", "flagged", "check", "review_prompt"]), "response_review")
    csv(pd.DataFrame(summary), "descriptive_scores")
    csv(pd.DataFrame(missing), "missing_by_arm_age")
    csv(pd.DataFrame(paired, columns=["cohort", "experiment_id", "session_id", "arm_key", "age_band", "change_60m_minus_immediate"]), "paired_change")
    csv(pd.DataFrame(effort, columns=["cohort", "experiment_id", "arm_key", "form_key", "form_version", "measure", "value"]), "effort_items")
    csv(data[["cohort", *COHORT]].drop_duplicates(), "cohorts")
    frame = pd.DataFrame(missing)
    fig, ax = plt.subplots(figsize=(10, max(5, min(24, len(frame)*.23))), layout="constrained")
    labels = frame.apply(lambda row: f"{row.cohort[:4]} / {row.arm_key} / {row.timepoint}", axis=1)
    ax.barh(range(len(frame)), frame.missing_n, color="#27665b")
    ax.set_yticks(range(len(frame)), labels, fontsize=7)
    ax.set_xlabel("Missing assessments (count, never zero-filled scores)")
    ax.set_title(f"{kind} / assessment missingness by frozen cohort")
    fig.savefig(output / f"{kind}_missingness.png", dpi=150); plt.close(fig)
    if fit_primary:
        if data.cohort.nunique() != 1 or set(data.experiment_id) != {"E1"}:
            raise ValueError("The draft primary model requires one E1 frozen cohort.")
        complete = data.dropna(subset=["pre", "immediate"])
        if len(complete) < 30 or complete.arm_key.nunique() != 3:
            raise ValueError("Insufficient complete observations/arms. This is not a power justification.")
        import statsmodels.formula.api as smf
        model = smf.ols("immediate ~ pre + C(arm_key) + C(age_band)", data=complete).fit(cov_type="HC3")
        ci = model.conf_int()
        csv(pd.DataFrame({"term": model.params.index, "estimate": model.params.values, "ci_low": ci[0].values, "ci_high": ci[1].values}), "DRAFT_adjusted_estimates")
    manifest = dict(review_rules_sha256=hashlib.sha256(rules_path.read_bytes()).hexdigest(), review_rules_version=rules["version"], data_kind=kind, sessions=len(data), cohorts=int(data.cohort.nunique()), primary_model_requested=fit_primary, inputs_sha256={p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(folder.glob("*.csv"))})
    (output / f"{kind}_manifest.json").write_text(json.dumps(manifest, indent=2)+"\n", encoding="utf-8")
    (output / f"{kind}_READ_FIRST.txt").write_text(f"{kind} ONLY. " + ("Software fixtures, not human research findings. " if synthetic else "") + "Experiments and frozen cohorts are separated. Missing outcomes stay missing; unassigned optional seven-day tasks are not missed tasks. Charts are unadjusted, not causal estimates. Effort items stay separate by form/version. No confidence interval is implied for small descriptive cells. A primary model requires preregistration; its numerical guard is not a power justification. Review attrition, accommodations, language/device policy, item/rubric validity and scientific limitations.\n", encoding="utf-8")
    print(f"{kind}: analyzed {len(data)} exported sessions in {data.cohort.nunique()} cohorts. No outcomes generated or imputed.")
    return data


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("export_dir", type=Path); parser.add_argument("output_dir", type=Path)
    parser.add_argument("--synthetic", action="store_true")
    parser.add_argument("--fit-primary-model", action="store_true", help="Requires preregistration and one E1 cohort")
    args = parser.parse_args()
    try:
        analyze(args.export_dir, args.output_dir, args.synthetic, args.fit_primary_model)
    except (ValueError, KeyError) as error:
        raise SystemExit(str(error)) from error


if __name__ == "__main__":
    main()
