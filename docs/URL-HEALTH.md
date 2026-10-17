# Source URL reachability monitoring

The scheduled workflow `.github/workflows/check-source-urls.yml` checks distinct municipal website and official-source URLs from the checked-in directory. It emits a JSON artifact with HTTP status, final URL, and network errors.

Reachability and factual verification are independent:
- HTTP success does not mark a civic record verified.
- Redirects are reported separately.
- Broken URLs are reported but do not automatically erase or overwrite source records.
- The checker screens the initial URL **and each redirect destination** before following it. Private, loopback, link-local, invalid, or unsupported redirect targets are marked `manual_review`, not treated as verified public sources.
- The checker is **not fully SSRF-proof**: its DNS check is not pinned to the socket connection and DNS rebinding remains possible. Execute it only in an isolated, unprivileged CI runner, never on an internal network that contains credentials or services.
- A failed DNS resolution currently surfaces as a network check failure, rather than automatically proving a source URL is permanently broken. Improving transient-failure classification and the total probe budget remains on the roadmap.
- Reports are retained as GitHub Actions artifacts for 30 days.

Run locally with `python scripts/check_source_urls.py`. It needs outbound HTTPS access and writes `artifacts/url-health.json`.

The URL checker only sees URLs already present in the canonical JSON. It is not a substitute for per-sector source discovery, manual factual review, or legal/jurisdictional analysis.

## Spaces in municipal document URLs

URL paths and query components are percent-encoded during ingestion. For example, the Fall River **2026 City Council Committee Assignments** source ends in `/Committee%20List%202026%20AMENDED.pdf` (not a URL containing literal spaces). The existing `%20` encoding must be preserved on every refresh, never replaced by `%2520`. CI asserts this exact regression case as well as checking every directory URL field for unencoded whitespace.

This fixes URL serialization, **not** the municipal server's availability or the factual status of the document. The Fall River entry and all automatically discovered sources remain candidates until independently reviewed; HTTP reachability is checked separately.
