# WEB-005 — A80 R14 / HANDOFF DO A00

**AGENT:** A80 — Stage Lifecycle & Sporting Rules  
**TASK:** WEB-005-T050-T051-A80-R7 · **WAVE:** R14 · 2026-10-14 Europe/Warsaw  
**GO:** SOURCE ONLY / QUALITY GATE. **STOP:** kod, nowy PR, merge, DB/prod, SWARM-006.  
**FINAL:** SOURCE_ONLY_COMPLETE / OWNER_POLICY_OPEN / PR45_QA_PENDING / RUNTIME_NOT_EXECUTED / RELEASE_NO_GO.

## 1. Zweryfikowany GitHub, exact SHA i pliki

- Instrukcje R14: docs/web-005/WEB-005_WAVE_R14_AGENT_PROMPTS.md, blob e3fc34cee212e23c7516a2271af1080c96eff9a0. Przeczytano §0–§2 oraz A80.
- Release: release/tournament-ops-20261013-01 @ 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7. PR #32 OPEN/unmerged; main base c50cc48e6fa508592bda3f4838111e9cff5af80c.
- [A80 PR #45](https://github.com/C8LyNn/aplikacja-turnieje/pull/45): OPEN DRAFT/unmerged, exact HEAD a7a87bc019731191dbfa44bee6939e3fa25e27f4. Zmienia jedynie application/matches/revert-match.ts, nowy test/round-robin-terminal-reopen.integration.test.ts i 2 dokumenty R10. W R14 nienaruszony.
- [A70 PR #42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42) HEAD 1ae0ccb801f4177052bff1ec7041e55b8c992c8b, OPEN DRAFT; [A70 PR #51](https://github.com/C8LyNn/aplikacja-turnieje/pull/51) HEAD 2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a, OPEN DRAFT. Obydwa zmieniają routes/tournaments.ts i test/revert-match.integration.test.ts, co jest istotne dla przyszłego T050.
- PR45: zero przesłanych GitHub reviews i komentarzy w odczycie. Nie jest to dowód nieistnienia osobnego raportu A60, ale nie potwierdzono źródłowo żadnego A60 SOURCE_ACCEPTED ani PG16 RUNTIME_VERIFIED na exact SHA.
- [GitHub Actions 38591289886](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38591289886) dla PR45: FAILURE na wcześniejszym matcherze Pack19 (old readOnly:true kontra accessMode:"read only"); dalsze bramki SKIPPED. Poprawka kontraktu istnieje osobno w PR35. Nie dowodzi to FAIL ani PASS testu RR4.

## 2. A52-F019 / PR45: evidence i kryterium A50/A60

**SOURCE_CONFIRMED release gap:** końcowy RR Revert wcześniej zmieniał globalne statusy wszystkich graczy turnieju na active, również wyeliminowanych przed RR. **PATCH_PROPOSED PR45:** select+lock aktualnego rosteru stage_participants terminalnego RR; UPDATE players tylko w obrębie turnieju i member IDs, sprawdzenie affected-row cardinality. Kod zachowuje dotychczasowy audit i etap/turniej reopen. Test dodano w commicie ce72152b8d69aab313a3829a05367f2f45bf87cd, następnie kod w e6b7cd8191a16640fc6b7c290910897c5217bdb3. Kolejność commitów to test-first source order, nie udowodniony red/green runtime.

**A50 ma wykonać wyłącznie po pełnym preflight:** exact checkout PR45 SHA powyżej, Node22/pnpm10 locked deps, fizycznie osobna disposable PostgreSQL16 baza o nazwie zawierającej test (bez prod), TEST_DATABASE_URL ustawione tylko na tę bazę, TEST_DATABASE_SCHEMA=tm_test_a80_r14, TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA, jawna zgoda owner/HQ na schema DROP/RESET, bez secrets w logach. Source helper getSafeTestDatabaseConfig wymaga Node test context, nazwy tm_test_* i dokonuje DROP SCHEMA CASCADE. **Same guardy nie dowodzą izolacji**. Brak preflight oznacza BLOCKED/NOT_EXECUTED.

**Uruchamiać sekwencyjnie**, każde wywołanie osobno po skonfigurowaniu zmiennych i z cwd artifacts/api-server:

    node --import tsx --test --test-concurrency=1 ./test/round-robin-terminal-reopen.integration.test.ts
    node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts
    node --import tsx --test --test-concurrency=1 ./test/match-revision.integration.test.ts

Z root monorepo: pnpm --filter @workspace/api-server typecheck (bez DB przy kompletnym workspace).

**Dokładne expected state (RR14-PG-01):** SE8 → zakwalifikowana czwórka → końcowy RR4: 4 SE mecze, 6 RR, completeStage, snapshot pełnych players oraz stage_participants obydwu etapów, stage/tournament, match revision, result_history, action_log. Direct Revert ostatniego meczu w *samym PR45* zwraca 200; match pending, stage/tournament active, winnerId oba NULL, activeStageId terminalny RR4. Tylko czterej członkowie RR4 active; czterej wcześniejsi **niezakwalifikowani wyznaczeni set difference** pozostają eliminated i ich stare stage membership niezmienione. RR4 stageSeed utrzymane, finalRank NULL, historia wyników immutable, jedna completion action undone i jedna revert action. Recomplete + completeStage → 1 winner z RR4, 4 dawnych niezakwalifikowanych nadal eliminated, kolejna rewizja immutable result_history.

**Zależność triggera:** migracje 0002/0006 mogą synchronizować statusy wcześniejszych **zakwalifikowanych** graczy do pierwszego etapu; A50 ma zanotować ich delta, nie zakładać, że wszystkie historyczne członkostwa pozostają identyczne. **Zależność A70:** stage_completed może być najnowszą akcją, podczas gdy PR45 Direct Revert oczekuje 200. PR42/51 Global Undo ma osobną LIFO/parse semantykę; public Direct Revert strict CAS policy pozostaje OPEN. Samodzielny PR45 test nie certyfikuje kompozytu.

**Zasada dowodów:** A50 zapisuje dla każdego run dokładny SHA, command, exit, stdout/stderr po redakcji, Node/pnpm/PG wersje, fingerprint hosta/bazy bez sekretów, schema i artefakt wyniku; A60 niezależnie ocenia actual vs expected exact SHA. A80 nie wykonywał żadnego testu aplikacji.

## 3. Owner sporting decisions — dokument do podpisu

[WEB-005_A80_R14_OWNER_SPORTING_DECISIONS.md](./WEB-005_A80_R14_OWNER_SPORTING_DECISIONS.md) — gotowa do podpisu jednostronicowa decyzja. **Żaden wariant nie został wybrany.**

- **POLICY-TERMINAL-SWISS / A52-F022:** TS-A DENY_409 bez zapisów i bez nowej akcji Undo, albo TS-B ATOMIC_REOPEN meczu, etapu, turnieju, winner/roster z rollbackiem i jawnie zaprojektowaną kompensacją stage_completed. Brak Swiss terminal reopen w kodzie SOURCE_CONFIRMED, trwała niespójność STATIC_INFERRED, dopóki PG16 jej nie wykaże.
- **POLICY-SE-ROUND / A52-F018:** pointer earliest actionable=1 vs max generated=2 plus osobne actionable=1 przy cofaniu SE4 feeder; UI/API consistency.
- **POLICY-SWISS-PAIRING / BIZ-21-17:** Swiss5/6 greedy 1 powtórka, optimal 0; podpisać rematch vs score band, BYE fairness, completed no_contest jako wcześniejsze spotkanie vs cancelled, deterministyczny solver i fallback.
- **POLICY-DE-GF-RUNNERUP / BIZ-21-19:** finalny przegrany GF/played Reset jako runner-up lub jawny inny kontrakt; ranks 3–N utratą drugiego życia/wave, ties/seed. System BYE nie jest rozegranym Reset.
- **BIZ-21-18:** RR stageSeed source-corrected na release — regresja, brak duplikatu. Historyczne WEB-004 A52-F001/F002 i BIZ-21-09/12 pozostają WITHDRAWN.

**Model R14:** rechecked 11 przypadków R11 JSON z poprzednich fal (Swiss5/6, forced fallback 1/2, BYE P4/P5, NC/cancelled oraz 3 GF/Reset), bez błędu w oddzielnym modelu JS. Classification = MODEL_CHECKED ONLY; brak OS process exit; **to nie są testy TypeScript/PG**. [Conditional case matrix R13 (18)](./WEB-005_A80_R13_CONDITIONAL_ACCEPTANCE_FIXTURES.json) nadal aktualna jako specyfikacja; opcje wymagające podpisu nie są domyślnymi oracles.

## 4. Dokładnie jeden przyszły minimalny patch (HOLD)

**Kandydat P0 T050-TERMINAL-SWISS-DENY-GUARD**, *wyłącznie jeżeli* owner/HQ wybierze TS-A, A50/A60 ustalą wymagany R14 evidence na exact SHA, A00 wyda osobne precyzyjne GO w wolnej fali z wyłączną własnością plików. To **nie jest** decyzja TS-A ani GO wydane w R14.

Po zatwierdzeniu: test-first nowy artifacts/api-server/test/terminal-swiss-revert.integration.test.ts (played/no_contest/walkover, system BYE, zero-write 409 na terminal, active Swiss legal, nonterminal downstream guards, concurrency i full table snapshot). Minimalny guard w artifacts/api-server/src/application/matches/revert-match.ts po walidacji lock/action/history i przed zapisem, z **owner-approved** HTTP code. **PR45 dotyka dokładnie revert-match.ts** → konflikt pliku; przyszłą ancestry i izolację ustala A00. Gdy potrzeba nowego domenowego mapowania 409, routes/tournaments.ts koliduje z **PR42 i PR51 A70**, podobnie istniejący revert-match.integration.test.ts. Bez osobnego ownership GO nie edytować tych ścieżek. Jeśli owner wybierze TS-B, **STOP** tej poprawki; stworzyć odrębny plan wielotabelowego reopen i audytu. T051 Swiss pairings to inne, późniejsze zadanie, nie dokładać do tego patcha.

## 5. Faktyczne działania A80 / STOP / next owner

**Wykonane:** bezpośredni GitHub recheck instrukcji, aktualnych SHA PR32/42/45/51/54, file diffs, reviews, workflow, źródeł SE/RR/Swiss/DE/test helpera, decyzji i fixture; 11 in-memory model checks; utworzono kartę decyzji owner/HQ i ten raport w docs/web-005 na kontrolnej gałęzi. **Zmodyfikowany kod aplikacji: 0; nowy PR: 0; DB/CI/manual: 0.**

**NOT_EXECUTED:** fizyczny PG16, Node unit/integration, pełny typecheck, browser/RTL, niezależny A60 acceptance, composite. Nie ma podstaw do RUNTIME_VERIFIED/RELEASE_GO.

**Hard STOP:** brak edycji PR45, merge/cherry-pick/rebase, composite branch, shared/prod SQL/DDL, migracji, płatnego manual CI rerun, staging/live/Replit, SWARM-006.

**NEXT dla A00:** uzyskać podpisy owner/HQ (najpierw TS-A/TS-B), przydzielić A50 prawdziwy bezpieczny PG16 preflight+RR test PR45 i A60 osobny exact-SHA verdict; dopiero po wynikach i rozwiązaniu konfliktów wystąpić o nowy kodowy GO. Swarm-006 jedynie po formalnym zamknięciu całego WEB-005.

**FINAL:** A80_R14_SOURCE_ONLY_COMPLETE / OWNER_POLICY_OPEN / P12_PG16_NOT_VERIFIED / INDEPENDENT_QA_PENDING / RELEASE_NO_GO.
