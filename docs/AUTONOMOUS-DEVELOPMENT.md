# CivicPatch autonomous development — operational configuration

The [GitHub-only handover and live proof](AGENT-HANDOVER.md) is the
authoritative operational reference. See also the
[multi-agent state machine](AGENT-STATE-MACHINE.md).

## Execution

The dispatcher in `.github/workflows/agent-dispatcher.yml` runs at
02:19, 08:19, 14:19 and 20:19 UTC, with manual and limited bootstrap
dispatch. It starts issue ingestion and a bounded development worker.
Neither a live ChatGPT session nor an always-on server is necessary.

The code generator supports pre-reviewed exact-substitution recipes and,
for other approved tasks, the local `qwen2.5-coder:1.5b` Ollama model.
An optional `CIVICPATCH_LLM_API_KEY` Action secret selects an
OpenAI-compatible HTTPS endpoint with repository variables
`CIVICPATCH_LLM_API_URL` and `CIVICPATCH_LLM_MODEL`.
Free external model availability and request costs are provider-dependent.
No external secret is necessary for the local default.

## Authorization and trust boundaries

The manifest `.github/autodev/tasks.json` and
`.github/autodev/progress.json` define approved work and state. Issue
ingestion accepts `agent-ready` issues by members/maintainers with a
fenced JSON task, only for a previously allowlisted Python source/test pair.
Model-generated changes must touch exactly one implementation, one
corresponding test, and the progress marker. It cannot edit workflows,
government data, credentials, or release configuration.

The worker opens a draft PR after passing complete tests. A separate,
independent gatekeeper verifies immutable head SHA, allowed changed
paths, compilation, tests, directory invariants and coverage. A passing
candidate is promoted to `agent/beta`, automatically merged to `main`,
and deployed through GitHub Pages. `agent/alpha` holds the initial
unreviewed candidate, and Pages includes labeled `/alpha/` and
`/beta/` views. A person is **not required** for the narrowly allowed
code-and-test promotion; all other sensitive work remains excluded.
The production deployment workflow uses a read-only build/test job and
a separate pages/token deployment job.

## Resource controls

The worker itself has a 15-minute ceiling and four scheduled entry points
per day, for **at most 1,860 worker minutes in a 31-day month**.
That is **not the whole pipeline budget**: dispatcher, issue ingestion,
independent test jobs, GitHub Pages, ordinary CI and URL monitoring incur
additional runtime. Public standard runners may be free under GitHub
policy, but workflows must still comply with service quotas and fair use.
GitHub scheduled events are best-effort, not guaranteed uninterrupted
24/7 processing.

Concurrency gates prevent duplicates while an agent-generated PR is
open. An invalid model patch or failed test is rejected; the codegen
loop has bounded retries, not endless recursion. Only tasks in the
approved queue are eligible for promotion.

## Verified execution (2026-10-17)

- [Dispatcher](https://github.com/onnxscibroccoli/civicpatch/actions/runs/39009951716): succeeded.
- [Issue ingestion](https://github.com/onnxscibroccoli/civicpatch/actions/runs/39009956991): succeeded.
- [Code synthesis and PR creation](https://github.com/onnxscibroccoli/civicpatch/actions/runs/39009966302): succeeded.
- [Independent gatekeeper and autonomous merge](https://github.com/onnxscibroccoli/civicpatch/actions/runs/39009983238): succeeded, merged [PR #18](https://github.com/onnxscibroccoli/civicpatch/pull/18).
- [Production and previews](https://github.com/onnxscibroccoli/civicpatch/actions/runs/39010015925): deployed successfully.

The current system is an autonomous incremental code-maintenance engine,
**not** a fully implemented civic product. Claims about verified municipal
officials and authoritative services still require independent evidence.

## Recovery

Inspect [GitHub Actions](https://github.com/onnxscibroccoli/civicpatch/actions).
Re-run the dispatcher through `workflow_dispatch` on `main` after resolving
a failed gate. Do not bypass an immutable SHA check, edit progress markers
without a matched code/test merge, or force-publish an unvalidated beta
candidate. To stop auto-development, disable the dispatcher without
disabling the production Pages release.

Offline checks:

```bash
python3 -m unittest discover -s tests -v
python3 -m compileall -q scripts tests
python3 scripts/validate_ma_directory.py
python3 scripts/report_ma_coverage.py
python3 scripts/autodev.py pending
```
