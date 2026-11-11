# Portfolio reviewer readiness — civicpatch

> **Status:** Reviewable documentation plan, not a production certification. **As of:** 2026-11-11. **Tracking:** [local issue](https://github.com/onnxscibroccoli/civicpatch/issues/30) · [cross-repository ledger](https://github.com/onnxscibroccoli/broccoli-core/issues/102).  
> Do not interpret AI-assisted source development, successful offline tests or simulations as independently verified industry employment, compliance, or live operations.

## One-minute technical orientation

**Focus:** Source-first Massachusetts civic information. Early-stage civic platform with an official-source-oriented municipality candidate registry, site/application code, URL checks, accessibility principles, and scheduled data-validation workflows.

**What is demonstrable:** The listed source files and explicitly scoped CI runs can be inspected. A reviewer can evaluate the code, rerun supported unit tests, and challenge the architecture decisions. Any claimed practical capability requires the corresponding test, environment, and source revision; not all systems are integrated or generally available.

## Source and reviewer starting points

| Evidence | Path |
| --- | --- |
| Directory validation workflow | [Inspect](https://github.com/onnxscibroccoli/civicpatch/blob/main/.github/workflows/validate-data.yml) |
| Municipality directory tests | [Inspect](https://github.com/onnxscibroccoli/civicpatch/blob/main/tests/test_ma_directory.py) |
| Application routes | [Inspect](https://github.com/onnxscibroccoli/civicpatch/tree/main/src/routes) |
| Public product charter | [Inspect](https://github.com/onnxscibroccoli/civicpatch/blob/main/README.md) |

## Executed CI references (historical, scoped)

| Check | Exact run |
| --- | --- |
| Scheduled data validation on main | [Run 43056924311](https://github.com/onnxscibroccoli/civicpatch/actions/runs/43056924311) |

These run links refer to the specific branch/commit shown on GitHub. They must not be silently attributed to a different current HEAD, production environment, device or approval state.

## Reproduce the relevant local checks

After cloning the repository and reviewing dependencies and safe environment requirements:

```sh
python3 -m unittest discover -s tests -v && python3 scripts/validate_ma_directory.py
```

This is a **documented command**, not a claim that this portfolio PR executed it. Some modules require dependencies or privileges, and a missing dependency must be reported rather than converted into a false PASS.

## Ordered actionable changes

1. [ ] Surface the precise fraction of verified municipalities/services; distinguish candidate links from verified coverage.
2. [ ] Link data provenance and last-checked timestamps to directory updates.
3. [ ] Document automated URL reachability checks and which failures need manual source verification.
4. [ ] Build a keyboard/screen-reader-friendly static walkthrough without claiming full usability acceptance.
5. [ ] Complete privacy/source-quality gates before enabling user submissions or public production claims.

## Maturity and verification boundary

The 351-municipality registry is a structural target, not proof that statewide public services and jurisdiction guidance have all been validated or deployed.

## Release and artifact strategy

Publish a static accessible demo with links to authoritative sources and clear freshness/coverage caveats.

## Safe continuation after interruption

1. Follow the local issue and the [master execution ledger](https://github.com/onnxscibroccoli/broccoli-core/issues/102); inspect existing PRs before creating new ones.
2. Check `git rev-parse HEAD`, repo default branch, current feature branches and fresh Actions conclusions.
3. For each checklist item, implement the smallest change on a reviewable PR; record exact SHA, test scope, successes, failed/untested checks and outstanding decisions.
4. Keep a previously failing independent-approval requirement or live-device gate unresolved until a legitimately authorized actor/environment supplies evidence.
5. Re-read this document against source after changing implementation. Do **not** mark a checklist item complete merely because it is documented.

**Human-only / outside repository assertions:** employment history, professional tenure, team-management responsibilities, third-party audit and approvals.