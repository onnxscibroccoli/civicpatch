import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "ingest_ma_municipalities.py"
spec = importlib.util.spec_from_file_location("ingest_ma_municipalities", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class IngestionUnitTests(unittest.TestCase):
    def test_normalize_names_for_exact_anchor_matching(self):
        self.assertEqual(module.normalize("North Attleborough"), "northattleborough")
        self.assertEqual(module.normalize("Town of Stow"), "townofstow")

    def test_anchor_parser_collects_label_and_href(self):
        parser = module.AnchorParser()
        parser.feed('<a href="https://example.gov/">Abington</a><a href="/about">About</a>')
        self.assertEqual(parser.anchors, [("Abington", "https://example.gov/"), ("About", "/about")])

    def test_department_candidates_are_classified_but_not_verified(self):
        self.assertIn("public_works", module.classify_department("Department of Public Works"))
        self.assertIn("health", module.classify_department("Board of Health"))
        self.assertIn("building_zoning", module.classify_department("Building Permits and Zoning"))
        self.assertEqual(module.classify_department("Parks and Recreation"), [])

    def test_identifier_is_not_inferred(self):
        self.assertIn('"ocd_id": None', SCRIPT.read_text(encoding="utf-8"))

    def test_scraper_refuses_wrong_expected_count(self):
        self.assertEqual(module.EXPECTED, 351)
        self.assertIn("refusing to replace directory", SCRIPT.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
