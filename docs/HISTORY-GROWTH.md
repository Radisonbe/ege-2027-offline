# History growth and the 20 MiB backup limit

Reviewed during local release 0.3.4 preparation, 2026-10-09. This is technical
debt documentation, not an implemented archive or deletion policy.

## What currently grows

- training appends one compact attempt and one activity on each recognised
  practice answer/check. It stores IDs/metadata and the answer/code, not a whole
  Question. Run, draft edits and invalid answer format do not append training.
  Repeated explicit checks of identical code can nevertheless store the same code
  repeatedly; this is not currently deduplicated.
- topicTests stores every explicitly started mini-test, including completed ones.
  Each item holds an immutable full Question snapshot (including solutions,
  hints and Python test definitions), first answer, latest answer and attempt link.
  First code answers may thus appear in item.answer, item.lastAnswer and attempts;
  an erroneous first answer also appears in the error record. Repeated sessions
  intentionally copy the same versioned Question for faithful history restoration.
- Opening an existing mini-test resumes it. The active-session guard prevents
  automatic creation of duplicate unfinished sessions; corrections update that
  item's current result rather than appending new control attempts/sessions.
- Adaptive Review already stores per-session Question snapshots, attempts and
  exposures. This increases the same backup's size.
- Exercise drafts keep the latest code per stable ID; stdout is transient and
  not exported. Large drafts/answers may still dominate the data size.
- Before-import recovery copies stay separately in IndexedDB. They are not part
  of the exported current document but can grow total device storage. None are
  removed by this release.

No uncontrolled duplication from page rerenders/startup was observed. Large
duplicates are caused by explicit repeated answers and versioned session snapshots.
The whole current document is also written on each change; growing history can
increase typing/save costs even before the export limit is reached.

## Reproducible estimate

An ignored local script models 60 authored synthetic days through the existing
domain functions and actual pretty-printed UTF-8 backup serializer. No user's
IndexedDB/code is read. Assumptions: 20 practice responses/day, half of them short
reference programs; one mini-test/day, cycling 31 topics. All responses are correct;
there are no extra retries, error snapshots, long comments or private packages.
The second profile adds a 15-question adaptive session daily. These are conservative
illustrative profiles, not a storage/performance guarantee.

| Profile | Actual 60-day JSON bytes | Estimated annual bytes | Estimated days to limit |
|---|---:|---:|---:|
| Practice + mini-test | 1,169,340 | 7,110,908 | 1,076 |
| Plus daily Adaptive Review | 3,933,805 | 23,928,070 | 319 |

Projection uses the mean observed increment (19,481 / 65,555 bytes per day),
subtracting the empty-state baseline. The current limit is exactly 20 * 1024 * 1024
= 20,971,520 bytes. With daily Adaptive Review it can be reached in roughly ten
months; longer programs, incorrect answers and repeated checks can reach it sooner.
For example, a near-100,000-character ASCII program adds around 100 KiB per stored
copy, and Cyrillic characters consume more UTF-8 bytes. The export limit does not
prevent further learning-state writes, so waiting until it is exceeded is risky.

## Safe future strategy (requires a separate stage)

1. Measure actual backup size/counts and warn early, while a complete supported
   export is still possible. Do not silently cap or delete history.
2. Introduce immutable snapshot records keyed by Question ID + version + content
   hash. Sessions/errors can reference those records, keeping the actual historic
   material available even after a bundled question changes or disappears.
3. Consider content-addressed immutable code strings so identical first/latest/
   attempt/draft text can be stored once without losing dates, outcomes or links.
4. Move append-only events/session records to indexed stores so typing need not
   rewrite the entire history. Use a versioned migration into shadow data, verify
   counts/references/checksums, retain the original document and commit atomically.
5. Define a versioned complete/chunked or compressed backup with a manifest and
   integrity checks; old v1/v2 imports must remain supported. Validate a complete
   restore before replacing current progress. Raising a cap alone is insufficient.
6. Offer user-controlled archival/export of completed periods and recovery copies,
   with verified restorable backups. Any later deletion requires explicit approval;
   retain first answers, corrections, notes, dates, intervals and historical context.

In 0.3.4 none of these storage/format changes, cleanup, compression, automatic
archival, record deduplication or limit increases are implemented. IndexedDB/schema
2 and backup format 2 remain unchanged.
