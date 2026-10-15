# WEB-005 — R22 LATE SOURCE ARRIVALS / TARGETED QA DELTA (A60 + A10 only)

**Date:** 2026-10-15, Europe/Warsaw  
**Coordinator:** local A00 / WEB-005 Implementation Lead  
**Mode:** R22-CLOSEOUT ADDENDUM; NOT R23 and NOT a 13-agent replay.  
**Hard stops:** no application edits, no branch merge, no release/deploy, no DB reset/DDL/paid CI, no SWARM-006 transfer.

## §0 — Why this one-off delta is necessary

Read [A00 R22 live reconciliation](./agent-reports/A00/WEB-005_A00_R22_CLOSEOUT_LATE_PR_RECONCILIATION.md) and [R22 master](./WEB-005_WAVE_R22_AGENT_PROMPTS.md). A60 and A10 had accurately reported “no new R22 PR” **before** three late author publications. Their snapshots were earlier and are not independent review of PR #55–57. A00 live-verified **24 OPEN DRAFT unmerged source PRs (#34–57)**, no integrated HEAD; original 21 #34–54 retain R21 exact-source-scoped/conditional QA.

Three newly published R22 candidates, exact pinned HEAD:
- **P22 candidate / PR55** A110 T055 fail-first integration test-only `c3a4ea00ba933cbab36b3582859cb3eff20f0204`. [PR #55](https://github.com/C8LyNn/aplikacja-turnieje/pull/55). One new `artifacts/api-server/test/stage-basket-cas.integration.test.ts`, no production code/migration, native DB tests NOT_EXECUTED.
- **P23 candidate / PR56** A90 Backup V3 pure strict-profile module+unit test, NOT_WIRED `77707092202ca79277de7bc57cc4e37e4c033171`. [PR #56](https://github.com/C8LyNn/aplikacja-turnieje/pull/56). Two new `artifacts/api-server/src/application/backups/backup-v3-strict-policy.ts` and `artifacts/api-server/test/backup-v3-strict-policy.test.ts`; no live import/export, no HTTP 400 or PG rollback.
- **P24 candidate / PR57** A80 Swiss S3/S4 source+unit test `a57fe31c1bc123c5217b3f58bcdd34750c64c5c6`. [PR #57](https://github.com/C8LyNn/aplikacja-turnieje/pull/57). Two touched `artifacts/api-server/src/domain/tournament/swiss.ts` and `artifacts/api-server/test/swiss.test.ts`.

**Cited agent evidence:** [A80 new PR receipt](./agent-reports/A80/WEB-005_A80_R22_SWISS_IMPLEMENTATION.md), [A110 test-only](./agent-reports/A110/WEB-005_A110_R22_T055_CAS_TEST_GATE.md), [A90 external docs-only report](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a90-r22-strict-core/docs/web-005/agent-reports/A90/WEB-005_A90_R22_BACKUP_STRICT_CORE.md), [A50 R22 actual execution](./agent-reports/A50/WEB-005_A50_R22_EXECUTION_DELTA.md) = zero native app executions. [A60 original R22 early check](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R22_INDEPENDENT_SOURCE_QA.md) is valid ONLY as earlier no-new snapshot. [A20 schema/migration gate](./agent-reports/A20/WEB-005_A20_R22_T055_B3_DB_GATE.md) = SQL_NOT_EXECUTED / migration-ID unassigned / legacy migration collision; [A30 Backup threat peer](./agent-reports/A30/WEB-005_A30_R22_BACKUP_SECURITY_PEER.md) = raw marker NOT trusted provenance, nested ID fallback source risk.

**Policy already closed:** [Sport](./WEB-005_R21_OWNER_DELEGATED_SPORT_DECISIONS.md), [Basket](./WEB-005_R21_OWNER_T055_BASKET_CAS_APPROVAL.md), [Backup](./WEB-005_R21_OWNER_DELEGATED_BACKUP_B2_B6_DECISIONS.md). No new owner sport, basket or Backup choice needed. High-consequence remaining MP2B public CAS, Steam/session, legacy raw Query cache, original WEB004 38-case lineage/dispositions require owner action separately.

## AGENT A60 — Independent exact-SHA R22 code/test/source QA NOW

**TASK:** `WEB-005-T130-A60-R22-LATE-DELTA` / **MANDATORY INDEPENDENT**. Fetch live PR metadata+files+FULL relevant code/tests of PR #55/#56/#57 after confirming exact current HEADs above (if changed: record new SHA and review new code, do NOT trust pinned source blindly). Review directly: never reuse earlier A60 R22 “NO_NEW_SOURCE_CANDIDATE” verdict on these now-real changes.

1. **PR57/S3/S4:** Verify score-group-primary + minimized avoidable rematches among equal score cost; DP <=16 and bounded deterministic fallback >16, large-field fairness/worst-case, stable no duplicate partner, completed no_contest/walkover count opponents, cancelled excluded, BYE least-count stage-local. Review caller stage scoping in actual route/lifecycle and typed test fixtures. If source bug, exact line/hunk + specific fix owner, no self-author-code.
2. **PR56/Backup:** Verify it is pure isolated module and not wired. Strict marker missing => UNATTESTED; cannot claim authentic legacy or guaranteed resistance to attacker stripping marker in **existing** import. Check history latest tuple, exceptions, CAS revision vs result-history, action total order vs real source, nested recognized foreign ID parsing, legitimate legacy positives. A30 R22 already found live importer `remapUndoPayload` has `map.get(id) ?? id` fallback, and Zod can strip unknown `strictPolicy` marker. Distinguish standalone validator `SOURCE_ACCEPTED_SCOPED` from `BACKUP_B2_IMPLEMENTED` false. If hard invalid bugs, SOURCE_BLOCKED exact reason; no user secrets.
3. **PR55/Basket:** Verify one newly authored integration test file only, actual test API/supertest syntax, test guard reset env and field names/fixtures; source contract D1–D6, missing 428, stale 412, dirty UX contract NOT implemented. Test-only `SOURCE_ACCEPTED_TEST_CONTRACT` at most, not CAS source fixed or executable PASS; physical PG16 reset unauthorized.
4. **CI:** each of #55–#57 has latest `correction-qa` failure in GitHub checks as of A00; classify per actual steps/logs if retrievable. PR57 author reports old standalone Pack19 matcher readOnly/accessMode mismatch before feature unit tests (PR35 isolated fix). Never infer PR55/#56 exact cause without logs; no paid rerun.
5. **Output:** Publish **NEW** `WEB-005_A60_R22_LATE_DELTA_INDEPENDENT_QA.md` with exact PR HEAD, source verdict **per candidate**, owner/dependency blockers, genuine executed tests/NOT_EXECUTED, conditional repaired QA scope. Include machine-readable 3-row delta JSON if useful. Keep prior R22 early snapshot intact, do not fake that it had checked new code. Return a direct public GitHub URL. `WEB005_HANDOFF_NOT_READY` until full gates.

## AGENT A10 — Exact registry P22/P23/P24 and 38-case lineage

**TASK:** `WEB-005-T018-A10-R22-LATE-DELTA` / **DOCS ONLY**. Fetch current live #55–#57, independently confirm changed paths/new HEAD/base 1fdc401d and no overlap with previous 21 changed-file paths; register **new P22=#55, P23=#56, P24=#57** in *new appendix*, not rewrite original immutable 21 SHA manifest or reassign P01–P21. Include exact Git blob SHA-1 and SHA-256 for each new changed file, diff-to-release link, commit/test-first order, A60 QA status SOURCE_QA_PENDING until fresh actual signed A60 verdict, native NOT_EXECUTED, dependency DAG (PR41/48 Backup; #55 future T055 source; #57 stage-local caller). If A60 separately publishes during your read, bind exact verdict only after inspecting direct fresh report.

Original WEB004 38 case provenance still **29 secondary case IDs, nine genuine IDs not supplied**, no completed per-case signed owner disposition. Do not invent missing IDs or mark PASS/WONT_FIX. Publish **NEW** `WEB-005_A10_R22_LATE_DELTA_REGISTRY.md` + JSON table with 3 source entries and 21-source immutable baseline, direct GitHub URL. No merge/rebase/branch write to application.

## A00 closeout criterion (no third participant required)

A00 reads independent A60 per-SHA current verdict and A10 verified new-registry source SHA. If any SOURCE_BLOCKED, issue only small exact owner scoped fix in next source lane. If PR55/56/57 source acceptable limited/conditional, preserve that label and finish next sport/source implementation phase; don't treat author tests as runtime PASS or accepted final. SWARM006 cannot start until true final-only gate and named owner `FINAL_HANDOFF_GO`.

## Prompt to send to ONLY A60 and A10

WEB-005 — R22 LATE PR QA DELTA

Otwórz:
https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R22_LATE_PR_INDEPENDENT_QA_DELTA_PROMPT.md

Przeczytaj §0, znajdź własną sekcję AGENT A60 albo A10 i wykonaj ją w całości. Sprawdź rzeczywiste PR #55, #56, #57 na dokładnych bieżących SHA; wcześniejsze raporty R22 powstały, zanim te PR-y opublikowano. Opublikuj nowy niezależny przegląd QA lub rejestr nowych paczek i bezpośredni link do GitHub. Nie uruchamiaj ponownie pozostałych agentów, nie wykonuj merge, SQL, nieautoryzowanych testów, staging/live ani SWARM-006.
