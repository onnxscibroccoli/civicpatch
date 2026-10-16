import json
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "ma" / "municipalities.json"
SCHEMA = ROOT / "schemas" / "ma-source-directory.schema.json"
VALIDATOR = ROOT / "scripts" / "validate_ma_directory.py"


class MassachusettsDirectoryTests(unittest.TestCase):
    def test_schema_and_directory_are_valid_json(self):
        schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
        data = json.loads(DATA.read_text(encoding="utf-8"))
        self.assertEqual(schema["$schema"], "https://json-schema.org/draft/2020-12/schema")
        self.assertEqual(data["schema_version"], "1.0.0")
        self.assertEqual(data["jurisdiction"]["state_fips"], "25")

    def test_unpopulated_directory_is_honestly_reported(self):
        data = json.loads(DATA.read_text(encoding="utf-8"))
        self.assertEqual(data["coverage"]["target_municipalities"], 351)
        self.assertEqual(data["coverage"]["records_present"], len(data["municipalities"]))
        self.assertEqual(data["coverage"]["verified_records"], 0)
        self.assertEqual(data["coverage"]["status"], "not_started")
        self.assertEqual(data["municipalities"], [])

    def test_validator_passes_current_directory(self):
        result = subprocess.run([sys.executable, str(VALIDATOR)], cwd=ROOT, text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("records=0/351", result.stdout)
        self.assertIn("does not establish factual accuracy", result.stdout)

    def test_ocd_id_can_remain_unknown_until_semantically_verified(self):
        schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
        ocd = schema["$defs"]["Municipality"]["properties"]["ocd_id"]
        self.assertIn("null", ocd["type"])
        self.assertIn("authoritative OCD-ID registry", ocd["description"])
        self.assertIn("(place|cousub)", ocd["pattern"])

    def test_schema_has_provenance_and_separate_url_status(self):
        schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
        source = schema["$defs"]["OfficialSource"]["properties"]
        self.assertIn("evidence", source)
        self.assertIn("verification_status", source)
        self.assertIn("url_status", source)
        self.assertIn("last_content_reviewed_at", source)


if __name__ == "__main__":
    unittest.main()
