# CivicPatch

**Make local civic problems visible, understandable, and easier to act on.**

CivicPatch is an open-source civic participation concept that helps people identify a local issue, understand which public body may be responsible, find trustworthy public information, and take a constructive next step. Start in Massachusetts, build a reliable state-wide foundation, then expand across the United States and beyond.

The idea matters more than any one implementation. CivicPatch is published openly so residents, journalists, civic technologists, researchers, public-interest groups, and other developers can improve it, fork it, or build something better from it.

- **Repository:** https://github.com/onnxscibroccoli/civicpatch
- **Project status:** Early-stage public project. The concept and initial project charter are published; production functionality and statewide coverage are not yet verified.
- **License:** MIT. See [LICENSE](LICENSE).
- **Contributing:** See [CONTRIBUTING.md](CONTRIBUTING.md).
- **Roadmap:** See [docs/ROADMAP.md](docs/ROADMAP.md).\n- **Architecture:** See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).\n- **Automated ingestion:** See [docs/AUTOMATED-INGESTION.md](docs/AUTOMATED-INGESTION.md).\n- **Coverage metrics:** See [docs/MASSACHUSETTS-COVERAGE.md](docs/MASSACHUSETTS-COVERAGE.md).\n- **URL health monitoring:** See [docs/URL-HEALTH.md](docs/URL-HEALTH.md).

## The problem

People often know what is wrong in their community but do not know:
- Which city, town, county, regional, state, or federal body is responsible.
- Where the authoritative information lives.
- Whether a similar issue or public initiative already exists.
- How to submit a useful report, public comment, records request, or constituent message.
- How to follow progress without relying on rumor or an opaque platform.

CivicPatch aims to reduce that friction. It should explain options, connect people to primary sources, and help them participate constructively without pretending to be a government agency or replacing official channels.

## The intended experience

1. **Describe a concern.** A resident explains a civic issue in plain language and chooses a location.
2. **Find the right jurisdiction.** The application helps identify likely responsible public bodies, showing uncertainty and evidence rather than guessing.
3. **Review verified sources.** It provides official pages, relevant public records, meeting information, ordinances, service request channels, and other useful sources when available.
4. **Choose an action.** It explains practical options and can help draft a respectful message, public comment, records request, or meeting question.
5. **Track what is known.** Where reliable public data exists, CivicPatch can show source links, last-checked dates, status history, and gaps in the evidence.
6. **Improve the commons.** Residents and contributors can correct information, report broken links, add jurisdiction coverage, and improve the software.

These are product goals, not claims that every feature is already implemented.

## Geographic plan

### Phase 1: Massachusetts

Establish a dependable Massachusetts foundation before claiming broad coverage:
- Support all 351 cities and towns as a coverage target.
- Distinguish municipal, regional, county-level where applicable, Massachusetts state, and federal responsibilities.
- Prefer official government sources and public datasets.
- Make incomplete coverage visible; never imply every municipality or service has been verified.
- Test across urban, suburban, rural, and regional contexts.

Massachusetts has different local-government structures in different places. The product must not assume that every county has an active county government or that every issue belongs to a municipality.

### Phase 2: United States

Expand through reusable state and local jurisdiction adapters, common schemas, authoritative-source registries, and a transparent coverage map. Treat each state as a separately validated rollout rather than turning on nationwide coverage by assumption.

### Phase 3: North America and global

Add countries and regions only when localization, jurisdiction models, source quality, language, accessibility, privacy, and legal context can be handled responsibly.

## Quality and trust principles

- **Source-first:** Link to primary sources and label source provenance.
- **Honest uncertainty:** Distinguish verified facts, inferred suggestions, stale information, and unknowns.
- **No fabricated coverage:** A location or jurisdiction is not supported merely because a map or search box accepts it.
- **Human agency:** People choose whether to send a message, publish information, or contact an official. Never submit or publish on their behalf without clear consent.
- **Nonpartisan access:** Support constructive civic participation across viewpoints; do not manipulate people or target them based on sensitive traits.
- **Privacy by design:** Minimize collection of personal data, avoid exposing private individuals, and document retention and deletion behavior before collecting submissions.
- **Accessible by default:** Aim for WCAG 2.2 AA, keyboard operation, screen-reader support, readable language, and mobile-friendly layouts.
- **Open standards and portability:** Prefer documented formats, exportable data, and replaceable providers.
- **Safety and moderation:** Do not enable harassment, threats, doxxing, voter intimidation, or publication of private personal information.
- **No false official status:** CivicPatch is an independent community project, not a government service.

## What is ready today?

The repository is the public home of the concept and its development. This project charter describes intended behavior and boundaries. It does **not** certify a production application, verified Massachusetts coverage, a functioning backend, a complete data pipeline, or a successful live deployment. Those claims require tests and observable evidence.

The next practical goal is a usable, accessible Massachusetts-first web application with:
- a simple civic issue intake and location selection flow;
- a clear jurisdiction and official-source directory;
- links and guidance for taking action through official channels;
- explicit data freshness and coverage indicators;
- automated checks and a reproducible GitHub Pages deployment;
- a documented, open contribution process.

## Contributing

You do not need to be an expert or agree with every design decision to help. Useful contributions include validating an official source, reporting a broken link, testing with assistive technology, documenting a municipal process, translating copy, improving the interface, adding tests, and reviewing privacy or security risks.

Start with [CONTRIBUTING.md](CONTRIBUTING.md), [the roadmap](docs/ROADMAP.md), and [the data and trust model](docs/DATA-AND-TRUST.md). Please do not submit private resident data, credentials, or unverified allegations about identifiable people.

## Open source

CivicPatch is released under the MIT License. Contributions are welcome under the same license, subject to the repository's contribution guidance. Fork it, improve it, and help make civic information easier for everyone to use.

## A note to future maintainers

Do not trade trust for a demo that looks complete. Ship useful increments, verify claims, preserve source attribution, and clearly mark what is not yet supported. If another team can implement this idea better, the public concept and open documentation should make that possible.