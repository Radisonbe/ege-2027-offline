# Local release 0.3.4 preparation

Branch: polish-study-flow. Accepted review base:
34b8511b662cdf4f59d6e5235ae55fef6e49bf62. Stable main/origin/main remain
69e7b5623d5bb687f06b7e5c5c09e54de1c003a8 (published 0.3.3).

## Scope

Practice progress/finish controls now say practice, and its summary explicitly
describes corrections and separate training history without control penalties.
Easy review uses repetition captions rather than mini-test captions. TopicTest
continues to present the frozen first independent result; scoring was not changed.

Topic counters are now “Контрольных попыток”, “Контроль: верно / ошибки” and
“Тренировочных ответов”. A pure topicAttemptCounts selector reads the existing
arrays; it never rewrites them. Legacy practice records in attempts remain where
they were historically counted, with an explicit no-recalculation explanation.
New training never enters the control counts, errors or adaptive penalties.

package.json, settings version and backup appVersion now identify 0.3.4.
Schema 2, backup format 2 and the exact 20 MiB limit are unchanged. Manifest,
Service Worker/versioned caches, IndexedDB, runner/runtime and 167 questions are
unchanged from the accepted study-flow branch. No dependency added.

## History debt

See HISTORY-GROWTH.md for measured synthetic profiles and a future strategy.
Twenty training answers plus one mini-test daily project to about 7.1 MB/year;
adding fifteen adaptive questions daily projects to about 23.9 MB/year and the
20 MiB cap at roughly 319 days. These assume short reference code, correct answers
and no error snapshots/retries. Real history can grow faster.

Versioned full-question snapshots, repeated code strings and separate import
recovery copies are the main duplication/storage costs. No automatic duplicate
unfinished-session creation was found. No archiving, deletion, storage migration,
deduplication, format change or limit increase is implemented here.

## Verification and size

Required: TypeScript; all unit tests (96); existing browser regression groups and
five new label/counter cases (112 total); code-reading/stdin contracts; real Python
stdout/function/error/stop/timeout tests; practice/control and first-score tests;
old/new backup imports and transaction rollback; PWA update/cold offline restart;
320/360/390/desktop layout; bank/provenance/public audit; production and SHA-256
inventory; no mandatory external requests. The full 25-program batch was already
verified in the unchanged accepted engine/bank; the release reruns runner/grading
regressions, overfitting checks and beginner examples rather than changing that bank.

Comparable local Windows builds:

| | Stable 0.3.3 | Local 0.3.4 |
|---|---:|---:|
| Verified offline bytes | 14,456,700 | 14,494,806 |
| Full production bytes | 14,468,163 | 14,506,279 |
| Offline entries | 31 | 31 |

Offline increase: 38,106 bytes (~0.26%); 1,208 bytes over accepted study-flow.
Inventory: b0e828f1dd863d7dc7c2. Python core remains 13,531,207 bytes.
The existing >500 KB main-chunk advisory remains. Published Linux resource sizes
and hashes may differ slightly from this Windows build due to raw source line endings.

Pre-change archive: work/before-release034-34b8511-20261009.zip,
SHA-256 684D2D587A48327C9BF31AE8BE1715F9708705130845143C2B4EFF8D1E05E8E2.
Temporary profiles, fixture data, analysis script, reports, screenshots and builds
remain ignored; only reusable regression tests/documentation are committed.

## Next human check

After separate authorization to publish, verify on Samsung: update and previous
progress, labels/counts after wrong/correct practice, first mini-test score after
correction and restart, input modes, keyboard/font scaling, full-output Back/copy/
scroll restoration, infinite-loop stop/recovery, cold airplane-mode startup and JSON
backup restore. Chromium emulation is not a claim of final Android acceptance.

This preparation does not authorize merge, push, tag or GitHub Pages publication.
Stage 3B.2 and content expansion remain separate work.
