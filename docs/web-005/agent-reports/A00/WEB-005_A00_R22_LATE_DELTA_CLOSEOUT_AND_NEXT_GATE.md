# WEB-005 — A00 R22 late-delta closeout, independent source QA and NEXT gate

**Date:** 2026-10-15 (Europe/Warsaw)  
**Role:** local A00 Implementation Lead.  
**Result:** `R22_LATE_DELTA_COMPLETE / P22_SCOPED_SOURCE_ACCEPTED / P23_SOURCE_BLOCKED / P24_SCOPED_SOURCE_ACCEPTED / NEW_PR55_57_NO_NATIVE_QA / R23_FULL_IMPLEMENTATION_HOLD_UNTIL_P23_CORRECTION / SWARM006_HOLD / RELEASE_NO_GO`.

## 1. Independently verified evidence after asynchronous publication

A60's final independent report has now been published on independent documentation branch `docs/web-005/a60-r18-independent-qa-20261014` at Git SHA `e2ac5d79a1a413a354d4613a90575bec5ef6311b`:
[WEB-005_A60_R22_LATE_DELTA_INDEPENDENT_QA.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R22_LATE_DELTA_INDEPENDENT_QA.md),
[A60 JSON](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R22_LATE_DELTA_MATRIX.json).

A10 has directly published append-only P22–P24 registry on the control branch:
[WEB-005_A10_R22_LATE_DELTA_REGISTRY.md](../A10/WEB-005_A10_R22_LATE_DELTA_REGISTRY.md) and [machine JSON](../A10/WEB-005_A10_R22_LATE_DELTA_REGISTRY.json). A10 ran its registry snapshot before A60 published the final late delta, so its `SOURCE_QA_PENDING` cells must not be treated as the latest live verdict. A00's reconciliation **preserves** A10's immutable original 21 and references A60 directly for latest independent outcomes.

Current source inventory remains **24 OPEN DRAFT / unmerged PR #34–57**, base `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`, no integrated SHA.

| Packet | PR / exact HEAD at late readback | Latest A60 independent new-source verdict | Functionality actually delivered |
|---|---|---|---|
| P22 | [#55](https://github.com/C8LyNn/aplikacja-turnieje/pull/55) `c3a4ea00ba933cbab36b3582859cb3eff20f0204` | `SOURCE_ACCEPTED_TEST_CONTRACT_CONDITIONAL` | **Only** 10 authored fail-first T055 Basket CAS integration tests, no production CAS/DB/UI |
| P23 | [#56](https://github.com/C8LyNn/aplikacja-turnieje/pull/56) `77707092202ca79277de7bc57cc4e37e4c033171` | `SOURCE_BLOCKED_STRICT_COMPLETED_BYE_ACTION_INVARIANT` | Pure strict-profile Backup V3 validator, **NOT_WIRED**, contains proven lawful-BYE false rejection |
| P24 | [#57](https://github.com/C8LyNn/aplikacja-turnieje/pull/57) `a57fe31c1bc123c5217b3f58bcdd34750c64c5c6` | `SOURCE_ACCEPTED_SCOPED_CONDITIONAL` | Swiss S3/S4 domain logic + test suite; >16 uses documented bounded heuristic, actual native tests not executed |

## 2. Critical P23-01 source blocker and approved minimal correction route

A60 directly read current [PR56 strict validator](https://github.com/C8LyNn/aplikacja-turnieje/blob/77707092202ca79277de7bc57cc4e37e4c033171/artifacts/api-server/src/application/backups/backup-v3-strict-policy.ts#L199-L245) which requires every completed match to have exactly one active `match_result_submitted` action. But real release Swiss stage startup and subsequent rounds create valid completed BYE with `resultType="bye"`, immutable result history and an **audit action `system_bye_assigned`**, `undoPayload=null`, not undoable. The new strict validator rejects such valid backups, contradicting owner Backup B1-A safe-legitimate-backup and B2-B history conditions.

**A00 correction decision:** authorize ONLY A90 to patch **its own existing PR #56 branch** `fix/web-005/t060-b2-strict-policy-core-r22`, exactly the strict validator module and its new unit-test file, test-first, to accept **source-proven typed legal BYE with correct history and system action** without making manual completions exempt from provenance. Include no-contest/walkover handling only where current source supports it; no fabricated action types or provenance. No import/export wiring, no modification to PR41/48, no DB migration, no HTTP route or generated OpenAPI, no wild permissive legacy bypass. After commit A90 publishes NEW PR56 SHA and sends for A60 INDEPENDENT fresh new-SHA source review; A10 updates append-only registry delta. Formal central prompt:
[WEB-005_R22_P23_SOURCE_BLOCKER_CORRECTION_PROMPT.md](../../WEB-005_R22_P23_SOURCE_BLOCKER_CORRECTION_PROMPT.md).

**P23-02 security boundary remains:** this pure validator's `UNATTESTED` is not trustworthy historical producer provenance. Real importer `backup-v3.ts` not wired and still has foreign-ID fallback; generated Zod may strip unknown `strictPolicy`. Correcting BYE doesn't equal full Backup B2–B6 product implementation. A30/A90 need future trusted historical profile adapter with strict common invariants and future explicit code authorization.

## 3. Real CI and runtime

A60 checked all three GitHub Actions job logs, each failed inherited **Pack19 snapshot consistency test** (`readOnly:true` matcher vs `accessMode:"read only"`; 7 PASS/1 FAIL at that step). Separate unmerged draft PR35 contains isolated Pack19 correction. All feature-specific Swiss/Backup/T055 tests remained NOT_EXECUTED, as did A50 actual native APP tests due to no complete owner-connected runner/frozen workspace and isolated disposable PG16/reset authorization. A60 static source acceptance ≠ execution.

## 4. Next readiness beyond P23 fix

Once PR56's new exact SHA passes independent A60 source review and is recorded by A10, R23 can authorize separately scoped real source work on: terminal Swiss TS-B atomic correction, SE actionableRound separate from currentRound, DE GF/reset runner-up and competition-wave ranking, T055 full CAS persisted revision and client updates only after A20 migration identifier/lock/Backup compatibility reviews, and Backup strict import/export wiring only after A30 verified anti-downgrade+legacy-positive design and exact file ownership. No repeat question on approved sport/Backup/T055.

**Still owner decisions outside delegation:** MP2B public Direct Revert CAS+Host, Steam missing-admin-secret 403/503, session TTL/digest/rotation, PR53 orphan raw cache retention/erasure, and original WEB004 38 cases (29 derived secondary IDs, nine missing) and per-finding dispositions. There is no signed final handoff GO.

**Next dispatch NOW:** A90 P23-01 minimal source fix only. Then A60 targeted independent review of new head; A10 append exact SHA to registry; coordinator returns with R23 narrow implementation GO. No need to re-run all 13 agents just to accept already published R22 evidence. `WEB005_IN_PROGRESS / SWARM006_HOLD / RELEASE_NO_GO`.
