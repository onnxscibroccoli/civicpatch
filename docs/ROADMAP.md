# CivicPatch roadmap

This roadmap separates product goals from verified capabilities. An item is not complete merely because the interface suggests it.

## Stage 0: Publish the concept and a usable starting point

- [x] Public repository and project charter.
- [x] MIT license and contribution guidance.
- [x] Static landing page with an in-browser next-step guide and external official-source searches.
- [x] Explicitly label the current guide as early-stage and not statewide verified.
- [ ] Confirm GitHub Pages settings and a successful deployment from the Actions run history.
- [ ] Add automated HTML, JavaScript, accessibility, and link checks.

## Stage 1: Massachusetts minimum useful product

- [ ] Build a versioned, machine-readable registry of all 351 cities and towns.
- [ ] Include official municipal website, relevant official contacts, source URL, source type, verification date, reviewer, and confidence/status fields.
- [ ] Establish a documented state and local jurisdiction model, including regional authorities and municipalities without county-level service structures.
- [ ] Add source review and correction workflows.
- [ ] Add a coverage dashboard showing verified, partial, stale, and unknown records.
- [ ] Build reliable issue-category guidance that distinguishes a suggestion from a verified responsible agency.
- [ ] Add automated tests for data schema, link health, source provenance, and routing.
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