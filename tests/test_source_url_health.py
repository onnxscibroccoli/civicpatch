import importlib.util
import unittest
from pathlib import Path
from unittest.mock import Mock, patch
from urllib.request import Request

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

    def test_redirect_handler_rejects_private_target_before_following(self):
        for target in ("http://127.0.0.1/metadata", "http://localhost/", "file:///etc/shadow", "http://169.254.169.254/latest/meta-data/"):
            with self.subTest(target=target):
                handler = module.PublicOnlyRedirectHandler()
                with self.assertRaises(module.UnsafeRedirectError):
                    handler.redirect_request(Request("https://example.org/path"), None, 302, "Found", {}, target)

    def test_redirect_handler_accepts_public_redirect_and_preserves_encoded_spaces(self):
        destination = "https://www.example.org/Committee%20List%202026%20AMENDED.pdf"
        with patch.object(module, "is_public_http_url", return_value=True):
            request = module.PublicOnlyRedirectHandler().redirect_request(
                Request("https://example.org/old"), None, 302, "Found", {}, destination
            )
        self.assertEqual(request.full_url, destination)
        self.assertNotIn("%2520", request.full_url)

    def test_probe_marks_rejected_redirect_manual_review_and_never_exposes_target(self):
        with patch.object(module, "is_public_http_url", return_value=True), patch.object(module, "build_opener") as builder:
            builder.return_value.open.side_effect = module.UnsafeRedirectError("unsafe redirect")
            result = module.probe("https://example.org/")
        self.assertEqual(result["status"], "manual_review")
        self.assertIsNone(result["final_url"])
        builder.return_value.open.assert_called_once()

    def test_probe_reports_public_redirect_without_rewriting_verification(self):
        source = "https://example.org/old"
        destination = "https://example.org/new"
        response = Mock()
        response.getcode.return_value = 200
        response.geturl.return_value = destination
        response.__enter__ = Mock(return_value=response)
        response.__exit__ = Mock(return_value=False)
        with patch.object(module, "is_public_http_url", return_value=True), patch.object(module, "build_opener") as builder:
            builder.return_value.open.return_value = response
            record = module.probe(source)
        self.assertEqual(record["status"], "redirected")
        self.assertEqual(record["final_url"], destination)

    def test_malformed_urls_are_rejected(self):
        for value in ("https://[::1]/", "https://[bad-ipv6/", "https://public.example:invalid/", "http://user:secret@public.example/"):
            with self.subTest(value=value):
                self.assertFalse(module.is_public_http_url(value))

    def test_reachability_report_does_not_mutate_verification(self):
        self.assertIn("never changes record_status or verification_status", SCRIPT.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
