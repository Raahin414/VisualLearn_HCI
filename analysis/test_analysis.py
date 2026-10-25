"""SYNTHETIC analysis contract tests; these fixtures are not research findings."""
import tempfile
import unittest
from pathlib import Path
import pandas as pd
from analyze import COHORT, load_exports, analyze


class AnalysisTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.folder = Path(self.temp.name) / "exports"
        self.folder.mkdir()
        self.people = pd.DataFrame([dict(participant_id=f"SYNTHETIC-p{i}", experiment_id="E1", age_band="18-30", language="English", consent_version="SYNTHETIC-CONSENT") for i in range(3)])
        self.sessions = pd.DataFrame([dict(**{c: "SYNTHETIC-v1" for c in COHORT}, session_id=f"SYNTHETIC-s{i}", participant_id=f"SYNTHETIC-p{i}") for i in range(3)])
        self.sessions["experiment_id"] = ["E1", "E1", "E1"]
        self.sessions.loc[2, "presentation_version"] = "SYNTHETIC-e1-v2"
        self.sessions["seven_day_bank_sha256"] = None
        self.sessions["seven_day_window_minutes"] = None
        self.assigned = pd.DataFrame([dict(participant_id="SYNTHETIC-p0", experiment_id="E1", arm_key="low"), dict(participant_id="SYNTHETIC-p2", experiment_id="E1", arm_key="high")])
        self.attempts = pd.DataFrame([dict(session_id="SYNTHETIC-s0", timepoint=stage, submitted_at="2026-10-24T10:00:00Z", correct=correct, max_score=8, form_version="SYNTHETIC-v1") for stage, correct in [("pre", 0), ("immediate", 4), ("plus_60m", 2)]])
        self.save()

    def save(self):
        for name, frame in [("participants_deidentified", self.people), ("sessions", self.sessions), ("assignments", self.assigned), ("assessment_attempts", self.attempts)]:
            frame.to_csv(self.folder / f"{name}.csv", index=False)
        pd.DataFrame(columns=["session_id", "form_key", "form_version", "answers_json"]).to_csv(self.folder / "surveys.csv", index=False)

    def tearDown(self):
        self.temp.cleanup()

    def test_preserves_zero_missing_unassigned_and_experiment_identity(self):
        data, synthetic = load_exports(self.folder)
        self.assertTrue(synthetic)
        self.assertEqual(len(data), 3)
        self.assertEqual(data.loc[data.session_id == "SYNTHETIC-s0", "pre"].iloc[0], 0)
        self.assertTrue(data.loc[data.session_id == "SYNTHETIC-s1", "immediate"].isna().all())
        self.assertEqual(data.cohort.nunique(), 2)
        self.assertEqual(data.loc[data.session_id == "SYNTHETIC-s1", "arm_key"].iloc[0], "unassigned")

    def test_rejects_duplicate_attempts_and_invalid_scores(self):
        self.attempts = pd.concat([self.attempts, self.attempts.iloc[[0]]]); self.save()
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            load_exports(self.folder)
        self.attempts = self.attempts.iloc[:3].copy(); self.attempts.loc[0, "max_score"] = 0; self.save()
        with self.assertRaisesRegex(ValueError, "Invalid"):
            load_exports(self.folder)

    def test_never_mixes_synthetic_and_human_records(self):
        self.people.loc[0, "consent_version"] = "unapproved-example"; self.save()
        with self.assertRaisesRegex(ValueError, "Never combine"):
            load_exports(self.folder)

    def test_separates_source_changes(self):
        self.sessions.loc[1, "stimulus_sha256"] = "SYNTHETIC-v2"; self.save()
        self.assertEqual(load_exports(self.folder)[0].cohort.nunique(), 3)

    def test_outputs_are_all_labeled_and_optional_unassigned_is_not_missing(self):
        output = Path(self.temp.name) / "output"
        analyze(self.folder, output, require_synthetic=True)
        self.assertTrue(all(file.name.startswith("SYNTHETIC_") for file in output.iterdir()))
        missing = pd.read_csv(output / "SYNTHETIC_missing_by_arm_age.csv")
        self.assertNotIn("plus_7d", set(missing.timepoint))
        paired = pd.read_csv(output / "SYNTHETIC_paired_change.csv")
        self.assertEqual(paired.change_60m_minus_immediate.tolist(), [-25])
        self.assertTrue((missing.data_kind == "SYNTHETIC").all())


if __name__ == "__main__":
    unittest.main()
