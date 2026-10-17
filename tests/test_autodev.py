"""Offline safety tests for the bounded agentic code generator."""
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts/autodev.py'
spec = importlib.util.spec_from_file_location('autodev', SCRIPT)
autodev = importlib.util.module_from_spec(spec)
spec.loader.exec_module(autodev)


class AutoDevTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        for name in ('scripts', 'tests', '.github/autodev'):
            (self.root / name).mkdir(parents=True)
        (self.root / 'scripts/sample.py').write_text('FLAG = False\n', encoding='utf-8')
        (self.root / 'tests/test_sample.py').write_text('assert True\n', encoding='utf-8')
        self.task = {'id': 'test', 'goal': 'Make a safe small change', 'files': ['scripts/sample.py', 'tests/test_sample.py']}
        (self.root / '.github/autodev/tasks.json').write_text(json.dumps({'tasks': [self.task]}))
        (self.root / '.github/autodev/progress.json').write_text(json.dumps({'completed': []}))

    def tearDown(self):
        self.temp.cleanup()

    def test_tracks_one_pending_task_at_a_time(self):
        self.assertEqual(autodev.select_task(self.root)['id'], 'test')
        (self.root / '.github/autodev/progress.json').write_text(json.dumps({'completed': ['test']}))
        self.assertIsNone(autodev.select_task(self.root))

    def test_accepts_exact_changes_to_source_and_test(self):
        candidate = {'edits': [
            {'path': 'scripts/sample.py', 'old': 'False', 'new': 'True'},
            {'path': 'tests/test_sample.py', 'old': 'assert True', 'new': 'assert 1 == 1'},
        ]}
        changed = autodev.parse_edits(json.dumps(candidate), self.task, self.root)
        self.assertIn('FLAG = True', changed['scripts/sample.py'])
        self.assertIn('assert 1 == 1', changed['tests/test_sample.py'])
        self.assertEqual((self.root / 'scripts/sample.py').read_text(), 'FLAG = False\n')

    def test_rejects_workflow_edits_and_missing_test_changes(self):
        with self.assertRaises(ValueError):
            autodev.parse_edits(json.dumps({'edits': [
                {'path': '.github/workflows/deploy-pages.yml', 'old': 'a', 'new': 'b'},
                {'path': 'tests/test_sample.py', 'old': 'assert', 'new': 'check'},
            ]}), self.task, self.root)
        with self.assertRaises(ValueError):
            autodev.parse_edits(json.dumps({'edits': [
                {'path': 'scripts/sample.py', 'old': 'False', 'new': 'True'},
                {'path': 'scripts/sample.py', 'old': 'FLAG', 'new': 'STATE'},
            ]}), self.task, self.root)

    def test_rejects_ambiguous_and_no_op_replacements(self):
        with self.assertRaises(ValueError):
            autodev.parse_edits(json.dumps({'edits': [
                {'path': 'scripts/sample.py', 'old': 'x', 'new': 'y'},
                {'path': 'tests/test_sample.py', 'old': 'assert', 'new': 'assert'},
            ]}), self.task, self.root)

    def test_only_python_source_and_test_tasks(self):
        with self.assertRaises(ValueError):
            autodev.validate_task({'files': ['.github/workflows/deploy-pages.yml', 'tests/test_sample.py']})


if __name__ == '__main__':
    unittest.main()
