# WEB-005 — WAVE NEXT IMPLEMENTATION PLAN R1

**Data:** 2026-10-14 (Europe/Warsaw)  
**Autor:** WEB-005-00 — Implementation Lead, podporządkowany globalnemu HQ  
**Wejście:** WEB-004_TO_WEB-005_HANDOFF_R2_2026-10-14.md (Bug Hunting 002; 11 raportów)  
**Tryb:** planowanie implementacji, deduplikacja i wydzielenie paczek  
**Status:** INTAKE ACCEPTED FOR PLANNING / RELEASE NO-GO / NO MERGE / NO PROD  
**Gałąź koordynacyjna:** chore/web-005/t000-wave1-control

## 0. Decyzja i poziomy dowodu

HANDOFF R2 przyjęty do triage, NIE jako runtime certyfikacja. WEB-004 A00 oznaczył konsolidację FINAL SOURCE i **QA CROSS-REPORT COUNTERSIGN PENDING**. Źródłowe liczniki przekazanego końcowego A60: **38 przypadków, 0 PASS, 3 FAIL odnoszące się do zewnętrznego CI, 33 BLOCKED i 2 NOT RUN**; brak wykonywanych przez A60 nowych API/DB/browser reprodukcji. Starsza dostępna macierz A60 R2 obejmuje 29 przypadków i nie zastępuje finalnego 38-wierszowego CSV. Należy zażądać oryginalnej macierzy oraz formalnego podpisu A60 po pełnej rekonsyliacji.

Używane klasy:
- **SOURCE-CONFIRMED:** konkretny brak/rozbieżność w audytowanym drzewie źródłowym; bez domniemania wystąpienia w live.
- **STATIC-INFERRED / HYPOTHESIS:** możliwy skutek wymagający izolowanej reprodukcji; brak automatycznej implementacji.
- **POLICY OPEN:** wybór semantyki użytkowej przez właściciela/HQ; nie wydawać GO dla zmiany zachowania.
- **PATCH PROPOSED:** istnieje zmiana na oddzielnym PR; **nie** znaczy QA PASS lub MERGED.
- **SOURCE-ACCEPTED:** niezależna ocena źródłowa; runtime, PG16, browser i composite SHA nadal odrębne.
- **RUNTIME VERIFIED:** wyłącznie realne testy z poleceniami, exit code, SHA, środowiskiem i wynikiem.
- **WITHDRAWN / MAIN-ONLY:** wycofania lub zmiany już source-mitigated na release; zachować tylko test retencji.

P0/P1 to kolejność prac/warunków wydania, a nie twierdzenie o incydencie na produkcji. Wdrożony SHA pozostaje niezweryfikowany.

## 1. Faktyczna baza GitHub po HANDOFF R2 — recheck 2026-10-14

- main: c50cc48e6fa508592bda3f4838111e9cff5af80c.
- release/tournament-ops-20261013-01: **1fdc401d87c6bffe6bf7312dfc9db681b689dcf7**, bez zmian z nowych paczek.
- PR #32: release→main OPEN, 856 plików, brak merge.
- PR #7: cancel/restore OPEN DRAFT, HEAD 4621fc1580c718b304b5526f74269d6bfe234c9f.
- PR #27: Undo OPEN DRAFT, HEAD 8e5a6e1fc613a0afacca22ac21bf86a38899e034, baza PR #7, nie jest niezależnym patchem.
- PR #33: alternatywny Steam guard OPEN DRAFT, HEAD 79fc25971a53641a704fa052a2b8d937d140fa7d, **HOLD**.
- PR #34: Steam write-auth OPEN DRAFT, HEAD fae2eea2f22df3f1b02ad035a7db00bc411ea73f; source-accepted, HTTP/PG niepotwierdzone.
- PR #35: Pack 19 OPEN DRAFT, HEAD 7cb283aa82273a1e22daf9051a82311eef53760c; Pack19 rzeczywiście PASS na tym SHA, późniejszy Pack20 FAIL w tym przebiegu.
- PR #36: Pack20–26 OPEN DRAFT, HEAD 85ad0b86136fc3491c9ef18663d9b01396179349; testy natywne na tym HEAD NOT_EXECUTED.
- PR #37: proxy trust OPEN DRAFT, HEAD fcfd8a6f5b997c90f2b62f0a3529fa64287a03d7; wymaga Express HTTP/typecheck, niezależnego QA.
- PR #38: offline migration validator OPEN DRAFT, HEAD 2d36864f4d2f1c838073f387fd3c8efb3378c43b; autor zgłosił 37/37 Node PASS, nie wykonywano SQL/PG16; CI PR zatrzymało się na bazowym Pack19.
- **NOWY po audycie: PR #39** — T040-MP1 Cancel/Restore OPEN DRAFT, HEAD **3e0a2dd64d03df5a85b7875af7dc012c796d01b3**, 6 zmienionych plików. Generic PATCH reject 422; dedykowane operacje, opcjonalny expectedRevision, test-first scenariusze. Testy HTTP/PG NIE wykonane; React client nie wygenerowany. Actions #38573071825 FAIL na bazowym Pack19, nie certyfikuje MP1. **Nie tworzyć drugiej implementacji MP1.**

Nie ma żadnego zaakceptowanego composite release SHA, ani zgody produkcyjnej.

## 2. Deduplikacja wszystkich kanonicznych pakietów R2

| R2 / ID | Dowód i polityka | Istniejący właściciel / nowy task | Aktualna decyzja |
|---|---|---|---|
| OPS-01 A50-F008 / A52-F010 — globalne Undo LIFO | SOURCE-CONFIRMED gap; race NOT RUN | **EXISTING T040-A70, MP2** | MP1 #39 nie obejmuje tego; przygotować MP2 po QA MP1; obejmij ścieżkę revert_match i globalną ostatnią akcję pod lockiem |
| OPS-02 A50-F027/F018/F030 — direct Revert CAS, historyczne payload | SOURCE GAP, ABA/runtime NOT RUN | **EXISTING T040-A70, MP2/MP3** | oddzielna request-level CAS, malformed payload 409/4xx zero-write; nie mieszać z MP1 |
| OPS-03 A50-F031/F028, A52-F003/F005 — generic PATCH Cancel/Restore | SOURCE-CONFIRMED, POLICY-CANCEL OPEN | **EXISTING T040-MP1 / PR #39** | IMPLEMENTED PROPOSED, QA/PG blocked; nie reimplementować; przyszły obowiązkowy CAS Host do MP3 |
| LIFE-01 A52-F022/A20-F057 — terminal Swiss | HIGH STATIC, API/DB NOT RUN, POLICY-TERMINAL-SWISS OPEN | **NEW T050-L1, Agent 80; powiązanie T040** | osobny pakiet state-lifecycle; decyzja odmowa lub atomic reopen przed zmianą zachowania |
| LIFE-02 A52-F019/F018 — RR/SE rewind | F019 HIGH STATIC; F018 POLICY-SE-ROUND OPEN | **NEW T050-L2, Agent 80** | RR wcześniej wyeliminowani nie mogą wrócić; SE currentRound wymaga podpisanej semantyki |
| DB-01 A51-F002 — identity/ledger 0030/0031 | SOURCE-CONFIRMED kolizja, applied ledger UNKNOWN | **EXISTING T020/T021-A20 / PR #38** | validator REVIEW_ONLY; runner/DDL HOLD; izolowane PG16, manifest checksum i BEGIN/COMMIT envelope |
| DB-02 A51-F034/F021/F022/F027 — approved output/route parity | SOURCE-CONFIRMED gap, PG NOT RUN | **NEW T060-B1, Agent 90 — Backup V3** | P0: wszystkie QP→QPE→OP, route arrivals, brak cichego continue; fail-closed importer |
| DB-03 A51-F037/F023 — result_history / match / revisions | SOURCE-CONFIRMED cross-record gap, error runtime inferred | **NEW T060-B2, Agent 90** | P0: latest history == completed match, immutable revision policy; koordynacja z T040 |
| DB-04 A51-F020=A50-F026, F032/F036/F035 — snapshot/trigger/legacy | brak spójnego snapshotu SOURCE-CONFIRMED; warunkowe trigger edge | **NEW T060-B3, Agent 90** | P1: MVCC consistent export; PG16 trigger and V2/V3 fixtures; nie mieszać z SQL migrations |
| SPORT-01 BIZ-21-17/19, 18 | Swiss/DE STATIC; RR stageSeed already source-fixed in PR32; POLICY-SWISS/RR/DE OPEN | **NEW T051, Agent 80** | P1: Swiss globally feasible non-rematch; DE GF runner-up; RR 21-18 tylko retest |
| SEC-01 SEC-001=A10-F013 — Steam 3 mutations | SOURCE-CONFIRMED release gap; PR #34 PATCH PROPOSED | **EXISTING T030-A30 / PR #34** | 403/503 policy owner signature, 0 writes/upstream on deny, valid editor & public GET; PR33 HOLD |
| SEC-02 SEC-021/006, SEC-022=UX-030 | auth races SOURCE GAP, cache exploit not proven | **NEW T080-S1 backend + T080-S2 frontend privacy, Agent 100** | P1; concurrency revalidation before writes; private cache cleared after 401/403/logout/rotation; two small PRs, not one monolith |
| SEC-03 SEC-013 proxy | vulnerable dependency/source confirmed, live preconditions unverified | **EXISTING T031-A30 / PR #37** | no duplicate; test XFF spoofing/IPv6/IPv4 mapped and negative config |
| FE-01 UX-047 basket lost update | SOURCE-CONFIRMED absence of CAS, runtime not executed; POLICY-BASKET OPEN | **NEW T055, Agent 110 (frontend+versioned backend contract)** | P1; two editors V0 one success, one 409/412; preserve draft and atomic version |
| FE-02 UX-042/044/045/046 async/drafts | SOURCE GAP/HYPOTHESIS per path; partial withdrawals | **NEW T110, Agent 110** | P1/P2; CSV FileReader A→B, unsaved Host draft, backup preview/new passwords, stale modal; no claim backup overwrites B |
| VIEW-01 A20-F052/055/058/053/054 | STATIC; F054 source-mitigated on PR32 | **NEW T100, Agent 120** | P2 later; frontend/browser E2E, DE Details→Bracket, RR overlay, labels; F054 retest, no duplicate patch |
| CI-01 A40-F074/F075/F077, A11 Pack26, A10 parity | SOURCE CI gaps; no full composite test | **EXISTING T017-A40 / T018-A10 / T130-A60 / T133-A50** | P0 gate; Pack17 full fail-closed, frontend/editor/Animated Effects, API codegen, MIME/version-skew tests |

**Do not create new tickets** for WITHDRAWN A52-F001/F002 and BIZ-21-09/12, main-only A52-F020/F021 or PR32-source-mitigated BIZ-21-16/direct route and BIZ-21-18. Preserve regression checks only. SEC-022/UX-030 and A51-F020/A50-F026 are **one cause each**, not two implementations. Legacy UX/SEC/DB registries beyond listed R2 packages are not an automatic backlog expansion.

## 3. Newly created workstream definitions (do not implement without a lane)

### T050 — Stage Lifecycle & Terminal Reverts — Agent 80 — P0/P1
- **T050-L1 terminal Swiss (P0 acceptance gate):** reproduce Swiss 4/2R; revert last match must return 409/no writes OR reopen match, stage, tournament, winnerId atomically according to POLICY-TERMINAL-SWISS.
- **T050-L2 RR/SE (P1):** 8→4→RR4 reopen leaves previously eliminated P5–P8 untouched; SE4 currentRound either earliest actionable or max generated according to POLICY-SE-ROUND. Existing protective guards for approved qualification/next started stage retained.
- File/ownership preflight: application/matches/revert-match.ts overlaps T040 MP2; Agent80 may design and add isolated tests now but no concurrent edits while A70 owns same file. Separate branch/PR for L1 and L2.
- DoD: policy signed, deterministic PG16 HTTP+history assertions, state/event matrix, no orphaned winners, rollback.

### T051 — Swiss/RR/DE Sporting Semantics — Agent 80 — P1
- Independent logical domain changes from T050. Swiss5/6 full matching, repeat BYE/no_contest policy; DE4/GF Reset champion and runner-up 2–N; RR3 roster seed vs stageSeed regression only, no redundant fix.
- DoD: POLICY-SWISS/RR/DE signed, deterministic seeds and tie-break tests, no non-determinism or behavioral back-compat surprise, independent A60 acceptance.

### T060 — Backup V3 Integrity & Snapshot — Agent 90 — P0
- **B1 Approved output and routing completeness:** full QP/QPE/OP equivalence, route arrivals and source provenance, detect missing refs before clone, reject 400 with zero clone rows.
- **B2 Match/result_history/actionLog:** latest-result equality, revision monotonicity/portable revision policy, payload.matchId equals owning action match, controlled V2 compatibility.
- **B3 Consistent export:** one repeatable-read snapshot for tournament+related tables; stage/version/trigger and legacy v2 compatibility.
- Risk: backup import code may depend on T020 schema and T040 Undo; freeze contract until historical revisions/DDL agreed. Partition B1/B2/B3 into small PRs, no SQL migrations in this task.
- DoD: PG16 SW-01..15 as applicable, synthetic backups only, import/failed import atomicity and zero-write-on-reject, source round-trip count/hash, retention of valid backups.

### T080 — Session Revocation & Private Cache — Agent 100 — P1
- **S1 backend:** SEC-021/SEC-006 race; revalidate actor under lock before support/organizer mutations (including direct bans/game picks) and negative race test. SEC-002/007/008 require separate owner policy for TTL, token digest migration and organizer password rotation; no silent auth contract change.
- **S2 frontend:** SEC-022=UX-030: purge private queries/route UI on logout, 401/403 or version rotation; abort/ignore in-flight old-tenant responses; no false claim of backend data leak.
- DoD: PostgreSQL deterministic auth race + frontend browser/React tests across A→B, 200→403, delayed response, cache empty after logout.

### T055 — Basket Optimistic Concurrency — Agent 110 — P1
- UX-047: prepare atomic versioned PUT compare-and-set, response 409/412 policy, preserve user draft, no silent overwrite by competing editors.
- DoD: two-session V0 fixture, exactly one success; second controlled stale reject with zero writes, frontend conflict message and retained draft.
- Coordinate stage versions, DB/T020, backend T040; keep isolated from frontend T110.

### T110 — Frontend State and Async Safety — Agent 110 — P1/P2
- UX-042 valid late FileReader CSV A→B risk (do NOT restore withdrawn StageBasketsPanel direct navigation claim); UX-044 Host draft Back/Forward; UX-045 backup import creates NEW tournament, protect preview/new passwords; UX-046 stage modal stale state.
- Tests: RTL/component + browser route/navigation, disabled stale writes, draft recovery, privacy partitioning reviewed by T080.
- Split independent PRs; no large one-commit frontend sweep.

### T100 — Presentation and Bracket Views — Agent 120 — P2
- A20-F052/053/055/058 targeted browser/React tests and fixes; F054 only source-retention QA. Wait for T050 state semantics and WEB-006 integrated candidate when interaction requires it.

## 4. EXISTING tasks — adjusted acceptance and next owner

| Task | Owner | Action now | Blocking evidence |
|---|---|---|---|
| T017 Pack17 fail-closed | A40 | Continue bounded patch; enforce no silent skip/false green. Implement only within authorized code-only lane | Pack17 full, FE+Animated Effects, API contract/codegen consistency |
| T018 packaging | A10 | Update conditional P01–P06 with #39; exact SHA, file ownership, tests and rollback | A60 source disposition and SWARM-006 integrated checks |
| T020/T021 migrations | A20 | Maintain R2 ledger plan and PR38 independent QA, PG16 fixture handoff | No source rewrite or DDL without separate owner decision |
| T030 Steam | A30 | Maintain PR34 QA / one 403-503 policy; PR33 duplicate HOLD | Real negative/positive HTTP/PG and no-upstream |
| T031 proxy | A30 | Maintain PR37 QA, target HTTP/typecheck, note active dependency override | Actual spoofing/rate-limit regressions and proxy deployment policy |
| T040 MP1 | A70 | PR39 prepared, QA only, source tests unexecuted; MP3 generated-client parity dependency | PG16 negative/revision tests, OpenAPI→Zod→React parity and Host compatibility |
| T040 MP2/MP3/MP4 | A70 | Global Undo LIFO + direct Revert CAS after MP1 QA and separate scope GO | Q01/Q02, legacy undo, full concurrency matrix |
| T130 independent QA | A60 | Integrate original WEB-004 final 38-case matrix, review #34–#39 by exact SHA | Independent runtime on authorized test env |
| T133 test harness | A50 | Prove disposable PG16, run actual backend/front/CI test suites, machine-readable evidence | Harness unit success is not app PASS |

A40/T017 and A70/T040 are the two currently allocated code-only implementation lanes. Their existing PR/test issues require triage before claiming they are free. **Lane 3 is RESERVED for T060-B1 (P0) only after Agent90's contract and the next explicit coordinator/HQ decision.** T050/T051/T055/T080/T100/T110 remain source-only design/fixtures until slots free.

## 5. Parallel work / dependencies / priority

| Phase | Work that may run concurrently | Gate to next phase |
|---|---|---|
| **NOW — R2 intake** | 00 accept/dedup; A10 conditional package P01–P06; A60 cross-report QA and PR34–39; A50 isolated runner; A20 migrations; A30 security QA; A40 T017; A70 PR39 QA | Exactly pinned sources and independent QA verdict; no new unapproved merge/CI |
| **DESIGN ONLY, parallel** | Agent80 T050/T051 source/tests; Agent90 T060-B1/B2/B3 contract; Agent100 T080 privacy/auth contract; Agent110 T055/T110 source/tests; Agent120 T100 later | Signed POLICIES, file-conflict map, minimal independent PRs |
| **NEXT P0 IMPLEMENTATION** | After release of implementation slot: T060-B1 approved output parity; next T040-MP2 global LIFO/CAS (A70) and T050-L1 terminal Swiss only after policy | Test-first PG16 with snapshot+zero-write, no file-owner overlap |
| **P1** | T060-B2/B3, T050-L2, T051 Swiss/DE, T080-S1/S2, T055 baskets, T110 UX | dependencies and decisions satisfied, max 3 active implementations |
| **P2** | T100 presentation and nonblocking UX | prior lifecycle and security stable |
| **External integration** | SWARM-006 can begin source inventory/branch design and integrate QA-accepted small packets only with separate authorization | 1 immutable composite SHA, full CI/PG16/browser and staged rollback |

**Conflict matrix:** revert-match.ts: T040 MP2 ↔ T050; routes/tournaments.ts: T040 MP1 ↔ T080/T055; backup-v3.ts ↔ T060-B1/B2/B3; pnpm-lock.yaml: T031 ↔ CI/integration; OpenAPI/generated Zod/React: T040 MP1/MP3 ↔ T017/T018. One concurrent writer per affected file; do not rebase multiple large changes without owner review.

## 6. Acceptance matrix for isolated testing

**Isolation prerequisite:** A50 verifies true dedicated PostgreSQL 16 / Node 22 / pnpm 10; explicit test DB/schema allowlist, owner-approved reset scope, no fallback to DATABASE_URL, no shared volumes, no production secrets or backup. Record version, SHA, fixture, command, exit code and pre/post hashes. Missing isolation = BLOCKED, never PASS.

| QA suite | Required fixture / expected result | Responsible |
|---|---|---|
| Q01 Global Undo LIFO | concurrent X then Y under tournament lock; stale X → 409, no change to X/Y; include revert_match branch | T040-A70 + A50/A60 |
| Q02 Direct Revert CAS | R1 complete→revert→R2 complete; stale request R1 ID/revision → 409 and unchanged R2/history | T040-A70 |
| Q03 Cancel/Restore MP1 | PATCH cancel/restore → 422 zero-write; authorized POST audit log 1:1, stale/ABA → 409; PR39 API/Host compatibility | T040-A70 |
| Q04 Terminal Swiss | Swiss4/2R last completed then revert → policy-signed 409/no-write OR complete atomic reopen | T050-A80 |
| Q05 RR/SE | 8→4→RR4 reopen keeps P5–P8 eliminated; SE4 pointer coherent with policy, next stage unchanged | T050-A80 |
| Q06 Sporting | Swiss5/6 no avoidable rematches, correct BYE; RR3 stage seed; DE4 GF reset runner-up | T051-A80 |
| Q07 Backup approvals/routes | SW-03/04/05/08/09/10/15 full QP/QPE/OP and route arrivals; missing/wrong receipt → 400, no clone rows | T060-A90 |
| Q08 Backup result/history | SW-06/07/11 completed match latest history matches, wrong action payload or revision rejected, atomic rollback | T060-A90 + T040 |
| Q09 Backup snapshot/trigger | SW-01/02/12/13 controlled concurrent export repeatable-read; round/policy/version and legacy triggered-stage checks | T060-A90 |
| Q10 Migration | isolated B26/B29/RELEASE/EDITOR/MIXED/DRIFT 0030/31 ledger, checksums, fail-closed; real SQL only after separate approval | T020/T021-A20 |
| Q11 Steam security | all 3 writes × anonymous/viewer/support/organizer vs admin: 403/503 fail-closed 0 DB/upstream; valid admin writes, GET remain public | T030-A30 |
| Q12 Security/privacy | queued-before-lock revoked token refuses late writes; logout/rotation/403 empties old private UI cache | T080-A100 |
| Q13 Basket+UX | dual PUT V0 one success one 409/412, retains draft; FileReader A→B ignored; backup creates new T; Host draft recovery | T055/T110-A110 |
| Q14 CI gates | Pack19–26, Pack17 --full, full frontend, Animated Effects, backend typecheck/build, deterministic codegen | T017/T018/T133 |
| Q15 Release staging | version skew, nested pages+asset MIME, PG ledger, browser smoke, backup+restore/rollback; only composite SHA | SWARM-006 + QA A60 |

Preserve all 38 original A60 cases as separately indexed evidence. Q01–Q15 are grouped **requirements**, not 15 executed tests, and not a substitute for 38 source rows.

## 7. Formal packet contract for SWARM-006

**WEB-005 produces individually testable patches and proof, NOT the integrated release.**

Each packet needs:
- Packet ID and finding IDs; status SOURCE_READY / SOURCE_ACCEPTED / QA_ACCEPTED / RUNTIME_VERIFIED / BLOCKED.
- Exact repository/base/head SHA, immutable file manifest (path + Git blob SHA and/or SHA-256), author, dependency chain and conflict matrix.
- Code diff + contracts + test commands, environment/fixture, exit code/evidence, negative tests, remaining blockers, rollback plan, policy approval IDs.
- Clear DO_NOT_MERGE/DB_BLOCKED/OWNER_APPROVAL_REQUIRED flags as relevant.
- Responsible A60 reviewer and date of independent verdict. Never fabricate approval or checksum.

**Existing integration candidates (not automatically mergeable):**
- P01 PR #35 — Pack19, SHA 7cb283aa…, scoped CI Pack19 PASS.
- P02 PR #36 — Pack20–26, SHA 85ad0b86…, source-reviewed, native full tests pending.
- P03 PR #34 — Steam Auth, SHA fae2eea2…, source-reviewed, HTTP/PG pending; PR33 stays HOLD.
- P04 PR #37 — Proxy CIDR/addr, SHA fcfd8a6f…, QA and HTTP/typecheck pending.
- P05 PR #38 — Offline ledger validator, SHA 2d36864f…, 37/37 author-local Node; DB runner authorization NOT INCLUDED.
- **P06 PR #39 — Cancel/Restore MP1, SHA 3e0a2dd6…, source/PG and generated React parity pending.**
- P07 **T017 Pack17**: only when separate patch/PR exists; not yet source-ready.
- P08+ **T060/T050/T051/T080/T055/T110/T100**: future packets only when corresponding code, tests and approvals exist.

**SWARM-006 acceptance:** pin and assemble accepted packets in an authorized isolated integration branch; resolve conflicts without secretly redesigning feature logic; run full integrated suite and stage/browser/PG gates on one SHA; report rollback and quality gate to HQ. If integration reveals a substantive code defect, return a scoped ticket to WEB-005. No deployment without owner/HQ authorization.

**SWARM-007 responsibility:** design the exchange protocol and create Google Drive folder structure for reports/manifests/evidence/handoffs, including naming, retention, permissions, versioning and receipt mechanism. WEB-005 supplies metadata only; this document **does not claim** any Drive folder or inter-thread transfer already exists. Code remains GitHub source-of-truth, Drive stores versioned documents as defined by SWARM-007.

## 8. POLICY OPEN / owner decisions

| Decision | Must be signed before | Invariant |
|---|---|---|
| POLICY-SWISS: rematches vs score pairing, BYE/no_contest history | T051 code | deterministic non-rematch when required and feasible |
| POLICY-RR: stageSeed and tie-breaks | T051 ranking effect | same champion/advancement rule |
| POLICY-DE: 3–N LB placement / GF reset | T051 DE logic | GF final loser is runner-up |
| POLICY-TERMINAL-SWISS: deny or atomic reopen | T050-L1 behavioral code | never completed tournament with required pending match |
| POLICY-SE-ROUND: actionable vs max generated currentRound | T050-L2 code | API/UI coherent |
| POLICY-CANCEL: CAS vs unconditional current-state command | T040 MP2/MP3 and Host client | no silent stale intent |
| POLICY-BASKET: stale PUT 409/412 vs explicit override | T055 code | no invisible lost update |
| POLICY-STEAM: 503 missing secret vs 403 | PR34 runtime acceptance | fail-closed and no upstream writes |
| POLICY-BACKUP: portable revisions, tokens/receipts/presentation settings | T060-B2/B3 code | cannot import contradictory or exposed secrets |
| POLICY-CACHE: immediate private UI clear after logout/403/rotation | T080-S2 code | old private data not displayed |

No silent defaults for contested business semantics. In absence of policy, design/reproduction may proceed; behavioral code stays HOLD.

## 9. Closeout / NO-GO and required next actions

**Current RELEASE: NO-GO.** Causes: no single composite SHA; full Pack19–26/17, actual API/PG16/browser not verified; PR #39 generated-client parity incomplete; schema ledger historical ambiguity; A60 final countersign pending; several product policies open; all candidate PRs unmerged.

Next actions:
1. **00:** publish this plan, synchronize BACKLOG/DECISIONS, assign source-only T050/T051/T060/T080/T055/T110/T100, preserve two active implementation lanes and reserve third.
2. **A60:** accept exact PR #34–#39 sources, request WEB-004 A60 final 38-row CSV and cross-report countersign; make evidence-based STATUS matrix (not expected PASS).
3. **A50:** produce actual isolated runner/PG16/browser output; if no runtime, record BLOCKED and executable scripts.
4. **A70:** PR39 MP1 source/testing handoff; then request scoped GO for global Undo LIFO/direct Revert CAS; not a wholesale #7/#27 port.
5. **A40:** finish T017 narrow fail-closed patch, do not weaken skip detection.
6. **A20/A30:** PR38/PR37 existing QA closure, no duplicate features.
7. **A10:** update P01–P06 conditional manifest and handoff metadata to SWARM-006 / SWARM-007.
8. **Agent90 (proposed):** begin T060-B1 design, data schema/map and PG16 negative test-first fixtures; request explicit slot/GO before implementation.
9. **Agent80 (proposed):** T050-L1 + T051 policies and independent reproduction designs; no overlapping revert-match edits.
10. **Owner/HQ:** decide required policies and authorize test infrastructure, any paid CI, integration and later production through their respective boundaries.

## 10. Evidence inventory

- PRIMARY: WEB-004_TO_WEB-005_HANDOFF_R2_2026-10-14.md (A00, FINAL SOURCE CONSOLIDATION; countersign pending).
- QA: WEB-004_A60_FINAL_ACCEPTANCE_MATRIX_R2.csv — **referenced by primary but actual bytes not independently supplied in this turn**. A60's older WEB-004_A60_INDEPENDENT_QA_ACCEPTANCE_MATRIX_R2.md is a 29-case provisional earlier matrix; do not replace final 38-row counts with it.
- SPECIALIST: WEB-004_A10/A11/A20/A21/A30/A40/A50/A51/A52/A60/A80_FINAL_*_R2.md (source index in primary).
- Current public references: https://github.com/C8LyNn/aplikacja-turnieje/pulls ; PRs #7,#27,#32,#33,#34,#35,#36,#37,#38,#39.
- Active WEB-005 records: docs/web-005/BACKLOG.md and docs/web-005/DECISIONS.md on chore/web-005/t000-wave1-control.
- 00 does not self-certify runtime, register approvals on behalf of A60, or grant SWARM-006 production authority.

**Signed for planning:** WEB-005-00 — R2 INTAKE RECONCILED / NEXT WAVE PLAN R1 / SOURCE-ONLY DISPATCH PERMITTED / PRODUCTION NO-GO.


## ADDENDUM R1A — repository drift recheck before WAVE R8 dispatch (2026-10-14)

The original plan remains the R2 intake baseline. **These later checks supersede stale SHA/status claims**:

- **T017 NEW PR #40:** [#40](https://github.com/C8LyNn/aplikacja-turnieje/pull/40), HEAD \`f9ad033683d93e442c7915a840e7b3f8bfdbb933\`, OPEN DRAFT, three Pack17-only files. Author reports real isolated synthetic \`gate-contract.test.mjs\` **19/19 PASS**, but \`--full\` actual repository/PG16 **NOT_EXECUTED**, no Actions on HEAD and A60 independent QA pending. Treat T017 as **PATCH PROPOSED / QA**, not as an unimplemented task; do not start second Pack17 patch.
- **T040 MP1 PR #39 advanced:** [#39](https://github.com/C8LyNn/aplikacja-turnieje/pull/39), HEAD \`16053ee132756ca05b6f2cd1f0cabae823905387\`, OPEN DRAFT, eight source/API/Zod/test files. PostgreSQL/HTTP typecheck and generated React client parity **NOT_VERIFIED**, historical CI stopped at baseline Pack19. Do not reopen MP1 implementation; A70 supports QA and designs MP2 global LIFO + direct Revert CAS separately.
- **P07** is now the **conditional source candidate PR #40** instead of a purely future unspecified patch. Source-only manifests P01–P07 can be prepared by A10; all independent QA and integrated gates remain explicit.
- **Concurrency**: T017 and T040 MP1 patches have been written; whether implementation lanes are actually released depends on A60 and A00 closeout. Source-only tasks T050/T051/T060/T080/T055/T110/T100 may start; no new implementation from their agents without an explicit slot assignment and approval.
- **Documentation owner**: SWARM-007 defines Drive file paths, naming and acceptance receipts. This addendum does not assert any Drive folders or transfers exist.

The owner-approved product policy decisions, no production/SQL/merge/paid CI, and composite SHA release NO-GO conditions remain unchanged.
