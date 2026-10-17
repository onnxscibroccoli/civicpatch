# Model-driven Alpha development loop

This is the GitHub-hosted experimental frontend engine for CivicPatch. It is a **bounded scheduled agent**, not a continuously running daemon and not an automatic certification of civic facts.

## Live targets

- Production: https://onnxscibroccoli.github.io/civicpatch/ (unchanged trusted main)
- Alpha: https://onnxscibroccoli.github.io/civicpatch/alpha/
- Agentic lab: https://onnxscibroccoli.github.io/civicpatch/alpha/agentic/
- Maturing Beta lab: https://onnxscibroccoli.github.io/civicpatch/beta/agentic/

Alpha and Beta are separately labeled and not indexed. The lab applies restrictive Content Security Policy and has no submission backend.

## Scheduled GitHub Actions state machine

GitHub Actions starts the Alpha model workflow at **03:47 and 15:47 UTC**, as well as on initial bootstrap changes or explicit manual dispatch. Each run is capped at 17 minutes and serialized. The existing backend agent remains independent.

1. A trusted script from main loads a separate persistent frontend branch, agent/alpha-frontend, without sharing the backend agent/alpha branch.
2. The next approved UI goal is selected from alpha-agent/roadmap.json and the persistent branch state. The model plans required connections, intermediate steps and risks. It is forbidden from enabling unapproved external integrations.
3. The model generates a small, independent, accessible JavaScript feature module. Strict validation rejects large or unexpected output, network-capable APIs, HTML injection and modifications outside the experimental browser feature contract.
4. The agent **commits and publishes the experimental feature before testing it**. It dispatches the existing GitHub Pages workflow and reads the exact run identifier from GitHub's workflow dispatch API.
5. **After Pages finishes**, a lightweight smoke verifies the live Alpha lab is serving the expected commit and feature source; Node checks JavaScript syntax. This is not a comprehensive browser, functional or WCAG audit.
6. On a detected problem, the model sees the actual diagnostic and gets one bounded repair cycle: change the feature, republish, and smoke again. If recovery fails, the agent reverts the experiment, republishes the previous Alpha and records the failed goal for later reconsideration.
7. Success advances persistent state. Every three successful increments the verified frontend is copied to agent/beta-frontend, and the next cycle schedules model-assisted review and improvement of a previous experiment rather than only adding features.

The workflow can recover from model proposal failures by deferring that goal and switching to other eligible work. It never executes model-supplied shell commands or writes directly to main. The dynamic frontend JavaScript is confined to the Alpha/Beta experimental lab, not the production site.

## Cost and usage policy

With two scheduled runs per day and a 17-minute ceiling, the Alpha job has at most 1,054 scheduled job-minutes in a 31-day month. Other CI, the old backend agent, Pages publishing and manually dispatched runs add additional usage. GitHub schedules can be delayed, skipped or disabled under the platform's rules. The local Ollama model requires no paid model API, while an optional external OpenAI-compatible endpoint can have separate costs and quotas.

## Operator controls

- Workflow: https://github.com/onnxscibroccoli/civicpatch/actions/workflows/agent-alpha.yml
- The model engine is in scripts/alpha_agent.py.
- The bounded executor is in scripts/alpha_cycle.sh.
- The lab scaffold and approved goals are in alpha-agent/.
- Persistent progress lives in the agent/alpha-frontend branch's alpha-agent/state.json, not in main.
- The frontend is bundled by scripts/build_pages_bundle.py and served by deploy-pages.yml.
- A model authoring error does not make an unverified municipal source official.

To pause model-generated experiments, disable only the Alpha workflow. Do not disable the existing production Pages deployment.
