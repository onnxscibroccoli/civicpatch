import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / "scripts/build_pages_bundle.py"
spec = importlib.util.spec_from_file_location("build_pages_bundle", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PagesBundleTests(unittest.TestCase):
    def test_preview_is_visible_and_has_noindex_marker(self):
        sha = "a" * 40
        site = module.stamp_preview("<html><head></head><body>Site</body></html>", "beta", sha)
        self.assertIn("BETA PREVIEW", site)
        self.assertIn('name="robots" content="noindex,nofollow"', site)
        self.assertIn("not a verified government service", site)

    def test_disallows_unapproved_stage_or_ref(self):
        with self.assertRaises(ValueError):
            module.stamp_preview("<head></head><body>", "production", "a" * 40)
        with self.assertRaises(ValueError):
            module.git_blob("malicious; command", "index.html")
        with self.assertRaises(ValueError):
            module.git_blob("a" * 40, "scripts/autodev.py")

    def test_production_bundle_does_not_copy_git_or_workflows(self):
        with tempfile.TemporaryDirectory() as temp:
            out = Path(temp) / "site"
            module.build(out)
            self.assertTrue((out / "index.html").is_file())
            self.assertTrue((out / "data/ma/municipalities.json").is_file())
            self.assertFalse((out / ".github").exists())
            self.assertFalse((out / "scripts").exists())
            self.assertFalse((out / ".git").exists())


if __name__ == "__main__":
    unittest.main()
