# UX & Learning Flow Polish

Local branch: `polish-study-flow`, based on the clean, published 0.3.3 commit
`69e7b5623d5bb687f06b7e5c5c09e54de1c003a8`. No release/version bump,
merge, push, tag or publication is part of this work.

## Learning modes

Previously practice and mini-tests shared topicQuestions; theoretical retries
overwrote the displayed score and both training and checks added scored errors.
src/data/study-flow.json now explicitly allocates all non-easy questions in the
31 supplied topics into disjoint practice/test sets. No question is added or
deleted. Equivalent fourth-bit questions, the repeated because/rain sentence, and sum/fix-sum programs stay together
in practice. Conditions/inputs/skills were reviewed, rather than treating a new
ID as proof of independence. The five interactive labs remain present.

This is partial coverage. Several topics have only one control question; some
practice skills, particularly writing initial input programs, have no independent
code-writing check. UI explains the limited coverage, shows checked skills, warns
about previously seen questions and repeats, and provides an explicit unavailable
state when no independent questions exist. It never fabricates a full-topic grade.

Training answers go to optional StudyState.training; they record learning activity
and started topics, but no scored attempts, errors or review penalties. Historical
practice records in attempts are not reclassified. New mini-tests use optional
topicTests: stable session ID, frozen Question snapshots, index, first answer,
latest corrected answer, firstCorrect/currentCorrect and linked scored attempt.
Only the first recognised answer is scored; subsequent correction is retained
without changing that score. Session progress resumes after a cold restart.

Adaptive Review and the existing scored error/review rules remain unchanged.
Mini-test hints/solutions are hidden until the first check; practice has progressive
hints and explicit solution controls. Neither mode auto-assigns “Уверенно”.

## Beginner programming presentation

All 25 code questions receive revision 3 and an optional validated presentation:
title, friendly statement, secondary limits and contextual-input-help flag.
Canonical prompts, IDs, origins, skills, solutions and all tests are unchanged
from 0.3.3. Older snapshots remain exactly as stored. No new questions or external
material are introduced. The 2/3 sum example produces 5 with a general solution.

Read-only examples use the first visible test (arguments/return for functions).
They are separated from editable experimental stdin and actual execution output.
Prepared input is the default in exercises; interactive input disables that field
and clearly says Python waits for replies. Without JSPI, prepared stdin still works.
Checks use their own cases regardless of experiment input. Collapsed input help
explains strings, int(input()), separate lines, bounds vs enumeration, and why
examples must not be hardcoded. The runner, runtime and isolation are unchanged.

## Output

PythonOutput preserves the original strings. Up to 15 rows / 3,000 characters are
shown inline; larger results get a clearly marked preview and a full-view button.
The character bound handles a very long single line. There is no fixed-height
inline vertical scroll. No rows are grouped, reordered or discarded by the UI.

FullOutput is a native modal dialog rendered through a React portal. One viewport
scroll area contains an unwrapped pre; long lines can scroll horizontally within
that area without widening the page. Background body is locked; focus is moved
out of the editor, and focus plus original window scroll are restored on close.
History entry/popstate handles Back, with cancel for Escape/native dismissal.
Safe-area padding and 100dvh support mobile viewport changes.

Each result/test owns an in-memory position: logical row, fraction within the row,
and horizontal offset. ResizeObserver restores against the current line height.
Closing/reopening retains position; new run/check IDs start separately. Positions
are not persisted across a full application restart. Clipboard writes the original
full text or selection; native text selection remains available when permission
fails. Windows Clipboard read-back can normalize LF to CRLF at OS level.

Checks no longer copy the last test's stdout into the experimental output. Each
case retains its own raw stdout/traceback and viewer. Expected values are shown
only for visible cases. Factual mismatch feedback distinguishes extra rows, no
output, differing return, syntax, runtime, timeout, stop and incomplete checking.
Exception/source-line summary remains visible even when traceback exceeds preview.
No algorithm is inferred and no ready solution is automatically revealed.

Worker's 65,536-character output bound and runner timeouts remain unchanged. An
output-limit termination explicitly labels the captured prefix as incomplete,
including inside the fullscreen viewer. It is never represented as a completed
program result. Local hidden tests are still not cryptographic secrets.

## Data, provenance and checks

IndexedDB stores and versions are unchanged. Schema 2 and backup format 2 have
optional additive fields; old Stage 2/3A/3A.1/3B backups continue to import.
New fields are strictly validated (IDs, linkage, metadata, indices, first score,
active sessions and snapshots) before the existing atomic import transaction.
New training/session/draft backup round-trip and failed-import rollback are tested.
No user history, draft, note, date, interval or private package is cleared.

SOURCES.md and publication.json explicitly review own allocation/presentation.
All 167 question origins remain generated. Private-import/build guards and local
storage separation remain intact. No dependencies, CDN, telemetry or backend added.

Verification: TypeScript; 94 unit tests; 107 browser check groups (90 existing or
adapted regression groups, 17 new groups); 25 references / 169 real CPython cases;
50 incorrect program variants; five overfitting examples; five code-reading cases;
four beginner loops / 28 cases; bank/taxonomy validation; public audit; build;
SHA-256 inventory; zero mandatory external requests. Old draft/duplicate-mode tests
now assert resumed practice plus distinct independent mini-tests, rather than
enforcing the duplicate-question behavior being fixed.

Comparable Windows production builds:

| | 0.3.3 | Study-flow branch |
|---|---:|---:|
| Full production bytes | 14,468,163 | 14,505,071 |
| Verified offline bytes | 14,456,700 | 14,493,598 |
| Offline entries | 31 | 31 |

Offline increase: 36,898 bytes (~0.26%). Inventory 4ef3216c43cc844dc6e2.
Pyodide core remains 13,531,207 bytes (13,673,182 including licence notices).
The existing >500 KB main chunk warning remains; no framework was added.

Initial source backup: work/before-study-flow-69e7b56-20261009.zip,
SHA-256 48A44798B5DBF5CE9F7064927858AFE447659ACAB4EB9254A645CBFB68882630.
Profiles, fixture data, logs, screenshots and generated builds stay ignored.
Stable main remains the rollback reference. No user data is used for browser tests.

## Real Samsung checklist after separately authorized publication

- Update, close every PWA/tab and reopen; verify previous progress/drafts.
- Read the sum condition and 2/3→5 examples; try prepared and interactive input.
- Compare practice and mini-test; wrong training must not add scored errors.
- Close during mini-test and reopen; first score and current draft must resume.
- Print 500 rows; scroll to ~327, close/reopen; confirm both scroll positions.
- Check native Back, selection/copy, keyboard dismissal, orientation/font scaling,
  light/dark and system safe areas. Chromium emulation cannot prove physical IME.
- Inspect separate failed-test stdout, traceback summary, output-limit notice.
- Stop an infinite loop, run again; close/restart in airplane mode; backup restore.
