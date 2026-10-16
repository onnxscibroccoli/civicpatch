# Automated Massachusetts municipality ingestion

The workflow `.github/workflows/refresh-ma-directory.yml` refreshes the municipality identity baseline weekly and on manual dispatch. It uses only Python standard-library code to query the MassGIS ArcGIS feature layer and parse the Commonwealth's published city-and-town website directory.

## Sources

- MassGIS municipality feature layer: https://services.arcgis.com/2gdL2gxYNFY2TOUb/ArcGIS/rest/services/Massachusetts_Municipalities/FeatureServer/8
- Commonwealth city and town website directory: https://www.mass.gov/lists/massachusetts-city-and-town-websites

## Safe ingestion contract

- The ingestion fails closed unless MassGIS returns exactly 351 features with unique TOWN_ID values spanning 1 through 351.
- Official websites are matched only where an exact normalized municipality label exists in the Commonwealth directory. URLs are not generated from municipality names.
- OCD-IDs remain null. No identifier is derived from a slug or name.
- Records remain `incomplete`; website presence and structural validation do not imply factual verification.
- The scraper does not infer departmental responsibility or automatically classify service categories.
- A workflow run opens or updates a draft pull request rather than silently committing changed civic data to production.
- The data-validation workflow checks internal consistency before the proposed data is reviewed.

## Run locally

```sh
python scripts/ingest_ma_municipalities.py
python -m unittest discover -s tests -v
python scripts/validate_ma_directory.py
python scripts/report_ma_coverage.py
```

The script requires outbound HTTPS access to the two sources. A failed or partial MassGIS response aborts without replacing the checked-in directory. The candidate website matching is deliberately conservative; unmapped websites remain null for review.

## What this does not do

It does not scrape all six municipal service sectors yet. Those need source-specific adapters and review policies. This first workflow establishes the 351-entity baseline and gathers candidate official homepages. The next ingestion phase should add per-sector official-source discovery, URL health checks that are separate from factual verification, and a reviewed mapping to OCD-ID and HSDS.
