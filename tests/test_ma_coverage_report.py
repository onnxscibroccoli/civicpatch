import json
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORTER = ROOT / "scripts" / "report_ma_coverage.py"


class CoverageReportTests(unittest.TestCase):
    def test_empty_directory_reports_zero_without_inventing_coverage(self):
        result = subprocess.run([sys.executable, str(REPORTER)], cwd=ROOT, text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        report = json.loads(result.stdout)
        self.assertEqual(report["municipality_target"], 351)
        self.assertEqual(report["municipalities_present"], 0)
        self.assertEqual(report["municipality_coverage_percent"], 0)
        self.assertEqual(report["ocd_ids_populated"], 0)
        self.assertEqual(len(report["sectors"]), 6)
        self.assertIn("not factual verification", report["trust_boundary"])


if __name__ == "__main__":
    unittest.main()
