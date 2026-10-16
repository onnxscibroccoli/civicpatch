# CivicPatch roadmap

This roadmap separates product goals from verified capabilities. An item is not complete merely because the interface suggests it.

## Stage 0: Publish the concept and a usable starting point

- [x] Public repository and project charter.
- [x] MIT license and contribution guidance.
- [x] Static landing page with an in-browser next-step guide and external official-source searches.
- [x] Explicitly label the current guide as early-stage and not statewide verified.
- [x] Confirm GitHub Pages is configured for GitHub Actions and a successful deployment is recorded in Actions.
- [x] Add automated HTML smoke tests and a scheduled URL-reachability report workflow (the report checks only URLs currently present in the directory; it is not an accessibility audit or JavaScript syntax test).

## Stage 1: Massachusetts minimum useful product

- [x] Define the versioned machine-readable registry schema and a MassGIS ingestion workflow for all 351 cities and towns.
- [x] Merge the 351-municipality candidate baseline with explicit incomplete/unverified labels. Human review of municipality links and service responsibility remains open.
- [ ] Include official municipal website, relevant official contacts, source URL, source type, verification date, reviewer, and confidence/status fields.
- [ ] Establish a documented state and local jurisdiction model, including regional authorities and municipalities without county-level service structures.
- [ ] Add source review and correction workflows.
- [x] Connect a static coverage dashboard and municipality provenance display to the versioned JSON file.
- [x] Populate the canonical file with 351 municipality records and candidate homepage/navigation sources; the UI reports municipality presence and verified counts.
- [ ] Expand the dashboard to sector-level verified, incomplete, stale, broken, and unverified totals.
- [ ] Build reliable issue-category guidance that distinguishes a suggestion from a verified responsible agency.
- [x] Add automated tests for core data invariants, provenance fields, coverage calculations, URL-check guardrails, and site-to-directory integration.
- [x] Add regression tests for URL-space encoding and preservation of existing percent encoding.
- [ ] Add end-to-end jurisdiction-routing tests and semantic OCD-ID registry validation.
- [ ] Test with users across urban, suburban, and rural communities and with assistive technologies.
- [ ] Publish privacy, retention, moderation, and security policies before accepting public submissions.

**Exit criteria:** no claim of full Massachusetts coverage until all 351 municipal records meet a defined minimum validation standard; stale and unknown records are visible; core flows pass automated and manual tests; deployment and rollback are documented.

## Stage 2: U.S. expansion

- [ ] Define a reusable state/jurisdiction adapter contract.
- [ ] Add one state at a time with official-source review and a public coverage report.
- [ ] Support federal, state, county, municipal, tribal, and special-district contexts where applicable without assuming identical structures.
- [ ] Make data exportable and preserve source provenance across updates.

**Exit criteria:** each enabled state meets the same quality gates as Massachusetts and has an accountable source-maintenance process.

## Stage 3: North America and global

- [ ] Design country-specific jurisdiction and administrative models.
- [ ] Support localization, translations, language accessibility, and region-specific legal context.
- [ ] Validate privacy and security implications before enabling new data sources.
- [ ] Publish a coverage map and explicit limitations by region.

## Cross-cutting quality gates

- Accessible, responsive UI with keyboard and screen-reader support.
- Tests for the most important user journeys.
- No secrets or unnecessary personal data in repository history.
- Source provenance, freshness, and uncertainty are first-class fields.
- Clear separation between public facts, community-submitted claims, and editorial guidance.
- No automated submission to a public authority without explicit user review and consent.
- Reproducible deployment and documented maintenance ownership.
- Open license and contributor-friendly documentation.

## What “statewide” means

A user being able to enter any Massachusetts town is not statewide coverage. Statewide means the system has validated sources and a tested process for each target jurisdiction, accurately represents which services are municipal, regional, state, or federal, and makes gaps visible. The project must publish evidence before using that label as a product claim.