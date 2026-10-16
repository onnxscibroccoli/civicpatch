# Data and trust model

CivicPatch only helps when people can tell the difference between a reliable source and an unverified suggestion.

## Source records

The planned source registry should include, at minimum:

- `id`: stable identifier
- `jurisdiction_id`: jurisdiction the source belongs to
- `name`: plain-language agency or source name
- `url`: canonical official URL
- `source_type`: official agency, statute/regulation, public dataset, meeting notice, or other documented category
- `topics`: issue categories the source may support
- `last_checked_at`: timestamp of the last successful human or automated check
- `verification_status`: verified, partial, stale, broken, or unverified
- `evidence_note`: concise explanation of what the source supports
- `reviewed_by`: maintainer identity or project role, avoiding unnecessary personal details
- `license_or_terms`: applicable reuse terms when known

A live URL alone does not prove the page is authoritative, current, complete, or relevant. Automated link checks can detect some failures, but cannot verify the meaning of a page.

## Jurisdictions

Represent jurisdiction relationships explicitly. A question may involve a municipality, regional authority, state agency, federal agency, tribal government, or a special district. Do not assume every service is municipal or that every Massachusetts county has the same governing responsibilities.

Routing should return:
- a suggested responsible body or a list of possibilities;
- the evidence and official source links supporting each suggestion;
- confidence and reasons for uncertainty;
- a way to report an incorrect result;
- a fallback when no reliable answer exists.

Do not silently turn an uncertain guess into a definitive answer.

## Privacy boundaries

The initial static guide does not send the entered location or description to a CivicPatch backend. It constructs search URLs in the browser. If the user follows an external search link, that search provider receives the query and its own privacy terms apply.

Before introducing accounts, analytics, submissions, or a database, document:
- what information is collected and why;
- whether information can identify a person or household;
- retention and deletion periods;
- access controls and incident response;
- whether data is public, private, or shared with third parties;
- how consent is obtained and withdrawn.

Collect the minimum data necessary. Do not request sensitive personal details for ordinary civic guidance. Never publish private contact details, credentials, or personal records.

## Community submissions

If submissions are added later, treat them as claims until reviewed. Provide clear status labels, correction mechanisms, moderation procedures, and audit history. Do not expose submitters to retaliation by making identifying details public by default. Do not present allegations about identifiable people as established facts without a reliable public record and editorial review.

## Safety and user agency

CivicPatch is not a government agency, attorney, emergency service, or official case-management system. It must not claim to file a request or contact an agency unless that action actually occurred and the user explicitly approved it. For consequential deadlines, eligibility, legal rights, or emergencies, direct users to authoritative services and make the limits of the tool clear.

## Freshness policy

The future registry should define review intervals by source type and show stale records. An automated check should never silently renew a source's factual verification date merely because the HTTP request succeeded. Record the difference between “URL reachable” and “content reviewed.”

## Data quality states

Use explicit states rather than a binary verified/unverified flag:
- **VERIFIED**: reviewed against an authoritative source within the documented freshness interval.
- **PARTIAL**: source supports some, but not all, of the expected information.
- **STALE**: source needs review under the published freshness policy.
- **BROKEN**: source is unavailable or confirmed invalid.
- **UNVERIFIED**: no adequate review evidence exists.

A missing source is not proof that a service or process does not exist.