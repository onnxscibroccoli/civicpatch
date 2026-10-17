"""Minimal static contract for the GitHub-only Alpha scheduler."""
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class AlphaWorkflowContractTests(unittest.TestCase):
    def test_executor_shell_syntax(self):
        result = subprocess.run(
            ["bash", "-n", str(ROOT / "scripts/alpha_cycle.sh")],
            capture_output=True, text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_publish_first_and_preserve_model_limits(self):
        script = (ROOT / "scripts/alpha_cycle.sh").read_text(encoding="utf-8")
        staged = script.index("commit -m 'agent(alpha): publish generated frontend before validation'")
        pushed = script.index("echo \"Alpha frontend candidate committed before smoke:")
        smoked = script.index("python3 scripts/alpha_agent.py publish-smoke --sha")
        self.assertLess(staged, pushed)
        self.assertLess(pushed, smoked)
        self.assertIn("git -C \"$work\" revert --no-commit", script)
        self.assertIn("agent/beta-frontend", script)

    def test_scheduled_job_is_serialized_and_bounded(self):
        wf = (ROOT / ".github/workflows/agent-alpha.yml").read_text(encoding="utf-8")
        self.assertIn('cron: "47 3,15 * * *"', wf)
        self.assertIn("timeout-minutes: 17", wf)
        self.assertIn("cancel-in-progress: false", wf)


if __name__ == "__main__":
    unittest.main()
