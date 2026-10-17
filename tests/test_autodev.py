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

    def test_invalid_first_model_output_gets_one_retry(self):
        from unittest.mock import patch
        success = json.dumps({'edits': [
            {'path': 'scripts/sample.py', 'old': 'False', 'new': 'True'},
            {'path': 'tests/test_sample.py', 'old': 'assert True', 'new': 'assert 1 == 1'},
        ]})
        with patch.object(autodev, 'infer', side_effect=[('{"edits":[]}', 'fake'), (success, 'fake')]) as mocked:
            autodev.generate(self.root)
        self.assertEqual(mocked.call_count, 2)
        self.assertIn('FLAG = True', (self.root / 'scripts/sample.py').read_text())
        self.assertEqual(json.loads((self.root / '.github/autodev/progress.json').read_text())['completed'], ['test'])

    def test_secret_free_test_log_can_drive_one_repair_without_double_advancing(self):
        from unittest.mock import patch
        diagnostic = self.root / 'artifacts/autodev-first-gates.txt'
        diagnostic.parent.mkdir()
        diagnostic.write_text('FAIL: AssertionError: False is not True\\n', encoding='utf-8')
        marker = self.root / '.github/autodev/progress.json'
        marker.write_text(json.dumps({'completed': ['test']}), encoding='utf-8')
        proposal = json.dumps({'edits': [
            {'path': 'scripts/sample.py', 'old': 'False', 'new': 'True'},
            {'path': 'tests/test_sample.py', 'old': 'assert True', 'new': 'assert 1 == 1'},
        ]})
        with patch.object(autodev, 'infer', return_value=(proposal, 'fake')) as inference:
            autodev.repair(self.root)
        self.assertIn('AssertionError', inference.call_args[0][0])
        self.assertEqual(json.loads(marker.read_text())['completed'], ['test'])
        self.assertIn('FLAG = True', (self.root / 'scripts/sample.py').read_text())

    def test_repair_does_not_run_without_diagnostic_evidence(self):
        marker = self.root / '.github/autodev/progress.json'
        marker.write_text(json.dumps({'completed': ['test']}), encoding='utf-8')
        with self.assertRaises(ValueError):
            autodev.repair(self.root)

    def test_audited_recipe_implements_transient_network_classification(self):
        from unittest.mock import patch
        task = {
            'id': 'p0-url-network-failures',
            'goal': 'Distinguish temporary errors from permanent failures',
            'files': ['scripts/check_source_urls.py', 'tests/test_source_url_health.py'],
        }
        source = self.root / task['files'][0]
        suite = self.root / task['files'][1]
        source.write_text(
            '            return {"url": url, "status": "broken", "http_status": exc.code, "final_url": exc.geturl(), "error": str(exc)[:300]}\\n'
            '            return {"url": url, "status": "broken", "http_status": None, "final_url": None, "error": str(exc)[:300]}\\n'
            '("reachable", "redirected", "broken", "manual_review")\\n',
            encoding='utf-8',
        )
        suite.write_text(
            '    def test_reachability_report_does_not_mutate_verification(self):\\n'
            '        pass\\n',
            encoding='utf-8',
        )
        (self.root / '.github/autodev/tasks.json').write_text(json.dumps({'tasks': [task]}))
        original = source.read_text()
        with patch.object(autodev, 'infer', side_effect=AssertionError('No LLM should be used')):
            autodev.generate(self.root)
        self.assertNotEqual(source.read_text(), original)
        self.assertIn('transient_error', source.read_text())
        self.assertIn('def test_transient_network_failures', suite.read_text())
        self.assertEqual(
            json.loads((self.root / '.github/autodev/progress.json').read_text())['completed'],
            ['p0-url-network-failures'],
        )

    def test_recipe_rejects_unexpected_original_source_and_unapproved_ids(self):
        self.assertIsNone(autodev.audited_recipe(self.task))
        task = {
            'id': 'p0-url-network-failures',
            'goal': 'URL health',
            'files': ['scripts/sample.py', 'tests/test_sample.py'],
        }
        self.assertIsNone(autodev.audited_recipe(task))
        task['files'] = ['scripts/check_source_urls.py', 'tests/test_source_url_health.py']
        (self.root / 'scripts/check_source_urls.py').write_text('no matching source\\n')
        (self.root / 'tests/test_source_url_health.py').write_text('no matching test\\n')
        with self.assertRaises(ValueError):
            autodev.select_recipe(task, self.root)

    def test_only_python_source_and_test_tasks(self):
        with self.assertRaises(ValueError):
            autodev.validate_task({'files': ['.github/workflows/deploy-pages.yml', 'tests/test_sample.py']})


if __name__ == '__main__':
    unittest.main()
