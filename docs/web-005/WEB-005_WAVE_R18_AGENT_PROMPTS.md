# WEB-005 — FALA R18 — DOMKNIĘCIE ZAKRESÓW ŹRÓDŁOWYCH I BRAMKA KOŃCOWEGO HANDOFFU

**Wersja:** R18.1 / 2026-10-14 / Europe/Warsaw  
**Rola 00:** lokalny WEB-005 Implementation Lead, podporządkowany jednemu globalnemu HQ/Queen  
**Repozytorium:** C8LyNn/aplikacja-turnieje  
**Gałąź centralnych instrukcji:** chore/web-005/t000-wave1-control  
**Stan:** R17 zakończona przez agentów i zraportowana; 21 OPEN DRAFT PR #34–54; 0 merge do release; 0 natywnych app-testów wykazanych przez A50; **R18 READY / SWARM-006 HOLD / RELEASE NO-GO**.

## §0. Zasady wiążące dla wszystkich agentów

1. Każdy wątek odczytuje wspólne §0–§2 i wykonuje wyłącznie przypisaną sekcję **AGENT Axx**; identyfikator pochodzi z utrwalonej roli wątku. Nie przejmuj cudzych prac i nie tytułuj 00 osobną Queen.
2. **Zamykamy istniejące PR-y, nie mnożymy nowych.** W R18 są dokładnie 3 małe GO SOURCE-CODE ONLY na własnych istniejących gałęziach: **A70 PR42**, **A100 PR53**, **A120 PR54**. A90 PR41 (nowy HEAD) przechodzi wyłącznie QA. Żadne nowe PR, merge, cherry-pick, composite branch, paid CI rerun, deployment ani produkcyjna SQL nie są autoryzowane.
3. Przed działaniem sprawdź live PR HEAD/base/files; SHA z §1 to snapshot 2026-10-14. Nie przenoś akceptacji A60 ze starego HEAD na nowy. Rozdziel \`PATCH_REVISED\`, \`SOURCE_ACCEPTED\`, \`RUNTIME_VERIFIED\`, \`NOT_EXECUTED\`, \`SOURCE_BLOCKED\`, \`POLICY_OPEN\`, \`OWNER_WAIVER_REQUIRED\`.
4. **R17 niezależne dowody:** [A60 R17 QA](./agent-reports/A60/WEB-005_A60_R17_INDEPENDENT_QA.md), [A60 R17 matrix](./agent-reports/A60/WEB-005_A60_R17_PACKAGE_MATRIX.json), [A50 R17 receipt](./agent-reports/A50/WEB-005_A50_R17_RECEIPT.md). Nie wykonano natywnych RTL/API/PG16 aplikacji. Source conditional QA: PR41 poprawiony, ale nadal wymaga PG16. Źródłowe full-claim blokady: PR42 (roster Undo), PR53 (unknown-owner picks), PR54 (global RR403).
5. **A70 explicit file-scope GO** obejmuje w R18 nowy **wyłączny** plik \`artifacts/api-server/src/application/players/tournament-roster.ts\`, odpowiednie istniejące hunki \`src/routes/tournaments.ts\` dla mapowania 409 i \`test/revert-match.integration.test.ts\` na PR42. Jest to rozszerzenie poprzedniego niedostatecznego GO i ma usuwać blokadę A70 R17. Nie przejmuj PR39/44/46/51, nie zmieniaj MP2B Direct Revert.
6. **A100 explicit scoped GO** pozwala dopracować przypisywanie match→tournament do prywatnych \`game-picks\` w momencie utworzenia/fetch query, jeżeli dowód własności jest bezpiecznie dostępny; zakres własnej gałęzi PR53 i dokładne pliki zaufanych hooków/testów należy opisać przed zapisem, z wyłącznością od A00. Nie wolno globalnie usuwać cache \`matches\`, zgadywać po ID, modyfikować backendu ani token TTL. Jeśli brak bezpiecznej własności, \`HOLD\` + alternatywa z akceptacją owner/HQ, nie pozorowana prywatność.
7. **A120 explicit scoped GO** pozwala poprawić na własnej gałęzi PR54 błąd globalnego wyłączania legalnych DE/Overview przy historycznym RR401/403, pod warunkiem zachowania prywatności danych RR i poprawności wybranej ręcznie zakładki/stage. Nie cherry-pick PR43/47/50. Jeśli wymagane zmiany PR47-owned child \`stage-progress-view.tsx\`, HOLD ten subzakres i zgłoś A00 wyłączność/pliki przed pisaniem.
8. Testowanie fizycznego PG16 wymaga oddzielnej **jawnej zgody owner/HQ** i sprawdzenia dedykowanej bazy; żadnego fallback z \`TEST_DATABASE_URL\` do \`DATABASE_URL\`, destrukcyjnego resetu shared/prod. Frontend RTL wymaga pełnego repo checkout, Node22/pnpm10/frozen deps i rzeczywistych command/exit. Żadne testy napisane ale niewykonane nie są PASS.
9. **Ustalony warunek przekazania:** WEB-005 kończy cały uzgodniony backlog WEB-004 HANDOFF R2 przez naprawę/QA źródłowe albo formalną owner-approved decyzję \`POLICY_OPEN/BLOCKED/WONT_FIX\`. A60 raportuje dokładne pozostałe ryzyka. **Nie trzeba scalać 21 PR w WEB-005**; dopiero SWARM-006 łączy je i testuje kompozyt. Jeżeli brak natywnej walidacji na pojedynczych SHA, nie udawaj jej: niech A00 wystąpi do owner/HQ o **osobną wyraźną zgodę na HANDOFF WITH RUNTIME TEST DEBT**, wskazując, że SWARM-006 przejmie pełny zestaw nieuruchomionych testów jako STOP release gate. Bez tej zgody stosuje się dotychczasowy \`SWARM006 HOLD\`.
10. Policy wymagające signoff: terminal Swiss deny/reopen, SE pointer, Swiss BYE/rematches, DE ranks, T055 Basket CAS status/ETag/token, T060-B2 Backup portability/history/revisions, T040 public Direct Revert CAS+Host/active completion ID, Steam 403/503, session TTL/digest. Nie wybieraj ich za właściciela. WEB-004 nie tworzy dodatkowych audytów; SWARM-007 niezależnie obsługuje architekturę plików/Drive.
11. Końcowy agent handoff \`WEB-005_Axx_R18_HANDOFF.md\` z bezpośrednim URL, exact old/new SHA, code/test changes, RUN command+exit albo NOT_EXECUTED, niezależne A60 verdict, owner policy, blockers, next step. Jeśli publikacja niemożliwa: \`PUBLICATION_BLOCKED\`, pełna treść w wątku. R18 nie uruchamia automatycznie SWARM-006.

## §1. Snapshot po R17 (verify again!)

| Pakiet | PR | HEAD | A60 R17 |
|---|---|---|---|
| P01 | #35 | \`7cb283aa82273a1e22daf9051a82311eef53760c\` | scoped Pack19 |
| P02 | #36 | \`85ad0b86136fc3491c9ef18663d9b01396179349\` | scoped Pack20–26 |
| P03 | #34 | \`fae2eea2f22df3f1b02ad035a7db00bc411ea73f\` | conditional |
| P04 | #37 | \`fcfd8a6f5b997c90f2b62f0a3529fa64287a03d7\` | conditional |
| P05 | #38 | \`2d36864f4d2f1c838073f387fd3c8efb3378c43b\` | offline-only, no SQL |
| P06 | #39 | \`16053ee132756ca05b6f2cd1f0cabae823905387\` | conditional |
| P07 | #40 | \`9a8287271299a59fc9291b8d253299a8d109a35d\` | scoped Pack17, not --full |
| **P08** | **#41** | \`f03cf3d09988a04ba9c2856e205d21f994ff67f1\` | **source accepted conditional**, PG pending |
| **P09** | **#42** | \`25b09f1a48a85ae882b817118f5d8c23bffbe383\` | **SOURCE BLOCKED**, global roster LIFO absent |
| P10 | #43 | \`96a6068f69027574ac76e18d4d5a2c444b5a914a\` | conditional |
| P11 | #44 | \`2f0187b7242681c394c09058b5ef647667206bd6\` | conditional |
| P12 | #45 | \`a7a87bc019731191dbfa44bee6939e3fa25e27f4\` | conditional |
| P13 | #46 | \`7f60849e389a7ed35fdd39dd5493c4c4c267d860\` | conditional |
| P14 | #47 | \`f09a13623faca8d7ab29b09a2c5b43907c2acd0b\` | conditional |
| P15 | #48 | \`2a8a4c72cb4a3a37402a346fd0acc83b03b39be3\` | conditional |
| P16 | #49 | \`99298b81501c3e7764d653604923522a19b9f05c\` | conditional |
| P17 | #50 | \`5457a74187edc263730c3a4b25a663bdf5531ee9\` | conditional |
| P18 | #51 | \`2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a\` | conditional |
| P19 | #52 | \`cce73ec47445102b216b3f8eceb4ec9de67eb1a7\` | conditional |
| **P20** | **#53** | \`8f959733258aed0cab15298dd0684ca068045e6f\` | scoped accepted; **full privacy blocked** |
| **P21** | **#54** | \`dbba0eb82920b4f324866b1b983e1211459f52ec\` | RR refresh scoped accepted; **mixed historical RR403 UI blocked** |

All 21 PR #34–54 remain DRAFT/OPEN unmerged. Release source \`release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7\`. Do not create a composite branch. PR32 main release is separate, PR33 alternative Steam HOLD. Full A60 QA acceptance=NO, current observed native-app runtime tests=0. Existing manifest in [A10 R17](./agent-reports/A10/WEB-005_A10_R17_INTERNAL_STATUS.md) must update changed SHA.

## §2. Wątek / owner / R18 tasks

| Axx | Role | Mode |
|---|---|---|
| A00 | Koordynacja, 3 scoped code GO, owner policy and runtime-debt decision, final handoff gate | COORD |
| A10 | Internal final-only 21-packet manifest, QA evidence, conflict DAG and waivers | DOCS |
| A20 | Isolated PG16 test setup safety + migration ledger REVIEW_ONLY | SOURCE |
| A30 | S2B match owner security peer + Steam/proxy/auth negative contracts | SOURCE |
| A40 | CI Pack19/17 actual test path + TAP parser issue triage | SOURCE |
| A50 | P0 authorized real test executor or exact blocker + owner request | SAFE TEST |
| A60 | P0 independent exact-SHA review 3 changed PR plus full backlog / handoff conditions | STRICT QA |
| **A70** | PR42 global roster Undo LIFO inside roster service transaction | **CODE L1** |
| A80 | Swiss/SE/DE policy signoffs + PR45 QA | SOURCE |
| A90 | PR41 conditional source acceptance + Backup B2 policy | SOURCE |
| **A100** | PR53 safe match-owned cache eviction on unknown-owner picks | **CODE L2** |
| A110 | T055 Basket CAS decision + frontend QA | SOURCE |
| **A120** | PR54 local RR401/403 guard preserving DE/Overview | **CODE L3** |

### AGENT A00 — Implementation Lead

**TASK:** WEB-005-T000-A00-R18. Verify R17 PR HEAD/QA. Assign narrow existing-branch GO to A70 (new file \`tournament-roster.ts\`, route status map and tests), A100 (ownership-at-fetch/typed metadata S2B), A120 (PR54 tab-scope denial), no more lanes. Pin R17 A60 conditional review P08. Obtain owner/HQ policy signoffs: T055, T050/T051, Backup B2, Direct Revert MP2B+Host, Steam/session. Prepare formal two-option **execution path**: A owner provides isolated A50 executor before handoff; B owner expressly accepts per-PR runtime NOT_EXECUTED debt and authorizes SWARM-006 integration/QA but still RELEASE NO-GO until composite full suite. **Do not enact B without explicit fresh owner consent.** A10 must publish final-only manifest and 38 WEB-004 finding disposition ledger. At R18 end evaluate whether all non-waived source blockers closed; only then propose handoff. Report \`WEB-005_A00_R18_CLOSEOUT_GATE.md\`.

### AGENT A10 — Internal package registry

**TASK:** WEB-005-T018-A10-R18. Preserve R17 P01–P21 manifest; verify any new exact PR42/53/54 HEAD, record changed file SHA, dependencies, source A60 verdict and native-test receipt. Mark policy tasks signed/unsigned and every original WEB-004 R2 finding as source-fixed/QA pending/owner disposition. Final-only SWARM-006 handoff manifest: PR, base, HEAD, checksum, dependency ordering, conflict resolution risk (PR39/42/44/46/51; PR41/48; PR43/50/54), rollback, tests NOT_EXECUTED, waivers. **NO dispatch / no integration.** Deliver \`WEB-005_A10_R18_FINAL_PACKET_READINESS.md\`.

### AGENT A20 — PG16 safety

**TASK:** WEB-005-T021-A20-R18. Prepare precise nonmutating verification of dedicated PG16/identity, test-only \`TEST_DATABASE_URL\`, \`tm_test_*\` and explicit reset approval. Reuse PR38 migration ledger \`ready_for_sql:false\`, no SQL adoption. Give A50 usable commands for PR41 B1 and PR42 roster Undo under authorized isolated environment. Missing physical executor → blocker not PASS. Deliver \`WEB-005_A20_R18_PG16_GATE.md\`.

### AGENT A30 — Security peer

**TASK:** WEB-005-T030-T031-A30-R18. Independently inspect A100 amended PR53 for previously ownerless game-picks cache; require match→tournament proof stored at fetch-time or bounded scoped metadata without broad purge. Test negative B/public cache unaffected, stale in-flight A, logout/401/403; no actual leak claim without runtime. Recheck PR34/37/44/46/49 existing security boundaries without full re-audit. Send A60 exact current SHA review and A50 tests; no code. Deliver \`WEB-005_A30_R18_S2B_PEER.md\`.

### AGENT A40 — CI and full-gate readiness

**TASK:** WEB-005-T010-T017-A40-R18. Provide exact repository-derived targeted React/API invocation avoiding unrelated old Pack19 matcher from release; PR35 existing fix, do not duplicate. Pack17 full test remains stop gate, scoped synthetic 24/24 not full PASS. Review T017-QA-01 adversarial forged TAP counters source risk and give one precise small next-code request only if independent A60 confirms. No new code. Deliver \`WEB-005_A40_R18_CI_HANDOFF.md\`.

### AGENT A50 — Real test executor / blocker

**TASK:** WEB-005-T133-A50-R18. First determine actual authorized complete repo checkout + pnpm10/Node22 and safe shell, without assuming user's Windows PC connection. If accessible, run targeted exact-HEAD frontend PR53/54/52/43/47/50 tests (per PR isolated checkout) with command/exit/TAP. PG16 tests only if A20 confirms physically isolated dedicated test DB plus owner written reset consent, then PR41/42/39/44/45/46/48/49/51. If environment blocked, deliver a **single concrete owner action** for connecting trusted PC/VM, **not another PLAN-only harness**. Never claim runtime PASS without executed command. Submit \`WEB-005_A50_R18_EXECUTION_OR_BLOCKER.md\` and direct receipts.

### AGENT A60 — Independent QA & formal closeout readiness

**TASK:** WEB-005-T130-A60-R18. Start from [R17 signed report](./agent-reports/A60/WEB-005_A60_R17_INDEPENDENT_QA.md) and [21-packet matrix](./agent-reports/A60/WEB-005_A60_R17_PACKAGE_MATRIX.json); independently review new exact PR42 roster service guard, PR53 safe unknown-owner picks, PR54 locally scoped denial; re-check PR41 unchanged conditional B1 as PG debt. Source verdict on exact SHA, evidence of app command/exit only if provided by A50, preserve historical WEB-004 38-case provenance. Produce 21-package source+runtime+policy matrix and a separate final-handoff viability \`READY/NOT_READY/READY_ONLY_IF_OWNER_WAIVES_RUNTIME\`; **no unconditional approval**. Deliver \`WEB-005_A60_R18_INDEPENDENT_QA.md\`.

### AGENT A70 — PR42 roster Undo source fix, newly expanded file GO

**TASK:** WEB-005-T040-A70-MP2A-ROSTER-R18. Explicit **GO** to edit \`artifacts/api-server/src/application/players/tournament-roster.ts\` inside roster service transaction, plus narrow \`routes/tournaments.ts\` stable 409 and existing \`test/revert-match.integration.test.ts\` on OWN existing PR42. Under tournament lock re-check tournament-wide most recent undoable action ID immediately before mutation, stale queued X/newer Y → 409 \`UNDO_ACTION_CHANGED\`, zero changes, Y preserved; legal latest delete_player/restore_player undo remains correct. Reuse R17 authored deterministic X/Y tests. No route-only TOCTOU, new transaction nesting, MP2B public CAS or other PR integrations. If behavior requires unsafe lock inversion/new policy HOLD and report. New HEAD+diff+commands or NOT_EXECUTED, A60 re-review, A50 PG tests with approved disposable DB. No merge. Deliver \`WEB-005_A70_R18_PR42_ROSTER_FIX.md\`.

### AGENT A80 — Sport owner signoffs

**TASK:** WEB-005-T050-T051-A80-R18. Reuse previous decision packet, get explicitly signed terminal Swiss TS-A deny409 vs TS-B atomic reopen, SE currentRound policy, Swiss5/6 rematch/BYE, DE GF/reset placements; do not silently choose. PR45 RR acceptance only conditional source, PG16 test pending. Give 00 exact next code scope after policies; no code R18. Deliver \`WEB-005_A80_R18_OWNER_DECISIONS.md\`.

### AGENT A90 — Backup conditional QA and B2 policy

**TASK:** WEB-005-T060-A90-R18. Recheck PR41 @ \`f03cf3d...\` independent A60 R17 \`SOURCE_ACCEPTED_CONDITIONAL\`. A90 no code R18. Prepare test commands and valid legacy/null \`sourceBasketPosition\` parity and corrupt invalid 400/no clone/rollback on approved PG16; A60 runtime separately. Consolidate B2 portable revision/result-history/action-log/legacy owner options and ask signature; do not implement without policy/new GO. Deliver \`WEB-005_A90_R18_BACKUP_ACCEPTANCE_POLICY.md\`.

### AGENT A100 — PR53 unknown-owner match picks cache, bounded GO

**TASK:** WEB-005-T080-A100-S2B-R18. On existing PR53, test-first identify verified owner for standalone \`["matches",mid,"game-picks"]\` cache at hook fetch-time (e.g. authoritative match DTO with tournamentId/typed query metadata) and guarantee scoped eviction on auth invalidation/denied 401/403 even when canonical match list cache absent. Do not guess numeric ID, evict public B, or global clear; verify delayed A responses can't repopulate. Preserve R17 tuple-bans fix and QueryClientProvider tests. If ownership requires broad redesign, stop with \`POLICY_OPEN/HOLD\` and precise dependency. Limited own branch files, new current SHA for A30/A60, real RTL only with available checkout; NOT_EXECUTED otherwise. Deliver \`WEB-005_A100_R18_PR53_FULL_SCOPE_OR_HOLD.md\`.

### AGENT A110 — Basket CAS & UX owner decisions

**TASK:** WEB-005-T055-T110-A110-R18. Consolidate T055 full basket PUT optimistic concurrency owner choice: If-Match/version, 409 vs 412, legacy clients, draft preservation and conflict recovery. Request explicit owner signature; no backend/frontend patch without it. PR43/50/52 existing source-only QA, UX044 Host draft policy pending, withdrawn cases remain withdrawn. Deliver \`WEB-005_A110_R18_BASKET_OWNER_DECISION.md\`.

### AGENT A120 — PR54 historical RR403 limited UI scope

**TASK:** WEB-005-T100-A120-R18. On existing PR54 branch only, implement minimal test-first source fix: historical RR detail 401/403 must not replace entire TournamentDetail tree when legal DE/Overview selected. RR-selected tab shows scoped denial, doesn't disclose private RR; manually selected historical RR stage supported, legitimate DE and Overview 200 remain visible, RR N→N+1 refresh remains correct. Avoid PR47 child file unless A00 explicitly reassigns owner after conflict review; if inescapable, HOLD subcase. Keep PR43/50 separate, no cherry-pick/integration. New SHA + A60 exact source review + A50 RTL/browser if executable. Deliver \`WEB-005_A120_R18_PR54_RR403_PATCH.md\`.

## §3. Bramka końcowego przekazania do SWARM-006

A00 może wystąpić o **jedną końcową autoryzację handoffu** dopiero gdy:
- wszystkie rzeczywiste zmiany WEB-005 mają HEAD/diff/manifest i niezależny A60 source verdict; blokujące source regressions naprawione lub jawnie owner-approved exception;
- zaakceptowany backlog WEB-004 R2 otrzyma rozstrzygnięcie \`SOURCE_FIXED / POLICY_SIGNED / OWNER_ACCEPTED_EXCEPTION\`, bez ukrytych zadań;
- A10 final-only manifest dokumentuje każdy z 21 PR, kolejność zależności, konflikty, rollback i test-dług;
- realne per-PR testy A50 istnieją **albo** owner/HQ świadomie i oddzielnie autoryzuje \`RUNTIME_DEBT_TO_SWARM006\` w finalnym handoffie, z obowiązkiem pełnych testów SWARM-006 przed staging/live;
- HQ/owner wyraźnie przyznaje \`FINAL_HANDOFF_GO\`.

Żadna fala sama z siebie nie aktywuje SWARM-006. Nie trzeba merge 21 PR w WEB-005; integrację i composite QA wykona później SWARM-006 po przekazaniu.

## §4. Krótki wspólny prompt

WEB-005 — START FALI R18

Otwórz:
https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R18_AGENT_PROMPTS.md

Przeczytaj §0–§2, rozpoznaj swoje Axx z roli wątku, wykonaj tylko sekcję AGENT Axx w trybie GO/STOP. Najpierw zweryfikuj live GitHub HEAD/QA R17, nie powielaj gotowych zmian. Opublikuj raport R18 z exact SHA, prawdziwymi testami/NOT_EXECUTED i bezpośrednim GitHub URL. Nie integruj PR-ów i nie uruchamiaj SWARM-006; o finalnym handoffie decyduje dopiero osobny GO owner/HQ.
