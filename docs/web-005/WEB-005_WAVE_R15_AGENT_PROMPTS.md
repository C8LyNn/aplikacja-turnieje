# WEB-005 — FALA R15 — JEDEN CENTRALNY DOKUMENT PROMPTÓW AGENTÓW

**Wersja:** R15.1 — 2026-10-14 (Europe/Warsaw)  
**Projekt:** WEB-005 / aplikacja-turnieje · **Koordynator:** A00 — lokalny Implementation Lead (jedyna Queen/HQ działa w osobnym projekcie)  
**Repo:** \`C8LyNn/aplikacja-turnieje\`; **centralna gałąź dokumentacji:** \`chore/web-005/t000-wave1-control\`  
**Obowiązujące źródła:** otrzymany \`WEB-004_TO_WEB-005_HANDOFF_R2_2026-10-14.md\`, \`docs/web-005/BACKLOG.md\`, \`DECISIONS.md\`, centralny R14, R14 manifest A10, rzeczywiste PR/CI oraz agentowe raporty R14 na gałęziach dokumentacyjnych.  
**Stan:** R14 zakończona na poziomie agentów, **WEB-005 nadal w toku**. 21 niepołączonych candidate PR #34–54, all OPEN DRAFT, brak integrated SHA, brak dowodu pełnej aplikacyjnej runtime QA. **SWARM-006 HOLD / RELEASE NO-GO.**

> **Wspólny kontrakt dla 13 agentów.** Odczytaj §0–§2 i sekcję \`AGENT Axx\` odpowiadającą rzeczywistemu identyfikatorowi wątku. Nie deleguj sobie pracy innych. Nie traktuj dokumentu planistycznego jako autoryzacji merge, produkcyjnego testu, API/polityki czy cross-swarm handoffu.

## §0 — Reguły operacyjne R15

1. **R15 ma dwie bramki P0:** (A) rzeczywisty, wykonywalny i bezpieczny tor testów (A50), (B) niezależne źródłowe QA na aktualnych SHA i publikacja odbieralnych artefaktów (A60). Nie wolno dalej traktować napisanego testu, statycznego harnessu albo FAIL starego Pack19 jako wyniku testów nowych funkcjonalności.
2. **Raporty dostępne dla 00:** R14 dokumentacja A80/A110/A120 jest obecna w centralnym repo, a A70/A90/A100 mają raporty na osobnych gałęziach dokumentacyjnych. Manifest A10 R14 istnieje w wewnętrznej bibliotece. **Nie udało się w bieżącym przeglądzie zlokalizować bezpośredniego, zweryfikowanego tekstu końcowego R14 A50 i A60.** To nie oznacza, że agenci nie pracowali — R15 wymaga **jednoznacznych adresów URL do ich rzeczywistych raportów**, komend/exit i source-acceptance. Bez nich status pozostaje \`NOT_VERIFIED_BY_COORDINATOR\`. Nie fabrykuj wyników.
3. **Wymuszona komunikacja:** każdy agent umieszcza swój końcowy R15 raport w GitHub w \`docs/web-005/agent-reports/Axx/WEB-005_Axx_R15_HANDOFF.md\` na centralnej gałęzi dokumentacyjnej (jeśli ma uprawnienie zapisu) **albo** na odrębnej gałęzi dokumentacyjnej/review PR, przesyłając A00 dokładny publiczny URL oraz SHA; gdy GitHub zapis jest niedostępny — podaje kompletny raport w swoim wątku i jawny status \`PUBLICATION_BLOCKED\`. **Nie zakładaj automatycznego przekazywania informacji pomiędzy wątkami**. Nie edytuj jednego raportu innego agenta ani wspólnych promptów.
4. **Kod R15:** maksymalnie **jeden WARUNKOWY code lane**, A100/T080-S2B, i tylko po niezależnej A60 potwierdzonej luki źródłowej lub rzeczywistym teście A50; A00 musi wydać odrębne \`R15-S2B-CODE-GO\` oraz wskazać ekskluzywne pliki/hunki. **Do wydania GO agent A100 działa SOURCE-ONLY + test-first.** Pozostałe Axx nie tworzą nowych PR ani nie zmieniają aplikacyjnego kodu. Nie rozwiązywać za SWARM-006 istniejących kolizji między PR-ami.
5. **Konkretna nowa blokada jakościowa A100 R14:** w PR53 \`removeTournamentAuthQueries\` dopasowuje URL-prefix \`/api/tournaments/<id>\`, ale istniejące React Query klucze \`["tournaments", id, "player-bans"]\` i \`["matches", matchId, "game-picks"]\` są poza tym predykatem. Match-only key wymaga rzetelnego mapowania match→tournament, **nie** globalnego czyszczenia całego cache. A100 wskazał też istniejący test \`use-tournament-auth.test.tsx\` z \`AuthProvider\` bez \`QueryClientProvider\`; PR53 używa \`useQueryClient\`. To SOURCE_CONFIRMED potencjalny błąd kompatybilności fixture, ale runtime FAIL nie jest jeszcze udowodniony. A50/A60 **najpierw** odtwarzają.
6. **Wszystkie 21 istniejących PR są zamrożone jako draft** poza fixem formalnie zatwierdzonym przez A00 z konkretnym SHA/FAIL. Przed każdym działaniem odczytaj najnowszy GitHub HEAD. Data/sha poniżej to snapshot 2026-10-14. Nie oznaczaj source acceptance bez podpisu A60 na tym samym SHA. Lokalna akceptacja tylko małej części nie jest GO release.
7. **Bezpieczny test runtime:** Node22/pnpm10 + rzeczywisty pełny checkout dla frontend-only bez bazy; PG16 tylko na fizycznie odizolowanej disposable bazie po preflight A20/A50, jawnej zgodzie owner/HQ na reset ograniczony schematem \`tm_test_*\`, z \`TEST_DATABASE_URL\` bez fallbacku do \`DATABASE_URL\`. Brak access → \`BLOCKED\` z kopiowalnym runbookiem dla autoryzowanego wykonawcy, nie \`PASS\`. Zakaz uruchamiania płatnego GitHub CI/re-run bez zgody.
8. **CI Pack19:** automatyczne działania dla PR52/53/54 kończą się FAIL na wcześniejszym release matcherze \`readOnly:true\` vs aktualne \`accessMode:"read only"\`. Poprawka **PR35 już istnieje**. Nie duplikuj, nie deklaruj testów nowych PR wykonanych przez CI ani nie fałszuj obligatoryjnych gate. Nie tworzyć composite branch w WEB-005.
9. **POLICY_OPEN / owner decision**: T055 Basket CAS 409 vs 412/ETag/version/legacy; Terminal Swiss TS-A deny vs TS-B atomic reopen; SE generated/actionable; Swiss rematch/BYE/NC; DE GF runner-up; Backup B2 portable history/revisions/legacy; public Direct Revert match CAS+completion action ID/Host; Steam missing-secret 403/503; auth TTL/digest. W R15 agenci źródłowi przygotowują krótkie podpisywalne alternatywy, **nie wybierają ich za ownera**.
10. **Granice między rojami:** WEB-004 skończył audyt, żadnych nowych raportów. WEB-005 kończy cały zaakceptowany HANDOFF R2 i przedstawia formalny closeout z jawnie owner-approved wyjątkami. Dopiero potem **jedno końcowe** przekazanie do SWARM-006 po osobnej decyzji owner/HQ; SWARM-006 wykona przyszłą integrację, kompozytową QA i deployment. SWARM-007 rozwija standardy i Google Drive niezależnie; żaden transfer nie jest domniemany.
11. **HARD STOP:** no merge/cherry-pick/rebase to release/main, staging/live, Replit integrator, prod SQL/DDL, shared DB reset, secret/token logging, paid CI unauthorized, deploy, self-review, hidden policy changes, imagined PRs.
12. **Końcowy raport R15:** \`AGENT/TASK, SOURCE_BASE/HEAD/PR, exact changed/reviewed paths, actual test command/env/exit + artifacts or NOT_EXECUTED, independent A60 verdict/status, policy/owner, blockers and fix lane GO/STOP, next action, publication URL, release NO-GO\`. Wątek kończy pracę możliwą teraz; nie obiecuje prac działających w tle.

## §1 — Snapshot SHA i zależności / źródło: GitHub na koniec R14

\`release/tournament-ops-20261013-01\` HEAD \`1fdc401d87c6bffe6bf7312dfc9db681b689dcf7\`. Każda zmiana jest osobnym PR opartym o release, jeszcze nie kompozytem.

| Packet | PR | Scope / owner | HEAD SHA |
|---|---|---|---|
| P01 | #35 | Pack19 / A10 | \`7cb283aa82273a1e22daf9051a82311eef53760c\` |
| P02 | #36 | Pack20–26 / A40 | \`85ad0b86136fc3491c9ef18663d9b01396179349\` |
| P03 | #34 | Steam write guard / A30 | \`fae2eea2f22df3f1b02ad035a7db00bc411ea73f\` |
| P04 | #37 | trusted proxies / A30 | \`fcfd8a6f5b997c90f2b62f0a3529fa64287a03d7\` |
| P05 | #38 | offline migration ledger validator / A20 | \`2d36864f4d2f1c838073f387fd3c8efb3378c43b\` |
| P06 | #39 | Cancel/Restore MP1 / A70 | \`16053ee132756ca05b6f2cd1f0cabae823905387\` |
| P07 | #40 | Pack17 fail-closed / A40 | \`9a8287271299a59fc9291b8d253299a8d109a35d\` |
| P08 | #41 | Backup B1 preclone / A90 | \`e847cb705296a48ab5c68ece96776cd0e0bbb417\` |
| P09 | #42 | Undo LIFO MP2A / A70 | \`1ae0ccb801f4177052bff1ec7041e55b8c992c8b\` |
| P10 | #43 | CSV FileReader / A110 | \`96a6068f69027574ac76e18d4d5a2c444b5a914a\` |
| P11 | #44 | post-lock bans/picks / A100 | \`2f0187b7242681c394c09058b5ef647667206bd6\` |
| P12 | #45 | terminal RR roster / A80 | \`a7a87bc019731191dbfa44bee6939e3fa25e27f4\` |
| P13 | #46 | guarded DELETE / A100 | \`7f60849e389a7ed35fdd39dd5493c4c4c267d860\` |
| P14 | #47 | DE presentation / A120 | \`f09a13623faca8d7ab29b09a2c5b43907c2acd0b\` |
| P15 | #48 | Backup B3A snapshot / A90 | \`2a8a4c72cb4a3a37402a346fd0acc83b03b39be3\` |
| P16 | #49 | password/visibility auth / A100 | \`99298b81501c3e7764d653604923522a19b9f05c\` |
| P17 | #50 | Backup preview / A110 | \`5457a74187edc263730c3a4b25a663bdf5531ee9\` |
| P18 | #51 | malformed Undo payload / A70 | \`2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a\` |
| P19 | #52 | stale stage modal / A110 | \`cce73ec47445102b216b3f8eceb4ec9de67eb1a7\` |
| P20 | #53 | private cache S2A / A100 | \`6a8f0c3e5775eb056df75ebdd7b33df7cbc78979\` |
| P21 | #54 | RR readback PR-B / A120 | \`dbba0eb82920b4f324866b1b983e1211459f52ec\` |

**Registry:** A10 R14 confirms P01–P21 internally; zero verified new PR in R14. 21 OPEN DRAFT / unmerged. \`QA_ACCEPTED_FULL=false\`, \`RUNTIME_VERIFIED_FULL=false\`, \`integrated_sha=null\` according to R14 A10 manifest. Some scoped/source verdicts exist from prior A60 matrices, **not automatically complete runtime acceptance**.  
**Confirmed GitHub Actions:** PR52 run 38605694664, PR53 run 38606179795, PR54 run 38606249912 completed FAILURE at preceding Pack19 stage; target RTL not executed in those workflows. Do not use these failures as a verdict on a specific new feature.

**Conflict / dependency clusters (not a request to merge):**
- Backend: PR39/42/44/46/51 share \`routes/tournaments.ts\`; security PR49 \`routes/auth.ts\`.
- Backup: PR41/48 share \`backup-v3.ts\` and some integration-test paths.
- Frontend: PR43/50/54 all touch \`tournament-detail.tsx\`; PR47 stage progress presented by PR54; PR53 auth cache related to private-data projections.
- CI: PR35 Pack19 matcher prerequisite for full future composite gate; PR36 Pack20–26; PR40 Pack17.
- Product policy: T055, Swiss/SE/DE, Backup B2, direct Revert CAS unresolved; no implied GO.

## §2 — Obowiązki i przydział wątków R15

| Wątek | Zadanie R15 | Mode |
|---|---|---|
| A00 | QA receipt closure, owner policy decisions, backlog/GO control | COORD |
| A10 | P01–P21 pinned registry, A50/A60 receipt links, final-only DAG | DOCS READ ONLY |
| A20 | isolated PG16 preflight and migrations/ledger gate | SOURCE ONLY |
| A30 | independent security peer for PR53 residual and auth PRs | READ ONLY |
| A40 | Pack19/17 CI source & non-composite test execution strategy | SOURCE ONLY |
| A50 | **P0** execute safe real tests or definitive executable blocker + report URL | TEST / SAFETY |
| A60 | **P0** publish signed independent exact-SHA source matrix + report URL | STRICT READ ONLY |
| A70 | MP2B public Revert policy/Host contract + PR39/42/51 QA | SOURCE ONLY |
| A80 | terminal Swiss, SE, Swiss/DE owner decision signatures + PR45 QA | SOURCE ONLY |
| A90 | Backup B2 portability/history owner D1–D6 + B1/B3A test contracts | SOURCE ONLY |
| A100 | S2B noncanonical cache key issue — test-first; **CODE HOLD until A60 + A00 GO** | CONDITIONAL ONE-LANE |
| A110 | T055 Basket CAS D1–D6 and frontend source QA | SOURCE ONLY |
| A120 | DE/RR PR47/54 readback source & executable tests | SOURCE ONLY |

**R15 progress measure:** usable artifacts/test receipts, NOT number of new draft PRs. A00 only starts one narrow code lane after independent fail/source confirmation plus authorized file ownership; otherwise all 13 agents deliver QA/owner decisions.

---

## AGENT A00 — R15 Implementation Lead / Evidence & Decision Gate

**TASK:** \`WEB-005-T000-A00-R15\`. **MODE:** COORDINATION / NO RELEASE.

1. Verify all 21 PR HEADs, R14 A10 registry, available A70/A80/A90/A100/A110/A120 reports. Locate and obtain **direct** R14 A50/A60 execution/source acceptance reports (actual URL/text), rather than inferring from A10 secondary quotes.
2. Define single canonical report address per agent and require R15 uploads/links. Ensure A50 and A60 are discoverable for subsequent turns/coordinator.
3. Prioritize runnable frontend-only React tests PR43/47/50/52/53/54. If A50 cannot run due to missing full checkout/deps, identify exactly what owner action makes that possible; do not repeat vague test-environment plans. For PG16, request explicit safe disposal database approval, not production.
4. **R15 only conditional source repair option:** A100 S2B noncanonical \`player-bans\` and \`game-picks\` query cache mismatch and QueryClientProvider fixture. Demand A60 exact-SHA independent verification and A50 reproducer; issue separate \`R15-S2B-CODE-GO\` with exclusive helper/test file windows **only if** real source gap proved and remediation is contained. If not, no new PR.
5. Assemble one owner/HQ **decisions required** packet from A70/A80/A90/A110 with clearly labeled alternatives, compatibility and smallest affected code patch, request signature rather than choose silently.
6. Maintain \`finding → task → agent → PR HEAD → source accepted? → runtime evidence? → policy owner → status\` for accepted WEB-004 R2 backlog; close only truly reconciled findings or formally owner-dispositioned exceptions.
7. Record explicit unintegrated collision DAG and final-only SWARM-006 mandate; do not initiate SWARM-006 or create candidate branch.
8. At wave end determine whether R16 can be narrow code fix (after policy) or further test-only acceptance. Publish measurable counts, don't guess finish date.

**DELIVERABLE:** \`WEB-005_A00_R15_QA_RECEIPTS_POLICY_GATE.md\`, current backlog/decisions, A50/A60 report URLs and exact pending owner actions. **STOP:** merge, prod/SQL, SWARM-006.

## AGENT A10 — Internal Manifest, QA Receipt and Dependencies

**TASK:** \`WEB-005-T018-A10-R10\`. **MODE:** DOCS / READ-ONLY.

1. Reuse \`WEB-005_A10_R14_PACKAGE_MANIFEST.json\` and packet index; verify P01–P21 mapping, SHA/release base, file checksums only where drift, no rebuilding from scratch.
2. Add **receipts fields** per packet: \`a50_test_report_url\`, \`a50_exact_sha_command_exit\`, \`a60_source_verdict_url\`, \`a60_exact_sha\`, \`owner_policy_id\`, \`rollback\`, \`cross_file_conflicts\`. Null when no real evidence; do not write \`RUNTIME_VERIFIED\` for harness/source tests.
3. Recheck GitHub PR #34–54 and any new A00-approved S2B code PR only after it exists, not an invented P22. Preserve independent critical dependency DAG and duplicate Steam #33 HOLD.
4. Keep \`QA_ACCEPTED\` false/unknown without independent exact proof; ensure A60 source verdict and A50 runtime receipts can be directly audited by URL.
5. Supply to A00 a concise 21-row dashboard with counts of SOURCE_READY/SOURCE_ACCEPTED/RUNTIME_VERIFIED/POLICY_OPEN and field coverage. This is not SWARM-006 handoff.
6. Describe SWARM-007 handoff metadata needs and Drive archive receipts without asserting folder creation or synchronization.

**DELIVERABLE:** \`WEB-005_A10_R15_QA_RECEIPT_INDEX.md\` + JSON manifest. **STOP:** external dispatch/integration/merge.

## AGENT A20 — Test PG16 Preflight, Historical Migration Ledger

**TASK:** \`WEB-005-T021-A20-R10\`. **MODE:** SOURCE-ONLY / TEST SAFETY.

1. Verify PR38 offline validator HEAD and migration history 0030–0031; \`REVIEW_ONLY\` and \`ready_for_sql:false\` stay unchanged.
2. Provide **safe nonmutating preflight** for A50 to independently prove host/DB identity, dedicated disposable test-only schema, permissions/reset boundaries and installed test fixture migrations without mutating shared/prod DB.
3. If no physical PG16 test DB is accessible, specify executable owner setup instructions for local Windows/Docker/approved runner with dedicated host/database, no hidden production fallback. No claims of completed setup or data access.
4. Map API test dependencies for PR39/41/42/44/45/46/48/49/51; define exact test commands/gates and abort conditions.
5. Cooperate with A50/A60 without running SQL adoption or editing app code.

**DELIVERABLE:** \`WEB-005_A20_R15_SAFE_PG16_RUNBOOK.md\` and explicit blockers. **STOP:** SQL/DDL on real systems, production/test reset without approval.

## AGENT A30 — Security Peer: cache blind spots & privileged endpoints

**TASK:** \`WEB-005-T030-T031-A30-R13\`. **MODE:** READ ONLY.

1. Independent source verify A100 R14 identified key mismatch in PR53: \`["tournaments",id,"player-bans"]\` and \`["matches",matchId,"game-picks"]\` versus URL-string query matcher. Confirm precise affected queries/renderers, role boundaries and static-only vs observed behavior.
2. Propose safe keyed query ownership/metadata for match-only cache so tournament A logout cannot retain private B data but other public tournaments are not globally wiped. Do not code.
3. Review PR44/46/49 stale organizer mutations and PR34 Steam / PR37 proxy negative/positive security source status; publish source-only security matrix for A60 and exact test fixtures to A50.
4. Distinguish actual 401/403 unprivileged behavior from inferred UI leak; no penetration/prod actions, no token logging.
5. Identify owner decision necessary (if any) vs pure privacy bug repair eligible for A00 conditional GO.

**DELIVERABLE:** \`WEB-005_A30_R15_SECURITY_CACHE_VERDICT.md\` and signed peer recommendation. **STOP:** code/merge.

## AGENT A40 — Pack19/17 CI strategy, not new contracts

**TASK:** \`WEB-005-T010-T017-A40-R15\`. **MODE:** READ ONLY / TEST GUIDANCE.

1. Verify PR35 corrected read-only matcher and full release old matcher; inspect current automated jobs on selected PRs. Maintain clear \`OLD_BASELINE_PACK19_FAIL\` vs feature-specific test stage NOT_EXECUTED.
2. Prepare **exact targeted per-SHA frontend commands** that invoke real test runner without previous full CI Pack19 stage, but still preserve untouched final Pack17/full gate contract. Do not author a fake green summary or composite branch.
3. Advise A50 on \`pnpm\`, \`node --import tsx\`, DOM setup and \`TSX_TSCONFIG_PATH\` only from actual repository scripts, with known failure modes; don't guess invocation.
4. Verify Pack17 \`--full\` ready for physical PG16 once owner preflight authorizes tests; no paid CI rerun/runner rewrite.
5. Escalate exact signed issue to A00 if a *new* contract regression besides PR35/PR36 appears.

**DELIVERABLE:** \`WEB-005_A40_R15_REPRODUCIBLE_TEST_COMMANDS.md\`. **STOP:** duplicate P01/P07 implementation.

## AGENT A50 — P0 Executed Runtime / Executable Blocker

**TASK:** \`WEB-005-T133-A50-R10\`. **MODE:** SAFE TEST EXECUTION OR PRECISE BLOCKER.

1. **Publish your actual R14 outcome** (report permalink and exact test commands/exits) so A00 can distinguish tests executed from plans. If no R14 real tests, explicitly state \`RUNTIME_NOT_EXECUTED\` and why.
2. Recheck environment access: full monorepo checkout of each PR exact HEAD, frozen Node22/pnpm10 dependencies, and dedicated physical PostgreSQL16. DO NOT assume connected user PC, ephemeral GitHub job ability or paid CI authorization.
3. **Frontend first**: if checkout+deps work, execute targeted no-DB RTL/typecheck PR43, PR47, PR50, PR52, PR53, PR54; for PR53 **run existing \`use-tournament-auth.test.tsx\` first** to verify the QueryClientProvider wrapper issue, plus R14 R01 player-bans and R02 game-picks cache tests at exact SHA. Capture exit/TAP/errors.
4. **PG16 second** only with A20 independent physical isolation and explicit reset consent: targeted PR39/41/42/44/45/46/48/49/51. Exact positive/zero-write negative and transaction race results required. No shared/prod DB.
5. If direct execution is impossible, deliver **a single copy-paste safe Windows/PowerShell or approved CI executor packet** pointing to precise Git HEAD, pnpm commands, dependencies, test-only PG setup/preflight and strict STOP conditions; name the specific owner action needed. A blueprint alone is not runtime PASS.
6. Supply artifacts via directly readable \`docs/web-005/agent-reports/A50/WEB-005_A50_R15_HANDOFF.md\` or validated URL; deliver A60 exact output for independent verdict; A10 checksum/pins.
7. No manual paid GitHub Actions rerun without owner GO; no generation of a fake runtime-success receipt.

**DELIVERABLE:** \`WEB-005_A50_R15_EXECUTION_OR_BLOCKER.md\` + test matrix with real \`run_state\`. **STOP:** unsafe test, fabricated PASS, autonomous background work.

## AGENT A60 — P0 Independent QA and Signed Source Verdicts

**TASK:** \`WEB-005-T130-A60-R15\`. **MODE:** STRICT READ ONLY, INDEPENDENT.

1. **Provide direct, verifiable URL to your final R14 QA report** (if existing), plus exact current per-PR matrix; no A10 secondary quotation in lieu of original independent A60 evidence. Publish R15 verdicts to designated readable GitHub path or new docs branch and hand A00 URL.
2. Prioritize source review **PR53 + A100 R14 R01/R02/Q01**: matcher omissions for player bans and game picks, QueryClientProvider mismatch in existing React test. Issue \`SOURCE_FAIL\` or \`SOURCE_ACCEPTED_CONDITIONAL\` with exact SHA/paths and test-first acceptance; do not accept full privacy claim if uncovered caches remain.
3. Independently review PR52 stale modal and PR54 RR readback; ensure negative stale submit/no-leak and positive lawful operation, without calling authored RTL PASS before A50 executes.
4. Reconcile 21 existing package source acceptance using previous A60 matrices and exact pinned HEAD, avoiding re-review of unchanged accepted source but surfacing missing QA. \`QA_ACCEPTED\` requires scope/executed test and no unresolved blocker; \`RUNTIME_VERIFIED\` only with A50 exact output.
5. On A50 actual regression output decide whether A100 S2B narrow code repair is justified; recommend precise GO/STOP to A00 with minimal file ownership. No code patches by A60.
6. Keep original WEB-004 38-row audit provenance immutable; track current finding closure separately, not by overwriting original 0 PASS/3 FAIL/33 BLOCKED/2 NOT_RUN numbers.
7. Publish 21-row signed \`source/runtime/policy\` matrix with actionable closeout blockers and URLs in canonical report path. No unconditional release/integration signoff.

**DELIVERABLE:** \`WEB-005_A60_R15_INDEPENDENT_QA.md\` plus machine-readable status matrix and URLs. **STOP:** author self-review, code/merge/deploy.

## AGENT A70 — Undo Direct Revert CAS owner signoff

**TASK:** \`WEB-005-T040-A70-R15\`. **MODE:** SOURCE-ONLY.

1. Freeze PR39/42/51. Verify exact heads and dependencies, give A50 PostgreSQL race/rollback/409/422/valid path tests and A60 source expectations.
2. Turn R14 MP2B policy into one **owner-signable two-option** contract: STRICT public expectedMatchRevision+expectedCompletionActionId vs explicitly time-boxed backward-compatible Host transition. Specify missing/malformed 422 or existing error, stale 409/zero-write, completion-ID discovery >50 logs and OpenAPI/Zod/React parity.
3. Mark owner signature required; do not choose policy. Prepare smallest future patch ownership window that won't collide with auth routes/PR39/42/51; no code until A00/HQ decision and new GO.
4. Separate T040 Undo LIFO from domain Backup B2 historical revision parity, working with A90/A20 source-only.

**DELIVERABLE:** \`WEB-005_A70_R15_MP2B_SIGNABLE_POLICY.md\`. **STOP:** Undo patch or merge.

## AGENT A80 — Swiss/SE/DE Sporting Owner Decisions

**TASK:** \`WEB-005-T050-T051-A80-R8\`. **MODE:** SOURCE-ONLY.

1. Reuse R14 one-page policy for completed Swiss TS-A deny 409 no writes vs TS-B atomic reopen. Provide explicit compatibility/future effect, await owner signature before coding.
2. Consolidate SE actionable vs max-generated pointer, Swiss avoidable rematches+BYE/NC order/determinism, DE GF runner-up/ranks 3–N; no invented default or new sweep audit.
3. Check PR45 current SHA; A50 isolated PG16 SE8→RR4 roster test and A60 exact acceptance still required if no new evidence. Pass precise positive/nonqualifier side-effect expected results.
4. Select **one** smallest future policy-dependent implementation request after signed decisions; no source changes R15.
5. Preserve withdrawn findings from WEB-004, no ghost patches.

**DELIVERABLE:** \`WEB-005_A80_R15_SPORTING_OWNER_DECISIONS.md\`. **STOP:** backend sport code.

## AGENT A90 — Backup B2 portability/history owner gate

**TASK:** \`WEB-005-T060-A90-R8\`. **MODE:** SOURCE-ONLY.

1. Reuse R14 B2 D1–D6 owner policy: modern strict profile/legacy identification, history latest-match invariant, CAS revision portability, action log ordering/completion Undo, nested IDs, typed 400/rollback. Clarify V3 \`resultHistory\` and \`actionLog\` properties required, array may be empty; \`undoPayload\` nullable. No silent strict invalidation of historically legal backup.
2. Recheck PR41/48 exact SHA, real A50 PG16 receipts if any; absent receipts = no runtime PASS. A60 source QA independently needed.
3. Provide deterministic 12 corrupt/valid legacy and concurrent MVCC snapshot fixture runnable on approved disposable PG16, identify test DB/schema dependencies A20.
4. Prepare smallest policy-approved B2 source patch request with no DDL or broad redesign; hold code pending owner signoff and future GO.

**DELIVERABLE:** \`WEB-005_A90_R15_BACKUP_B2_SIGNABLE_POLICY.md\`. **STOP:** backup code/migrations.

## AGENT A100 — T080 S2B noncanonical private cache blind spots (ONE CONDITIONAL LANE)

**TASK:** \`WEB-005-T080-A100-S2B-R15\`. **MODE:** SOURCE-ONLY FIRST. CODE **ONLY AFTER** A60 independent source FAIL or A50 real reproducible test + explicit \`R15-S2B-CODE-GO\` from A00.

1. Reuse R14 \`WEB-005_A100_R14_S2A_SECURITY_QA_AND_RESIDUAL.md\`. Recheck exact PR53 HEAD and baseline \`getPlayerBansQueryKey(tournamentId)=["tournaments",id,"player-bans"]\`, \`getMatchGamePicksQueryKey(matchId)=["matches",matchId,"game-picks"]\`; URL prefix predicate does not cover them. Also recheck existing \`use-tournament-auth.test.tsx\` provider fixture; no runtime verdict without test.
2. Write **three test-first negative contracts**: logout/revocation preserves unrelated public B but evicts A player bans, evicts A match picks via explicit match→tournament ownership/mapping, and existing AuthProvider hook test mounts valid QueryClientProvider. Delayed in-flight responses cannot repopulate private A-visible cache.
3. Submit test contract to A50/A60 first. If no source leak after full graph/data ownership check or tests disprove, return \`SOURCE_RECONCILED/NO_NEW_PR\`; don't write code merely because a match key differs.
4. **After written A00 GO only:** implement smallest isolated S2B remediation preserving existing PR53 behavior; no global match-cache purge and no false use of numeric match ID as tournament ID. If reliable match→tournament mapping requires invasive unapproved read model, HOLD and report instead. Fixture provider issue may need a separate 1-file scoped code window; don't change independent code/other agents' files without GO.
5. New isolated branch from release; record dependency on unmerged PR53, no cherry-pick/merge of PR53 into R15 patch, no backend auth/TTL/hash changes, no prod/CI spending. A30 peer, A50 runtime, A60 exact-head source QA.
6. Report \`NO_PR\` or actual draft PR/sha, tests executed/not, and exact residual privacy coverage.

**DELIVERABLE:** \`WEB-005_A100_R15_S2B_TEST_AND_PATCH_OR_HOLD.md\`. **STOP:** code before explicit new GO.

## AGENT A110 — Basket CAS owner decision and frontend acceptance

**TASK:** \`WEB-005-T055-T110-A110-R15\`. **MODE:** SOURCE ONLY.

1. Reuse R14 signed-template \`WEB-005_A110_R14_T055_OWNER_DECISION_1P.md\` as pending owner D1–D6: token/value/If-Match or JSON, status 409 vs 412, missing precondition/legacy, stage/roster invalidation, saved draft/reconciliation. **No implementation without policy.**
2. Recheck PR43/50/52 exact source and A50/A60 test receipts; authored hook/RTL definitions (5/10/7) ≠ tests run. Provide independently runnable frontend commands and positive/negative cases, no extra PR.
3. Keep UX044 Host dirty navigation as a separate product choice block/retain, UX016 only with confirmed source; withdrawn StageBasketsPanel A→B/backup-overwrite claims stay withdrawn.
4. Inform A100/A30 of privacy-state intersection with S2B, A120 of PR43/50/54 shared tournament-detail path; no merging.
5. Deliver one immediate owner/HQ signature request and next smallest approved T055 implementation request, not a patch.

**DELIVERABLE:** \`WEB-005_A110_R15_BASKET_OWNER_DECISION_AND_QA.md\`. **STOP:** frontend/backend code.

## AGENT A120 — Presentation/Bracket Source & Browser QA

**TASK:** \`WEB-005-T100-A120-R15\`. **MODE:** SOURCE ONLY.

1. Freeze PR47 DE PR-A and PR54 RR PR-B, recheck exact SHA, independent source reviews and A50 real RTL/typecheck/browser evidence. Don't label external Pack19 FAIL a target test failure.
2. Publish one runnable bounded React/browser matrix: DE Upper/Lower/GF/Reset selected stage, correct five format labels, completed winner hero overlay, RR stage result N→N+1 external readback, stale late response, 401/403 private cache hide, unchanged DE no refetch storm.
3. Audit interactions with PR53 privacy eviction and S2B blind spots, and shared \`tournament-detail.tsx\` changes PR43/50/54; record required future SWARM-006 combined regression only, not actual merge.
4. State whether T100 needs any source patch beyond PR47/54 or is simply QA-blocked; no new PR or styling redesign.
5. Deliver test commands/expected to A50/A60 and a definitive source-vs-runtime status to A00.

**DELIVERABLE:** \`WEB-005_A120_R15_T100_ACCEPTANCE.md\`. **STOP:** application code/merge/deploy.

---

## §3 — Po R15: required A00 closure readout

A00 publishes at minimum:
- Latest PR candidate count and source SHAs (snapshot currently 21).
- Direct URL to each A50 and A60 report and SHA-verifiable test/source verdict matrix.
- Number of confirmed application \`RUNTIME_VERIFIED\` vs \`NOT_EXECUTED/BLOCKED\`.
- R15-S2B GO/NO-GO decision with test-backed evidence.
- Owner policy signatures acquired vs outstanding.
- Accepted WEB-004 HANDOFF R2 findings still lacking implementation/QA.
- Whether the next wave should be actual coding after signed decisions, test execution or closeout.
- **SWARM-006 stays HOLD** until full WEB-005 closeout and explicit owner/HQ handoff GO. No automatic forwarding on mere R15 completion.

## §4 — Krótki wspólny prompt do wszystkich agentów

WEB-005 — START FALI R15

Otwórz centralny dokument:
https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R15_AGENT_PROMPTS.md

1. Odczytaj wspólne zasady §0–§2.
2. Rozpoznaj własny identyfikator Axx z roli wątku.
3. Wykonaj wyłącznie zadania w sekcji AGENT Axx w przyznanym trybie GO/STOP.
4. Sprawdź aktualne HEAD/SHA, PR, dowody QA.
5. Opublikuj raport R15 pod jednym bezpośrednio czytelnym linkiem GitHub (albo zgłoś PUBLICATION_BLOCKED) i przekaż ten link A00.
6. Nie przejmuj zadań innych agentów, nie uruchamiaj SWARM-006 i nie scalaj kodu.
