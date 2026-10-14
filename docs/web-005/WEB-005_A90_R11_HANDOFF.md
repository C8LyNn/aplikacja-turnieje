# WEB-005_A90_R11_HANDOFF

**AGENT:** A90 — Backup V3 Integrity & Restore  
**WAVE / TASK:** R11.1 / WEB-005-T060-A90-B3A-R4  
**PERMISSION:** GO SOURCE-CODE ONLY / TEST-FIRST / DRAFT PR (L1)  
**RELEASE BASE:** release/tournament-ops-20261013-01 @ \`1fdc401d87c6bffe6bf7312dfc9db681b689dcf7\`  
**DELIVERED PR:** [#48 — B3A snapshot export](https://github.com/C8LyNn/aplikacja-turnieje/pull/48), \`fix/web-005/t060-b3a-consistent-v3-export-r11\`, **HEAD \`68991b393f87ded797b8578a0972bee47b8375a8\`**, OPEN DRAFT, not merged.  
**REPORT:** [WEB-005_A90_R11_B3A_SNAPSHOT_PATCH.md](./WEB-005_A90_R11_B3A_SNAPSHOT_PATCH.md) on independent docs branch.

## Changes
- \`artifacts/api-server/src/application/backups/backup-v3.ts\`: replace independent exporter queries with single \`REPEATABLE READ READ ONLY\` transaction; all nested reads use the same \`tx\`, including \`loadCompiledRoutingPlanV2InTransaction\`; preserve V3 shape/ordering.
- \`artifacts/api-server/test/stage-basket-route-execution.integration.test.ts\`: two deterministic race barriers with a second committed writer (root/stage/match mutation and approved proposal/route receipt mutation). Existing positive §22 round-trip unchanged.
- First test commit \`bff56604c1901f7b4613caef7c2c32456cbadda3\` precedes implementation. No PR41/B1 cherry-pick, no B2 policy changes, no SQL/DDL, no shared routes or migrations.

## Evidence
- \`SOURCE_CONFIRMED\`: original export had no common DB snapshot.
- \`PATCH_PROPOSED\`: proposed same-tx export and two test-first negative concurrency scenarios.
- \`NOT_EXECUTED\`: A90 has Node v22.16.0 but lacks pnpm, local checkout and an approved physically isolated PG16 test database. **No commands with exit=0, no runtime PASS, no snapshot hashes**.
- \`SOURCE_ACCEPTED\` / \`RUNTIME_VERIFIED\`: **PENDING** independent A60/A50 evidence. Author does not self-approve.

## GO / STOP and next
- A50: isolated PG16 + exact-SHA typecheck and \`pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/stage-basket-route-execution.integration.test.ts\`; log exit/TAP plus before/after logical state hashes, fail closed if unsafe.
- A60: review PR48 \`68991b...\` (tx scope, root snapshot isolation, nested helper, no queries outside tx, race+positive regressions), record independent verdict.
- A10: future P13+ conditional **INTERNAL BUFFER**, no cross-swarm transfer; A00 records B1/PR41 future collision and integration ordering.
- A20: schema/test PG16 compatibility; B2 history and older V3 legacy decisions remain future separate tasks.
- **MERGE, DEPLOY, MIGRATIONS, SWARM-006:** NOT AUTHORIZED.
- **WEB-005 RELEASE:** NO-GO; \`B3A=PATCH_PROPOSED\` until safe runtime + A60 acceptance.
