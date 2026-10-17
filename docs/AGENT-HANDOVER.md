# CivicPatch GitHub Actions autonomous handover

**Repository:** `onnxscibroccoli/civicpatch` · **Controller:** GitHub Actions on `main` · **Execution:** scheduled, event-dispatched, bounded jobs.

The development loop runs **without an external ChatGPT session**. Within its narrow
approved code-and-test scope it can admit a task, synthesize a patch, validate,
open a draft pull request, stage an alpha/beta preview, independently validate
the exact candidate SHA, merge, and trigger the production Pages release.

This is **bounded asynchronous autonomy**, not a continuously executing
daemon and not proof that all CivicPatch milestones are complete.

## Separate model-driven frontend experiment track

The backend code-and-test gatekeeper described below remains active. The additional
[Alpha frontend loop](ALPHA-AGENTIC-LOOP.md) is a separate GitHub Actions workflow
that runs twice daily and writes only browser feature modules on its dedicated
agent/alpha-frontend branch. It maps model-planned dependencies, publishes to the
experimental /alpha/agentic/ route **before** checking that URL, performs a
lightweight live/syntax smoke, repairs once or rolls back, and records the failed
goal for another cycle. Every three successful increments, it stages the Alpha
frontend snapshot under /beta/agentic/ and prioritizes model-driven review of
previous work. It does not grant the model access to the production website or
the civic dataset. Frontend model inference occurs inside GitHub Actions without
an external ChatGPT prompt session. The original narrow Python release allowlist
has not been widened.

## State machine

| Stage | Workflow / entry point | Permission boundary | Advancement |
| --- | --- | --- | --- |
| Admission | `.github/workflows/agent-dispatcher.yml` | `actions:write` to dispatch; read-only PR enumeration | Skip an open agent PR; otherwise dispatch ingestion |
| Task ingestion | `.github/workflows/agent-task-ingest.yml` | Read issues, write task manifest, dispatch | Only `agent-ready` issue entries by OWNER/MEMBER/COLLABORATOR using an approved Python source/test pair |
| Generation | `.github/workflows/bounded-autodev.yml` | Strict two-file allowlist; model output treated as untrusted | Reviewed recipe or Ollama/OpenAI-compatible endpoint, exact edits and regression tests |
| Alpha | Generation workflow | `agent/alpha` branch | Only after a passing candidate and draft PR |
| Independent verification | `.github/workflows/agent-gatekeeper.yml` | Immutable head SHA, **exactly** source/test/progress paths, secret-free tests | Validate all tests, compile, MA schema and coverage |
| Beta | Gatekeeper | `agent/beta` branch | After independent verification |
| Production | Gatekeeper merges to `main`, dispatches `deploy-pages.yml` | Deployment uses separate least-privilege job | Build/tests succeed before publish |
| Pages | `.github/workflows/deploy-pages.yml` | **build:** `contents:read`; **deploy:** `pages:write`/`id-token:write` | Upload one sanitized Pages artifact containing `/`, `/alpha`, `/beta` when preview branches exist |

**Source data provenance:** Municipal records are NOT changed by the code
synthesis allowlist. A reachable URL is not a verified civic fact. External
`CivicPatch/open-data` and `CivicPatch/civicpatch-tools` repositories are
not automatically modified, and their schemas differ from this repository's
Massachusetts JSON directory.

## Schedules, budget, and triggers

The dispatcher runs at **02:19, 08:19, 14:19 and 20:19 UTC** using
`cron: 19 2,8,14,20 * * *`. It also supports manual `workflow_dispatch`
and a limited bootstrap push event for dispatcher/worker changes. The worker
runs only when dispatched and allows one active job. It has a 15-minute
timeout. Ingestion has 5 minutes and dispatcher 3 minutes; independent gatekeeper
and Pages build/deploy use separate jobs with additional timeout allowances.

**Do not claim 1,860 minutes is the total monthly budget:** that figure covers
the **worker only** at 4 × 15 × 31. Orchestration, independent verification,
production builds, scheduled URL reports, and other CI runs consume additional
runner time. The repository is public and uses standard GitHub-hosted Linux
runners, but GitHub usage rules, scheduled-job delays, and provider quotas
continue to apply. External LLM API spending is **not** bounded by runner minutes.
Set a no-spend provider quota or leave the API secret absent to use local Ollama.

The dispatcher skips when `automation/autodev-next` has an open PR. It does
not blindly recurse on model output. Issue ingestion accepts up to three new
approved tasks per cycle, with at most 30 tasks in the curated manifest.
The admitted scope remains preexisting `scripts/*.py` and `tests/*.py`
pairs only; new workflows, arbitrary tools, new data records, and deployment
settings cannot be authored by the coding model.

A known exact-match model failure can be addressed by a reviewed task recipe
inside `autodev.py`. The worker skips Ollama startup when a valid recipe is
available. Otherwise the worker uses Qwen2.5-Coder through local Ollama or
the configured OpenAI-compatible endpoint and allows bounded format/test
repair attempts.

## Production authority and remaining trust boundaries

`HUMAN_IN_THE_LOOP=false` means routine **allowlisted code-and-test tasks**
can be advanced automatically after verification. It does not disable GitHub
repository policies. It does **not** grant unrestricted authority to change
credentials, government records, external repositories, workflow definitions,
source provenance, or public claims of verification.

A passed test suite is necessary but not sufficient evidence that arbitrary
LLM code is trustworthy. The gatekeeper enforces exact branch, head SHA,
file count and fixed allowlist. Production deploys compile and retest content
in a read-only **build job**; the separate credential-bearing deployment job
only publishes the already-built Pages artifact.

This design cannot guarantee literal zero downtime: GitHub Pages availability
and deployment completion depend on GitHub's service. It preserves the previously
successful production site if a build gate fails instead of publishing
unvalidated replacements.

## Live acceptance evidence — October 17, 2026

The following runs exercised the chain with actual GitHub Actions, not a
simulated local execution:

1. [Dispatcher run 39009951716](https://github.com/onnxscibroccoli/civicpatch/actions/runs/39009951716) — succeeded.
2. [Task-ingestion run 39009956991](https://github.com/onnxscibroccoli/civicpatch/actions/runs/39009956991) — succeeded.
3. [Synthesis run 39009966302](https://github.com/onnxscibroccoli/civicpatch/actions/runs/39009966302) — created [draft PR #18](https://github.com/onnxscibroccoli/civicpatch/pull/18) after passing the regression gate, proving Actions PR creation permissions.
4. [Independent gatekeeper run 39009983238](https://github.com/onnxscibroccoli/civicpatch/actions/runs/39009983238) — validated immutable candidate SHA, ran complete tests, promoted `agent/beta` and automatically merged PR #18.
5. [Pages run 39010015925](https://github.com/onnxscibroccoli/civicpatch/actions/runs/39010015925) — successfully built and deployed production with `/alpha` and `/beta` previews.

The first failed recipe attempt [39009824757](https://github.com/onnxscibroccoli/civicpatch/actions/runs/39009824757) was caught by the regression tests and corrected in PR #17 before any model-generated changes were merged. It demonstrates that a failed gate stops bad promotion.

## Operator controls and recovery

- Inspect [Actions runs](https://github.com/onnxscibroccoli/civicpatch/actions) for `Agent dispatcher`, `Agent task ingestion`, `Bounded agentic`, `Agent independent gatekeeper`, and `Deploy CivicPatch`.
- To restart a bounded iteration, use **Actions → Agent dispatcher → Run workflow** on `main`. Do not dispatch worker/gatekeeper concurrently or bypass the SHA gate.
- Inspect `.github/autodev/tasks.json` and `.github/autodev/progress.json` for the approved backlog and completed milestones.
- To pause generation without removing deployed code, disable the dispatcher workflow in the Actions UI. Keep the production Pages deployment enabled.
- Investigate failed generation and test logs instead of manually editing progress markers. Changes to source/test pairs require a new verified candidate.
- Restore production by reverting the problematic `main` commit and re-running Pages. Do not force-push `agent/beta` to an unvalidated commit.
- Keep `GITHUB_TOKEN` at declared minimum scopes for each workflow; repository admin configuration may still block the ability to create PRs or dispatch workflows.

## Known limitations and next milestones

The end-to-end control plane is verified, but the product roadmap is
**not complete**. Only finite allowlisted engineering tasks are handled;
the small open model still struggles with some exact-text proposals.
Maintainer issue-body task ingestion exists; interpreting arbitrary PR review
comments as automatic code instructions is **not** implemented, for safety.
The `agent/alpha` and `agent/beta` previews are labeled static website
snapshots and do not constitute independent cloud environments or independent
browser end-to-end testing.

Future releases should establish stronger candidate sandboxing, external API
spending caps, replayable state logs, post-deploy HTTP health checks, branch
protection, and measured agent success rate before widening the coding allowlist.
