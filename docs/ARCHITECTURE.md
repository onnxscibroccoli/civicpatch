# CivicPatch architecture

## Purpose

CivicPatch is a public-interest navigation layer that helps people find reliable civic information and choose their own next step. The public concept and source code are open. The product must make uncertainty visible and must not imply that it is an official government service.

## Current deployment shape

The current application is a static HTML/CSS/JavaScript site hosted through GitHub Pages. Its guide constructs external search links in the browser. It does not currently run a backend, store submissions, geocode street addresses, or maintain a verified statewide service directory.

GitHub Actions is responsible for running tests before the Pages workflow uploads and publishes the site. The separate data-validation workflow runs on pull requests, pushes to main, a nightly schedule, and manual dispatch. Workflow success proves that automated checks passed, not that all source facts are accurate.

## Target logical architecture

1. **Experience layer**: accessible, mobile-first web interface; location and issue intake; plain-language next steps; visible evidence and uncertainty.
2. **Jurisdiction resolver**: resolves a selected place to a canonical jurisdiction identifier. It must return ambiguity and fallback states rather than guessing.
3. **Directory API or static data adapter**: exposes validated municipality, department, service, and source records. The first implementation can remain static JSON to keep hosting simple.
4. **Provenance and verification layer**: stores evidence, reviewer, review date, source URL status, content-review date, and quality status separately.
5. **Source ingestion and validation**: imports public records only under permitted terms, validates schemas, detects duplicate identifiers, checks URL reachability, and queues semantic changes for human review.
6. **Contribution and correction workflow**: GitHub issues and pull requests provide an auditable first version. Public correction intake should not collect private resident information.
7. **Coverage and operations reporting**: publishes records present, verified records, stale records, broken links, unknowns, test status, and last successful validation time.

## Standards and identifiers

- Use Open Civic Data Division Identifiers (OCD-IDs) when the jurisdiction mapping has been validated. Do not invent identifiers from a guessed municipality name.
- Track MassGIS town identifiers as an independent source identifier, not as proof of municipal responsibility.
- Consider Open Referral HSDS for service-directory interoperability. CivicPatch should document its chosen HSDS profile and mappings before claiming conformance.
- Keep Census and FIPS identifiers distinct from municipal IDs and mailing ZIP codes.
- Use a versioned JSON Schema and include provenance with each claim.

## Massachusetts geographic integration

MassGIS data is a candidate authoritative source for municipal boundaries, town identifiers, and address-related geographic data. Integration is not yet implemented in the current static application. Before using an address locator, document its license/terms, dataset vintage, coordinate reference system, match quality, and fallback behavior.

A postal place name or ZIP code must not be treated as conclusive proof of municipal jurisdiction. If CivicPatch later accepts street addresses, prefer on-device processing when feasible and explain any external geocoding provider before sending data. Do not retain precise addresses unless a reviewed product requirement justifies it.

## Data lifecycle

1. **UNVERIFIED**: no sufficient evidence review.
2. **INCOMPLETE**: a source exists, but expected information is missing or only partly supported.
3. **VERIFIED**: a reviewer checked the source and the specific claim within the published freshness window.
4. **STALE**: previously reviewed information is past its freshness threshold or needs review after a meaningful source change.
5. **BROKEN**: the source is confirmed unavailable or invalid.

Track URL reachability independently from factual verification. A successful HTTP response does not prove that the page is official or supports the recorded claim. A redirect is a signal for review, not automatically proof of failure.

The proposed initial review thresholds are 90 days for verified source review and 180 days before an unreviewed record becomes stale. These are policy proposals, not currently enforced automatic state transitions. Before implementing transitions, define exceptions for stable statutes, dynamic officeholders, seasonal notices, and critical services.

## Privacy and security boundaries

- Do not add analytics or a submission backend without a documented data inventory and privacy review.
- Do not expose secrets in client-side assets.
- Do not make official submissions on a resident's behalf without explicit review and consent.
- Avoid storing personal or sensitive data in public issues and pull requests.
- Protect workflow permissions with least privilege and pin third-party actions to full commit SHAs before treating the pipeline as hardened production infrastructure.
- Use automated link checks as triage, not as an authoritative verification method.

## Deployment and release evidence

A deployment is verified only when the GitHub Actions run is successful and the deployed URL is reachable and checked. Data coverage is verified separately. Maintain a release note and test evidence for consequential changes. The public status should distinguish:
- code tests passed;
- deployment succeeded;
- URLs responded;
- content was human-reviewed;
- jurisdiction routing was tested;
- municipality coverage met its stated threshold.

Do not collapse these into a single “production ready” badge.

## Integration with other CivicPatch projects

Potential interoperability with CivicPatch/civicpatch-tools or CivicPatch/open-data is an investigation item, not an established partnership. Preserve clear repository ownership and attribution. Evaluate their license, schemas, data quality, update cadence, and contributor expectations before importing data or claiming collaboration.
