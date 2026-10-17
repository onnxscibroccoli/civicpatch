#!/usr/bin/env python3
"""Assemble a minimal static Pages tree with clearly labeled alpha and beta.

Production assets come exclusively from the checked-out main branch.
Preview index and dataset are read from immutable git refs, never executed.
"""
from __future__ import annotations

import argparse
import html
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMMIT_RE = re.compile(r"^[0-9a-f]{40}$")
PREVIEW_FILES = ("index.html", "data/ma/municipalities.json")
COPY_ROOT = ("index.html", "README.md", "LICENSE", "CONTRIBUTING.md")


def stamp_preview(document: str, stage: str, commit: str) -> str:
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
    return document.replace("</head>", '<meta name="robots" content="noindex,nofollow">\n</head>', 1).replace(
        "<body>", "<body>\n" + badge, 1
    )


def git_blob(sha: str, path: str) -> bytes:
    if not COMMIT_RE.fullmatch(sha) or path not in PREVIEW_FILES:
        raise ValueError("Disallowed git source")
    result = subprocess.run(
        ["git", "show", f"{sha}:{path}"], cwd=ROOT,
        stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
        check=True, timeout=15,
    )
    if len(result.stdout) > 12_000_000:
        raise ValueError("Preview asset exceeded 12 MB")
    return result.stdout


def build(output: Path, alpha: str = "", beta: str = "") -> None:
    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)
    for name in COPY_ROOT:
        shutil.copyfile(ROOT / name, output / name)
    for folder in ("docs", "screenshots", "public"):
        source = ROOT / folder
        if source.is_dir():
            shutil.copytree(source, output / folder, symlinks=False,
                            ignore=shutil.ignore_patterns("__pycache__", ".DS_Store", "__grok"))
    dataset = output / "data/ma/municipalities.json"
    dataset.parent.mkdir(parents=True)
    shutil.copyfile(ROOT / "data/ma/municipalities.json", dataset)
    for stage, sha in (("alpha", alpha), ("beta", beta)):
        if not sha:
            continue
        if not COMMIT_RE.fullmatch(sha):
            raise ValueError("Invalid preview commit SHA")
        target = output / stage
        (target / "data/ma").mkdir(parents=True)
        for name in PREVIEW_FILES:
            contents = git_blob(sha, name)
            if name == "index.html":
                contents = stamp_preview(contents.decode("utf-8"), stage, sha).encode("utf-8")
            (target / name).write_bytes(contents)
    (output / ".nojekyll").write_text("", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    parser.add_argument("--alpha", default="")
    parser.add_argument("--beta", default="")
    args = parser.parse_args()
    build(Path(args.output).resolve(), args.alpha, args.beta)


if __name__ == "__main__":
    main()
