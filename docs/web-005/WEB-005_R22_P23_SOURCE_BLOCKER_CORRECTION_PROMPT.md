# WEB-005 — R22 P23-01 BLOCKER CORRECTION / A90 ONLY, THEN A60 QA

**Date:** 2026-10-15 · Local coordinator A00  
**Mode:** `TARGETED_POST_R22_FIX`, **not** a fresh 13-agent R23 wave, not SWARM-006.  
**Source authority:** [A60 late independent QA report](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R22_LATE_DELTA_INDEPENDENT_QA.md), finding **P23-01**. [A00 closeout](./agent-reports/A00/WEB-005_A00_R22_LATE_DELTA_CLOSEOUT_AND_NEXT_GATE.md).  
**Release base:** `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.  
**Target existing PR:** [#56](https://github.com/C8LyNn/aplikacja-turnieje/pull/56), branch `fix/web-005/t060-b2-strict-policy-core-r22`, **previous HEAD** `77707092202ca79277de7bc57cc4e37e4c033171`. Check live branch HEAD again before editing; do not reset others' commits.

## §0. Hard safety and source rules

1. This wave has **ONLY ONE authorized source owner, A90**, tasked to resolve P23-01. A60 later independently checks newly published SHA; A10 records new SHA only after A90. Do not send A60/A10 the source-task prompt before A90 published its corrected commit.
2. A90 may edit **only its own two files** on existing PR #56 branch:
   - `artifacts/api-server/src/application/backups/backup-v3-strict-policy.ts`
   - `artifacts/api-server/test/backup-v3-strict-policy.test.ts`
   No `backup-v3.ts`, PR41/48, database schema/SQL, importer/exporter route, generated DTO/OpenAPI or unrelated PR source. Test-first commit(s), then source fix commit.
3. Current strict module at previous HEAD [lines 199–245](https://github.com/C8LyNn/aplikacja-turnieje/blob/77707092202ca79277de7bc57cc4e37e4c033171/artifacts/api-server/src/application/backups/backup-v3-strict-policy.ts#L199-L245): every completed match requires exactly one active manual `match_result_submitted` action. Real release Swiss startup [lines 1544–1570](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/routes/tournaments.ts#L1544-L1570) and next Swiss round create legally completed `resultType="bye"` with `resultHistory` and `actionType="system_bye_assigned"`, `undoPayload=null`, `canUndo=false`. This is a **real source mismatch, no runtime exploit confirmed**.
4. **Owner approved Backup B1=A and B2=B, B3–B6=A under Backup delegation**: preserve genuine legal old formats and strict new profile, never synthesize a manual completion action for system BYE. Strict-only validator remains NOT_WIRED; marker absent UNATTESTED is not proof of historical-origin authentication. No changing old grandfathering/revert policy to bypass defect.
5. No merge/cherry-pick, no SQL/DDL, paid CI rerun, DB reset, staging/live or SWARM-006; no claim of native tests passed if not physically executed.

## AGENT A90 — narrow fail-first source patch GO

**TASK:** `WEB-005-T060-A90-R22-P23-01-HOTFIX`.

1. Fetch live PR #56 HEAD/files, immutable source baseline release, A60 finding and current `actionLog`/system BYE export metadata. Inspect actual BYE: `status="completed"`, `resultType="bye"`, `resultReason="system_bye"`, `player2BackupId=null`, winner=player1, scores permitted null, provenance `system_bye_assigned`, `canUndo=false`, `undoPayload=null`, `isUndone=false`; keep history latest-tuple parity and match state revision checks intact. Don't infer undocumented BYE action schema solely from imagined fields.
2. **TEST FIRST**, add strict-profile valid BYE test fixture matching real source and proof of action (no fabricated manual completion). Add negatives: BYE missing history; BYE forged player/winner/action/misleading canUndo/payload; manual played match without active properly typed completion still rejected; source NC/walkover handling only per actual release semantics. Test both single-BYE and hybrid played+BYE backup where feasible. If test fixture type obstacles occur, repair type locally, no casting away validation.
3. Implement minimal **typed disjoint provenance policy**:
   - completed manual result requires proper active `match_result_submitted` link with newest result history;
   - system-completed BYE is represented with proper **real system BYE action provenance**, result history, valid state/revision and **zero active manual completion actions**; no phantom undoable action or invented completion token;
   - unknown completion action / incoherent finished match **fail closed**; typed exceptions apply **only** to source-supported lawful cases. Never general `if(resultType!=='played') skip all action checks` escape.
   - Preserve strict marker absent `UNATTESTED`, B3 state vs history revisions, B4 deterministic order, B5 recognized nested IDs. No positive legacy classification from self-declared marker alone.
4. Commit test-first and patch ONLY to current PR #56 branch, publish corrected **new full commit SHA**, new file Git blob SHAs, test command+actual exit/TAP or **NOT_EXECUTED**. Issue direct A60 independent new-SHA review request and A10 registry update request. Do not self-accept or declare full Backup import path done.
5. Publish `WEB-005_A90_R22_P23_01_FIX_HANDOFF.md` with precise new code diff and A60 remaining gates. Link a real GitHub file path/branch, not a guessed URL.

## AGENT A60 — do not execute before new A90 source is published

**TASK:** `WEB-005-T130-A60-R22-P23-01-REVIEW`; new SHA exact file/test review only. A90 must first supply new PR56 HEAD. Compare previous A60 finding P23-01 at `77707092202ca79277de7bc57cc4e37e4c033171`, inspect current completed BYE source/history/action, new positive/negative test assertions, security/fail-closed manual result controls and any altered source beyond two allowed files. If defect fixed: `P23_SOURCE_ACCEPTED_SCOPED_CONDITIONAL`, NOT_WIRED, native NOT_EXECUTED; if not, `SOURCE_BLOCKED` with minimal reproduction. Publish `WEB-005_A60_R22_P23_01_REVIEW.md` and exact SHA to A00/A10. No editing A90 source or integration claims.

## AGENT A10 — after A60's actual review

Update append-only [P22–P24 source registry](./agent-reports/A10/WEB-005_A10_R22_LATE_DELTA_REGISTRY.md) with **additional P23 fix SHA and changed file blob SHA1/SHA256**; preserve original 24 prior source packet identities and old SHA as audit record. Reference new independent A60 review for P23; no retroactive rewrite of old manifest, no extra separate PR for same file unless A90 has proven need. Publish direct new append-only delta.

## §1. Exit criterion

R22 P23-01 can be marked `SOURCE_DEFECT_FIXED` only after real new source HEAD and A60 independent new-SHA acceptance. Still: strict validator NOT_WIRED; A50 native application tests 0, old Pack19 source CI failure PR35 isolated, A20 migration identity unresolved, real Backup V3 strict import/export/rollback and legal legacy anti-downgrade policy require later source GO. Public MP2B/Steam/session/PR53 orphan owner risk and WEB004 original 38-case case-by-case dispositions remain outside this narrow source correction. WEB005 release/handoff NO-GO.

## §2. Immediate text for A90 (ONLY)

WEB-005 — P23-01 / PR #56 — NARROW SOURCE FIX

Otwórz:
https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R22_P23_SOURCE_BLOCKER_CORRECTION_PROMPT.md

Przeczytaj §0 i wyłącznie sekcję AGENT A90. Zweryfikuj bieżący HEAD PR #56 i niezależny błąd A60 P23-01: nowe strict Backup V3 błędnie odrzuca prawidłowy completed system BYE z `system_bye_assigned`. Dodaj najpierw pozytywne i negatywne testy, potem minimalną poprawkę w DWÓCH przypisanych plikach PR #56. Zachowaj pozostałe zasady fail-closed i brak live import/export wiring. Opublikuj nowy SHA PR #56 i handoff do A60/A10. Nie wykonuj merge, migracji, nieautoryzowanych testów ani SWARM-006.
