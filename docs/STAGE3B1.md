# Stage 3B.1: learning content and embedded Python exercises

This work belongs to stage-3b1-learning-content, based on Android-tested main 35400d19c5a298251fe00601290fa6bd5a0d99d0 (0.3.1). Local version is 0.3.2-dev. No merge/push/publication is performed in this stage.

## Content and taxonomy

The four stage3b1-*.json packages add exactly 100 original generated exercises, 25 per subject. The original four packages and reference.json remain byte-for-byte unchanged. All new examTaskType values are null; no task is claimed to be official FIPI material.

| Subject | Questions | Coding | Topics |
| --- | ---: | ---: | --- |
| Mathematics | 25 | 0 | Arithmetic, fractions, percentages, powers, roots, linear equations, functions |
| Russian | 25 | 0 | Parts of speech, sentence analysis, conjunctions/relative words, checked vowels, simple punctuation, text links |
| Informatics | 25 | 5 | Numeral systems, uniform encoding, logic, information units, Python algorithms |
| Python | 25 | 20 | Variables, types, conditions, loops, strings, lists, dictionaries, functions/return |

There are now 167 questions, 55 subtopics and 95 skills. 12 previously planned topics get original introductory theory; four existing modules get targeted supplements. 31 of 67 topics have material; 36 remain planned. Source lessons are separate validated data, not changes to the captured reference.

Writing skills have their own stable IDs and prerequisite links to existing foundations. Reading code is not replaced by writing code. New coding metadata supports write-program, complete-code, fix-bug and write-function. Multiple-choice means an unordered set of option strings; legacy selection exercises remain intact. Binary text format is explicitly declared.

The mathematical answers are checked by separate arithmetic identities; encoding and logic use independent calculations/truth tables. All 25 coding reference programs pass their four test cases in the real isolated CPython runner. For each, a constant first-example answer and a skill-specific common mistake are rejected. Five code-reading questions are independently executed as well. Russian examples use simple, explicitly worded contexts; this is an internal editorial check, not external linguistic certification.

## Execution and assessment

CodeExercise is lazy-loaded only for answerType code. It uses the existing PythonRunner, opaque sandbox frame and Web Worker. No second interpreter, runtime bundle, CDN, backend or telemetry was added. Ordinary mathematics/Russian tests do not initialize Python. PWA installation still eagerly caches all runtime assets, as required for a first unvisited offline code exercise.

Run executes code with the student's stdin or interactive input, displays stdout/traceback and never scores. Check solution uses each test's stdin or function arguments. Visible input/output mismatches are shown; hidden failures identify the additional case without exposing its expected value. Full explanations/reference code require an explicit separate request; hints are progressive.

Each assessment test uses a clean worker. A trailing stdin newline no longer creates an extra blank input line. The idle experimental runner is disposed during assessment to avoid retaining two interpreters. It is recreated after checking/cancellation. Expected outputs and expected returns remain outside Worker; only program text, stdin, function name and argument values cross the boundary. Function output is checked by actual returned JSON value, not source-text matching or variable names.

Hidden tests in a local browser are educational checks, not cryptographically secret. An owner with DevTools can read client resources. This must not be marketed as a secure examination grader.

Syntax/indentation errors are unscored input-format problems. Wrong output or runtime exceptions from Check are educational errors. Timeout, manual stop, excessive output/infrastructure failures are unscored. Run never scores any of these.

An assessmentKey groups one question/day/context or one adaptive session slot. At most one failure and one correction are recorded; a later day or another adaptive slot is independent evidence. A solved same-cycle question is not repeatedly rescored. Existing attempt/error snapshots, due dates, activity and adaptive exposures use the existing engine. New daily sessions never repeat the same ID; if fewer eligible questions exist, the UI explicitly offers a shorter session. Legacy repeated sessions remain readable.

## Local drafts and backup

The progress database is unchanged: ege-local-center, physical DB version 1, progress/current. Document schema 2 receives optional codeDrafts and attempt.assessmentKey fields; no destructive schema migration is needed. Each codeDrafts[questionId] has schemaVersion 1, questionVersion, code, stdin and updatedAt. Edits save without modifying learning activity. Different assignment IDs never share drafts. Topic practice/mini-tests reopen the most recent matching draft, with a way to start at the first question.

Backup v2 includes these versioned optional drafts automatically. Genuine Stage 2 backup v1 and Stage 3A/3A.1 backup v2 remain importable. Validation rejects corrupt/future draft schemas before replacement. Confirmed import replaces progress AND assignment drafts in one IndexedDB transaction, with a pre-import recovery record. An old backup without drafts replaces them too; the confirmation warns explicitly. Older app versions are not promised to understand the new optional fields.

The standalone Python Playground still uses its separate ege-python-playground database. Its draft is not included in the progress backup, unchanged from 0.3.1. Copy it separately before clearing site data. Personal imported packages remain in their own local-only storage and never enter Git/build/automatic public review.

## Checks and size

TypeScript; all unit tests; public-content audit; content/taxonomy/lesson validation; production build; final SHA-256 offline inventory; existing browser suites; new embedded-editor checks; all programming references and negative solutions; code-reading predictions. All 75 unit tests, 59 existing browser scenarios and 19 new embedded-editor scenarios passed; 100 reference coding cases, 50 incorrect solutions and five reading predictions were checked with real CPython. Exact stdin line endings/blank lines/EOF were also checked. These counts include the final saved-multiple-answer import guard and the code-reading display regression checks.

Build outputs and all browser profiles/reports/screenshots are ignored. New reusable tests are work/tests/learning-content.test.mjs, learning-content-browser.mjs, program-bank-browser.mjs and prediction-bank-browser.mjs. Browser scripts receive bundled-node-modules, the new production build and the stable 0.3.1 build. --ui-only skips the separate full content verification when it has already passed.

Verified fresh build: outputs/stage3b1-completion-checked, offline version d3fe4cca85287938540e. Production output: 14,451,489 bytes, 33 files (including sw.js and offline-inventory.json). Offline cache: 14,440,026 bytes, 31 precached resources. Compared with 0.3.1 (14,286,577 bytes), increase is 153,449 bytes (~149.85 KiB, ~1.07%). Pyodide's five files remain exactly 13,531,207 bytes; runtime/licence files and lockfile are unchanged. Main application JS is 641.96 kB (158.17 kB gzip), producing Vite's nonblocking 500 kB warning. Cache size describes response bodies, excluding browser metadata, IndexedDB and temporary overlap with a waiting update.

## Final correction checkpoint

The main implementation commit is 04ed9aca55bf77edc0993582c5d1cc5110b268b8. A separate local follow-up commit preserves the final corrections; no amend or history rewrite is used. Five reading questions (b1-python-02, -04, -12, -15 and -19) retain their IDs and answers and render supplied code in a separate preformatted block, including the error bank. Their prediction metadata is verified with the same CPython runner without initializing Python in the ordinary reading interface. Malformed saved multiple-selection answers are rejected before importing or replacing progress. The updated Python package is covered by the reviewed publication hash and regression tests.

All eight browser scripts were rerun in isolated test profiles; every script that loads the application uses the fresh production build. The 59 existing scenarios comprise 11 general offline/backup, 12 adaptive-review, 30 standalone Playground, four update and two private-package scenarios; the embedded-editor suite adds 19. The separate program-bank and prediction scripts verify the actual supplied reference solutions and deliberately incorrect alternatives, rather than adding their cases to the UI-scenario count. No public deployment or real Android verification of this Stage 3B.1 build has been performed.

## Real Samsung Android checklist after approved deployment

1. Wait for complete offline kit; close every PWA/site window and reopen the new version.
2. Existing attempts/errors/notes/review sessions remain intact.
3. Read a normal math/Russian question; Python should not start there.
4. Open a code exercise: starter appears, editor has usable height and font; test keyboard, Enter, indentation, punctuation, long-code scrolling and stdin.
5. Run an incorrect experiment; statistics must not change. Check a constant first-example answer; extra tests must fail and one error is recorded.
6. Correct the program; all tests pass and one correction is recorded. Check a function using return, then print without return (which must fail).
7. Try SyntaxError, ZeroDivisionError, an infinite loop, manual cancellation and timeout. Next run/check should work.
8. Leave two different drafts; close PWA, restart phone and return to practice/mini-test; drafts remain separate.
9. Airplane mode: cold launch, open a previously unvisited new topic/code exercise, run/check and save code.
10. Export/import backup with drafts; invalid file must preserve data. Notice the explicit warning before importing an old backup without drafts.

Samsung IME/keyboard and device-specific RAM/initialization time require the owner's real-device test. Browser emulation is not confirmation of real Android compatibility for this integration. Assessment starts several clean workers sequentially and can take seconds on a phone; no hard RAM quota exists. Runtime packages, pip UI, AI, cloud sync and full IDE features were not added.

Stage 3B.2 candidates: collect Android feedback, editorial review of this wave, broader topic coverage with supporting theory, and better feedback/tests for coding exercises. Further expansion/publication requires separate authorization.
