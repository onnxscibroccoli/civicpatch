#!/usr/bin/env python3
"""Ingest maintainer-authorized, low-risk CivicPatch tasks from GitHub issues.

Never accept untrusted issue text as a command or as permission to edit new files.
The manifest only expands across already review-approved Python source/test pairs.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import sys
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / ".github/autodev/tasks.json"
AUTHORIZED = {"OWNER", "MEMBER", "COLLABORATOR"}
MAX_TASKS = 30
MAX_NEW = 3
MARKER = re.compile(r"\x60\x60\x60autodev-task\s*\n(.*?)\n\x60\x60\x60", re.S)


def parse_issue(issue: dict, approved_pairs: set[tuple[str, str]]) -> dict | None:
    """Only structured issue entries by maintainers, never comments, may add tasks."""
    if issue.get("state") != "open" or issue.get("author_association") not in AUTHORIZED:
        return None
    if "agent-ready" not in {str(tag.get("name", "")) for tag in issue.get("labels", [])}:
        return None
    number = issue.get("number")
    if not isinstance(number, int) or number < 1:
        return None
    match = MARKER.search(issue.get("body") or "")
    if match is None or len(match.group(1)) > 3000:
        return None
    try:
        obj = json.loads(match.group(1))
    except json.JSONDecodeError:
        return None
    if not isinstance(obj, dict) or set(obj) != {"goal", "files"}:
        return None
    goal = obj["goal"]
    files = obj["files"]
    if not isinstance(goal, str) or not 20 <= len(goal) <= 360:
        return None
    if not isinstance(files, list) or len(files) != 2 or not all(isinstance(v, str) for v in files):
        return None
    if tuple(sorted(files)) not in approved_pairs:
        return None
    # No arbitrary prose directives / external shell snippets as task goals.
    if any(token in goal.lower() for token in ("sudo ", "curl ", "wget ", "rm -rf", "github_token", "api_key", ".github/workflows", "secret")):
        return None
    digest = hashlib.sha256(goal.encode("utf-8")).hexdigest()[:10]
    return {"id": f"issue-{number}-{digest}", "goal": goal, "files": files}


def expand(manifest: dict, issues: list[dict]) -> tuple[dict, int]:
    if manifest.get("schema_version") != 1 or not isinstance(manifest.get("tasks"), list):
        raise ValueError("Task manifest schema mismatch")
    pairs = {tuple(sorted(t["files"])) for t in manifest["tasks"]}
    existing = {t["id"] for t in manifest["tasks"]}
    pending = []
    for issue in issues:
        task = parse_issue(issue, pairs)
        if task and task["id"] not in existing:
            pending.append(task)
            existing.add(task["id"])
    pending.sort(key=lambda t: t["id"])
    new = pending[: min(MAX_NEW, max(0, MAX_TASKS - len(manifest["tasks"])))]
    return {**manifest, "tasks": manifest["tasks"] + new}, len(new)


def main() -> int:
    token = os.environ.get("GH_TOKEN", "")
    repo = os.environ.get("GITHUB_REPOSITORY", "")
    if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", repo):
        raise ValueError("No valid GITHUB_REPOSITORY")
    if not token:
        raise ValueError("Missing GH_TOKEN")
    all_issues = []
    for page in range(1, 4):
        url = f"https://api.github.com/repos/{repo}/issues?state=open&per_page=100&page={page}"
        request = Request(url, headers={"Authorization": "Bearer " + token,
                            "Accept": "application/vnd.github+json",
                            "User-Agent": "CivicPatch-Autodev/1.0"})
        with urlopen(request, timeout=12) as response:
            batch = json.load(response)
        if not isinstance(batch, list):
            raise ValueError("Unexpected GitHub issue response")
        all_issues.extend(i for i in batch if "pull_request" not in i)
        if len(batch) < 100:
            break
    current = json.loads(MANIFEST.read_text(encoding="utf-8"))
    updated, added = expand(current, all_issues)
    if added:
        MANIFEST.write_text(json.dumps(updated, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"issues_inspected": len(all_issues), "new_tasks": added,
                      "queue_total": len(updated["tasks"]), "source": "maintainer-labeled issue blocks"}))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as exc:
        print(f"Task ingestion halted safely: {exc}", file=sys.stderr)
        sys.exit(1)
