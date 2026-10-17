#!/usr/bin/env python3
"""Probe directory URL reachability without changing factual verification states."""
import ipaddress
import json
import socket
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "ma" / "municipalities.json"
OUTPUT = Path("artifacts/url-health.json")
TIMEOUT = 12
USER_AGENT = "CivicPatch-LinkHealth/1.0 (+https://github.com/onnxscibroccoli/civicpatch)"


def is_public_http_url(url):
    """Reject private destinations, credentials, and unsupported URL schemes.

    DNS is checked prior to each request/redirect, but this is not DNS pinning:
    only run the checker on an isolated, unprivileged CI runner.
    """
    try:
        parsed = urlparse(url or "")
        if parsed.scheme not in ("http", "https") or not parsed.hostname or parsed.username or parsed.password:
            return False
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
    except ValueError:  # Malformed IPv6 bracket or port.
        return False
    try:
        ip = ipaddress.ip_address(parsed.hostname)
        return ip.is_global
    except ValueError:
        host = parsed.hostname.casefold().rstrip(".")
        if host in {"localhost", "localhost.localdomain"} or host.endswith((".local", ".internal", ".test", ".invalid")):
            return False
        try:
            addresses = {item[4][0] for item in socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)}
        except OSError:
            return True  # Let the request report DNS/network failure, rather than misclassifying it as unsafe.
        if not addresses:
            return False
        for address in addresses:
            try:
                if not ipaddress.ip_address(address).is_global:
                    return False
            except ValueError:
                return False
        return True


class UnsafeRedirectError(ValueError):
    """Raised before an HTTP redirect follows a non-public destination."""


class PublicOnlyRedirectHandler(HTTPRedirectHandler):
    """Apply URL screening before every redirect, not just the original URL."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not is_public_http_url(newurl):
            raise UnsafeRedirectError("redirect target is not an allowed public HTTP(S) URL")
        return super().redirect_request(req, fp, code, msg, headers, newurl)

def probe(url):
    if not is_public_http_url(url):
        return {"url": url, "status": "manual_review", "http_status": None, "final_url": None, "error": "URL is not an allowed public HTTP(S) destination"}
    headers = {"User-Agent": USER_AGENT, "Accept": "text/html,application/json,*/*"}
    opener = build_opener(PublicOnlyRedirectHandler())
    for method in ("HEAD", "GET"):
        try:
            request = Request(url, headers=headers, method=method)
            with opener.open(request, timeout=TIMEOUT) as response:
                code = response.getcode()
                final_url = response.geturl()
                if method == "GET":
                    response.read(1)
                return {
                    "url": url,
                    "status": "reachable" if final_url == url and 200 <= code < 400 else ("redirected" if 200 <= code < 400 else "broken"),
                    "http_status": code,
                    "final_url": final_url,
                    "error": None,
                }
        except UnsafeRedirectError as exc:
            return {"url": url, "status": "manual_review", "http_status": None, "final_url": None, "error": str(exc)[:300]}
        except HTTPError as exc:
            if method == "HEAD" and exc.code in (405, 501):
                continue
            classification = ("broken" if exc.code in (404, 410) else
                              "transient_error" if exc.code in (429, 500, 502, 503, 504) else "manual_review")
            return {"url": url, "status": classification, "http_status": exc.code, "final_url": exc.geturl(), "error": str(exc)[:300]}
        except (URLError, TimeoutError, OSError) as exc:
            return {"url": url, "status": "transient_error", "http_status": None, "final_url": None, "error": str(exc)[:300]}
    return {"url": url, "status": "manual_review", "http_status": None, "final_url": None, "error": "No supported HTTP response"}


def collect_urls(data):
    urls = set()
    for municipality in data.get("municipalities", []):
        if municipality.get("official_website"):
            urls.add(municipality["official_website"])
        for source in municipality.get("official_sources", []):
            if source.get("canonical_url"):
                urls.add(source["canonical_url"])
    return sorted(urls)


def main():
    data = json.loads(DATA.read_text(encoding="utf-8"))
    urls = collect_urls(data)
    results = [probe(url) for url in urls]
    counts = {key: sum(row["status"] == key for row in results) for key in ("reachable", "redirected", "broken", "transient_error", "manual_review")}
    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": "data/ma/municipalities.json",
        "urls_checked": len(results),
        "counts": counts,
        "results": results,
        "important": "HTTP reachability is not factual verification. This report never changes record_status or verification_status."
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"urls_checked": len(results), "counts": counts, "report": str(OUTPUT), "important": report["important"]}, indent=2))
    # Broken links are reported as evidence, not treated as a workflow failure.
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"ERROR: URL health report failed: {exc}", file=sys.stderr)
        sys.exit(1)
