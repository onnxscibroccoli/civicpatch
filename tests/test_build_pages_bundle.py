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

    def test_frontend_preview_uses_explicit_experimental_lab_link(self):
        sha = "a" * 40
        page = module.stamp_preview(
            "<html><head></head><body>Site</body></html>", "alpha", sha, lab=True
        )
        self.assertIn('href="agentic/"', page)
        self.assertIn('name="robots" content="noindex,nofollow"', page)
        self.assertNotIn('href="agentic/"', module.stamp_preview(
            "<html><head></head><body>Site</body></html>", "alpha", sha
        ))

    def test_isolated_frontend_bundle_excludes_model_code_from_production(self):
        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp) / "site"
            sha = "c" * 40
            inputs = {
                "index.html": b"<html><head></head><body>Preview</body></html>",
                "data/ma/municipalities.json": b"{}",
                "alpha-agent/index.html": b'<html><head></head><body>Lab<section aria-labelledby="features-heading" id="experiments"></section></body></html>',
                "alpha-agent/base.js": b"window.CivicLab = {};",
                "alpha-agent/style.css": b"body{color:black}",
                "alpha-agent/state.json": b'{"completed":[],"successful_iterations":0,"review_count":0}',
                "alpha-agent/roadmap.json": b'{"goals":[{"id":"sample","title":"Sample task"}]}',
                "alpha-agent/features/feature-one.js": b"/* ALPHA GENERATED START */\\nconst ok = true;\\n/* ALPHA GENERATED END */",
            }
            with patch.object(module, "git_blob", side_effect=lambda sha, name: inputs[name]), patch.object(
                module, "feature_paths", return_value=["alpha-agent/features/feature-one.js"]
            ):
                module.build(output, alpha_frontend=sha)
            self.assertTrue((output / "alpha/agentic/features/feature-one.js").is_file())
            lab = (output / "alpha/agentic/index.html").read_text()
            self.assertIn('name="civicpatch-frontend-sha" content="' + sha, lab)
            self.assertIn('features/feature-one.js', lab)
            self.assertIn("agentic/", (output / "alpha/index.html").read_text())
            self.assertNotIn("feature-one.js", (output / "index.html").read_text())
            self.assertFalse((output / "agentic").exists())

    def test_progress_panel_escapes_untrusted_roadmap_titles(self):
        html = module.agent_progress_markup(
            {"completed": ["one"], "successful_iterations": 2, "review_count": 1},
            {"goals": [{"id": "one", "title": "<img src=x onerror=alert(1)>"}]},
            "alpha",
        )
        self.assertIn("&lt;img", html)
        self.assertNotIn("<img", html)
        self.assertIn("2</strong> checked increments", html)
        self.assertIn("Completed", html)
        with self.assertRaises(ValueError):
            module.agent_progress_markup({}, {}, "production")

    def test_feature_paths_disallow_symlinks_and_non_js(self):
        with patch.object(module.subprocess, "run") as runner:
            runner.return_value.stdout = b"120000 blob abc123\\talpha-agent/features/unsafe.js\\n"
            with self.assertRaises(ValueError):
                module.feature_paths("a" * 40)
            runner.return_value.stdout = b"100644 blob abc123\\talpha-agent/features/../../bad.js\\n"
            with self.assertRaises(ValueError):
                module.feature_paths("a" * 40)

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
