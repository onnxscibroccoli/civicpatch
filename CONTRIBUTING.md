# Contributing to CivicPatch

Welcome. CivicPatch is an open-source attempt to make civic information easier to find and act on. You do not need to be a professional developer. Source verification, usability feedback, translations, accessibility checks, and clear documentation all matter.

## First contributions

1. Read the [README](README.md), [roadmap](docs/ROADMAP.md), and [data and trust model](docs/DATA-AND-TRUST.md).
2. Search existing [issues](https://github.com/onnxscibroccoli/civicpatch/issues) before opening a new one.
3. For a bug, include the browser/device, steps to reproduce, expected behavior, and actual behavior. Remove personal information from screenshots and logs.
4. For a civic source correction, provide the official URL, jurisdiction, the date checked, what the source establishes, and any uncertainty.
5. For code, make a focused change and explain how you tested it. Open a pull request and describe any known limitations.

## Local development

This initial version is a static HTML/CSS/JavaScript site and does not require a build step or third-party runtime packages.

- Open `index.html` in a modern browser for a quick check.
- For a local HTTP server with Python installed, run `python -m http.server 8000` from the repository root and visit `http://localhost:8000`.
- Check the page at mobile and desktop widths.
- Test keyboard-only navigation, visible focus, form validation, links, and reduced-motion settings.
- Check browser developer tools for JavaScript errors.
- Do not claim statewide coverage or agency routing is verified unless you add reproducible evidence and tests.

## Civic data contributions

- Prefer primary sources: official government pages, statutes, published datasets, meeting notices, and agency documents.
- Record jurisdiction, source URL, source owner, date last checked, and what the source supports.
- Distinguish verified facts from suggestions, inference, and unknowns.
- Do not scrape or republish data in violation of terms, law, or privacy expectations.
- Never submit credentials, API keys, private resident records, sensitive personal data, or unverified allegations about identifiable people.
- Do not add a person's home address, private phone number, or other personal information as a way to pressure or target them.
- Flag dead links, contradictory sources, stale data, and accessibility barriers.

## Pull request expectations

- Keep changes focused and explain the user benefit.
- Add tests or a manual test plan for behavior changes.
- Preserve mobile usability, semantic HTML, keyboard access, and screen-reader clarity.
- Avoid collecting personal data. Any proposal to collect or retain submissions must include a privacy and threat-model review before implementation.
- Avoid dependencies unless they provide clear value and can be maintained.
- Use neutral, non-inflammatory language. Do not introduce partisan persuasion or targeted manipulation.
- Document limitations honestly. A green build is not proof of data correctness.

## Review and conduct

Be respectful and assume good faith. Critique ideas and code, not people. Harassment, threats, doxxing, discrimination, and publication of private information are not acceptable. Report security vulnerabilities privately to the repository maintainer rather than posting exploitable details in a public issue.

By submitting a contribution, you agree that it may be distributed under the repository's MIT License. You confirm that you have the right to contribute the material.

## Help wanted

Early high-value work:
- Verify official sources and contact routes for Massachusetts communities.
- Build a machine-readable directory for all 351 cities and towns with provenance and freshness fields.
- Add automated link checks and a coverage report.
- Improve accessibility and plain-language guidance.
- Add browser tests for the guide and safe external-link behavior.
- Design a reviewable jurisdiction-routing model with uncertainty and evidence.
- Improve deployment and release documentation.