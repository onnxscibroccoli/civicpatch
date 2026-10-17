"""Offline tests for the model-driven, publish-before-test Alpha lab."""
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
spec = importlib.util.spec_from_file_location("alpha_agent", ROOT / "scripts/alpha_agent.py")
alpha = importlib.util.module_from_spec(spec)
spec.loader.exec_module(alpha)


class AlphaAgentTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        (self.root / "alpha-agent").mkdir()
        (self.root / "artifacts").mkdir()
        self.roadmap = {"schema_version": 1, "goals": [
            {"id": "source-review", "title": "Source review",
             "goal": "Build an accessible source review checklist.",
             "connections": ["DOM", "ARIA"]},
            {"id": "keyboard-help", "title": "Keyboard help",
             "goal": "Provide accessible keyboard navigation instructions.",
             "connections": ["DOM", "events"]},
        ]}
        self.state = {"schema_version": 1, "completed": [], "blocked": [],
                      "attempts": 0, "successful_iterations": 0, "review_count": 0,
                      "last_good_sha": None, "last_failure": None}
        alpha.write_json(self.root / "alpha-agent/roadmap.json", self.roadmap)
        alpha.write_json(self.root / "alpha-agent/state.json", self.state)

    def tearDown(self):
        self.temp.cleanup()

    def test_selects_approved_goal_and_then_next_goal_after_failure(self):
        goal = alpha.select_goal(self.root)
        self.assertEqual(goal["target"], "source-review")
        alpha.generation_failure(self.root, "Model output malformed")
        self.assertEqual(alpha.select_goal(self.root)["target"], "keyboard-help")
        state = alpha.read_json(self.root / "alpha-agent/state.json")
        self.assertEqual(state["blocked"][0]["reason"], "Model output malformed")

    def test_reviews_existing_code_after_three_successful_iterations(self):
        state = dict(self.state)
        state.update(completed=["source-review"], successful_iterations=3,
                     attempts=3, review_count=0)
        alpha.write_json(self.root / "alpha-agent/state.json", state)
        goal = alpha.select_goal(self.root)
        self.assertEqual(goal["kind"], "review")
        self.assertEqual(goal["target"], "source-review")

    def test_forbids_unsafe_network_and_html_injection(self):
        code = ('const p = document.createElement("p"); '
                'p.textContent = "Ready"; root.appendChild(p);')
        self.assertEqual(alpha.checked_body(code), code)
        for unsafe in (
            'fetch("https://example.com");',
            'root.innerHTML = "<p>invalid</p>";',
            'eval("console.log(1)");',
            'navigator.sendBeacon("/track", "x");',
            'localStorage.setItem("private", "1");',
            'window.location = "https://evil.example";',
        ):
            with self.subTest(unsafe=unsafe), self.assertRaises(ValueError):
                alpha.checked_body(unsafe)

    def test_generator_adds_one_isolated_feature_with_no_execution(self):
        task = alpha.select_goal(self.root)
        plan = {"task": task, "connections": ["DOM"], "steps": ["Add checklist"],
                "risks": ["Experimental only"]}
        alpha.write_json(self.root / "artifacts/alpha-plan.json", plan)
        code = 'const p = document.createElement("p"); p.textContent = "Example"; root.appendChild(p);'
        with patch.object(alpha, "model_request", return_value={"code": code}) as inference:
            destination = alpha.synthesize(self.root)
        self.assertEqual(inference.call_count, 1)
        output = destination.read_text()
        self.assertIn('window.CivicLab.register("source-review"', output)
        self.assertIn(alpha.FEATURE_START, output)
        self.assertEqual(alpha.existing_body(task, self.root), code)
        self.assertEqual(alpha.read_json(self.root / "alpha-agent/state.json")["attempts"], 1)

    def test_accepted_candidate_advances_safely(self):
        state = dict(self.state)
        state["pending"] = {"id": "source-review", "target": "source-review",
                            "kind": "new", "title": "Source review"}
        alpha.write_json(self.root / "alpha-agent/state.json", state)
        alpha.accept(self.root, "a" * 40)
        next_state = alpha.read_json(self.root / "alpha-agent/state.json")
        self.assertEqual(next_state["completed"], ["source-review"])
        self.assertEqual(next_state["successful_iterations"], 1)
        self.assertNotIn("pending", next_state)
        self.assertEqual(alpha.select_goal(self.root)["id"], "keyboard-help")

    def test_rejected_published_candidate_does_not_advance_task(self):
        state = dict(self.state)
        state.update(attempts=1, pending={
            "id": "source-review", "target": "source-review", "kind": "new",
            "title": "Source review",
        })
        alpha.write_json(self.root / "alpha-agent/state.json", state)
        alpha.reject(self.root, "live smoke returned HTTP 404")
        new = alpha.read_json(self.root / "alpha-agent/state.json")
        self.assertNotIn("source-review", new["completed"])
        self.assertEqual(new["blocked"][0]["id"], "source-review")
        self.assertEqual(alpha.select_goal(self.root)["id"], "keyboard-help")

    def test_planner_falls_back_to_reviewed_dom_connections(self):
        goal = alpha.select_goal(self.root)
        with patch.object(alpha, "model_request",
                          side_effect=[ValueError("invalid JSON"), ValueError("invalid JSON")]):
            result = alpha.plan_goal(self.root)
        self.assertEqual(result["task"]["id"], goal["id"])
        self.assertEqual(result["connections"], ["DOM", "ARIA"])

    def test_refuses_wrong_live_host_or_sha(self):
        with self.assertRaises(ValueError):
            alpha.check_live(self.root, "not-a-sha", "https://onnxscibroccoli.github.io/civicpatch/")
        with self.assertRaises(ValueError):
            alpha.check_live(self.root, "a" * 40, "https://evil.example/")
        with self.assertRaises(ValueError):
            alpha.dispatch_pages_and_smoke(self.root, "not-a-sha")


if __name__ == "__main__":
    unittest.main()
