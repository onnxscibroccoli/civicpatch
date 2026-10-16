#!/usr/bin/env python3
"""Refresh the Massachusetts municipality baseline from primary public sources.

This ingests official municipality names and MassGIS TOWN_IDs, then matches
official website links from the Secretary of the Commonwealth's directory.
It deliberately does not infer OCD-IDs or department/service responsibility.
"""
import json
import re
import sys
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.error import URLError, HTTPError
from urllib.parse import quote, urlencode, urlparse, urljoin, urlsplit, urlunsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "ma" / "municipalities.json"
MASSGIS_LAYER = "https://services.arcgis.com/2gdL2gxYNFY2TOUb/ArcGIS/rest/services/Massachusetts_Municipalities/FeatureServer/8"
MASSGIS_QUERY = MASSGIS_LAYER + "/query"
STATE_DIRECTORY = "https://www.sec.state.ma.us/ele/eleclk/clkidx.htm"
MASSGOV_DIRECTORY = "https://www.mass.gov/lists/massachusetts-city-and-town-websites"
USER_AGENT = "CivicPatch-Municipality-Directory/1.0 (open civic data; repository: onnxscibroccoli/civicpatch)"
EXPECTED = 351


def fetch(url, timeout=35, max_bytes=1_500_000):
    request = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json,text/html,*/*"})
    with urlopen(request, timeout=timeout) as response:
        if response.status < 200 or response.status >= 300:
            raise RuntimeError(f"HTTP {response.status} for {url}")
        return response.read(max_bytes + 1)[:max_bytes]



def normalize_http_url(value):
    """Trim a candidate URL and percent-encode whitespace in URL components.

    Spaces in municipal PDF/document paths must be encoded as %20. Using
    quote() on URL components preserves path separators and query delimiters.
    """
    value = (value or "").strip()
    if not value:
        return value
    parts = urlsplit(value)
    if parts.scheme.casefold() not in {"http", "https"} or not parts.netloc:
        return value
    path = quote(parts.path, safe="/%:@!$&()*+,;=-._~%")
    query = quote(parts.query, safe="/?@!$&()*+,;=:%-._~")
    fragment = quote(parts.fragment, safe="/?@!$&()*+,;=:%-._~")
    return urlunsplit((parts.scheme, parts.netloc, path, query, fragment))


def normalize(value):
    return re.sub(r"[^a-z0-9]+", "", (value or "").casefold())


class AnchorParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.anchors = []
        self._href = None
        self._text = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() == "a":
            self._href = dict(attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((" ".join(self._text).strip(), self._href))
            self._href = None
            self._text = []


def official_website_map():
    """Match exact municipality-name anchors only; never guess URLs from names."""
    html = fetch(MASSGOV_DIRECTORY).decode("utf-8", errors="replace")
    parser = AnchorParser()
    parser.feed(html)
    mapping = {}
    for label, href in parser.anchors:
        key = normalize(label)
        if not key or not href:
            continue
        if href.startswith("//"):
            href = "https:" + href
        elif href.startswith("/"):
            href = "https://www.mass.gov" + href
        href = normalize_http_url(href)
        parsed = urlparse(href)
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            continue
        if parsed.hostname and (parsed.hostname == "mass.gov" or parsed.hostname.endswith(".mass.gov")):
            continue
        mapping.setdefault(key, href)
    return mapping



DEPARTMENT_KEYWORDS = {
    "public_works": ("public works", "dpw", "department of public works", "highway department", "street department", "roads and streets", "sanitation", "recycling", "trash collection", "water department", "sewer department"),
    "building_zoning": ("building department", "building inspector", "inspectional services", "building permits", "permitting", "zoning", "code enforcement", "building inspections"),
    "health": ("board of health", "health department", "public health", "health services"),
    "conservation": ("conservation commission", "conservation department", "conservation"),
    "clerk": ("town clerk", "city clerk", "municipal clerk", "clerk's office", "clerk office"),
    "elections": ("elections", "election department", "voter registration", "registrar of voters", "voting"),
    "executive": ("select board", "selectboard", "board of selectmen", "mayor", "city council", "town manager", "town administrator", "city manager", "town government", "city government"),
    "planning": ("planning board", "planning department", "planning and development")
}
ISSUE_CATEGORIES = {
    "public_works": ["roads", "sidewalks", "public_works", "trash_recycling", "water_sewer"],
    "building_zoning": ["building_permits", "zoning", "code_enforcement"],
    "health": ["public_health"],
    "conservation": ["conservation", "wetlands"],
    "clerk": ["municipal_records", "licenses"],
    "elections": ["elections", "voter_registration"],
    "executive": ["municipal_governance"],
    "planning": ["planning_and_development"]
}


def classify_department(label):
    normalized = re.sub(r"[^a-z0-9 ]+", " ", (label or "").casefold())
    normalized = re.sub(r"\s+", " ", normalized).strip()
    if not normalized:
        return []
    return [department for department, keywords in DEPARTMENT_KEYWORDS.items()
            if any(keyword in normalized for keyword in keywords)]


def crawl_service_candidates(record, today):
    """Collect homepage navigation candidates only; never mark a department verified."""
    homepage = record.get("official_website")
    if not homepage:
        return []
    try:
        html = fetch(homepage, timeout=8, max_bytes=1_500_000).decode("utf-8", errors="replace")
        parser = AnchorParser()
        parser.feed(html)
    except Exception as exc:
        print(f"INFO: homepage candidate scrape skipped for {record['name']}: {str(exc)[:160]}", file=sys.stderr)
        return []
    base_host = (urlparse(homepage).hostname or "").casefold()
    candidates = []
    seen = set()
    for label, href in parser.anchors:
        departments = classify_department(label)
        if not departments or not href:
            continue
        target = normalize_http_url(urljoin(homepage, href))
        parsed = urlparse(target)
        host = (parsed.hostname or "").casefold()
        if parsed.scheme not in ("http", "https") or not host:
            continue
        if host != base_host and not host.endswith("." + base_host):
            continue
        for department in departments:
            key = (department, target.rstrip("/"))
            if key in seen:
                continue
            seen.add(key)
            safe_label = re.sub(r"\s+", " ", label).strip()[:160] or department.replace("_", " ").title()
            source_id = record["municipality_id"] + "-" + department.replace("_", "-") + "-" + str(len(candidates) + 1)
            candidates.append({
                "source_id": source_id,
                "name": safe_label,
                "department_type": department,
                "canonical_url": target,
                "supported_issue_categories": ISSUE_CATEGORIES[department],
                "verification_status": "unverified",
                "url_status": "not_checked",
                "last_content_reviewed_at": None,
                "evidence": [{
                    "source_type": "official_website",
                    "reference_url": homepage,
                    "checked_at": today,
                    "checked_by": "CivicPatch automated ingestion",
                    "claim_supported": f"The candidate homepage navigation for {record['name']} contains the link label '{safe_label}' pointing to {target}. This is a discovery lead only, not proof of departmental authority.",
                    "notes": "Automatically discovered from homepage navigation. Must be reviewed for current ownership, scope, and municipal responsibility."
                }],
                "notes": "Unverified navigation candidate. Do not treat as a confirmed service contact or statutory responsibility."
            })
    return candidates


def enrich_service_candidates(records, today):
    total = 0
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = {pool.submit(crawl_service_candidates, record, today): record for record in records if record.get("official_website")}
        for future in as_completed(futures):
            record = futures[future]
            try:
                candidates = future.result()
            except Exception as exc:
                print(f"INFO: candidate scrape skipped for {record['name']}: {str(exc)[:160]}", file=sys.stderr)
                continue
            record["official_sources"] = candidates
            total += len(candidates)
    return total

def fetch_massgis_records():
    query = urlencode({
        "where": "1=1",
        "outFields": "TOWN,TOWN_ID,TYPE,COUNTY,FIPS_STCO",
        "returnGeometry": "false",
        "returnDistinctValues": "true",
        "orderByFields": "TOWN_ID ASC",
        "f": "json",
    })
    payload = json.loads(fetch(MASSGIS_QUERY + "?" + query).decode("utf-8"))
    if payload.get("error"):
        raise RuntimeError("MassGIS ArcGIS query error: " + json.dumps(payload["error"]))
    features = payload.get("features")
    if not isinstance(features, list) or len(features) != EXPECTED:
        raise RuntimeError(f"MassGIS returned {len(features) if isinstance(features, list) else 'no'} features; expected exactly {EXPECTED}; refusing to replace directory")
    records = []
    seen_ids = set()
    today = datetime.now(timezone.utc).date().isoformat()
    try:
        websites = official_website_map()
    except (HTTPError, URLError, TimeoutError, RuntimeError) as exc:
        print(f"WARNING: official website directory unavailable; retaining null websites: {exc}", file=sys.stderr)
        websites = {}
    for feature in features:
        attrs = feature.get("attributes") or {}
        name = str(attrs.get("TOWN") or "").strip()
        town_id = attrs.get("TOWN_ID")
        if not name or not isinstance(town_id, int) or not 1 <= town_id <= EXPECTED:
            raise RuntimeError(f"Invalid MassGIS record: {attrs!r}")
        if town_id in seen_ids:
            raise RuntimeError(f"Duplicate MassGIS TOWN_ID {town_id}")
        seen_ids.add(town_id)
        website = websites.get(normalize(name))
        evidence = [{
            "source_type": "official_dataset",
            "reference_url": MASSGIS_LAYER,
            "checked_at": today,
            "checked_by": "CivicPatch automated ingestion",
            "claim_supported": f"MassGIS lists {name} as a Massachusetts municipality with TOWN_ID {town_id}.",
            "notes": "Automated registry ingestion only. Does not verify service responsibility, legal jurisdiction, or the municipality's current website content."
        }]
        if website:
            evidence.append({
                "source_type": "official_website",
                "reference_url": MASSGOV_DIRECTORY,
                "checked_at": today,
                "checked_by": "CivicPatch automated ingestion",
                "claim_supported": f"The Massachusetts city-and-town website directory links the exact municipality label {name} to {website}.",
                "notes": "Candidate official website link harvested from the Commonwealth directory; link and ownership require periodic verification."
            })
        records.append({
            "municipality_id": "ma-" + re.sub(r"[^a-z0-9]+", "-", name.casefold()).strip("-"),
            "name": name.title(),
            "massgis_town_id": town_id,
            "ocd_id": None,
            "government_form": None,
            "official_website": website,
            "record_status": "incomplete",
            "official_sources": [],
            "evidence": evidence,
            "last_content_reviewed_at": None,
            "notes": "Automated baseline from MassGIS. Municipal identity is seeded; department/service sources, OCD-ID, government form, and website accuracy require independent verification."
        })
    if seen_ids != set(range(1, EXPECTED + 1)):
        missing = sorted(set(range(1, EXPECTED + 1)) - seen_ids)
        raise RuntimeError(f"MassGIS TOWN_ID sequence is incomplete; missing {missing[:20]}")
    records.sort(key=lambda item: item["massgis_town_id"])
    candidate_count = enrich_service_candidates(records, today)
    print(f"Discovered {candidate_count} unverified homepage navigation candidates across service sectors.", file=sys.stderr)
    return records, today


def main():
    records, today = fetch_massgis_records()
    existing = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    data = {
        "schema_version": "1.0.0",
        "jurisdiction": {"country_code": "US", "state_code": "MA", "state_fips": "25"},
        "coverage": {
            "target_municipalities": EXPECTED,
            "records_present": len(records),
            "verified_records": sum(record["record_status"] == "verified" for record in records),
            "status": "review_required",
            "generated_at": today
        },
        "municipalities": records
    }
    if existing.get("municipalities") and len(existing["municipalities"]) > len(records):
        raise RuntimeError("Refusing to overwrite a directory with more records than the current source")
    OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Generated {len(records)}/{EXPECTED} municipality baseline records; verified=0; official websites matched={sum(bool(r['official_website']) for r in records)}; OCD-IDs left null pending semantic validation.")
    print("All ingested records remain incomplete; no municipal department/service claims were inferred.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"ERROR: ingestion aborted without claiming success: {exc}", file=sys.stderr)
        sys.exit(1)
