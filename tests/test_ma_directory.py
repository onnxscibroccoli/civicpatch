import json
import subprocess
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from ingest_ma_municipalities import normalize_http_url

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

    def test_directory_counts_are_honest(self):
        data = json.loads(DATA.read_text(encoding="utf-8"))
        records = data["municipalities"]
        coverage = data["coverage"]
        self.assertEqual(coverage["target_municipalities"], 351)
        self.assertEqual(coverage["records_present"], len(records))
        self.assertEqual(coverage["verified_records"], sum(r.get("record_status") == "verified" for r in records))
        self.assertLessEqual(len(records), 351)
        self.assertIn(coverage["status"], {"not_started", "review_required", "in_progress", "coverage_target_met"})
        if len(records) == 0:
            self.assertEqual(coverage["status"], "not_started")
        if len(records) > 0:
            self.assertNotEqual(coverage["status"], "not_started")

    def test_validator_passes_current_directory(self):
        data = json.loads(DATA.read_text(encoding="utf-8"))
        result = subprocess.run([sys.executable, str(VALIDATOR)], cwd=ROOT, text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("records=" + str(len(data["municipalities"])) + "/351", result.stdout)
        self.assertIn("does not establish factual accuracy", result.stdout)

    def test_urls_encode_spaces_and_trim_surrounding_whitespace(self):
        self.assertEqual(
            normalize_http_url(" https://example.gov/Documents/Board of Health/Annual report.pdf?title=town hall#minutes "),
            "https://example.gov/Documents/Board%20of%20Health/Annual%20report.pdf?title=town%20hall#minutes",
        )

    def test_existing_percent_encoding_is_preserved(self):
        self.assertEqual(
            normalize_http_url("https://example.gov/Board%20of%20Health/report.pdf?download=1"),
            "https://example.gov/Board%20of%20Health/report.pdf?download=1",
        )

    def test_directory_url_fields_have_no_raw_whitespace(self):
        data = json.loads(DATA.read_text(encoding="utf-8"))
        url_keys = {"official_website", "canonical_url", "reference_url"}

        def inspect(value, path="$"):
            if isinstance(value, dict):
                for key, child in value.items():
                    if key in url_keys and isinstance(child, str) and child.startswith(("http://", "https://")):
                        self.assertFalse(any(char.isspace() for char in child), f"{path}.{key} contains raw whitespace: {child}")
                    inspect(child, f"{path}.{key}")
            elif isinstance(value, list):
                for index, child in enumerate(value):
                    inspect(child, f"{path}[{index}]")

        inspect(data)

    def test_fall_river_2026_amended_committee_pdf_is_encoded_in_published_data(self):
        raw = "http://www.fallriverma.org/Document Center/Goverment/City Council/Committee List 2026 AMENDED.pdf"
        encoded = "http://www.fallriverma.org/Document%20Center/Goverment/City%20Council/Committee%20List%202026%20AMENDED.pdf"
        self.assertEqual(normalize_http_url(raw), encoded)
        self.assertEqual(normalize_http_url(encoded), encoded)  # No double encoding on re-ingest.

        records = json.loads(DATA.read_text(encoding="utf-8"))["municipalities"]
        fall_river = next(record for record in records if record["name"] == "Fall River")
        committee_sources = [
            source for source in fall_river["official_sources"]
            if source["canonical_url"].endswith("/Committee%20List%202026%20AMENDED.pdf")
        ]
        self.assertEqual([source["canonical_url"] for source in committee_sources], [encoded])
        self.assertEqual(committee_sources[0]["verification_status"], "unverified")

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
