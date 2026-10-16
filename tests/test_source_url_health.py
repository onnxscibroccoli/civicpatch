import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "check_source_urls.py"
spec = importlib.util.spec_from_file_location("check_source_urls", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class URLHealthTests(unittest.TestCase):
    def test_only_unique_website_and_canonical_source_urls_are_checked(self):
        data = {"municipalities": [
            {"official_website": "https://town.example.gov", "official_sources": [{"canonical_url": "https://town.example.gov"}]},
            {"official_website": None, "official_sources": [{"canonical_url": "https://agency.example.gov"}]}
        ]}
        self.assertEqual(module.collect_urls(data), ["https://agency.example.gov", "https://town.example.gov"])

    def test_private_and_non_http_destinations_are_rejected(self):
        self.assertFalse(module.is_public_http_url("http://127.0.0.1/"))
        self.assertFalse(module.is_public_http_url("file:///etc/passwd"))
        self.assertFalse(module.is_public_http_url("http://localhost/"))

    def test_reachability_report_does_not_mutate_verification(self):
        self.assertIn("never changes record_status or verification_status", SCRIPT.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
