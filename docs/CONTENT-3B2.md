# Stage 3B.2 — first reviewed content wave

Base: published 0.3.4, `77f81ec9c42cf956d39b3680bd82608913353a39`.
Branch: `content-bank-3b2`. No merge, push, tag or publication is authorized here.
Application release metadata remains 0.3.4 until a separate release decision.

## Scope and honest limits

This is a coherent first package of **150 new exercises**, below the 220 target.
After a substantive difficulty review it contains **17 easy, 115 medium, 18 hard**
questions. The target of 30 genuinely hard new tasks is **not yet met**. Several
useful but short algorithms/calculations were deliberately classified medium.
Hard labels describe this refresher curriculum, not a verified official EGE level.
This package must not be reported as fulfillment of every Stage 3B.2 target.

| Subject | Questions before → after | New easy / medium / hard | Ready topics before → after | New code writing |
|---|---:|---:|---:|---:|
| Profile mathematics | 45 → 95 | 8 / 34 / 8 | 7 → 13 | 0 |
| Russian | 35 → 70 | 4 / 31 / 0 | 6 → 10 | 0 |
| Informatics | 36 → 71 | 2 / 30 / 3 | 5 → 8 | 6 |
| Python | 51 → 81 | 3 / 20 / 7 | 13 → 13 | 23 |
| Total | **167 → 317** | **17 / 115 / 18** | **31 → 44** | **29** |

Full-bank difficulty: **146 easy, 153 medium, 18 hard**. All 167 old question
objects, IDs, versions, answers and old taxonomy entities are retained unchanged.
The catalog still contains 67 topics; 23 correctly remain plan pages.

## Coverage and teaching

13 newly opened topics:
* Mathematics: quadratic equations, inequalities, word models, probability and
  statistics, logarithms/exponentials, basic trigonometry.
* Russian: sentence members, prepositions, participles, complex sentences.
* Informatics: graphs, tables, algorithms.

Each has terminology, explanation from basics, worked example, >=2 practice and
>=2 control exercises. Existing prerequisites remain available; both question and
new skill `requires` links use stable IDs. No visual graph or new engine is built.

21 existing-topic supplements: arithmetic, fractions, powers, functions, encoding,
information, logic, spelling, punctuation, parts of speech, text; Python conditions,
loops, strings, lists, dictionaries, functions, sets, tuples, files, types.
`stage3b2-lessons.json` uses the same validated lesson format and safe ContentNode
renderer as Stage 3B.1. Existing interactive trainers are unchanged.

Practice/control allocation extends `study-flow.json`. New conditions were reviewed
by operation/context, not by IDs alone: e.g. mixture vs staged joint work, ordinary
probability vs conditional sample space, shortest route vs spanning-tree proof,
stable filtering vs median/distinct ranking, file round-trip vs numeric processing.
The 35 Russian exercises contain full original context and all answer options.
An ambiguous pronoun reference was replaced during review. Language review is not
an independent philologist's certification; it is ready for external content review.

Existing one-control topics still include py-variables, py-algorithms and py-csv.
Linear equations retain only their three original basic exercises. These need
future independent controls/deeper theory. Missing separate modules include N/NN,
NE/NI, gerunds, speech norms, geometry, sequences, networks, recursion and games.
The UI continues to describe each mini-test as a partial check of specified skills,
not full mastery of a whole topic or an official exam.

## Verification design

* Strict schemas, unique IDs, topic/subtopic/skill links, dependencies and complete
  disjoint allocation are checked by the existing engine; every question now needs
  theory, not just the b1-prefix exercises.
* `scripts/stage3b2-quality.mjs` independently checks **79 mathematical/informatics
  answers**: substitution, bounded integer enumeration, cross-multiplied fractions,
  ordered urn/dice outcomes, path enumeration, exhaustive spanning-tree search,
  truth tables and formula-copy translation. The authored bank stores literal
  answers; the verification is separate from the ignored authoring scripts.
* The same checks run in `check:content` before the normal production build.
* New unit cases cover old-object preservation, 150 reviewed additions, all 44
  allocations, 13 newly opened lessons, draft/old-backup compatibility, frozen old
  sessions and expanded deterministic adaptive selection with no unstudied topics.
* **29 new programs** have 2 visible plus >=3 hidden cases, meaningful boundaries,
  literal expected results and **two specified incorrect algorithms** per task.
  Seven new code-reading predictions also have real execution checks.
* Browser checks use the existing opaque-origin Worker/Pyodide Runner and compare
  actual stdout/return outside it. Expected answers are never sent with the program.
  Local hidden tests are not cryptographically secret. Worker architecture and
  timeouts are unchanged. One existing argument-marshalling defect was fixed:
  nested list/dict arguments now own their PyProxy objects until the call finishes,
  instead of receiving proxies destroyed when iteration over the outer list ends.
  The old scalar checks and all new collection checks must pass with this fix.
* Additional native CPython cross-checks use only authored solutions in isolated
  ignored fixtures; the browser checks are the evidence for the actual PWA runtime.
* Empty stdin means EOF; one empty input line is stored as `\n`. The new test cases
  were corrected to honor this existing contract instead of changing the Runner.

Run is unscored. Practice checking stores training separately. Control freezes the
first answer, including after code correction. Drafts stay keyed by stable IDs.
Schema 2, backup format 2, legacy Stage 2/3A/3A.1 import and 20 MiB limit are unchanged.

File exercises use the temporary virtual Worker filesystem, never phone files.
Their checker validates final stdout; it cannot prove that the student used a file
instead of an equivalent direct algorithm, or that a function left its argument
unchanged. These implementation constraints need manual code inspection. The lesson
states this limit. No file tree/import/upload feature is added.

## Offline size and realistic study use

Comparable local Windows builds: 0.3.4 **14,494,806 offline bytes**, this package
**14,824,137 bytes**, increase **329,331 bytes (~2.27%)**, still 31 resources.
Inventory version: `9ef867f18d8035a95569`. Pyodide and its licences are unchanged.
Existing main-chunk warning remains; the main JS is about 1,010 KB minified. This
does not establish initialization/performance on the actual Samsung device.

The package supports several substantial mixed-topic study sessions. A plan such
as a new lesson, practice/control mathematics and two programming exercises can
occupy roughly 1–2 hours depending on remembered skills; this is a planning estimate,
not measured completion time or a promise that every student gets 2–3 hours. Reading
solutions quickly is very different from solving on paper and writing code.

Frozen snapshots may enlarge future backups; see HISTORY-GROWTH.md. No owner's
progress, personal package, code, backup or browser profile was used. Temporary
reports, PDF reference extraction, profiles, fixtures and builds remain ignored.

## Samsung acceptance checklist and next package

After separate publication approval: update with old error/active mini-test/draft;
restart in airplane mode; open a previously unseen new topic; read long math/Russian
text at 320–390 px and increased font scale; solve on paper; check a new program,
input modes, keyboard, timeout/stop/recovery; full stdout/Back/copy/scroll position;
close/reopen the draft and JSON export/import. Chromium emulation is not Android
acceptance.

Next priority: at least 12 more genuinely multistep hard tasks with adequate theory
and independent controls, then linear equations/inequalities, N/NN/NE/NI and gerunds,
sequences/financial models, richer graph/table/algorithm tasks and sequence-processing
Python. Official numbering and exact EGE alignment require a separate checked mapping.

## Final checks

TypeScript and 102 unit tests pass. 122 browser check groups pass across the existing
regressions, new-bank integration and collection-argument bridge tests. All 29 new
programs pass 189 distinct reference cases on the real Pyodide CPython 3.14.2 runner;
58 specified incorrect algorithms are rejected. Seven new code-reading predictions
also execute correctly. The added routes(1) boundary is explicitly rechecked after
the full initial run. Additional native CPython 3.12.14 checks passed the preceding
188-case set; browser execution is the authority for the shipped runtime.

Old and new backups, rejected/canceled imports, cold offline launch, signed update
waiting/refusal, old active snapshots, drafts, 320–390px layouts, full stdout/Back/
copy/anchor restoration, manual stop/recovery and absence of mandatory external
requests pass. The final local offline inventory has 31 SHA-256-verified resources.

The last data refinements affect conditions/starter signatures/paragraph breaks;
reference solution code and grading inputs are unchanged except the added n=1 case.
All program reference/negative evidence and logs stay in ignored local outputs.
