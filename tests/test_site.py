import os
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
HTML_FILE = ROOT / "index.html"


class PageInspector(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = []
        self.links = []
        self.title_depth = 0
        self.title = []
        self.main_count = 0
        self.form_count = 0
        self.labels = []
        self.inputs = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        if tag == "a" and attrs.get("href"):
            self.links.append(attrs["href"])
        if tag == "title":
            self.title_depth += 1
        if tag == "main":
            self.main_count += 1
        if tag == "form":
            self.form_count += 1
        if tag == "label" and attrs.get("for"):
            self.labels.append(attrs["for"])
        if tag in ("input", "select", "textarea") and attrs.get("id"):
            self.inputs.append(attrs["id"])

    def handle_endtag(self, tag):
        if tag == "title" and self.title_depth:
            self.title_depth -= 1

    def handle_data(self, data):
        if self.title_depth:
            self.title.append(data)


class CivicPatchSmokeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = HTML_FILE.read_text(encoding="utf-8")
        cls.page = PageInspector()
        cls.page.feed(cls.html)
        cls.page.close()

    def test_public_page_and_project_disclosure_exist(self):
        self.assertIn("CivicPatch", self.page.title[0])
        self.assertEqual(self.page.main_count, 1)
        self.assertIn("not a fully verified Massachusetts-wide service", self.html)
        self.assertIn("MIT License", (ROOT / "LICENSE").read_text(encoding="utf-8"))

    def test_ids_are_unique(self):
        self.assertEqual(len(self.page.ids), len(set(self.page.ids)))

    def test_form_controls_have_matching_labels(self):
        for control_id in self.page.inputs:
            self.assertIn(control_id, self.page.labels, f"Missing label for {control_id}")
        self.assertGreaterEqual(self.page.form_count, 1)

    def test_local_links_resolve(self):
        for href in self.page.links:
            parsed = urlparse(href)
            if parsed.scheme or href.startswith("#") or href.startswith("mailto:"):
                continue
            path = (ROOT / parsed.path).resolve()
            self.assertTrue(path.is_relative_to(ROOT.resolve()), f"Link escapes repository: {href}")
            if parsed.path:
                self.assertTrue(path.exists(), f"Broken local link: {href}")

    def test_public_directory_is_connected_with_explicit_trust_states(self):
        self.assertIn('id="directory"', self.html)
        self.assertIn('fetch("data/ma/municipalities.json"', self.html)
        self.assertIn('id="municipal-directory-match"', self.html)
        self.assertIn("not yet validated", self.html)
        self.assertTrue((ROOT / "data" / "ma" / "municipalities.json").exists())

    def test_in_browser_guide_and_privacy_disclosure_exist(self):
        self.assertIn('id="civic-form"', self.html)
        self.assertIn('addEventListener("submit"', self.html)
        self.assertIn("This page does not send it to a CivicPatch server", self.html)
        self.assertIn("noopener noreferrer", self.html)


if __name__ == "__main__":
    unittest.main()
