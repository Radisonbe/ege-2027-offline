# Release 0.3.3 — polishing after Stage 3B.1

Accepted foundation: published main/origin/main
`2470167c89ccd05e9440fbaaf386acc7ce40fa0d` (0.3.2).
Accepted local polishing: `ddeb13e40ac8dab7162206214233ae4b039c5ecf`,
branch `polish-032-math-and-code`. See POLISH-032.md for the original changes.

Release preparation changes only version metadata, math display safety,
deployment/test configuration and verification. No new tasks, dependency,
Python runner, database schema, backup format or scheduling changes.

- Package, settings and backup appVersion now identify 0.3.3.
- Recognisable URLs (including queries containing fractions), file paths and
  inline code enclosed in backticks remain literal display spans.
- React's actual rendered output is tested for escaped HTML, special symbols,
  script/event payloads and code elements. A browser fixture also verifies
  literal display, unchanged input, zero executable elements and backup snapshots.
- GitHub Actions fetches history because regression tests compare with the
  accepted immutable 0.3.2 commit. The workflow still deploys only dist from main.

Required checks: TypeScript, 85 unit tests, all eight existing browser suites,
polishing/mobile browser checks and beginner-example execution. The bank remains
167 questions, 67 topics, 55 subtopics and 95 skills. Programming verification
executes 25 reference programs across 169 cases, rejects 50 incorrect alternatives
and verifies five overfitting programs against the original/strengthened tests.
Public audit, production build, final offline inventory and diff checks are required.

Local Windows build: `outputs/release033-final` (ignored), 31 offline resources,
14,456,700 bytes, inventory `fd343c80c48952ab4615`. The comparable 0.3.2 build was
14,440,018 bytes. Increase: 16,682 bytes, approximately 0.12%. Runtime remains
13,531,207 bytes. Published Linux builds can differ slightly because raw source
line endings are normalized; verify actual published hashes and cache bytes.

For the real HTTPS update check, an isolated profile is first installed from
published 0.3.2 and given synthetic attempts, an error, a note, standalone Python
code, an exercise draft and a revision-1 adaptive question snapshot. After Pages
deployment, every resource hash and the full waiting cache are verified; a cold
offline restart must activate 0.3.3 with the exact original data intact. A code
exercise and fraction lesson must then work offline; another complete restart
must preserve the new result and draft. This never uses the owner's browser data.
Fixture/profile, logs, screenshots and generated reports stay in ignored work/outputs.

Initial local source backup: `work/before-release033-ddeb13e.zip`, SHA-256
`CC28F6968A0264EFB2F96D2380FC39162CBCE2C18BF3B1DA632060DB7B860AAD`.
Merge/push are authorized in the current conversation; no force push, reset,
cleanup or stable v0.3.3 tag is authorized. Android hardware acceptance remains
the owner's next step after publication.

Known limitations remain: simple display grammar rather than TeX; historical
question snapshots retain their original revision; local hidden tests are not
secret; the existing main JavaScript chunk remains above Vite's 500 KB advisory.
Real Samsung Internet, system font scaling and the on-screen keyboard must still
be checked on the device. Stage 3B.2 is outside this release.
