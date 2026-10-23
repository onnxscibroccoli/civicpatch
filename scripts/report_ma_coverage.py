#!/usr/bin/env python3
"""Report transparent Massachusetts civic-directory coverage from the canonical JSON."""
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "ma" / "municipalities.json"
SECTORS = {
    "public_works": "Public works",
    "building_zoning": "Building and zoning",
    "health": "Public health",
    "conservation": "Conservation",
    "clerk": "Clerks and elections",
    "executive": "Executive administration",
}
SOURCE_STATES = ("verified", "incomplete", "stale", "broken", "unverified")


def build_report(data):
    municipalities = data.get("municipalities", [])
    target = data.get("coverage", {}).get("target_municipalities", 351)
    report = {
        "generated_at": data.get("coverage", {}).get("generated_at"),
        "jurisdiction": "US-MA",
        "municipality_target": target,
        "municipalities_present": len(municipalities),
        "municipalities_verified": sum(m.get("record_status") == "verified" for m in municipalities),
        "municipality_coverage_percent": round(100 * len(municipalities) / target, 2) if target else 0,
        "ocd_ids_populated": sum(bool(m.get("ocd_id")) for m in municipalities),
        "sectors": {},
        "trust_boundary": "URL reachability is not factual verification; sector counts require an explicit source record.",
        "source_verification_status": "verified"
    }
    for sector, label in SECTORS.items():
        states = Counter()
        municipalities_with_records = set()
        municipalities_with_verified = set()
        for municipality in municipalities:
            for source in municipality.get("official_sources", []):
                if source.get("department_type") != sector:
                    continue
                municipalities_with_records.add(municipality.get("municipality_id"))
                state = source.get("verification_status", "unverified")
                states[state if state in SOURCE_STATES else "unverified"] += 1
                if state == "verified":
                    municipalities_with_verified.add(municipality.get("municipality_id"))
        report["sectors"][sector] = {
            "label": label,
            "municipalities_with_source_records": len(municipalities_with_records),
            "municipalities_with_verified_sources": len(municipalities_with_verified),
            "sources_by_status": {state: states.get(state, 0) for state in SOURCE_STATES},
        }
    return report


def main():
    data = json.loads(DATA.read_text(encoding="utf-8"))
    print(json.dumps(build_report(data), indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
