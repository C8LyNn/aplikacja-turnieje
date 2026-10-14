# WEB-005 — FALA R11 — CENTRALNY DOKUMENT PROMPTÓW WSZYSTKICH AGENTÓW

**Wersja:** R11.1 — 2026-10-14 (Europe/Warsaw)  
**Projekt:** WEB-005 — Website Recovery & Development  
**Rola 00:** lokalny Implementation Lead, podległy jednej globalnej Queen/HQ; nie jest drugą Queen.  
**Repo:** \`C8LyNn/aplikacja-turnieje\`  
**Branch dokumentów:** \`chore/web-005/t000-wave1-control\`  
**Podstawa merytoryczna:** \`WEB-004_TO_WEB-005_HANDOFF_R2_2026-10-14.md\`, \`WEB-005_WAVE_NEXT_IMPLEMENTATION_PLAN_R1.md\`, \`WEB-005_WAVE_R10_AGENT_PROMPTS.md\`, \`BACKLOG.md\`, \`DECISIONS.md\`, rzeczywiste PR #34–45 i raporty R10.  
**R11 status:** READY FOR DISPATCH; WEB-005 IN_PROGRESS; NO SWARM-006; RELEASE NO-GO.

**To jest jedyny zbiorczy dokument z promptami R11.** Wszystkie 13 wątków otrzymują identyczny krótki prompt startowy. Każdy czyta §0–§2 oraz sekcję **AGENT Axx** zgodną z własną rolą. Odczytanie pozostałych sekcji dla zrozumienia zależności nie oznacza uprawnień do wykonywania ich zadań.

## §0 — Wspólny kontrakt pracy i ograniczenia

1. **Weryfikacja przed pracą.** Odczytaj GitHub HEAD/base/diff/PR i dowody R10; tabela §1 to snapshot, nie gwarancja niezmienności. Nie powtarzaj wykonanych już implementacji R9/R10.
2. **Dokładne poziomy dowodu:** \`SOURCE_CONFIRMED\`, \`STATIC_INFERRED\`, \`HYPOTHESIS\`, \`PATCH_PROPOSED\`, \`SOURCE_ACCEPTED\`, \`RUNTIME_VERIFIED\`, \`FAIL\`, \`BLOCKED\`, \`NOT_EXECUTED\`, \`POLICY_OPEN\`. Autor napisał test ≠ test uruchomiony; lokalny test syntetyczny ≠ rzeczywisty PostgreSQL/HTTP/React PASS; brak komentarza GitHub Review ≠ automatycznie brak oceny w osobnym raporcie.
3. **Twardy STOP:** brak merge/cherry-pick do release/main, tworzenia composite integration branch, Replit, produkcji, staging/live, SQL/DDL/migration/adoption, zmian sekretów, mutujących testów na współdzielonej bazie, ręcznych płatnych CI bez autoryzacji. Nie przenoś danych użytkowników ani tokenów do raportów.
4. **Trzy i tylko trzy source-code lanes R11:** L1 **A90/T060-B3A** spójny snapshot eksportu Backup V3, L2 **A100/T080-S1B-D** post-lock auth dla DELETE tournament, L3 **A120/T100-PR-A** niezależne czytelne widoki DE/formatów/final overlay. Wszystkie **GO SOURCE-CODE ONLY / TEST-FIRST / DRAFT PR**, warunkowe brakiem kolizji i decyzji produktowej. Pozostali pracują SOURCE-ONLY / QA / TEST / DOCS i nie otwierają kolejnych implementacji.
5. **Własność plików:** A90 \`application/backups/backup-v3.ts\` dla B3A; PR41/B1 zamrożony do QA, nie przepisywać. A100 \`routes/tournaments.ts\` tylko DELETE route (PR44/S1A i PR42/MP2A zamrożone), A70 nie edytuje w R11; przy kolizji defektów HOLD i A00 rozstrzyga. A120 wyłącznie \`stage-progress-view.tsx\`, \`tournament-bracket.tsx\`, \`tournament-audience.tsx\` plus testy. A80 \`revert-match.ts\` SOURCE-ONLY (PR45 frozen). A110 \`tournament-detail.tsx\` SOURCE-ONLY (PR43 frozen).
6. **POLICY OPEN nie jest implementacją:** terminal Swiss 409 vs atomic reopen; SE currentRound; Swiss/DE/RR ranking; Basket CAS 409/412 + revision token; Backup V3 portable match revisions / legacy compatibility; public Direct Revert strict preconditions + Host rollout / completion action discovery; Steam 403/503, session TTL/token digest/rotation. Nie wymyślaj wyborów owner/HQ.
7. **WEB-004** zakończył audyt i nie przygotowuje kolejnych raportów. Pracujemy tylko na HANDOFF R2 i dowodach, które już są. **SWARM-006 otrzyma jedno finalne przekazanie DOPIERO po formalnym zamknięciu uzgodnionego backlogu WEB-005**. A10 utrzymuje bufor P01+, bez wysyłania. **SWARM-007** przygotowuje protokoły i strukturę Google Drive, nie zakładaj gotowej synchronizacji.
8. **Testowanie:** A50 uruchamia rzeczywiste testy tylko na zweryfikowanym checkout i odizolowanym fizycznie PostgreSQL16/Node22/pnpm10; \`TEST_DATABASE_URL\` test-only, \`TEST_DATABASE_SCHEMA=tm_test_*\`, potwierdzony explicit reset i odseparowanie od produkcji. Nie używaj placeholderów ani współdzielonego DB. Brak warunków = BLOCKED/NOT_EXECUTED, a nie PASS. Zmiany frontend można testować bez DB, jeśli rzeczywista zależność/checkout jest dostępna.
9. **Independence:** A60 ocenia autorów niezależnie i przywiązuje dowód do exact SHA. A30 dodatkowo ocenia security. Author source assertions nie certyfikują wydania.
10. **Raport końca R11:** \`WEB-005_Axx_R11_HANDOFF.md\` z task ID, exact PR/head/base/branch, real changed files, komendami i exit codes lub NOT_EXECUTED, statusy QA, konflikty/polityki, wskazanie blokerów, następnym krokiem. Jeżeli agent nie może wykonać części zadania, zapisuje to bez deklarowania ukończenia runtime.
11. **Nie deleguj samodzielnie:** żadnych zadań innego Axx, zwłaszcza kodu, merge, release. Wykonaj możliwy zakres w bieżącym wątku, nie obiecuj pracy w tle.

## §1 — Zweryfikowany snapshot P01–P12 (odświeżyć przy wykonaniu)

**Wspólny baseline:** \`release/tournament-ops-20261013-01\` HEAD \`1fdc401d87c6bffe6bf7312dfc9db681b689dcf7\`. Nie ma jednego zintegrowanego SHA. Wszystkie poniższe PR w chwili przygotowania R11 są OPEN DRAFT i niescalone.

| ID | PR | HEAD SHA (snapshot 2026-10-14) | Zakres i bramka |
|---|---|---|---|
| P01 | #35 | \`7cb283aa82273a1e22daf9051a82311eef53760c\` | Pack19 scoped PASS, full CI nie |
| P02 | #36 | \`85ad0b86136fc3491c9ef18663d9b01396179349\` | Pack20–26 full native tests nieudokumentowane |
| P03 | #34 | \`fae2eea2f22df3f1b02ad035a7db00bc411ea73f\` | Steam writer auth HTTP/PG pending |
| P04 | #37 | \`fcfd8a6f5b997c90f2b62f0a3529fa64287a03d7\` | Proxy trust XFF HTTP pending |
| P05 | #38 | \`2d36864f4d2f1c838073f387fd3c8efb3378c43b\` | Offline ledger validator; no SQL GO |
| P06 | #39 | \`16053ee132756ca05b6f2cd1f0cabae823905387\` | Cancel/Restore MP1; PG/React parity pending |
| P07 | #40 | \`9a8287271299a59fc9291b8d253299a8d109a35d\` | Pack17 author/independent synthetic tests, \`--full\` pending |
| P08 | #41 | \`e847cb705296a48ab5c68ece96776cd0e0bbb417\` | Backup B1 QP/QPE/OP; PG16 pending |
| P09 | #42 | \`1ae0ccb801f4177052bff1ec7041e55b8c992c8b\` | Undo MP2A global LIFO; PG16 pending |
| P10 | #43 | \`96a6068f69027574ac76e18d4d5a2c444b5a914a\` | UX042 FileReader cross-tournament; real RTL/browser pending |
| P11 | #44 | \`2f0187b7242681c394c09058b5ef647667206bd6\` | Auth S1A post-lock; PG16/security QA pending |
| P12 | #45 | \`a7a87bc019731191dbfa44bee6939e3fa25e27f4\` | RR terminal stage-roster correction; PG16 pending |

**P08–P12 authors wrote negative/integration/RTL test definitions but did NOT establish actual app test PASS on these heads in published PR reports.** Source code exists; a test running on another SHA/branch does not confer acceptance. PR #33 Steam alternative remains HOLD, PR #32 release→main remains unmerged.

## §2 — Agent roles, lanes and sequencing

| Agent | R11 task | Uprawnienia |
|---|---|---|
| A00 | Fala R11, triage, QA gating, backlog and policy decisions | COORDINATION |
| A10 | P01–P12 rolling manifest + future P13+ | DOCS / READ-ONLY |
| A20 | T021 validator and PG16 schema/history gate | READ-ONLY / TEST SPEC |
| A30 | Steam/proxy/S1A security review; S1B-D peer | READ-ONLY |
| A40 | Pack17/source CI gating | READ-ONLY / SUPPORT |
| A50 | **P0 physical PG16/Node/React test execution blocker** | TEST ENV + EVIDENCE |
| A60 | Independent QA of #41–45, prior packages, new R11 PR | STRICT READ-ONLY |
| A70 | MP2B direct Revert CAS + malformed Undo policy design | SOURCE-ONLY |
| A80 | Terminal Swiss/SE/Swiss DE policy, PR45 QA handoff | SOURCE-ONLY |
| A90 | T060 B3A consistent export snapshot | **CODE LANE L1** |
| A100 | T080 S1B-D protected tournament deletion | **CODE LANE L2** |
| A110 | T055 basket CAS decision and remaining T110 frontend backlog | SOURCE-ONLY |
| A120 | T100 presentation PR-A: DE Details/labels/completed overlay | **CODE LANE L3** |

**Kolejność zależności:** A50 i A60 nadają priorytet wykonaniu/odbiorowi już istniejących P08–P12; agent 00 nie traktuje napisania kolejnych PR za zamknięcie starych. Nowe R11 patche powstają w izolowanych gałęziach bazowych, bez samodzielnego scalenia wcześniejszych PR.

---

## AGENT A00 — Implementation Lead / R11 Coordinator

**TASK:** \`WEB-005-T000-A00-R11\` | MODE: COORDINATION.

**MISSION:** Po R10 zamknij nieścisłości evidence i uruchom 3 małe code lanes przy bezwzględnym wymogu bezpiecznego testowania. Nie uruchamiaj SWARM-006.

**TASKS:**
1. Odśwież statusy P01–P12 oraz PR #41–45 dokładnym HEAD. Potwierdź: A100 S1A to już PR44 (nie R9 HOLD), A80 RR już PR45, A110 CSV już PR43.
2. Przejrzyj R10 raporty A10, A70, A80, A90, A100, A110, A120 oraz dostępne A50/A60; nie wpisuj PASS, gdy brak logów.
3. Wydziel A90/T060-B3A, A100/T080-S1B-D i A120/T100-PR-A jako source-code-only lanes, nie więcej. Zamroź poprzednie PR-y na czas pracy nad niepokrywającymi się hunks.
4. Uzgodnij exclusive file ownership: backup-v3.ts→A90; delete route tournaments.ts→A100; DE/frontend presentation→A120; A70/A80/A110 read-only. W razie kolizji wdrażanych patchy HOLD i przeszereguj.
5. Priorytet P0: bezpieczeństwo fizycznego testowego PG16/kompletny checkout przez A50, niezależny A60 odbiór PR41–45; zbieraj twarde BLOCKED przy niedostępnej infrastrukturze.
6. Przygotuj krótką owner/HQ decision queue: POLICY-BACKUP revision/legacy, Revert public CAS+Host, Swiss/SE, Basket CAS, Steam fallback i auth token behavior. Nie wybieraj samowolnie polityk.
7. Prowadź macierz \`finding → task → agent → PR SHA → source review → runtime QA → policy/status\`; zamykaj jako naprawione tylko rzeczywiście zaimplementowane zakresy.
8. Po R11 nie rozsyłaj paczek SWARM-006. Kolejna fala tylko jeśli backlog/QA uzasadnia; WEB-005 final closeout nadal odrębny.

**DELIVERABLE:** \`WEB-005_A00_R11_COORDINATION.md\`, zaktualizowane BACKLOG/DECISIONS, QA prioritization, next GO/STOP.  
**STOP:** merge, SQL, production, release, SWARM-006 handoff.

## AGENT A10 — Internal Packet Registry, no dispatch

**TASK:** \`WEB-005-T018-A10-R6\` | MODE: READ-ONLY / DOCS.

1. Kontynuuj manifest R10 P01–P12, nie twórz od początku i nie zmieniaj zatwierdzonych SHA bez GitHub recheck.
2. Pin PR #43=UX042, #44=S1A, #45=RR stage; potwierdź parowanie P10–P12 dokładnym HEAD i zaktualizuj checksum/path/ancestry/conflict matrix.
3. Dla P13+ rejestruj wyłącznie **realne** nowe PR R11 A90/A100/A120, gdy rzeczywiście powstaną. Nie wymyślaj commitów.
4. Wykryj merytoryczne nakładanie: PR #41 ↔ B3A backup-v3.ts, PR #42 ↔ PR44/S1B-D tournaments.ts, PR39 client contract, PR43 ↔ przyszłe UX, PR45 ↔ future T050.
5. Wpisuj statusy SOURCE_READY/QA_ACCEPTED/RUNTIME_VERIFIED z niezależnych dowodów A60/A50, nie nadaj własnych approvals.
6. Utrzymuj rollback, test commands, repo SHA, konfliktów i podpisanego policy ID; przygotuj finalny manifest przekazania dopiero po zamknięciu backlogu.
7. Dokumentuj wymagania metadanych SWARM-007 bez domniemania istniejących Drive folderów ani automatycznego transferu.

**DELIVERABLE:** \`WEB-005_A10_R11_INTERNAL_MANIFEST.md\` + P01–P12(+new) index.  
**STOP:** no SWARM-006 send / composite build / merge.

## AGENT A20 — Migration Validation / SQL STOP

**TASK:** \`WEB-005-T021-A20-R6\` | MODE: SOURCE-ONLY / QA SUPPORT.

1. Recheck P05 PR #38 HEAD, 0030/0031 historic collisions, manifest hashes, duplicated ledger receipt and unapproved adoption; nie implementuj 2. walidatora.
2. Zachowaj fail-closed decision \`REVIEW_ONLY\` albo \`STOP\`, \`ready_for_sql=false\` bez prawdziwej weryfikacji katalogu PG16/owner approval.
3. Oddziel autorowe synthetic test PASS od fizycznych testów migracji. Przygotuj A50 test-only PG16 catalog fingerprint / same-source checksum preflight bez SQL migracji i bez resetu współdzielonych schematów.
4. Zidentyfikuj zależności schema dla P08 Backup i P12 RR/PR45, ale nie implementuj ich logiki.
5. Przekaż A60 negatywną macierz i A00 warunki dalszej migracji do osobnej bramki; 00/HQ decydują o historycznych ledgerach.

**DELIVERABLE:** \`WEB-005_A20_R11_MIGRATION_GATE.md\`.  
**STOP:** any real SQL/DDL/adoption/production DB.

## AGENT A30 — Security peer / Steam + Proxy

**TASK:** \`WEB-005-T030-T031-A30-R9\` | MODE: READ-ONLY.

1. Recheck PR #34/#37 exact HEAD; three Steam mutation guards, public GET, negative 403/503, upstream-zero-write, proxy-addr and IPv4/IPv6 mapped XFF spoofing.
2. **Priority:** independently inspect PR #44 post-lock auth S1A, especially HMAC credential proof/tournament binding, support row-lock, bans/game-picks row locks, any lock ordering/deadlock and existing legal requests.
3. Review proposed R11 A100 narrow S1B-D deletion guard after PR exists; verify post-lock authorization, fail-closed revoked organizer, no raw token logging, no zombie delete.
4. Deliver A50 runnable negatives and A60 security threats; no vulnerability exploitation claim without real runtime.
5. Track remaining S1B+ auth mutations (password routes/correction intents) and S2 private cache without implementing them.
6. Preserve POLICY-STEAM status 403/503 and auth TTL/token storage as open until owner/HQ.

**DELIVERABLE:** \`WEB-005_A30_R11_SECURITY_QA.md\`.  
**STOP:** do not edit security production code in this wave.

## AGENT A40 — Pack 17/CI gate contract

**TASK:** \`WEB-005-T017-A40-R6\` | MODE: READ-ONLY / AUTHOR QA SUPPORT.

1. Recheck P07 PR #40 exact SHA and three Pack17 files. Preserve existing negative TAP suite without new runner rewrite.
2. Provide A50 explicit reproducible commands for synthetic gate contract, \`Pack17 --static\` (nonrelease) and true \`Pack17 --full\` (requires isolated PG16/locked deps/frontend/API).
3. Cross-check Pack19/20–26 sequential CI and failed source pattern; distinguish unrelated Pack19 baseline failure from PR41/42/B3A failures.
4. Source review omitted full gates, false 0, skipped/todo, TAP subprocess summary handling and dependency/missing DB.
5. A60 supplies independent verdict. Code fixes only after a demonstrated defect and separate A00 GO; no paid CI.

**DELIVERABLE:** \`WEB-005_A40_R11_PACK17_CI_READINESS.md\`.  
**STOP:** no implied release PASS or new Pack17 patch.

## AGENT A50 — P0 test environment and real execution

**TASK:** \`WEB-005-T133-A50-R6\` | MODE: SAFE TEST INFRA & EXECUTION.

**MISSION:** Stop the accumulation of untested draft patches. Produce an actual, safe executable path for source and runtime verification; if impossible, provide a definitive precise infrastructure blocker.

1. Inspect previous harness/R10 instructions; check whether actual checkout, Node22/pnpm10 and PostgreSQL16 disposable dedicated database exist with explicit owner authorization. No assumption of access to local PCs/QueenBridge.
2. Before any destructive test prove isolated test host/DB identity, test credentials/permissions, test-only schema \`tm_test_*\`, explicit reset consent; refusal/unknown = STOP with reproduction-ready execution packet.
3. Execute if feasible **per exact individual SHA**: P08 PR41 Backup B1 positive+12 corrupt/rollback, P09 PR42 Undo LIFO races, P11 PR44 revocation races, P12 PR45 RR stage, P10 PR43 RTL/typecheck; also P06 PR39, P07 PR40 true --full, Steam/proxy and migration validator. Don't label synthetic harness as app tests.
4. For code-lane R11 new PRs execute, after appearance and appropriate safe environment: A90 repeatable-read export concurrency, A100 delete revocation race, A120 React component tests.
5. Capture actual command, SHA, Node/pnpm/PG version, exit, TAP counts, test DB safe fingerprint and negative DB snapshots, sanitize secrets. For frontend tests not requiring DB, do them first if environment supports.
6. Collaborate with A60 for independent acceptance; distinguish test failures caused by baseline old Pack19 from actual new-patch failures.
7. If no physical PG16, produce **specific** PowerShell/Docker/CI-independent recipe and fail-safe preflight for authorized executor, not invented success. No test DB credentials in a shared report.
8. Record test coverage against 38 WEB-004 cases; don't change historical results.

**DELIVERABLE:** \`WEB-005_A50_R11_RUNTIME_EVIDENCE.md\`, artifact manifest and exact BLOCKED list.  
**STOP:** shared/prod DB, paid CI without GO, fabricated test PASS.

## AGENT A60 — Independent QA of 12 old and 3 future patches

**TASK:** \`WEB-005-T130-A60-R11\` | MODE: STRICT READ-ONLY QA.

1. Pin each P01–P12 to updated PR SHA, review source and previous R9/R10 reports without redocumenting everything. Prioritize #41–45 as new independent findings.
2. PR41 B1: preclone approved outputs QP/QPE/OP/route arrivals, valid historical positive, 400/no clone and late rollback (not a statement of actual test success).
3. PR42 MP2A: global latest action under same transaction, X waiting/Y newest 409, zero-write; review PR44 shared file conflict but do **not** integrate the patches.
4. PR43: FileReader A→B late callback, same-component and full-page React/route test gap. PR44: organizer revocation and deadlock, routes/bans/picks. PR45: RR 8→4→RR4 status scope and single-stage regression.
5. Independently inspect new PRs A90 B3A, A100 S1B-D, A120 T100 PR-A as they materialize. Report source acceptance separately from runtime execution.
6. Maintain original 38-case WEB-004 audit provenance, including 0 historical PASS, 3 external CI FAIL, 33 BLOCKED, 2 NOT RUN. Don't convert them to PASS based on source-only changes.
7. Report exact blockers P03/P04/P05/P06/P07 etc and synthetic vs actual test status A50. Source-only QA accepted conditional ≠ integration release GO.
8. No code edits, self-certification, merge, production or release.

**DELIVERABLE:** \`WEB-005_A60_R11_INDEPENDENT_QA.md\`, status matrix P01–P12+ and explicit risks.

## AGENT A70 — Direct Revert CAS MP2B / Undo Payload Risk

**TASK:** \`WEB-005-T040-A70-R8\` | MODE: SOURCE-ONLY.

1. Recheck PR39 MP1 and PR42 MP2A; do not modify their PR branches or A100's \`routes/tournaments.ts\`.
2. Use the R10 MP2B source contract: public direct Revert request \`expectedMatchRevision\` / completion action ID, stale ABA 409 + zero writes, malformed request 422, existing transaction locked guards.
3. Prepare for A00/HQ explicit decisions: strict old Host cutover vs backward compatibility, completion action ID discovery beyond 50 action-log rows, external field names and generated OpenAPI/React/Zod parity. Do not choose silently.
4. Write narrow test-first plan for malformed historical undoPayload safe parser (source gap in PR27 vs release), separating this from direct CAS to prevent a large monolithic patch.
5. Help A50/A60 validate PR42 exact HEAD, including \`revert_match\` branch, latest action lock and 409.
6. Do not edit routes/tournaments.ts (A100 owner for R11), revert-match.ts (A80 history, no new owner code), OpenAPI or Host. Only specification/policy/fixtures.

**DELIVERABLE:** \`WEB-005_A70_R11_MP2B_AND_HISTORY_GATE.md\`.  
**STOP:** no MP2B implementation without contract/owner policy and next code-lane GO.

## AGENT A80 — Terminal Swiss / SE/DE next domain patch

**TASK:** \`WEB-005-T050-T051-A80-R4\` | MODE: SOURCE-ONLY.

1. Recheck P12 PR #45 exact HEAD and A52-F019 test/source; support A50/A60 read-only. Do not reimplement RR resurrection fix.
2. Present two formal terminal Swiss owner choices (409 fail-closed or atomic reopen); specify invariant that completed tournament cannot contain required pending match, all affected stage/turn status/winner restored atomically if allowed.
3. Present SE currentRound behavior (earliest actionable vs maximum generated) and RR/DE ranking semantics needing signatures; no policy choice.
4. Prepare reproducible Swiss5/6 non-rematch, BYE selection, DE GF runner-up fixtures with deterministic matching and negative fallback controls.
5. Compile a minimal **future** single-patch proposal and file conflicts with PR45/revert-match.ts and PR42 Undo; avoid current code changes and no new draft PR in R11.
6. Source findings are not runtime-reproduced without PG/TS tests; share fixtures A50/A60.

**DELIVERABLE:** \`WEB-005_A80_R11_TERMINAL_SWISS_POLICY_PACKET.md\` + future patch plan.  
**STOP:** no sport rule code or player status changes without policy.

## AGENT A90 — T060-B3A Consistent Export Snapshot (CODE LANE 1)

**TASK:** \`WEB-005-T060-A90-B3A-R4\` | PRIORITY: P0 data integrity  
**MODE:** **GO SOURCE-CODE ONLY / TEST-FIRST / DRAFT PR**.

**MISSION:** Apply only the preexisting R2 risk A51-F020=A50-F026: Backup V3 export must read tournament, stages, matches, history, baskets, routes and receipts from **one internally consistent database snapshot** or fail deterministically. Do NOT combine B1 or B2.

1. Start from pinned release branch on a separate isolated branch; PR41 B1 source patch stays frozen/independent. Compare current exportBackupV3 query paths: tournament root and parallel related-table reads, no existing enclosing snapshot.
2. Write targeted test-first deterministic two-connection/export barrier fixture: export reads initial tournament, a second transaction commits a result/stage/route update, export resumes; expected payload from one pre-update or post-update snapshot only, never mixed.
3. Implement minimal safe \`REPEATABLE READ\` **read-only** transaction spanning all snapshot reads and nested helpers; ensure queries use the **same transaction handle**. Preserve serialization order/API output, no mutation, no unapproved schema/format change. If current DB utility cannot guarantee snapshot/repeatable-read or test contract without invasive rewrite, HOLD CODE and report evidence to A00.
4. Preserve valid V3 exports; do not reinterpret historical portable revisions, B1 qualifications/route parity, B2 result_history/undo provenance or legacy V2 import. Never call production backup endpoint.
5. Create isolated source patch/test-first draft PR only for B3A; no merges of PR41. Avoid unrelated Pack19 regex work; report any runner mismatch as dependency.
6. If a physically isolated PostgreSQL16 is available and approved, execute targeted race, positive export, typecheck; otherwise \`NOT_EXECUTED\`, not PASS. Give A50/A60 barriers, exact HEAD, before/after hashes, same-snapshot assertion.
7. Escalate any conflict with PR41 to A00, who records future integration dependency; no manual resolution into release now.

**DELIVERABLE:** \`WEB-005_A90_R11_B3A_SNAPSHOT_PATCH.md\`, exact PR SHA, tests, negative barrier contract, rollback, B2/B3 remainder.  
**STOP:** no importer rearchitecture, B2 policy change, SQL/DB mutations outside safe tests, merge or SWARM-006.

## AGENT A100 — T080-S1B-D Protected Tournament Delete (CODE LANE 2)

**TASK:** \`WEB-005-T080-A100-S1B-D-R4\` | PRIORITY: P1 security  
**MODE:** **GO SOURCE-CODE ONLY / TEST-FIRST / DRAFT PR**.

**MISSION:** Prevent an organizer request authorized before token/password rotation from deleting the tournament **after** its credential is revoked. Narrow target: delete tournament route only; leave all other S1B+, support/session TTL and private frontend cache to separate work.

1. Read R9 S1 inventory and R10 PR44 S1A on a fixed SHA; preserve its auth proof concept but do not modify or cherry-pick PR44 into release. Work from release baseline on a separate branch. If the fix requires a shared helper introduced **only** in PR44, do not copy it without a documented dependency/owner review; report HOLD and a proposed safe incremental design.
2. Test-first deterministic barrier: old organizer enters DELETE request, is delayed before tournament lock; owner rotates/revokes credentials; resumed stale DELETE must fail 403/authorized stable error and leave tournament, players, matches, histories, stages unchanged. Current valid organizer deletion still works only when authorized; viewer/support must not gain delete privilege.
3. Implement minimal locked revalidation in DELETE endpoint, keeping permission check + deletion in the **same tournament transaction**. Verify any cascades and read-only denied side effects. Preserve auth token format; never log token/hash.
4. Do not broaden into password route changes, controlled correction, S2 cache, TTL/token migration, global authorization framework. If lock order/deletion semantics are unsafe or policy-incompatible, HOLD CODE with minimal test plan, no forced patch.
5. Own \`routes/tournaments.ts\` exclusively for R11; PR42 MP2A and PR44 S1A frozen. A70/A30 review only. Open a new draft PR on separate branch; no merge/rebase of unaccepted draft PRs.
6. A50 isolated PG16 test if approved, A60 independent source/runtime QA, A30 security peer; exact HEAD, zero-write-on-deny, retained authorized positive.
7. Report dependency on PR44 and any future S1B branches, and explicit 403 policy nuance.

**DELIVERABLE:** \`WEB-005_A100_R11_T080_S1B_DELETE_PATCH.md\` + test/PR if viable.  
**STOP:** no other auth endpoints or live DB.

## AGENT A110 — Basket CAS policy gate and UX follow-up

**TASK:** \`WEB-005-T055-T110-A110-R4\` | MODE: SOURCE-ONLY.

1. Recheck P10 PR43 exact HEAD; preserve its CSV late-callback patch and 5 prepared RTL tests. Hand to A50/A60 for real React/browser. No reimplementation.
2. Prepare a 1-page owner/HQ choice for T055 UX-047 full basket PUT: version/precondition token shape, 409 vs 412, legacy client behavior, stage set and conflict UI/draft retention. Do not unilaterally choose.
3. Independently revalidate source for UX-044 Host unsaved draft, UX-045 Backup preview/new passwords (backup import creates a **new** tournament), UX-046 stale modal; identify which can be future code-only small independent patch without product policy.
4. Prepare test-first isolated RTL/browser fixtures, including stale FileReader A→B guard coverage and negative no cross-tournament write. No new frontend code until an assigned lane.
5. Preserve withdrawn StageBasketsPanel normal navigation and claimed backup overwrite findings as withdrawn.
6. Share source evidence/policy decision requests to A00, runnable tests A50 and independent acceptance A60.

**DELIVERABLE:** \`WEB-005_A110_R11_T055_POLICY_AND_UX_QUEUE.md\`.  
**STOP:** no basket CAS patch without owner approval; no PR43 edits during QA.

## AGENT A120 — T100 Presentation Views PR-A (CODE LANE 3)

**TASK:** \`WEB-005-T100-A120-PR-A-R4\` | PRIORITY: P2 visible UX  
**MODE:** **GO SOURCE-CODE ONLY / TEST-FIRST / DRAFT PR**.

**MISSION:** Implement **only** three independent source-confirmed presentation fixes from A20: F052 DE stage missing in tournament Details, F053 incomplete format labels on bracket/audience, F055 completed tournament hero overlay precedence. Remainder F058 RR freshness and F054 champion banner stays outside this PR.

1. Review R9/R10 A120 fixture/10 RTL+4 browser design and current release sources. Verify the dedicated DE API already exists before adding presentation.
2. F052: render selected DE stage in tournament Details through the canonical DE read API instead of substituting generic SE; graceful loading/empty/error and no duplicated bracket derivation.
3. F053: reuse canonical stage format labels from shared \`tournament-stages-ui\` mapping; don't invent new sport terminology.
4. F055: when tournament is completed, canonical champion/summary takes precedence over an old heroMatch; when active, existing featured match remains valid. No backend ranking change.
5. Add focused React component tests for these cases and negative API/error states, test-first. Use only isolated release-derived branch, draft PR, likely \`stage-progress-view.tsx\`, \`tournament-bracket.tsx\`, \`tournament-audience.tsx\` and tests; no routing/backend/DB.
6. F054 winnerId champion is already source-mitigated on PR32: regression test only, NO second patch. F058 external RR details refresh needs T050/T040 and is deferred PR-B.
7. A50 runs actual React/typecheck/build if executable; A60 independently verifies exact SHA and no leakage/format error. Browser tests only in authorized isolated environment.
8. If DE Details semantics need an unapproved backend stage identity assumption, stop that sub-scope and report to A00 rather than guessing.

**DELIVERABLE:** \`WEB-005_A120_R11_T100_PR_A_PATCH.md\` + draft PR if viable + exact SHA/test status.  
**STOP:** no UX redesign, no PR-B F058, no merge or production.

---

## §3 — Warunki zakończenia R11 / co dalej

A00 zbiera indywidualne raporty A00…A120, odświeża rzeczywiste PR-y i oddziela:
- **PATCH PROPOSED**: test-first source code istnieje w izolowanym PR.
- **SOURCE ACCEPTED**: niezależna A60 analiza na exact HEAD.
- **RUNTIME VERIFIED**: prawdziwe wykonanie na odpowiednim SHA/test env z exit=0, bez pominiętych obowiązkowych testów.
- **BLOCKED/POLICY OPEN**: wymaga konkretnej decyzji właściciela/HQ lub infrastruktury. Nie traktuj jako naprawione.

Jeśli nie ma rzeczywistego PostgreSQL16, kolejne dziesiątki draftów nie znoszą blokady wydania; A00 ma przedstawić jasny warunek techniczny jej usunięcia. SWARM-006 pozostaje całkowicie wstrzymany dla tego projektu do formalnego zakończenia całego WEB-005.

## §4 — Jeden krótki prompt startowy do wszystkich wątków R11

WEB-005 — START FALI R11

Otwórz centralny dokument:
https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R11_AGENT_PROMPTS.md

1. Przeczytaj §0–§2.
2. Rozpoznaj swój Axx na podstawie przypisanej roli tego wątku.
3. Znajdź sekcję AGENT Axx i wykonaj wyłącznie swoje zadania zgodnie z GO/STOP.
4. Zweryfikuj aktualne HEAD/SHA GitHub oraz dowody z poprzedniej fali.
5. Zapisz artefakty i końcowy raport R11 do koordynatora 00.
6. Nie przejmuj cudzych zadań ani nie uruchamiaj SWARM-006.
