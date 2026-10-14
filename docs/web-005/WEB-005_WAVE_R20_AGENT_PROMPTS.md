# WEB-005 — R20 — CENTRALNY DOKUMENT PROMPTÓW DLA 13 AGENTÓW

**Data:** 2026-10-14, Europe/Warsaw
**Lokalny koordynator:** A00 / Implementation Lead. Jedyna Queen/HQ działa w oddzielnym projekcie.
**Repo:** C8LyNn/aplikacja-turnieje
**Gałąź dokumentacji:** chore/web-005/t000-wave1-control
**Źródła:** WEB-004_TO_WEB-005_HANDOFF_R2_2026-10-14.md; oryginalna WEB-004_A60_FINAL_ACCEPTANCE_MATRIX_R2.csv, jeśli dostępna; WEB-005 BACKLOG.md, DECISIONS.md, R19 master; A10 R19 21-packet/38-case ledger; A50 R19 receipt; niezależne A60 R18 QA i późniejsze faktycznie opublikowane raporty.

**Snapshot R19:** 21 PR #34–54 OPEN DRAFT, zero merge/composite; PR41 f03cf3d09988a04ba9c2856e205d21f994ff67f1; PR42 021bed269f9ea8ac8ce53caeea44263c098aa2dd; PR53 d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34; PR54 bfa9d075b431185aa8bbf87bf021d64dde8ae22f. A50 R19 wykazał ZERO natywnych testów aplikacji; źródłowy R19 nowego PR53/54 nie ma w odnalezionych przez A00 podpisanych raportach A60. A10 wtórnie odtworzył 29 historycznych ID z 38, lecz dziewięć pozostałych ID nadal nie ma wiarygodnej proweniencji. Zgłoszenie użytkownika: agentowa fala R19 ukończona; WEB005 final closeout niepotwierdzony. SWARM-006 HOLD; RELEASE NO-GO.

## §0 — Wspólne zasady obowiązujące

1. Każdy agent czyta wspólne §0–§2 i wykonuje WYŁĄCZNIE sekcję AGENT Axx odpowiadającą roli swojego wątku. Nie przejmuje innych zadań ani nie uruchamia SWARM-006.
2. R20 jest falą niezależnego QA, decyzji owner/HQ i rekonsyliacji oryginalnych źródeł. ZERO domyślnych uprawnień na nowe modyfikacje kodu, PR, merge, cherry-pick, rebase, composite, release, staging lub produkcyjne SQL. Tylko odrębne, pisemne fix-specific GO A00 po A60 exact-SHA source FAIL może otworzyć nową wąską poprawkę w przyszłej fali.
3. Sprawdzaj aktualne PR HEAD/base/CI przed działaniem. SHA powyżej to snapshot. PATCH_REVISED, SOURCE_ACCEPTED_A60_EXACT_HEAD, NATIVE_RUNTIME_VERIFIED_COMMAND_EXIT, BLOCKED, NOT_EXECUTED, POLICY_OPEN i OWNER_APPROVED_EXCEPTION to różne stany. Nie przenoś A60 R18 QA na PR53/54 R19 SHA.
4. PR54: źródłowa zmiana R19 A120 obejmuje page-level historical RR401/403 guard i selected-stage child privacy. Sprawdź, czy legalne DE/Overview pozostają widoczne, historyczny RR na aktywnie wybranej zakładce nie pokazuje starych danych z React Query przy 401/403, retry jest lokalny, N→N+1 odświeża canonical source. PR47 i PR54 obie edytują stage-progress-view.tsx: NIE scalać, dokumentować przyszłą semantyczną kolizję dla SWARM-006.
5. PR53: źródłowa zmiana R19 A100 rozdziela historyczne, nieoznakowane wpisy cache game-picks od nowego, zweryfikowanego owner-qualified query. A60/A30 muszą zweryfikować A→B zmianę poświadczeń, stary promise/403, brak ponownego wyświetlenia danych A, pozostawienie publicznego B. Samo zatrzymanie raw ownerless orphan w pamięci jest oddzielnym ryzykiem/polityką, nie udowodnionym wyciekiem u użytkownika.
6. A50 bez faktycznego pełnego checkoutu, pnpm10, frozen dependencies i autoryzowanego środowiska nadal raportuje 0 app tests. Testy React po dostępie do per-SHA checkout wymagają realnych command/exit/TAP. PG16 tylko fizycznie dedykowana, izolowana disposable test DB, TEST_DATABASE_URL, test schema tm_test_* i pisemna zgoda na konkretny reset; brak jakiegokolwiek fallback do shared/production. Manual paid CI wyłącznie po wyraźnej zgodzie.
7. Izolowane CI stale może zatrzymywać się na starym matcherze Pack19 wymagającym readOnly:true wobec accessMode:"read only"; poprawka jest już w osobnym PR35. NIE duplikować. Automatyczny FAIL poprzedzający właściwe testy nie dowodzi feature-specific FAIL ani PASS. Pack17 --full, Pack20–26, frontend/API/PG wymagane później.
8. Historyczny WEB-004 HANDOFF R2 wskazuje 38 przypadków: 0 PASS / 3 external CI FAIL / 33 BLOCKED / 2 NOT_RUN. A10 R19 wskazał 29 znanych ID i 9 UNKNOWN. Najpierw spróbuj odzyskać ORYGINALNY już istniejący artefakt WEB-004_A60_FINAL_ACCEPTANCE_MATRIX_R2.csv lub autentyczny raport R2 z projektu; nie żądaj nowego audytu WEB-004 i nie wymyślaj 9 ID. Brak pliku = SOURCE_ID_NOT_AVAILABLE, nie signed WONT_FIX.
9. Bez właścicielskich decyzji nie wybieraj semantyki: T055 Basket CAS 409/412, If-Match/token, legacy/draft; Swiss terminal deny/reopen; SE pointer; Swiss5/6 BYE/rematches; DE GF/ranks; Backup B2 portable history/legacy revision; Direct Revert MP2B request CAS+Host ID/cutover; Steam absent-secret 403/503; session TTL/digest/rotation; historycznego ownerless-cache storage.
10. Owner wyraźnie ustalił FINAL-ONLY SWARM-006. Zakończyć przyjęty zakres WEB-004 R2, niezależne source QA, oryginalne 38-case signed disposition i decyzje product. Dopiero potem A00 składa jeden FINAL_HANDOFF_GO_REQUEST; zgoda owner/HQ wymagana. Gdy A50 nadal 0 testów, trzeba dodatkowo odrębnie podpisać HANDOFF_WITH_RUNTIME_TEST_DEBT, który obciąża SWARM-006 twardymi kompozytowymi testami przed staging/live. NIE udzielaj takiej zgody domyślnie.
11. Każdy agent publikuje WEB-005_Axx_R20_HANDOFF.md w docs/web-005/agent-reports/Axx (control branch lub jawna osobna docs branch) z bezpośrednim linkiem GitHub/SHA, reviewed HEAD, faktyczną komendą/exit lub NOT_EXECUTED, A60, owner policy, konkretną następną akcją. Jeżeli GitHub write niedostępny, PUBLICATION_BLOCKED i cały raport w wątku.
12. STOP: brak samodzielnej autoryzacji A60, production/shared DB SQL/DDL, secrets w logach, Replit-integrator, live/staging, paid CI bez GO, samoczynnego uruchamiania innych rojów. SWARM-007 odpowiada osobno za infrastrukturę komunikacji/Drive, bez założenia automatycznego transferu.

## §1 — R19 główne źródła i bramki

- PR41/Backup B1: f03cf3d09988a04ba9c2856e205d21f994ff67f1, A60 R18 SOURCE_ACCEPTED_CONDITIONAL; PG16 positive/corrupt/rollback NOT_EXECUTED.
- PR42/Undo roster LIFO: 021bed269f9ea8ac8ce53caeea44263c098aa2dd, A60 R18 SOURCE_ACCEPTED_CONDITIONAL; PG16 X/Y stale 409 zero-write NOT_EXECUTED.
- PR53/private game picks: d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34, R19 authored 23 cache tests/source patch, new exact A60 verdict pending at A00 readback; raw orphan retention policy.
- PR54/RR+DE: bfa9d075b431185aa8bbf87bf021d64dde8ae22f, R19 parent-child source fix, newly authored tests but NOT_EXECUTED, exact A60 verdict pending at A00 readback.
- A50 R19: zero native app test executions, no approved connected repo checkout/pnpm/isolation PG16.
- A10 R19: 21 PR/source SHA inventory and 38-slot traceability; 29 known historical IDs, nine SOURCE_ID_NOT_AVAILABLE; no per-row signed dispositions.
- Product owner/HQ policy: no verified final signed decisions; SWARM006_FINAL_HANDOFF_GO=FALSE.

**Linki:** 
[A10 R19 registry](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R19_FINAL_ONLY_PACKAGE_AND_38_CASES.md);
[A50 R19 receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R19_RECEIPT.md);
[A60 R18 independent QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_INDEPENDENT_QA.md);
[PR53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53);
[PR54](https://github.com/C8LyNn/aplikacja-turnieje/pull/54).

## §2 — Agent routing R20

| Agent | R20 obowiązek | Mode |
|---|---|---|
| A00 | A60 exact R19 QA, oryginalne 38 ID, owner podpisy, final gate | COORD |
| A10 | 21 exact PR, 38 oryginalnych case-ID, provenance i owner signoff | DOCS ONLY |
| A20 | PG16 physical preflight, migration ledger REVIEW_ONLY | SOURCE ONLY |
| A30 | PR53 current SHA privacy peer, cache orphan | READ ONLY |
| A40 | Pack19/Pack17 hard test gates, executable commands | SOURCE ONLY |
| A50 | Rzeczywisty test executor lub jedna konkretna blokada owner | SAFE TEST ONLY |
| **A60** | **P0 independent exact SHA PR53/PR54 + formal handoff QA** | STRICT READ ONLY |
| A70 | PR42 frozen; MP2B public Revert/Host policy | SOURCE ONLY |
| A80 | Swiss/SE/DE owner policy and PR45 evidence | SOURCE ONLY |
| A90 | Backup B2 policy/PR41 runtime fixture | SOURCE ONLY |
| A100 | PR53 frozen, A30/A60 support, legacy orphan acceptance | SOURCE ONLY |
| A110 | T055 Basket CAS and Host UX044 owner signature | SOURCE ONLY |
| A120 | PR54 frozen, source two-boundary UI oracle and collision | SOURCE ONLY |

## AGENT A00 — R20 Implementation Lead

1. Recheck newest #53/#54 exact HEAD, collect R19 A60 final source report if available; if missing, require immediate A60 review on current SHAs, not assume negative outcome.
2. Freeze code changes; any confirmed new source FAIL → a separately documented narrow next-wave patch only.
3. Recover original WEB-004 38-row matrix from already supplied Project files if accessible, never fill unknown nine IDs by guess. Ensure A10 outputs original-ID → task/PR/SHA → independent QA → signed owner disposition.
4. Request owner/HQ explicit selections from existing A80/A90/A70/A110 decision packets: T055, sport, B2, MP2B, Steam/session, legacy cache. No silent design change or invented WONT_FIX.
5. A50 choice: A physically approved test host and PG16; B only AFTER source/policy/38-case closure, separately sign HANDOFF_WITH_RUNTIME_TEST_DEBT for SWARM-006.
6. Give concise R20 gate report and ONLY if all conditions truly pass prepare FINAL_HANDOFF_GO_REQUEST; do not activate SWARM-006.

**Deliver:** WEB-005_A00_R20_FINAL_CLOSEOUT_DECISION.md.

## AGENT A10 — 21 PR manifest and 38 original WEB-004 cases

1. Update PR Head/digests, especially #53/#54 and any A60 new SHA verdict; preserve all 21 open draft/unmerged status and dependency/conflict/rollback mapping.
2. Search preexisting original WEB-004_A60_FINAL_ACCEPTANCE_MATRIX_R2.csv and other authenticated source files for nine missing IDs. Record exact source filename/hash and rows if found, or maintain UNKNOWN without filling. No fresh WEB-004 audit.
3. Per original ID (not PR): historic status, actual accepted finding, linked PR current SHA, A60 source verdict, runtime test, signed owner policy/disposition URL or NULL.
4. Keep future SWARM-006 final-only dependency DAG: PR39/42/44/46/51 routes; PR41/48 backup; PR43/50/54 page; PR47/54 child; PR35 CI prerequisite; PR38 offline ledger; PR33 alternative Steam HOLD. No transfer.

**Deliver:** WEB-005_A10_R20_38_CASES_FINAL_ONLY.md + machine table.

## AGENT A20 — test DB and migration safety

Verify PR38 offline ledger 0030/0031 REVIEW_ONLY / ready_for_sql:false. Specify physically dedicated PG16 host/test-only identity, TEST_DATABASE_URL, tm_test_* schema, owner signed reset boundary and nonmutating preflight. Provide A50 exact API tests PR41/42 and others. If host absent, report exact request. No DDL/reset on production/shared.

**Deliver:** WEB-005_A20_R20_PG16_GATE.md.

## AGENT A30 — current PR53 privacy peer

Inspect new #53 SHA d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34 (not old R19 preflight). Verify owner-namespace guarded query, revoked credential, 401/403, old delayed promise, unknown owner and unchanged B cache. Separate confirmed raw orphan retention from possible UI exposure: no claim of observed exploit without runtime. Provide A60 current SHA line-level peer verdict and narrowly described owner exception, if any. No code.

**Deliver:** WEB-005_A30_R20_PRIVACY_PEER.md.

## AGENT A40 — CI gates and executable test list

Keep existing PR35 Pack19 corrected regex, PR36 Pack20–26 and PR40 Pack17 source conditions unchanged. Explain GH Actions older Pack19 upstream fails vs target tests not executed, don't file another patch. Supply A50 exact backend-free PR53/54 focused Node22/pnpm10 RTL command, separate PG16 scripts; classify T017-QA-01 TAP parser adversarial issue only if source-proven and A60 confirms. No CI code or paid rerun.

**Deliver:** WEB-005_A40_R20_CI_GATE.md.

## AGENT A50 — actual execution or concrete owner blocker

Check if a real, authorized full per-SHA checkout and pnpm10 frozen deps exists NOW. If yes run exact-head PR53 rebind RTL, PR54 mixed RR403 parent/child RTL, auth hooks, targeted typecheck/build and remaining frontend suites; record command+exit/TAP/version/sha. API/PG16 only on physically isolated disposable test DB with A20 preflight and written owner reset consent. If environment inaccessible, report exactly one required owner action to make trusted PC/VM executor usable and 0 native app tests, not another PLAN-only harness. Do not execute paid GH CI.

**Deliver:** WEB-005_A50_R20_NATIVE_EXECUTION_OR_BLOCKER.md.

## AGENT A60 — P0 independent source QA and final handoff

1. If R19 signed QA report already exists, publish its exact URL and SHA; otherwise independently review R20 now. Do not assert nonexistent A60 R19 acceptance.
2. #53 current d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34: legacy untagged old A must not rebind under new auth identity; owner-qualified query and 401/403 evictions; late A promises/B public unaffected; classify source acceptance vs residual policy.
3. #54 current bfa9d075b431185aa8bbf87bf021d64dde8ae22f: full parent RR403 replaced by selected-stage-only alert, hidden stale RR participants/winner, lawful DE/Overview, private tournament readOk fail-closed, canonical refresh preserved. Explicit PR47 child future integration dependency.
4. Preserve A60 R18 for unchanged 19 PR sources; mark runtime 0 unless real A50 per-SHA receipts. Reconcile original WEB-004 case IDs/signatures; no invented owner disposition.
5. Publish current SHA 21-row matrix and formal verdict NOT_READY / READY_FOR_EXPLICIT_RUNTIME_DEBT_ONLY / READY_FOR_FINAL_HANDOFF, choosing latter statuses ONLY when source+policy+original 38-case conditions actually documented.

**Deliver:** WEB-005_A60_R20_INDEPENDENT_QA.md + final-gate matrix.

## AGENT A70 — Revert CAS owner signoff

PR42 source frozen at 021bed269f9ea8ac8ce53caeea44263c098aa2dd, A60 R18 conditionally accepted, PG16 X/Y interleaving/409 no-write still unexecuted. Prepare owner decision on public Direct Revert expectedMatchRevision plus expectedCompletionActionId, 422 malformed, stale 409, >50 action log completion discovery and Host old tab transition. No code or merge.

**Deliver:** WEB-005_A70_R20_MP2B_OWNER_SIGNOFF.md.

## AGENT A80 — sport policy signoff

Prepare explicit owner choices: Swiss terminal TS-A deny409 vs TS-B atomic reopen; SE currentRound actionable/generated; Swiss rematch/BYE/NC deterministic priorities; DE GF reset and rankings 3–N. PR45 roster source conditional only, PG16 not tested. Do not preselect or code. Record named owner signature/unsigned.

**Deliver:** WEB-005_A80_R20_SPORT_DECISIONS.md.

## AGENT A90 — Backup B2 owner signoff

Keep PR41 B1 QP/QPE/OP conditional source acceptance and PR48 MVCC source conditional; physical PG16 positive modern and legacy-null, invalid 400 zero-clone and late rollback pending. Present owner alternatives for B2 portable match history/revision/action logs/legacy migration without choosing unsafe strict rejection; no new code.

**Deliver:** WEB-005_A90_R20_BACKUP_B2_DECISIONS.md.

## AGENT A100 — PR53 frozen source support

Do not modify PR53 while A60 reviews exact d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34. Supply legacy orphan seeded A=7/M=701 vs B=8/M=801 test-first oracle, current guarded key proof, late response and revocation semantics. Scope remaining raw orphan policy, not assumed privacy leak. A30 peer/A50 runtime necessary; propose future minimal patch only on A60-confirmed source FAIL and fresh 00 GO.

**Deliver:** WEB-005_A100_R20_PR53_QA_SUPPORT.md.

## AGENT A110 — Basket CAS owner signature

Create single owner-signable T055 optimistic concurrency: If-Match/ETag vs body version, 409 vs 412, legacy missing precondition, stage/roster invalidation, saving drafts/retry. Host UX044 dirty navigation separate decision. PR43 CSV/50 preview/52 stage modal source accepted conditional but RTL still blocked. No code/policy default.

**Deliver:** WEB-005_A110_R20_BASKET_DECISION.md.

## AGENT A120 — PR54 frozen source QA oracle

Do not amend PR54 while A60 independently reviews bfa9d075b431185aa8bbf87bf021d64dde8ae22f. Provide exact parent+child tests: historical RR31 401/403, lawful DE32/Overview 200, manual selected RR hide stale cache and winner, local retry 200, RR snapshot N→N+1, non-RR no storms. Future PR47/54 stage-progress-view semantic merge constraint and PR43/50/54 parent collision. If source acceptance fails, report exact minimal next patch with fresh GO request.

**Deliver:** WEB-005_A120_R20_PR54_QA_ORACLE.md.

## §3 — End-of-wave R20

A00 receives signed exact SHA A60 independent verdict, A50 real test receipts/one blocker, updated 21-PR final-only manifest, authentic 38-case IDs or nine unavailable, owner signed policy or explicit open decision list. If source/policy/38-case incomplete: WEB005 IN_PROGRESS, SWARM006 HOLD. If complete, A00 prepares a final handoff authorization request, not direct deployment. Runtime debt exception is separate, explicit, narrow and cannot waive source/privacy/backlog; SWARM-006 still must pass all integrated release gates.

## §4 — Jeden prompt startowy dla wszystkich agentów

WEB-005 — START FALI R20

Otwórz centralny dokument:
https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R20_AGENT_PROMPTS.md

Przeczytaj §0–§2, rozpoznaj swój Axx na podstawie roli wątku i wykonaj wyłącznie sekcję AGENT Axx. Zweryfikuj live PR HEAD i QA R19, uzyskaj realne owner/QA evidence, publikuj raport R20 pod bezpośrednim linkiem GitHub. Brak automatycznego GO na kod, merge, SWARM-006 ani release.
