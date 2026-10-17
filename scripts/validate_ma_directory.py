#!/usr/bin/env python3
"""Validate core CivicPatch Massachusetts directory invariants using Python stdlib.

This is intentionally a dependency-free guardrail, not a full JSON Schema engine.
CI runs these checks so incomplete coverage is visible rather than fabricated.
"""
import json
import re
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "ma" / "municipalities.json"
SCHEMA_PATH = ROOT / "schemas" / "ma-source-directory.schema.json"
STATUSES = {"verified", "incomplete", "stale", "unverified"}
SOURCE_STATUSES = STATUSES | {"broken"}
URL_STATUSES = {"not_checked", "reachable", "redirected", "broken", "manual_review"}
DEPARTMENT_TYPES = {"executive", "clerk", "public_works", "health", "conservation", "building_zoning", "finance", "public_safety", "planning", "elections", "other"}
OCD_PATTERN = re.compile(r"^ocd-division/country:us/state:ma/(?:place|cousub):[a-z0-9_]+$")
ID_PATTERN = re.compile(r"^ma-[a-z0-9-]+$")


def fail(message):
    print(f"ERROR: {message}", file=sys.stderr)
    return False


def is_date(value):
    if not isinstance(value, str):
        return False
    try:
        date.fromisoformat(value)
        return True
    except ValueError:
        return False


def is_url(value):
    if not isinstance(value, str):
        return False
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def validate():
    errors = []
    try:
        schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
        data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return fail(f"cannot read schema or directory: {exc}")

    if schema.get("$schema") != "https://json-schema.org/draft/2020-12/schema":
        errors.append("schema must declare JSON Schema draft 2020-12")
    if data.get("schema_version") != "1.0.0":
        errors.append("schema_version must be 1.0.0")
    if data.get("jurisdiction") != {"country_code": "US", "state_code": "MA", "state_fips": "25"}:
        errors.append("jurisdiction must identify US / MA / FIPS 25")

    coverage = data.get("coverage")
    records = data.get("municipalities")
    if not isinstance(coverage, dict) or not isinstance(records, list):
        errors.append("coverage must be an object and municipalities must be an array")
        coverage = {}
        records = []

    if coverage.get("target_municipalities") != 351:
        errors.append("target_municipalities must remain 351")
    if coverage.get("records_present") != len(records):
        errors.append("coverage.records_present does not match actual record count")
    if not isinstance(coverage.get("verified_records"), int) or coverage.get("verified_records") < 0:
        errors.append("verified_records must be a non-negative integer")
    if not is_date(coverage.get("generated_at")):
        errors.append("coverage.generated_at must be an ISO date")
    if coverage.get("status") not in {"not_started", "in_progress", "review_required", "coverage_target_met", "unverified"}:
        errors.append("coverage.status is invalid")

    seen_ids, seen_town_ids, seen_ocd_ids = set(), set(), set()
    verified_count = 0
    for index, record in enumerate(records):
        prefix = f"municipalities[{index}]"
        if not isinstance(record, dict):
            errors.append(f"{prefix} must be an object")
            continue
        mid = record.get("municipality_id")
        town_id = record.get("massgis_town_id")
        ocd_id = record.get("ocd_id")
        if not isinstance(mid, str) or not ID_PATTERN.fullmatch(mid):
            errors.append(f"{prefix}.municipality_id has invalid format")
        elif mid in seen_ids:
            errors.append(f"duplicate municipality_id: {mid}")
        seen_ids.add(mid)
        if not isinstance(town_id, int) or not 1 <= town_id <= 351:
            errors.append(f"{prefix}.massgis_town_id must be between 1 and 351")
        elif town_id in seen_town_ids:
            errors.append(f"duplicate massgis_town_id: {town_id}")
        seen_town_ids.add(town_id)
        if ocd_id is not None:
            if not isinstance(ocd_id, str) or not OCD_PATTERN.fullmatch(ocd_id):
                errors.append(f"{prefix}.ocd_id has invalid format; use null until independently validated")
            elif ocd_id in seen_ocd_ids:
                errors.append(f"duplicate ocd_id: {ocd_id}")
            else:
                seen_ocd_ids.add(ocd_id)
        if not isinstance(record.get("name"), str) or not record.get("name", "").strip():
            errors.append(f"{prefix}.name must be a non-empty string")
        if record.get("record_status") not in STATUSES:
            errors.append(f"{prefix}.record_status is invalid")
        if record.get("record_status") == "verified":
            verified_count += 1
        if record.get("official_website") is not None and not is_url(record.get("official_website")):
            errors.append(f"{prefix}.official_website must be null or an HTTP(S) URL")
        for evidence_index, evidence in enumerate(record.get("evidence", [])):
            ep = f"{prefix}.evidence[{evidence_index}]"
            if not is_url(evidence.get("reference_url")):
                errors.append(f"{ep}.reference_url must be an HTTP(S) URL")
            if not is_date(evidence.get("checked_at")):
                errors.append(f"{ep}.checked_at must be an ISO date")
            if not evidence.get("checked_by") or not evidence.get("claim_supported"):
                errors.append(f"{ep} must identify reviewer and supported claim")
        for source_index, source in enumerate(record.get("official_sources", [])):
            sp = f"{prefix}.official_sources[{source_index}]"
            if source.get("verification_status") not in SOURCE_STATUSES:
                errors.append(f"{sp}.verification_status is invalid")
            if source.get("url_status") not in URL_STATUSES:
                errors.append(f"{sp}.url_status is invalid")
            if source.get("department_type") not in DEPARTMENT_TYPES:
                errors.append(f"{sp}.department_type is invalid")
            if not is_url(source.get("canonical_url")):
                errors.append(f"{sp}.canonical_url must be an HTTP(S) URL")
            if not source.get("evidence"):
                errors.append(f"{sp} requires evidence")
            if source.get("last_content_reviewed_at") is not None and not is_date(source.get("last_content_reviewed_at")):
                errors.append(f"{sp}.last_content_reviewed_at must be null or an ISO date")
            for evidence_index, evidence in enumerate(source.get("evidence", [])):
                ep = f"{sp}.evidence[{evidence_index}]"
                if not is_url(evidence.get("reference_url")) or not is_date(evidence.get("checked_at")):
                    errors.append(f"{ep} must include a valid HTTP(S) reference_url and ISO checked_at")
                if not evidence.get("checked_by") or not evidence.get("claim_supported"):
                    errors.append(f"{ep} must identify reviewer and supported claim")

    if coverage.get("verified_records") != verified_count:
        errors.append("coverage.verified_records does not match records marked verified")
    if coverage.get("status") == "coverage_target_met" and (len(records) != 351 or verified_count != 351):
        errors.append("coverage_target_met requires 351 records and 351 verified municipality records")
    if len(records) > 351:
        errors.append("more than 351 municipality records are present")

    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return False
    print(f"PASS: directory structure and invariants valid; records={len(records)}/351; verified={verified_count}/351; OCD-ID populated={len(seen_ocd_ids)}/{len(records)}; status={coverage['status']}")
    print("NOTE: structural validation does not establish factual accuracy or source reachability.")
    return True


if __name__ == "__main__":
    sys.exit(0 if validate() else 1)
