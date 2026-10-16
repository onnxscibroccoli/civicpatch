# Massachusetts coverage report

Run from the repository root:

```sh
python scripts/report_ma_coverage.py
```

The command reads `data/ma/municipalities.json` and prints machine-readable JSON for the six initial service sectors: public works, building/zoning, public health, conservation, clerks/elections, and executive administration. It reports municipality presence separately from verified municipal records, counts source records by trust state, and counts OCD-IDs only when populated.

This report is a deterministic calculation over the checked-in data, not proof that source facts are correct or that a URL is reachable. The current directory can legitimately report zero coverage. A sector is not considered covered merely because a municipality has a homepage or an HTTP 200 response. The application must not present the report as live network monitoring.

## Source-of-truth boundary

MassGIS municipal boundary data is appropriate for official municipality names and TOWN_ID crosswalks. It does not establish which body is responsible for a particular service. Community aliases, regional authorities, emergency service zones, and category-specific responsibility require separate mappings and evidence.

OCD-IDs remain null until independently validated against an authoritative registry. Regex checks catch malformed strings only; they do not establish that an identifier exists or maps to the intended jurisdiction.
