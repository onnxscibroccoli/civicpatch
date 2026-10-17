# CivicPatch autonomous GitHub Actions state machine

This document describes the bounded, unattended, **low-risk** code-and-test automation implemented in this repository. It does not grant an LLM access to its own workflow files, repository secrets, civic factual verification statuses, or unlimited compute. Unattended operation means that when the repository permissions permit it, the agent can merge narrowly allowlisted Python changes without waiting for a reviewer. It does **not** mean GitHub Actions can guarantee completion of an open-ended product roadmap.

## State machine

```
GitHub scheduled/manual trigger (02:19, 08:19, 14:19, 20:19 UTC)
    agent-dispatcher.yml (3 min; actions: write)
         | if no pending agent PR
         v
    agent-task-ingest.yml (5 min; issues: read; bounded manifest update)
         | explicit workflow_dispatch, never implicit GITHUB_TOKEN push
         v
    bounded-autodev.yml (15 min; Ollama local or optional API)
         | exactly one task, source + regression test
         | optional one bounded diagnostic repair
         | open draft PR; update agent/alpha ref
         +--> deploy-pages.yml (alpha static preview)
         v
    agent-gatekeeper.yml (3 + 8 + 5 min maximum)
         | reverify PR head SHA, branch and exact three-file allowlist
         | independent regression job (contents: read, no LLM secret)
         | beta ref only when all required tests pass
         | make draft ready and squash merge
         +--> deploy-pages.yml (root prod from main + staged previews)
```

Each explicit child dispatch is created at most once on the success path. There are no recursively spawned workflow files and no loop from deployment back into the dispatcher. Job timeouts, issue-task limits, concurrency groups, and scheduled-entry gating prevent unbounded runs. The `GITHUB_TOKEN` is intentionally scoped **per job**, with `actions: write` only on jobs that dispatch follow-on workflows. GitHub's docs confirm that explicit `workflow_dispatch` and `repository_dispatch` events sent with `GITHUB_TOKEN` can run workflows; normal bot pushes do not automatically trigger workflows.

## Task admission and autonomous discovery

The versioned task manifest lives at `.github/autodev/tasks.json`. Five focused Stage 1 tasks are seeded. During ingestion, the system inspects up to 300 open GitHub Issues and accepts at most **three new tasks per cycle** (total manifest at most 30). Eligible issues must have the `agent-ready` label, `OWNER` / `MEMBER` / `COLLABORATOR` author association, and an exact fenced JSON code block:

```autodev-task
{"goal":"Improve deterministic source classification with appropriate mocked regression coverage","files":["scripts/check_source_urls.py","tests/test_source_url_health.py"]}
```

The requested paths must match an existing reviewed source/test pair. The task ID is deterministic and duplicate-safe. Other issue text, user comments, and model-generated prose are **untrusted**; nothing can dynamically authorize changing workflows, public civic data, credentials, or arbitrary repository files. Tasks are committed with an ordinary `GITHUB_TOKEN` push and then code generation is **explicitly dispatched**; if GitHub branch permissions reject the commit, the workflow fails closed.

This is autonomous **issue intake within a pre-approved scope**, not unrestricted autonomous roadmap design. A new file pair or stage must be added by a separate reviewed workflow change.

## Production, alpha, beta

GitHub Pages exposes a single repository site, so the deployment artifact contains:

| Path | Git source | Promotion rule |
|---|---|---|
| `/` | immutable current `main` checkout | Existing main plus Python structural/regression tests and Pages deploy success |
| `/alpha/` | most recent `agent/alpha` commit | candidate created, not yet independently approved |
| `/beta/` | `agent/beta` commit | immutable-head independent CI succeeded |

Alpha and beta pages are explicitly labeled **experimental** and carry `noindex,nofollow` tags. The production HTML/data are copied from `main`, never from beta or alpha. The bundle intentionally excludes `.git/`, `.github/`, scripts, tests and secrets; only necessary public static documents and assets are published. A failed build does not replace the previously deployed Pages artifact.

The beta verification gate runs the full Python unittest suite, syntax compilation, directory validation and coverage report; passing these checks is **not** a guarantee that every semantic, legal, accessibility or security condition is satisfied. Production releases remain bounded to Python-only changes from three allowlisted files: one implementation, its test, and the progress marker. Civic fact verification, communications, payments, and sensitive data remain out of scope.

## Permissions and external dependencies

Required repository settings: **Settings → Actions → General → Workflow permissions → Read and write permissions**; enable **Allow GitHub Actions to create and approve pull requests**. Previously reported Issues #3/#4 indicate write restrictions may still be present. If administration/organization rules prevent these settings, GitHub will not let the unattended workflow publish new PRs or commits; do not attempt to circumvent that constraint.

An optional `CIVICPATCH_LLM_API_KEY` secret selects a configurable OpenAI-compatible HTTPS provider. Without it, the runner pulls local `qwen2.5-coder:1.5b` through Ollama. Each codegen run is capped at 15 minutes and model-proposed edits are strictly parsed, path-checked and run **only in a secret-free test job**.

## Cost and failures

A 31-day month with all four entries daily means 124 entries. The codegen job alone is limited to 1,860 minutes. Combined worst-case caps for dispatcher + ingestion + codegen + gatekeeper + Pages runs can exceed that figure, so **1,860 minutes is not the full pipeline budget**. All workflows are time-bounded and one candidate may be promoted per cycle at most. GitHub schedules may be delayed or disabled after prolonged inactivity and depend on account/org limits. The workflows do not guarantee unlimited free Actions usage.

If the model cannot supply a valid patch, a regression gate fails twice, a PR permission is rejected, or a branch/promotion condition changes, that cycle exits cleanly; the next scheduled entry can retry. No uncontrolled infinite retry occurs. Explicit dispatch failures surface in GitHub Actions logs.

## Verification and recovery

```sh
python3 -m unittest discover -s tests -v
python3 -m compileall -q scripts tests
python3 scripts/validate_ma_directory.py
python3 scripts/report_ma_coverage.py
python3 scripts/build_pages_bundle.py --output /tmp/civicpatch-site
```

The [dispatcher](../.github/workflows/agent-dispatcher.yml) and [deployment gatekeeper](../.github/workflows/agent-gatekeeper.yml) should be checked after the first live activation. A successful YAML/CI test does **not** prove GitHub's runtime permissions or that `gh workflow run`, `gh pr ready`, `gh pr merge` and Pages promotion work on this repository. Confirm each from actual Actions run logs before declaring end-to-end handover complete.

The two upstream `CivicPatch/open-data` and `CivicPatch/civicpatch-tools` repositories belong to a separate organization. This workflow has no write rights there, and it does not impose their schemas on this repository.
