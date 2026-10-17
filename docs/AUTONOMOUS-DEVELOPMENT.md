# Bounded autonomous development (review-gated)

CivicPatch uses [`.github/workflows/bounded-autodev.yml`](../.github/workflows/bounded-autodev.yml) to schedule **four short development attempts per UTC day**. Each selects exactly one preapproved, incremental Python implementation-and-test task from [`.github/autodev/tasks.json`](../.github/autodev/tasks.json). The model proposes exact text substitutions, not arbitrary shell commands, deploys, or repository administration actions.

## Execution and budget

- Runs at 02:19, 08:19, 14:19 and 20:19 UTC, with `timeout-minutes: 15` and only one concurrent job. Four fully saturated runs every day in a 31-day month would be **1,860 runner-minutes**; most runs should skip immediately when a PR is waiting for review. This is a self-imposed scheduling cap, **not an account-wide GitHub billing quota**. As a public repository, CivicPatch gets standard GitHub-hosted Linux runner minutes without usage charges under GitHub's currently published terms. Other workflows, artifact limits, external model quotas, and acceptable-use policies are separate constraints.
- Scheduled GitHub jobs may be delayed or skipped, and can be disabled after 60 days of public-repository inactivity. This is **periodic autonomous progress**, not an uninterrupted 24/7 worker or guaranteed task completion.
- The scheduler only activates after this workflow is merged into `main`; `workflow_dispatch` allows one manual cycle.
- A pending draft PR on `automation/autodev-next` prevents duplicate inference. After each reviewed PR is merged, its `.github/autodev/progress.json` marker moves the next scheduled cycle to the next curated task. No task is self-certified before review.

## Open model and API routing

**No paid API key is necessary.** Without a secret, the workflow runs Ollama in a short-lived Docker container and pulls the open `qwen2.5-coder:1.5b` model. CPU inference uses the documented Ollama JSON-mode chat API. Very small models may fail to produce useful patches; failure is safe, and the same task is attempted next time.

An optional larger LLM can be used through an OpenAI-compatible HTTPS endpoint. Configure the repository Actions secret `CIVICPATCH_LLM_API_KEY`. Optionally set repository Actions variables `CIVICPATCH_LLM_API_URL` and `CIVICPATCH_LLM_MODEL`. With a key, defaults are `https://openrouter.ai/api/v1/chat/completions` and `openrouter/free`. Both variables must match the chosen provider; free model availability and quotas can change. For guaranteed zero API spending, use the local fallback or restrict provider credentials to a zero-spend/free-only account. **GitHub Actions timeouts do not constrain external API spending.**

## Production and safety gates

1. The agent reads exactly one task and two allowlisted Python files. Repository content is untrusted reference data, not instructions.
2. Strict JSON edit validation requires unique exact substitutions, 2–12 edits and changes to both implementation and test, and rejects arbitrary file paths (including workflows, civic data and deployment assets). It never executes model-supplied shell commands.
3. The workflow validates `git diff --check`, `python3 -m unittest discover -s tests -v`, `python3 scripts/validate_ma_directory.py`, and `python3 scripts/report_ma_coverage.py`. A failing first gate writes bounded diagnostics and permits **one model-assisted repair**, followed by a mandatory secret-free final test gate. Model API credentials are present only during inference/repair steps, never during generated test execution. A two-day final-candidate patch artifact provides recovery evidence; tests do not eliminate all risks of untrusted code.
4. Only after validation passes does `peter-evans/create-pull-request@v7` open a **draft** PR. Production Pages is not changed. **A person must review and merge** for provenance, accessibility, security, privacy, meaningful tests, and factual correctness.
5. If model generation, tests, or permissions fail, the workflow stops; `main` remains unchanged. GitHub Actions logs contain the failure evidence.

**Permission prerequisite:** In repository **Settings → Actions → General → Workflow permissions**, enable suitable `GITHUB_TOKEN` read/write permissions and **Allow GitHub Actions to create and approve pull requests**. CivicPatch Issues #3 and #4 document previous automation failures when trying to push review branches. If the repository blocks it, this new workflow cannot open draft PRs until the settings are corrected.

## Milestones and local verification

The five current bounded tasks target Issue #8 URL-health robustness and Stage 1 Massachusetts directory integrity. The queue does **not** cover the entire roadmap or establish completion of CivicPatch. To keep progressing beyond the initial queue, future maintainers must extend the curated, testable backlog through reviewed PRs; the agent otherwise stops rather than inventing unrelated tasks. Human review remains mandatory before changes to verified public records, personal data, government communications, or release configuration.

```sh
python3 -m unittest discover -s tests -v
python3 scripts/autodev.py pending
python3 scripts/validate_ma_directory.py
```

No claim is made that GitHub has successfully executed Ollama, produced a draft, or deployed new CivicPatch code until live workflow evidence confirms those outcomes.
