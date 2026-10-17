#!/usr/bin/env python3
"""Build sanitized production and separate, model-editable Alpha/Beta labs.

Only current production main supplies /; immutable Git blobs supply previews.
Generated JavaScript is copied, never imported or executed by the build job.
"""
from __future__ import annotations

import argparse
import html
import json
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMMIT_RE = re.compile(r"^[a-f0-9]{40}$")
FEATURE_RE = re.compile(r"^alpha-agent/features/[a-z0-9-]{2,48}\.js$")
PREVIEW_FILES = ("index.html", "data/ma/municipalities.json")
AGENT_FILES = (
    "alpha-agent/index.html",
    "alpha-agent/base.js",
    "alpha-agent/style.css",
    "alpha-agent/roadmap.json",
    "alpha-agent/state.json",
)
COPY_ROOT = ("index.html", "README.md", "LICENSE", "CONTRIBUTING.md")


def stamp_preview(document: str, stage: str, commit: str, lab: bool = False) -> str:
    if stage not in {"alpha", "beta"} or not COMMIT_RE.fullmatch(commit):
        raise ValueError("Invalid preview identity")
    badge = (
        '<div role="status" style="background:#301934;color:#fff;padding:12px;'
        'font:700 16px system-ui;text-align:center">'
        f'CivicPatch {html.escape(stage.upper())} PREVIEW — experimental; '
        'not a verified government service; do not rely on it for official decisions. '
        f'Commit: {html.escape(commit[:12])}</div>'
    )
    if "<body>" not in document or "</head>" not in document:
        raise ValueError("Unexpected static HTML structure")
    if lab:
        badge += ('<p style="padding:12px 20px;background:#f8f1d6">'
                  '<a href="agentic/">Explore the Agentic Development Lab</a>'
                  ' — model-built experimental features, not official guidance.</p>')
    return document.replace(
        "</head>", '<meta name="robots" content="noindex,nofollow">\n</head>', 1
    ).replace("<body>", "<body>\n" + badge, 1)


def git_blob(sha: str, path: str) -> bytes:
    if not COMMIT_RE.fullmatch(sha) or (
        path not in PREVIEW_FILES + AGENT_FILES and not FEATURE_RE.fullmatch(path)
    ):
        raise ValueError("Disallowed git source")
    result = subprocess.run(
        ["git", "show", f"{sha}:{path}"], cwd=ROOT,
        stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
        check=True, timeout=15,
    )
    if len(result.stdout) > 12_000_000:
        raise ValueError("Preview asset exceeded 12 MB")
    if path.startswith("alpha-agent/") and len(result.stdout) > 40_000:
        raise ValueError("Alpha source exceeds individual asset limit")
    return result.stdout


def feature_paths(sha: str) -> list[str]:
    if not COMMIT_RE.fullmatch(sha):
        raise ValueError("Invalid Alpha frontend commit")
    result = subprocess.run(
        ["git", "ls-tree", "-r", sha, "--", "alpha-agent/features"],
        cwd=ROOT, stdout=subprocess.PIPE, check=True, timeout=15,
    )
    paths = []
    for line in result.stdout.decode("utf-8").splitlines():
        metadata, _, path = line.partition("\t")
        if not path or not FEATURE_RE.fullmatch(path) or not metadata.startswith("100644 blob "):
            raise ValueError("Unexpected or unsafe Alpha feature entry")
        paths.append(path)
    if len(paths) > 24 or len(set(paths)) != len(paths):
        raise ValueError("Too many or duplicate Alpha features")
    return sorted(paths)


def agent_progress_markup(state: dict, roadmap: dict, stage: str) -> str:
    """Render safe, inspectable agent progress from immutable frontend JSON."""
    if stage not in ("alpha", "beta"):
        raise ValueError("Unknown lab stage")
    goals = roadmap.get("goals")
    finished = state.get("completed")
    if not isinstance(goals, list) or not isinstance(finished, list) or len(goals) > 30:
        raise ValueError("Invalid Alpha status source")
    ids = {str(item) for item in finished if isinstance(item, str)}
    cards = []
    for goal in goals:
        if not isinstance(goal, dict):
            raise ValueError("Invalid Alpha roadmap item")
        title = html.escape(str(goal.get("title", "Unnamed goal"))[:100])
        name = str(goal.get("id", ""))
        status = "Completed" if name in ids else "Planned"
        cards.append(f"<li><strong>{title}</strong> — {status}</li>")
    count = state.get("successful_iterations", 0)
    if not isinstance(count, int) or count < 0:
        raise ValueError("Invalid Alpha iteration count")
    reviewed = state.get("review_count", 0)
    if not isinstance(reviewed, int) or reviewed < 0:
        raise ValueError("Invalid review count")
    return (
        '<section class="explain" aria-labelledby="agent-progress-heading">'
        '<h2 id="agent-progress-heading">Autonomous build progress</h2>'
        f'<p><strong>{count}</strong> checked increments; '
        f'<strong>{reviewed}</strong> self-review cycles. '
        'Each increment is generated, published to Alpha, then smoke-tested.</p>'
        '<h3>Development goals</h3><ol>'
        + "".join(cards)
        + '</ol><p class="disclaimer">These counters describe engineering progress, '
        'not verified civic information or accessibility certification.</p></section>'
    )


def build_agent_lab(output: Path, sha: str, stage: str) -> None:
    if not COMMIT_RE.fullmatch(sha) or stage not in ("alpha", "beta"):
        raise ValueError("Invalid Alpha lab source")
    lab = output / stage / "agentic"
    lab.mkdir(parents=True, exist_ok=True)
    for name in AGENT_FILES:
        contents = git_blob(sha, name)
        (lab / Path(name).name).write_bytes(contents)
    paths = feature_paths(sha)
    for name in paths:
        (lab / "features").mkdir(parents=True, exist_ok=True)
        (lab / "features" / Path(name).name).write_bytes(git_blob(sha, name))
    document = (lab / "index.html").read_text(encoding="utf-8")
    if "</head>" not in document or "</body>" not in document:
        raise ValueError("Invalid Alpha lab HTML structure")
    progress_anchor = '<section aria-labelledby="features-heading" id="experiments">'
    if progress_anchor not in document:
        raise ValueError("Alpha shell lacks a safe progress insertion point")
    state = json.loads((lab / "state.json").read_text(encoding="utf-8"))
    roadmap = json.loads((lab / "roadmap.json").read_text(encoding="utf-8"))
    document = document.replace(
        progress_anchor, agent_progress_markup(state, roadmap, stage) + "\n" + progress_anchor, 1
    )
    marker = f'<meta name="civicpatch-frontend-sha" content="{sha}">'
    document = document.replace("</head>", marker + "\n</head>", 1)
    tags = "\n".join(
        f'<script defer src="features/{html.escape(Path(name).name, quote=True)}"></script>'
        for name in paths
    )
    document = document.replace("</body>", tags + "\n</body>", 1)
    if stage == "beta":
        document = document.replace(
            "Alpha development environment", "Beta verification environment"
        ).replace("CivicPatch Alpha", "CivicPatch Beta")
    (lab / "index.html").write_text(document, encoding="utf-8")


def build(output: Path, alpha: str = "", beta: str = "",
          alpha_frontend: str = "", beta_frontend: str = "") -> None:
    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)
    for name in COPY_ROOT:
        shutil.copyfile(ROOT / name, output / name)
    for folder in ("docs", "screenshots", "public"):
        source = ROOT / folder
        if source.is_dir():
            shutil.copytree(
                source, output / folder, symlinks=False,
                ignore=shutil.ignore_patterns("__pycache__", ".DS_Store", "__grok"),
            )
    dataset = output / "data/ma/municipalities.json"
    dataset.parent.mkdir(parents=True)
    shutil.copyfile(ROOT / "data/ma/municipalities.json", dataset)
    for stage, sha, frontend in (
        ("alpha", alpha, alpha_frontend), ("beta", beta, beta_frontend)
    ):
        if not sha and not frontend:
            continue
        if sha and not COMMIT_RE.fullmatch(sha):
            raise ValueError("Invalid preview commit SHA")
        if frontend and not COMMIT_RE.fullmatch(frontend):
            raise ValueError("Invalid frontend commit SHA")
        target = output / stage
        (target / "data/ma").mkdir(parents=True, exist_ok=True)
        for name in PREVIEW_FILES:
            # Frontend experiments are separate from production's current data:
            # preserve existing validated preview semantics when a ref exists.
            contents = git_blob(sha, name) if sha else (ROOT / name).read_bytes()
            if name == "index.html":
                contents = stamp_preview(
                    contents.decode("utf-8"), stage, sha or frontend, bool(frontend)
                ).encode("utf-8")
            (target / name).write_bytes(contents)
        if frontend:
            build_agent_lab(output, frontend, stage)
    (output / ".nojekyll").write_text("", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    parser.add_argument("--alpha", default="")
    parser.add_argument("--beta", default="")
    parser.add_argument("--alpha-frontend", default="")
    parser.add_argument("--beta-frontend", default="")
    args = parser.parse_args()
    build(Path(args.output).resolve(), args.alpha, args.beta,
          args.alpha_frontend, args.beta_frontend)


if __name__ == "__main__":
    main()
