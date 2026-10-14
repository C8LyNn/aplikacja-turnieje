# WEB-005 — WAVE R16 — CENTRALNY DOKUMENT PROMPTÓW (13 AGENTÓW)

**Wersja:** R16.1 · 2026-10-14 · Europe/Warsaw  
**Rój / zarządzanie:** WEB-005; A00 = Implementation Lead, podporządkowany jedynej globalnej Queen/HQ. A00 **nie** jest Queen.  
**Repo:** \`C8LyNn/aplikacja-turnieje\`  
**Gałąź dokumentów:** \`chore/web-005/t000-wave1-control\`  
**Źródła:** WEB-004 final HANDOFF R2; WEB-005 \`BACKLOG.md\`, \`DECISIONS.md\`, \`WEB-005_WAVE_R15_AGENT_PROMPTS.md\`; **pierwotne, opublikowane na GitHubie** R15 raporty [A50](./agent-reports/A50/WEB-005_A50_R15_RECEIPT.md), [A60](./agent-reports/A60/WEB-005_A60_R15_INDEPENDENT_QA.md) + [jego macierz](./agent-reports/A60/WEB-005_A60_R15_PACKAGE_MATRIX.json), [A10](./agent-reports/A10/WEB-005_A10_R15_HANDOFF.md), raporty A20/A30/A40/A70/A80/A90/A100/A110/A120.  
**Stan:** R15 zakończona na poziomie agentów; WEB-005 NIE jest formalnie zakończony; 21 draft PR #34–54; 4 niezamyka się w pełni źródłowo; realna QA aplikacyjna **0** dla bieżących indywidualnych SHA; **SWARM-006 HOLD / RELEASE NO-GO**.

**Ważna korekta R15:** A50 i A60 raporty R14/R15 są już opublikowane i bezpośrednio dostępne. Nie przydzielaj ponownego zadania "szukania raportów"; dalsze zadania powinny wykorzystać ich ustalenia. A50 15 wykonanych komend kontrolno-środowiskowych ≠ testy aplikacji. A60 ma 17 source-scope verdicts (w tym conditional/offline) i 4 full-claim source blockers **P08/PR41, P09/PR42, P20/PR53, P21/PR54**. Jest to niezależne QA źródeł, **nie** akceptacja finalnego wydania.

## §0 — Wspólne zasady, GO/STOP i evidence

1. **Każdy agent** czyta §0–§2, potem wyłącznie własną sekcję \`AGENT Axx\` zgodną z tożsamością przypisaną do wątku. Nie przejmuje cudzych zadań ani nie uruchamia innych wątków. Odczyt pliku centralnego nie nadaje dodatkowych uprawnień.
2. **Recheck GitHub live**: każdy PR HEAD/base/diff/test/ci może zmienić się po publikacji. Tabela §1 to snapshot. Raport i SHA muszą się zgadzać z aktualnym PR; source verdict A60 na starym SHA po zmianie kodu nie obowiązuje automatycznie.
3. **Trzy wąskie R16 GO SOURCE-CODE ONLY, test-first, na własnych istniejących draft PR branches:**
   - **L1 A90** poprawia **P08 PR41** QP/QPE/OP \`sourceBasketPosition\` parity, wyłącznie ścieżkę walidacji istniejącego B1.
   - **L2 A70** poprawia **P09 PR42** global LIFO także dla \`delete_player/restore_player\`, pod tą samą transakcyjną blokadą.
   - **L3 A100** poprawia **P20 PR53** niekanoniczne prywatne query keys + kompatybilność \`AuthProvider\` test provider w ograniczonym S2B.
   **GO dotyczy wyłącznie małych zmian na OWN istniejących draft PR branches i testów; nie tworzyć kolejnych PR, nie integrować innych PR, nie resetować bazy.** Jeśli bezpieczna naprawa wymaga nowego API/polityki, globalnego cache purge, nieprzypisanego pliku, niezatwierdzonej bazy lub większego redesignu → HOLD konkretną część, raportuj A00. Nie ma czwartego code lane.
4. **P21 PR54** pozostaje **SOURCE-ONLY / TEST CONTRACT** u A120: pokazać osobny test mixed historical RR 403 + legal overview/DE i wąski przyszły fix; nie edytować PR54 w R16. Bez przetestowania ograniczonej propozycji nie zakładaj, że źródłowa inferencja dowodzi runtime regresji.
5. **Testy source-only nie wystarczą do finalnego QA.** \`PATCH_PROPOSED\` (PR istnieje), \`SOURCE_ACCEPTED\` (A60 niezależne na dokładnym HEAD), \`RUNTIME_VERIFIED\` (faktycznie wykonany command/env/exit na exact SHA), \`FAIL\`, \`NOT_EXECUTED\`, \`BLOCKED\`, \`POLICY_OPEN\`, \`WITHDRAWN\` są osobnymi stanami. Autor nie samocertyfikuje. Test-first oznacza przygotowanie testu przed poprawką, lecz **bez jego wykonania brak RED/GREEN dowodu**.
6. **A50 P0 — konieczne realne środowisko:** według własnego R15 ma Linux+Node v22.16.0+Git 2.47.3, ale brak **checkoutu repo, pnpm, Docker, psql, pwsh i fizycznej izolowanej bazy PG16**. 15 preflight/launcher subprocess calls (8×exit0, 2×2, 4×127, 1×128) to **zero app tests**. A50 nie wykonuje kolejnego ogólnego harnessu; otrzymuje konkretny plan owner-provided PC/VM/full checkout i uprawnienia. Bez środowiska przygotowuje bezpieczny \`EXTERNAL_EXECUTOR_READY\` kit i oznacza \`BLOCKED\`.
7. **PG16:** wyłącznie odizolowana fizycznie i jednoznacznie oznaczona testowa baza PostgreSQL16; \`TEST_DATABASE_URL\` bez fallback do produkcyjnego/shared \`DATABASE_URL\`, \`tm_test_*\` reset tylko ze **zgodą owner/HQ na dokładny zakres DROP/RESET**, nie-supersuser rola i A20/A50 preflight. **Sam dokument R16 nie jest zgodą na destrukcyjny reset**. Brak warunków => NOT_EXECUTED, zero SQL adoption/DDL/real migration. Frontend RTL/typecheck można wykonać bez PG, gdy pełny checkout/deps i zgoda środowiskowa są dostępne.
8. **Pack19 ci historyczne:** standalone drafty bazują na release ze starym regex \`readOnly:true\` vs real Drizzle \`accessMode:"read only"\`. Już istnieje PR35 matcher fix, PR36 Pack20–26, PR40 Pack17. Automatyczny CI może FAIL na upstream zanim uruchomi feature tests. Nie duplikuj PR35, nie traktuj FAIL Pack19 jako testu nowej funkcjonalności, nie wykonuj żadnego własnego cross-PR merge/cherry-pick/composite branch.
9. **Hard STOP:** zakaz scalania do main/release, rebase innych agentów, integracji, produkcyjnej SQL, shared DB reset, staging/live, Replit integrator, płatnego rerun GitHub Actions bez zgody, sekretów w logach, backupów użytkowników, samodzielnego podpisania A60 acceptance, background work i cross-swarm dispatch.
10. **Product POLICY_OPEN:** Basket T055 optimistic CAS 409 vs 412/ETag/token/legacy; terminal Swiss TS-A 409 vs TS-B atomic reopen; SE currentRound actionable/generated; Swiss5/6 BYE/NC/rematches; DE GF runner-up and ranking; Backup B2 legacy/revisions/result_history/action log; public Direct Revert request CAS+active completion action ID/Host; Steam absent secret 403/503; auth TTL/rotation/digest. Te zachowania nadal wymagają owner/HQ i nie mogą zostać przyjęte przez agenta jako domyślne.
11. **Cross-swarm:** WEB-004 nie przygotowuje nowych raportów. WEB-005 kończy zatwierdzony zakres HANDOFF R2 i dopiero po formalnym \`WEB005_FINAL_CLOSEOUT\` może przekazać JEDEN końcowy zestaw paczek do SWARM-006 za zgodą owner/HQ. SWARM-006 później odpowiada za integrację, testy **composite SHA**, staging/live. SWARM-007 rozwija osobno wymianę informacji/Google Drive. **Nie inicjuj SWARM-006 w R16.**
12. **Artefakty:** końcowy \`WEB-005_Axx_R16_HANDOFF.md\` na \`docs/web-005/agent-reports/Axx/\` centralnej gałęzi lub własnej gałęzi dokumentacyjnej z bezpośrednim URL i SHA. Zawiera PR/base/HEAD, zmienione pliki, testy RUN command/exit i NOT_EXECUTED, independent A60 verdict, konflikty/polityki, next action, GO/STOP. Nie edytuj wspólnego pliku promptów po rozesłaniu; A00 otrzymuje link.

## §1 — R15 baseline, pakiety, QA z oryginału A60

Release source baseline \`release/tournament-ops-20261013-01\` @ \`1fdc401d87c6bffe6bf7312dfc9db681b689dcf7\`. Wszystkie 21 draft PR poniżej otwarte, niescalone na punkcie kontrolnym 2026-10-14.

| Packet | PR | HEAD SHA | A60 R15 źródłowo |
|---|---|---|---|
| P01 | #35 | \`7cb283aa82273a1e22daf9051a82311eef53760c\` | SOURCE_ACCEPTED scoped Pack19 |
| P02 | #36 | \`85ad0b86136fc3491c9ef18663d9b01396179349\` | SOURCE_ACCEPTED scoped Pack20–26 |
| P03 | #34 | \`fae2eea2f22df3f1b02ad035a7db00bc411ea73f\` | CONDITIONAL |
| P04 | #37 | \`fcfd8a6f5b997c90f2b62f0a3529fa64287a03d7\` | CONDITIONAL |
| P05 | #38 | \`2d36864f4d2f1c838073f387fd3c8efb3378c43b\` | OFFLINE_ONLY, no SQL GO |
| P06 | #39 | \`16053ee132756ca05b6f2cd1f0cabae823905387\` | CONDITIONAL |
| P07 | #40 | \`9a8287271299a59fc9291b8d253299a8d109a35d\` | SOURCE_ACCEPTED scoped synthetic; full gate not done |
| **P08** | **#41** | \`e847cb705296a48ab5c68ece96776cd0e0bbb417\` | **SOURCE_BLOCKED_FULL_QP_QPE_OP_PARITY** |
| **P09** | **#42** | \`1ae0ccb801f4177052bff1ec7041e55b8c992c8b\` | **SOURCE_BLOCKED_GLOBAL_UNDO_LIFO** |
| P10 | #43 | \`96a6068f69027574ac76e18d4d5a2c444b5a914a\` | CONDITIONAL |
| P11 | #44 | \`2f0187b7242681c394c09058b5ef647667206bd6\` | CONDITIONAL |
| P12 | #45 | \`a7a87bc019731191dbfa44bee6939e3fa25e27f4\` | CONDITIONAL |
| P13 | #46 | \`7f60849e389a7ed35fdd39dd5493c4c4c267d860\` | CONDITIONAL |
| P14 | #47 | \`f09a13623faca8d7ab29b09a2c5b43907c2acd0b\` | CONDITIONAL |
| P15 | #48 | \`2a8a4c72cb4a3a37402a346fd0acc83b03b39be3\` | CONDITIONAL |
| P16 | #49 | \`99298b81501c3e7764d653604923522a19b9f05c\` | CONDITIONAL |
| P17 | #50 | \`5457a74187edc263730c3a4b25a663bdf5531ee9\` | CONDITIONAL |
| P18 | #51 | \`2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a\` | CONDITIONAL |
| P19 | #52 | \`cce73ec47445102b216b3f8eceb4ec9de67eb1a7\` | CONDITIONAL |
| **P20** | **#53** | \`6a8f0c3e5775eb056df75ebdd7b33df7cbc78979\` | **SOURCE_FAIL_FULL_PRIVACY_SCOPE / URL PREFIX only accepted** |
| **P21** | **#54** | \`dbba0eb82920b4f324866b1b983e1211459f52ec\` | **SOURCE_BLOCKED_HISTORICAL_RR_403_UI_SCOPE / refresh only accepted** |

**Final release QA still 0/21 accepted.** Current original A60 [signed matrix](./agent-reports/A60/WEB-005_A60_R15_INDEPENDENT_QA.md): 17 narrow/conditional/offline accepted source portions; 4 broad-claim source blocked. No present exact-SHA A50 app runtime test receipts, no integrated SHA. Scoped A60 PR40 pure Node 24/24 unit contract historical result is not a Pack17 \`--full\` PASS.

**Source-confirmed counterexamples — fix exactly these:**
- P08: \`validateBackupV3FlowIntegrity\` validates player, finalRank/basket but omits strict QP/QPE/OP \`sourceBasketPosition\` parity (A60 file blob \`cfe3d87bbb412e6878c872ffc003b7583fb53b57\`). Existing B1 tests positive/corrupt, real PG not done.
- P09: PR42 \`routes/tournaments.ts\` for roster Undo \`delete_player/restore_player\` calls \`undoTournamentRosterAction\` without global locked latest-action LIFO guard, even though generic/revert_match branches now have it (blob \`a0473fed687932a26275f2bef14864d196ed3bb7\`).
- P20: PR53 URL-prefix cache eviction doesn't include keys \`["tournaments",id,"player-bans"]\` and \`["matches",matchId,"game-picks"]\`; match-only key needs trustable match→tournament ownership. Existing \`use-tournament-auth.test.tsx\` mounts \`AuthProvider\` without the new required \`QueryClientProvider\`; fixture runtime FAIL not executed.
- P21: PR54 \`RoundRobinReadbackBridge\` wraps entire TournamentDetail tabs and its historical RR stage-details denied 401/403 full-replacement alert may hide lawful Overview/DE tabs; mixed historical RR→DE browser test not executed.

**Dependency DAG (do not merge here):** PR39/42/44/46/51 share \`routes/tournaments.ts\`; PR41/48 share \`backup-v3.ts\`; PR43/50/54 share \`tournament-detail.tsx\`; PR53 private cache interacts with PR54 401/403; CI PR35→PR36→PR40 full gate. A10 owns conflict map and eventual final-packet metadata.

## §2 — Właściciele i tryb wykonania R16

| Agent | Zadanie | Mode |
|---|---|---|
| A00 | R15 closure, 3 narrow GO, test environment owner action, decisions, backlog | COORDINATION |
| A10 | P01–P21 SHA+receipts update; QA gates and dependency/rollback | DOCS READ ONLY |
| A20 | isolation-ready PG16 catalog/preflight for A50 and migration ledger | READ ONLY |
| A30 | independent security peer PR53 S2B + PR44/46/49 | READ ONLY |
| A40 | Pack19/Pack17 real gate constraints and source checks | READ ONLY |
| A50 | **P0** true frontend/PG16 application tests OR owner-executor packet | SAFE TESTS |
| A60 | **P0** independent review 3 changing heads and P21 contract; report SHA | STRICT READ ONLY |
| **A70** | P09 PR42 global roster Undo LIFO patch | **GO SOURCE-CODE L2** |
| A80 | PR45 sport QA and signed Swiss/SE/DE policies; no code | SOURCE ONLY |
| **A90** | P08 PR41 QP/QPE/OP basket-position parity patch | **GO SOURCE-CODE L1** |
| **A100** | P20 PR53 scoped privacy cache S2B patch | **GO SOURCE-CODE L3** |
| A110 | T055 Basket CAS signed owner packet & frontend QA | SOURCE ONLY |
| A120 | P21 PR54 mixed RR→DE 403 repro/patch-ready spec | SOURCE ONLY |

**File exclusivity:** A70 may update own \`fix/web-005/t040-mp2a-global-undo-lifo-r9\` branch only, \`routes/tournaments.ts\` + targeted tests; A90 own \`fix/web-005/t060-b1-backup-v3-integrity-r9\` only, backup validation/tests; A100 own \`fix/web-005/t080-s2a-private-auth-query-cache-r13\` only, auth/context/query-invalidation/deadlock keys and provider tests. **No concurrent overlapping files among L1/L2/L3.** A80/A120/A110 and other agents are source-only. No cherry-pick from one PR into another, no composite branch, no merge to release.

---

## AGENT A00 — Implementation Lead / R16

**TASK:** \`WEB-005-T000-A00-R16\` | MODE: COORD / OWNER GO.

1. Verify R15 original A50/A60 reports are directly available (paths above); summarize: **0 native tests**, R15 A60 17 conditional/limited and 4 broad claim blockers. Stop repeated searches for previously missing receipts.
2. Send **GO SOURCE-CODE ONLY** R16 to A90 PR41 (QP/QPE/OP sourceBasketPosition), A70 PR42 (global roster LIFO), A100 PR53 (noncanonical privacy cache; fixture). Constrain each to its existing separate draft PR branch, precise files and regression tests; require A60 new-source-head review after commits. No fourth code lane.
3. Prioritize A50 external executor: provide owner a **single actionable action** for trusted Windows PC/approved VM checkout+pnpm and test-only PG16, record explicit owner approval to run. Avoid spending another wave generating only abstract tooling or interpreting plan harness as runtime test. Do not self-authorize destructive PG reset.
4. Coordinate A120 P21/PR54 source-only mixed RR historical 403 regression and remediation design. Future code GO only after a free lane and revised A60 triage, not in R16.
5. Maintain \`finding→ticket→package PR/current SHA→source A60→runtime A50→policy signature→disposition\` for full WEB-004 handoff. Do NOT mark package accepted just because author updated PR or reviewer accepted a smaller subset.
6. Owner/HQ decision queue from A70 MP2B, A80 Swiss/sport, A90 B2, A110 Basket. Collect signed choices or list exact pending; no silent default.
7. Maintain A10 internal manifest/final-only transfer; no SWARM-006 activation or integration release.

**DELIVERABLE:** \`WEB-005_A00_R16_COORDINATION_AND_GO.md\`, exact A50 env unblock request and updated backlog. STOP merge/prod/SQL/dispatch.

## AGENT A10 — Package registry & Evidence

**TASK:** \`WEB-005-T018-A10-R11\` | MODE: DOCS ONLY.

1. Read A10 R15 [receipt index](./agent-reports/A10/WEB-005_A10_R15_QA_RECEIPT_INDEX.md) and [manifest](./agent-reports/A10/WEB-005_A10_R15_PACKAGE_MANIFEST.json), and A60 R15 original signed matrix URL. Replace R15 placeholder/null \`a60_source_verdict_url\` **only after** direct verified A60 URL and SHA match; preserve actual narrow verdicts.
2. Recheck all 21 PR HEAD SHA; update changed-file digests/metadata only on changed P08/P09/P20 (or others if externally changed). Retain unchanged accurate receipts.
3. For each changed PR record new \`PATCH_REVISED\`, source acceptance reset to PENDING until new A60 verdict, tests EXECUTED vs NOT_EXECUTED and owner policy scope. Do not assign full QA acceptance.
4. P21 PR54 remains separate source blocker; no P22+ until real new PR appears. Provide file/path ownership and eventual SWARM-006 collision DAG, NOT executed.
5. Record A50 safe-runner access blocker and owner action to be executed externally; verify actual receipts only if A50 provides command+exit+SHA.
6. Prepare immutable consolidated internal registry for future final-only handoff; no upload/send to SWARM-006, no Drive custody assertion.

**DELIVERABLE:** \`WEB-005_A10_R16_INTERNAL_SHA_QA_INDEX.md\` + manifest. STOP merge/distribute.

## AGENT A20 — PostgreSQL16 & ledger safety preflight

**TASK:** \`WEB-005-T021-A20-R11\` | MODE: SOURCE ONLY.

1. Recheck PR38 existing offline ledger validator and migrating 0030/0031 conflict; \`REVIEW_ONLY\`, \`ready_for_sql:false\`, no new migration.
2. On behalf of A50 produce **minimal nonmutating** host/database identity preflight for an owner-provided **dedicated disposable** PG16 container/VM. Explicit setup approval and reset scope must come from owner/HQ; don't assume user PC access.
3. Target PR41 position parity and PR42 roster LIFO deterministic PG negatives, plus PR39/44/45/46/48/49/51, with test-only fixtures and root schema list; no production queries.
4. Provide PowerShell/Docker and Node22/pnpm10 prerequisites to owner, exact safe STOP on wrong host/schema/credentials. Do not assert infrastructure was configured.
5. Pass to A50/A60 ready command/provenance matrix, no execution claims.

**DELIVERABLE:** \`WEB-005_A20_R16_PG16_PREFLIGHT.md\`. STOP SQL DDL/migration/prod.

## AGENT A30 — Independent security peer for P20

**TASK:** \`WEB-005-T030-T031-A30-R14\` | MODE: READ ONLY.

1. Read original A30 R15 source matrix and independent A60 PR53 source FAIL. Review A100 R16 new PR53 HEAD only if changed; validate scoped query ownership for player bans and match game picks using trusted match→tournament mapping; no global purging B unrelated query.
2. Security cases: organizer/support/viewer logout or credential replacement, denied 403, in-flight unabortable private A result, public B remains, valid positive auth unaffected. Distinguish cache privacy from backend GET auth bypass (not proven).
3. Check QueryClientProvider test fixture issue and any use of query meta/typed keys; no token leakage or changed TTL policy.
4. Recheck source boundaries of PR44/46/49 and Steam PR34/proxy PR37 only to verify independent regressions, no broad redo.
5. Provide A60 separate peer signoff or source blockers on exact changed SHA, and A50 test-only cases.

**DELIVERABLE:** \`WEB-005_A30_R16_S2B_PEER.md\`. STOP code.

## AGENT A40 — CI Pack19, Pack17 blocker contract

**TASK:** \`WEB-005-T010-T017-A40-R16\` | MODE: SOURCE ONLY.

1. Review original A40 R15 exact executable frontend test commands + existing PR35 Pack19 source contract and PR36 Pack20–26; don't rewrite old fixes.
2. Give A50 one minimal approved per-SHA RTL/typecheck command example that does NOT invoke prior failing Pack19 full workflow, without falsely waiving eventual composite full suite.
3. R15 A40 flags \`T017-QA-01\` adversarial TAP parser accepting forged PASS counters or negative \`not ok\` line; identify exact source parser/test and propose smallest future fix, **not** code in R16, and seek A60 independent verdict.
4. Track PR40 Pack17 synthetic scoped 24/24 PASS separate from real \`--full\` requiring PG16/API/frontend. No paid CI or manual rerun.
5. Escalate only new real CI failure with logs and SHA to A00.

**DELIVERABLE:** \`WEB-005_A40_R16_CI_READINESS.md\`. STOP code/merge.

## AGENT A50 — First actual frontend/PG16 execution, or exact owner blocker

**TASK:** \`WEB-005-T133-A50-R11\` | MODE: SAFE TEST EXECUTION.

1. Read already published [R15 receipt](./agent-reports/A50/WEB-005_A50_R15_RECEIPT.md) and direct executor/runbook branch; don't waste R16 on identical PLAN-mode calls. State actual accessible shell/PC mechanism, full checkout, pnpm, and PG16 at first action; cannot simply assume access to user's Windows machine.
2. If authorized **real repo checkout+pnpm** becomes available, run frontend-only tests **PR53 existing use-tournament-auth.test.tsx first**, then PR53 dedicated cache (existing + S2B new cases), PR54 historical RR deny, PR52 stage modal, PR43 CSV, PR47 DE, PR50 Backup preview, each own exact SHA. Record TAP, exit, skipped, versions, branch/shas, logs with no secrets.
3. If approved dedicated PG16 host/database and A20 preflight/owner reset consent, run **PR41** B1 position parity positive+malformed/zero-clone and **PR42** roster action latest Undo 409 zero-write, then PR39/44/45/46/48/49/51 targeted suites. No shared/prod DB. \`--full\` only after all prerequisites, not self-integration.
4. If lacking execution capability, give **one actionable owner request** for granting trusted PC/VM connector/shell plus clean per-SHA clone, Node22/pnpm10 install, and isolated test PG16 with explicit reset gate. No more generic 6-PR launcher plan claiming tests.
5. Ensure A100/A70/A90 new PR-heads get their own **new** test receipts after commits; prepatch evidence never carries over automatically.
6. Submit direct GitHub results URL, exact commands/exit or \`ENV_BLOCKED\` and missing concrete owner action to A00/A60/A10.

**DELIVERABLE:** \`WEB-005_A50_R16_RUNTIME_OR_OWNER_BLOCKER.md\` + machine matrix. STOP unsafe/reset/prod/paid CI.

## AGENT A60 — Independent re-verification of revised 3 heads and P21

**TASK:** \`WEB-005-T130-A60-R16\` | MODE: STRICT READ-ONLY INDEPENDENT QA.

1. Use original [R15 full report](./agent-reports/A60/WEB-005_A60_R15_INDEPENDENT_QA.md) and matrix as baseline. No need to re-review 17 unchanged heads. Track new P08, P09, P20 commits exactly, recheck diff and author-owned tests; verdict on old SHA void only for changed portion.
2. **PR41**: sourceBasketPosition parity across QP→QPE→OP+routes; positive legal legacy V3 still succeeds, corrupted position fails 400/zero cloned rows; real PG16 still pending without A50.
3. **PR42**: action_log global latest LIFO lock covers \`delete_player/restore_player\` and generic+revert_match, stale X vs newer Y 409 zero-write; preserve positive newest Undo and tournament lock order.
4. **PR53**: exact tournament scoped noncanonical keys; match-owned picks verified, no unrelated public B cache purge; QueryClientProvider fixture compatible; no stale protected A after logout/401/403; frontend runtime test evidence still required.
5. **PR54 source-only**: mixed RR historical denied detail cannot block valid DE/Overview other tabs; A120 fixture/plan, no source acceptance full until fixed or valid independent evidence.
6. Reconcile A40 T017-QA-01 adversarial TAP parser separately, classify source risk and required later code-go only if genuine, not duplicate P07.
7. Sign **SOURCE_ACCEPTED / SOURCE_BLOCKED / CONDITIONALLY ACCEPTED** on current exact heads, separately map actual A50 runtime receipts. Preserve WEB-004 original 38-case historical matrix and all final policy/QA no-go.
8. Publish report + machine 21-row matrix with direct GitHub URLs. No app writes, no release GO.

**DELIVERABLE:** \`WEB-005_A60_R16_INDEPENDENT_QA.md\` + 21 packet statuses. STOP code/merge/self-approval.

## AGENT A70 — P09 PR42 global roster Undo LIFO closure (GO CODE L2)

**TASK:** \`WEB-005-T040-A70-MP2A-ROSTER-R16\` | MODE: GO SOURCE-CODE ONLY / TEST-FIRST on **existing PR42 branch only**.

1. Recheck PR42 exact HEAD, A60 R15 source finding and \`routes/tournaments.ts\` roster dispatch for \`delete_player/restore_player\`; define latest Undo action id/revision and lock ordering in the **same** transaction before invoking \`undoTournamentRosterAction\`.
2. Add deterministic test-first X queued behind tournament lock, Y commits newer unrelated Undoable action, X roster Undo stale → existing controlled 409, **zero writes** to players/roster/action_log; Y remains, positive newest roster Undo still works; cover both delete and restore and cross-action variants. Do not assume test RED/GREEN executed if no PG16.
3. Implement smallest consistent locked latest-action check compatible with existing global LIFO semantics, preserving historical action_log and normal \`revert_match\` path. No direct Revert MP2B public CAS, no rewrite PR39/51 and no new sport policy.
4. Exclusive files PR42 own \`routes/tournaments.ts\`/ \`test/revert-match.integration.test.ts\` only, with scoped own branch commits. Do **not** modify PR39/44/46/51 or cherry-pick them in. Document cross-PR semantic conflict for eventual SWARM-006.
5. If proper route lock absent or cannot guarantee same transaction without large redesign, HOLD implementation, deliver exact blocker and safe smaller design; don't fake protection.
6. Run available nonmutating source/typecheck; PG16 only with owner-approved isolated physical DB else NOT_EXECUTED. After amended PR42 HEAD, request A60 independent re-review and A50 targeted runtime.
7. Report exact SHA diff and 409 zero-write expected; \`PATCH_REVISED\` not final QA accepted.

**DELIVERABLE:** \`WEB-005_A70_R16_PR42_ROSTER_LIFO_PATCH.md\` and PR42 new HEAD if safe. STOP integrate/SQL/prod.

## AGENT A80 — Sporting rules owner policy and PR45 QA

**TASK:** \`WEB-005-T050-T051-A80-R9\` | MODE: SOURCE ONLY.

1. Reuse R15 signable terminal Swiss TS-A deny 409 vs TS-B reopen, SE actionable/max-generated, Swiss5/6 rematch/BYE/NC solver and DE GF Reset rank semantics. Do not produce another sweeping audit.
2. Present owner/HQ with one compact decision form/link or a one-page signable document and exact consequences, no default choice or inferred approval. Mark unsigned if not signed.
3. Pin PR45 terminal RR roster revert and A60 source-only conditional acceptance; A50 actual PG16 SE8→RR4 fixture still pending; prepare commands/expected without running unsafe test.
4. Confirm only concrete policy-dependent next source patch after signature; no code in R16.
5. Communicate source and test cases to A70/A120 where Undo/RR UI cross-dependencies matter.

**DELIVERABLE:** \`WEB-005_A80_R16_OWNER_SPORT_POLICY.md\`. STOP sport code/merge.

## AGENT A90 — P08 PR41 Backup QP/QPE/OP position parity (GO CODE L1)

**TASK:** \`WEB-005-T060-A90-B1-POSITION-R16\` | MODE: GO SOURCE-CODE ONLY / TEST-FIRST on **existing PR41 branch only**.

1. Recheck PR41 HEAD, A60 R15 \`validateBackupV3FlowIntegrity\` specific omission: \`sourceBasketPosition\` not fully consistent across qualification proposal, approved/effective output and route receipt; inspect schema and approved output states before changes.
2. Test-first legal full Backup V3 positive QP→QPE→OP/route incl sourceBasketPosition, and corrupt-only position mutations producing typed \`400 INVALID_BACKUP_V3\` **before clone**. Verify missing, swapped, same-player/different-position, stage/basket mismatch without rejecting valid legacy fixtures outside documented contract. Zero clone rows on reject; typed rollback for late failure. If deciding position semantics requires undocumented historical policy, HOLD subcase and A00 decision.
3. Add minimal deterministic complete parity checks to B1 validator and narrow fixture, **not** B2 match revision/legacy redesign or B3A read-only MVCC export changes. No new DDL, SQL migrations or snapshot compatibility policy.
4. Exclusive PR41 existing own branch only, minimal changed backup validator file plus related tests; leave PR48 untouched, cross-PR collision recorded but not merged.
5. If actual runtime unavailable, honest \`NOT_EXECUTED\` for PG16; test-first source commit sequence not claimed RED/GREEN. A50 isolated positive/negative after physical approval; A60 source QA on new exact SHA.
6. Report new PR41 HEAD, diff, per-record invariants, valid legacy protection and remaining Backup B2 owner policy D1–D6.

**DELIVERABLE:** \`WEB-005_A90_R16_PR41_POSITION_PARITY_PATCH.md\`, amended PR41 if safe. STOP broad rewrite/merge/prod.

## AGENT A100 — P20 PR53 scoped S2B cache gap (GO CODE L3)

**TASK:** \`WEB-005-T080-A100-S2B-R16\` | MODE: GO SOURCE-CODE ONLY / TEST-FIRST on **existing PR53 branch only**.

1. R15 independent A60 \`SOURCE_FAIL_FULL_PRIVACY_SCOPE\` at PR53 HEAD, supported by A30 peer and A100 exact keys. R16 A00 authorizes source code correction narrowly; this **does not assert runtime exploit confirmed**.
2. Test-first original \`use-tournament-auth.test.tsx\` with required QueryClientProvider, + PR53 current URL-prefix tests. Add S2B N1 player-bans tuple-key eviction for tournament A on credential removal/denied 403, preserve public B and 7 vs 70 boundaries, old in-flight A result not visible.
3. S2B N2 match picks \`["matches",matchId,"game-picks"]\` only purge if a trustworthy, explicit match→tournament ownership proof is available (e.g. established current tournament authoritative match list, typed query meta at hook creation). No global \`matches\` cache wipe, no guessing matchId↔tournamentId, no PII log. Include negative B picks unchanged and delayed in-flight A response cannot refill.
4. Fix existing AuthProvider hook-test QueryClientProvider wrapper **only** in own narrow frontend fixture file and source dependency; preserve real production providers and existing support session tests. If a necessary fix spans a file owned by A120 or unapproved broad architecture, HOLD that subpart; do not take ownership silently.
5. Work on existing \`fix/web-005/t080-s2a-private-auth-query-cache-r13\` PR53 branch, preserving PR53 original behavior. Minimal controlled paths \`auth-context.tsx\`, \`tournament-query-invalidation.ts\`, \`deadlock-bans-picks.ts\`, and related focused tests; if modifying \`tournament-host.tsx\` or other modules unavoidable, HOLD until A00 assigns exclusive file-window; no unrelated backend PR44/46/49 changes.
6. **No actual test PASS without Node/pnpm checkout**, no user's production browser/proxy. If safe frontend runtime available, execute existing + new targeted RTL/typecheck and exit receipts. Otherwise NOT_EXECUTED and A50 runbook; A30 security peer+A60 independent SHA re-review needed after amend.
7. Report full and partial S2B coverage, unresolved match ownership ambiguity explicitly. \`SOURCE_ACCEPTED_URL_PREFIX_ONLY\` remains until updated A60 verdict. Do not claim full privacy secured by one local predicate adjustment.

**DELIVERABLE:** \`WEB-005_A100_R16_PR53_S2B_PATCH.md\`, PR53 amended HEAD if safe, targeted tests, remaining issues. STOP global cache purge/merge/prod.

## AGENT A110 — Basket CAS policy gate & existing frontend QA

**TASK:** \`WEB-005-T055-T110-A110-R16\` | MODE: SOURCE ONLY.

1. Present R15 owner-signable D1–D6 T055 Basketball/Stage basket full PUT: version/token shape, 409 vs 412, legacy missing token, stage/roster invalidation, draft retention and conflict reconciliation. No unilateral decision, even if 409 is a common default.
2. Recheck unchanged PR43 CSV, PR50 backup preview and PR52 stage modal statuses and A60 conditional exact-head verdict, give A50 RTL commands/known gaps, no rewrite.
3. Host UX044 unsaved draft block-vs-retain owner decision remains; do not implement without signed semantics. Keep previously withdrawn StageBasketsPanel ordinary A→B and backup overwrite findings WITHDRAWN.
4. Annotate PR43/50/54 shared \`tournament-detail.tsx\` and PR53 cache leakage intersection for future SWARM-006 integration only; no code.
5. Report next minimal code request for T055 only after owner signature and later free lane.

**DELIVERABLE:** \`WEB-005_A110_R16_BASKET_POLICY_GATE.md\`. STOP code/merge.

## AGENT A120 — P21 PR54 mixed RR/DE denied UI (SOURCE ONLY R16)

**TASK:** \`WEB-005-T100-A120-R16\` | MODE: SOURCE-ONLY / TEST-FIRST DESIGN.

1. Freeze PR54 at current HEAD; inspect A60 R15 source blocker \`RoundRobinReadbackBridge\` wraps all TournamentDetail tabs. Identify concrete source path where denied historical RR stage-details GET 403 might render full-page alert and suppress valid DE/Overview/other lawful tabs.
2. Design **minimal test-first mixed stages**: tournament includes historical RR stage and active/completed DE stage; historical RR GET returns 403, canonical DE selected stage/Overview GET 200; these tabs stay usable while error remains scoped **only to RR view**. Also RR selected case 403 local alert, valid 200 retry, update N→N+1, stale late N, no polling storms.
3. Prepare exact diff sketch limiting deny/401 presentation to selected RR tab or matched stage route and preserving unauthorized private-tournament cache hiding (coordinate with A100). Do not broaden to public route access bypass or invent backend behavior.
4. Report whether a **single small next-wave PR54 amend** is feasible after A60 acceptance of test contract and exclusive \`tournament-detail.tsx\` ownership, observing PR43/50 same-file dependencies. **No code edits R16** (three other active lanes).
5. Share A50 executable React tests and A60 narrow full-claim acceptance oracle. Old F054 champion banner remains regression-only; no broad redesign.

**DELIVERABLE:** \`WEB-005_A120_R16_PR54_MIXED_RR_DE_FIX_CONTRACT.md\`. STOP code/merge.

---

## §3 — Zakończenie R16 / measurable acceptance

A00 must publish R16 aggregate:
- P08/09/20 previous HEAD and amended HEAD (if changed), diff and independent new A60 verdict.
- P21 test contract and future code-go criteria (unfixed in R16 unless separately authorized later).
- R16 A50 actual native frontend/PG16 number of tests and exact receipts or owner-provided environment blocker. \`0\` is acceptable honest status, but **not** a release GO.
- Signed/unsigned owner policy queue and remaining accepted WEB-004 R2 findings.
- A10 package SHA checksum drift, unresolved overlap DAG and final-only package scope.
- Entire WEB-005 \`IN_PROGRESS/FINAL_CLOSEOUT\` decision, SWARM-006 remains HOLD unless all conditions actually met.

**Important:** The three R16 narrowly scoped code GO orders do not authorize integration, SQL, shared test DB, paid CI or production. A revised draft PR does not automatically become source-accepted or runtime-ready.

## §4 — Jeden krótki prompt startowy dla wszystkich wątków R16

WEB-005 — START FALI R16

Otwórz centralny dokument:
https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R16_AGENT_PROMPTS.md

Przeczytaj wspólne §0–§2, rozpoznaj swój identyfikator Axx z roli wątku i wykonaj **wyłącznie** sekcję AGENT Axx. Zweryfikuj aktualne PR HEAD i historyczne QA R15. Przestrzegaj przypisanych GO/STOP, nie mieszaj gałęzi innych agentów. Publikuj artefakty i końcowy R16 handoff z bezpośrednim GitHub URL dla A00. Nie uruchamiaj SWARM-006 ani nie wykonuj merge/release.
