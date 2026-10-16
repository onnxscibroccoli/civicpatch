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
from urllib.error import URLError, HTTPError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "ma" / "municipalities.json"
MASSGIS_LAYER = "https://services.arcgis.com/2gdL2gxYNFY2TOUb/ArcGIS/rest/services/Massachusetts_Municipalities/FeatureServer/8"
MASSGIS_QUERY = MASSGIS_LAYER + "/query"
STATE_DIRECTORY = "https://www.sec.state.ma.us/ele/eleclk/clkidx.htm"
MASSGOV_DIRECTORY = "https://www.mass.gov/lists/massachusetts-city-and-town-websites"
USER_AGENT = "CivicPatch-Municipality-Directory/1.0 (open civic data; repository: onnxscibroccoli/civicpatch)"
EXPECTED = 351


def fetch(url, timeout=35):
    request = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json,text/html,*/*"})
    with urlopen(request, timeout=timeout) as response:
        if response.status < 200 or response.status >= 300:
            raise RuntimeError(f"HTTP {response.status} for {url}")
        return response.read()


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
        parsed = urlparse(href)
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            continue
        if parsed.hostname and (parsed.hostname == "mass.gov" or parsed.hostname.endswith(".mass.gov")):
            continue
        mapping.setdefault(key, href)
    return mapping


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
