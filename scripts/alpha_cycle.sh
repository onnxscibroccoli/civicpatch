#!/usr/bin/env bash
# GitHub Actions Alpha state machine: commit/publish candidate BEFORE smoke.
# No model-generated shell commands or release permissions are executed.
set -Eeuo pipefail
test "$GITHUB_REPOSITORY" = onnxscibroccoli/civicpatch
: "$CIVICPATCH_ALPHA_ROOT"
: "$GH_TOKEN"
repo="$GITHUB_REPOSITORY"
work="$CIVICPATCH_ALPHA_ROOT"
mkdir -p "$RUNNER_TEMP"
git config user.name 'github-actions[bot]'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'

if git fetch --quiet origin "+refs/heads/agent/alpha-frontend:refs/remotes/origin/agent/alpha-frontend"; then
  git worktree add --detach "$work" refs/remotes/origin/agent/alpha-frontend
  git -C "$work" switch -C agent/alpha-frontend
else
  git worktree add -b agent/alpha-frontend "$work" HEAD
  git -C "$work" push origin HEAD:refs/heads/agent/alpha-frontend
fi
baseline="$(git -C "$work" rev-parse HEAD)"
git -C "$work" config user.name 'github-actions[bot]'
git -C "$work" config user.email '41898282+github-actions[bot]@users.noreply.github.com'
if ! python3 scripts/alpha_agent.py pending; then
  echo 'No eligible Alpha goals within the bounded budget.'
  exit 0
fi
mkdir -p "$work/artifacts"

if [ -z "$CIVICPATCH_LLM_API_KEY" ]; then
  docker run -d --rm --name civicpatch-alpha-ollama -p 127.0.0.1:11434:11434 ollama/ollama:0.12.1
  for i in $(seq 1 25); do
    if curl --fail --silent http://127.0.0.1:11434/api/version >/dev/null; then break; fi
    sleep 1
  done
  docker exec civicpatch-alpha-ollama ollama pull qwen2.5-coder:1.5b
else
  echo 'Using configured HTTPS model provider.'
fi

if ! { python3 scripts/alpha_agent.py plan && python3 scripts/alpha_agent.py generate; } \
    > "$work/artifacts/alpha-generate.log" 2>&1; then
  tail -55 "$work/artifacts/alpha-generate.log"
  reason="$(tail -6 "$work/artifacts/alpha-generate.log" | head -c 300)"
  python3 scripts/alpha_agent.py generation-failure --diagnostic "$reason"
  git -C "$work" add alpha-agent/state.json
  git -C "$work" commit -m 'agent(alpha): defer model generation failure and choose another goal'
  git -C "$work" push origin HEAD:refs/heads/agent/alpha-frontend
  echo 'Synthesis failed safely. A different goal or later recovery will be attempted.'
  exit 0
fi
tail -12 "$work/artifacts/alpha-generate.log"

git -C "$work" add alpha-agent/features alpha-agent/state.json alpha-agent/plan.json
git -C "$work" diff --cached --check
git -C "$work" diff --cached --name-only | grep -Eq '^alpha-agent/(features/|state.json|plan.json)'
git -C "$work" commit -m 'agent(alpha): publish generated frontend before validation'
git -C "$work" push origin HEAD:refs/heads/agent/alpha-frontend
candidate="$(git -C "$work" rev-parse HEAD)"
echo "Alpha frontend candidate committed before smoke: $candidate"

accepted=""
if python3 scripts/alpha_agent.py publish-smoke --sha "$candidate" \
    > "$work/artifacts/alpha-smoke.txt" 2>&1; then
  accepted="$candidate"
  tail -9 "$work/artifacts/alpha-smoke.txt"
else
  tail -30 "$work/artifacts/alpha-smoke.txt"
  echo 'Post-publication check failed; feeding live diagnosis to model once.'
  if python3 scripts/alpha_agent.py repair --diagnostic artifacts/alpha-smoke.txt \
      > "$work/artifacts/alpha-repair.txt" 2>&1; then
    tail -10 "$work/artifacts/alpha-repair.txt"
    git -C "$work" add alpha-agent/features alpha-agent/plan.json
    git -C "$work" diff --cached --check
    if ! git -C "$work" diff --cached --quiet; then
      git -C "$work" commit -m 'agent(alpha): repair live candidate from test feedback'
      git -C "$work" push origin HEAD:refs/heads/agent/alpha-frontend
      repaired="$(git -C "$work" rev-parse HEAD)"
      if python3 scripts/alpha_agent.py publish-smoke --sha "$repaired" \
          > "$work/artifacts/alpha-smoke-repaired.txt" 2>&1; then
        accepted="$repaired"
        tail -9 "$work/artifacts/alpha-smoke-repaired.txt"
      else
        tail -25 "$work/artifacts/alpha-smoke-repaired.txt"
      fi
    fi
  else
    tail -20 "$work/artifacts/alpha-repair.txt"
  fi
fi

if [ -n "$accepted" ]; then
  python3 scripts/alpha_agent.py accept --sha "$accepted"
  git -C "$work" add alpha-agent/state.json
  git -C "$work" commit -m 'agent(alpha): record live-smoke passing feature'
  git -C "$work" push origin HEAD:refs/heads/agent/alpha-frontend
  successes="$(python3 -c 'import json,os,pathlib;print(json.loads((pathlib.Path(os.environ["CIVICPATCH_ALPHA_ROOT"])/"alpha-agent/state.json").read_text())["successful_iterations"])')"
  if (( successes > 0 && successes % 3 == 0 )); then
    mature="$(git -C "$work" rev-parse HEAD)"
    if gh api "repos/$repo/git/ref/heads/agent/beta-frontend" >/dev/null 2>&1; then
      gh api -X PATCH "repos/$repo/git/refs/heads/agent/beta-frontend" -f sha="$mature" -F force=true >/dev/null
    else
      gh api -X POST "repos/$repo/git/refs" -f ref=refs/heads/agent/beta-frontend -f sha="$mature" >/dev/null
    fi
    gh api -X POST "repos/$repo/actions/workflows/deploy-pages.yml/dispatches" -f ref=main >/dev/null
    echo "Beta frontend promoted after $successes successful Alpha increments."
  fi
  echo 'Alpha accepted: model feature published and checked after deployment.'
else
  echo 'Both live attempts failed or model repair was invalid. Restoring previous Alpha code.'
  git -C "$work" reset --hard HEAD
  git -C "$work" revert --no-commit "$baseline"..HEAD
  git -C "$work" commit -m 'agent(alpha): roll back failed published experiment'
  reason="$(tail -5 "$work/artifacts/alpha-smoke.txt")"
  if [ -f "$work/artifacts/alpha-smoke-repaired.txt" ]; then
    reason="$(tail -5 "$work/artifacts/alpha-smoke-repaired.txt")"
  fi
  python3 scripts/alpha_agent.py reject --diagnostic "$reason"
  git -C "$work" add alpha-agent/state.json
  git -C "$work" commit -m 'agent(alpha): persist failure and switch future goal'
  git -C "$work" push origin HEAD:refs/heads/agent/alpha-frontend
  gh api -X POST "repos/$repo/actions/workflows/deploy-pages.yml/dispatches" -f ref=main >/dev/null
  echo 'Alpha rollback dispatched; production was never modified by the candidate.'
fi
