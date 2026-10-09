# Release 0.4.0 — reviewed Stage 3B.2 first wave

Published base: 0.3.4 / `77f81ec9c42cf956d39b3680bd82608913353a39`.
Accepted content: `bcf6a3e6461548c17ef608ee21515ca97bfdec04`, following
`2a540ae8990954841c752cdc1186c0dc3a143a0d`. Working branch: `content-bank-3b2`.

## Release scope

- 317 questions, including 150 original generated additions; 54 code exercises.
- 44 filled topics out of 67; 13 newly opened lessons and 21 supplements.
- Collection arguments/returns use owned Pyodide proxies in the existing Worker.
- Reviewed pronoun text has one antecedent. File exercises explicitly disclose
  that automatic grading checks stdout, not whether files were actually used.
- The original 167 published question objects/IDs are preserved.

Only release metadata changes from the accepted content revision: package version,
settings label and exported backup appVersion are 0.4.0. Python runtime, question
revisions, bank, teaching modes and grading cases are unchanged by the release.

## Data safety and deployment

User schema 2, JSON backup format 2 and the exact 20 MiB backup limit are unchanged.
No cleanup or destructive migration is introduced. Existing active tests/adaptive
sessions keep their frozen snapshots. Attempts, errors, notes and question drafts
stay in IndexedDB; changing the supplied bank does not replace them. See
HISTORY-GROWTH.md for the deferred history-size risk.

The complete offline inventory contains 31 SHA-256-verified resources, including
the unchanged local Pyodide CPython 3.14.2 runtime. The local Windows inventory
is 14,826,683 bytes (~14.14 MiB), +331,877 bytes against the comparable 0.3.4 build.
All learning resources are supplied together, including previously unvisited topics.
No CDN or external API is required during learning. Updates wait for the whole
new kit and activation follows closure of all app windows; IndexedDB is separate.

GitHub Pages retains its existing URL and main-only workflow. Only production
dist is published; private packages, progress, programs, profiles, local reports
and rollback archives are excluded. The approved integration is fast-forward,
with ordinary pushes and no release tag.

## Checks

TypeScript, 105 unit tests, complete 317-question validation, independent answer
oracles, provenance/public audit, production build and final SHA-256 inventory.
All 17 available browser regression suites pass (127 labelled check groups),
including the full original learning-content suite, collection identity/nested
returns and all 54 programming exercises. Their 358 reference cases pass on
real CPython; 108 specified incorrect algorithms are rejected. All 12 old/new
code-reading prediction programs are executed, and four beginner loop explanations
are checked against their real grading cases.

The 0.3.4-to-0.4.0 update test preserves errors, notes, frozen active mini-tests,
adaptive sessions and Python drafts exactly after cold offline activation. All
67 routes / 44 filled modules, mobile widths 320/360/390, dark/light themes,
long stdout/Back/position/copy, timeout/recovery and old/new UI backups pass;
mandatory external requests are zero. One test invocation initially supplied a
directory where a URL was required; its corrected rerun passes all three checks,
without an application or test-code change. Local logs/profiles stay ignored.

The existing >500 kB chunk-size warning remains; no build errors are present.

## Samsung acceptance

Export a backup before updating. Wait for the complete-kit/update notice, close
all PWA windows, then reopen and check version 0.4.0 / 317 questions / 44 modules.
Check an existing error, note, active mini-test and program draft; their old
results must remain. In airplane mode, cold-launch, open an unvisited new lesson,
complete practice/control, run a list/dictionary function, and restart again.
Check long stdout/Back, mobile keyboard and old/new JSON backup import/export.
Native Samsung verification remains the user's separate acceptance step.
