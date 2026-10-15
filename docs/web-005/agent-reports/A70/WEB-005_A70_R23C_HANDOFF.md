# WEB-005 — A70 R23C / Source authorization, collision gate and eventual handoff

**Task:** `WEB-005-T040-A70-R23C-ACTION-LOCAL-CLOSURE`  
**Role:** A70 — Match Lifecycle & Undo  
**Mode:** NARROW PURE DOMAIN IMPLEMENTATION  
**Date:** 2026-10-15 (Europe/Warsaw)  
**Status at preflight:** `SCOPE_FROZEN / TEST_FIRST / SOURCE_NOT_YET_AUTHORED`  
**Base release:** `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`  
**Branch:** `feat/web-005/t040-r23c-action-local-provenance`

## 1. EXCLUSIVE allowlist (published before any new code)

The **only files A70 may create or change** under this R23C task:

1. `artifacts/api-server/src/application/backups/backup-v3-action-provenance.ts` — NEW pure strict-profile action provenance and action-local closure validator.
2. `artifacts/api-server/test/backup-v3-action-provenance.test.ts` — NEW deterministic unit tests, authored before production module.
3. `docs/web-005/agent-reports/A70/WEB-005_A70_R23C_HANDOFF.md` — THIS report / source QA handoff.

All three paths confirmed absent at release base (GitHub `NOT_FOUND` on pinned SHA).

**Excluded:** `backup-v3.ts`, `backup-v3-strict-policy.ts`, `backup-v3-profile-gate.ts`, `routes/tournaments.ts`, DB schema/migrations, generated schemas/API, UI, all Undo branches and PR #56/#58.

## 2. Conflict preflight

- [PR #56](https://github.com/C8LyNn/aplikacja-turnieje/pull/56): exact HEAD `a7f71a7e7efdabd479b358a3cee80bc6359c4321`, open draft, two distinct files `backup-v3-strict-policy.ts` + `backup-v3-strict-policy.test.ts`.
- [PR #58](https://github.com/C8LyNn/aplikacja-turnieje/pull/58): exact HEAD `e8100f7b0c1071c2a98880d4eb7947514fc58185`, open draft, two distinct files `backup-v3-profile-gate.ts` + `backup-v3-profile-gate.test.ts`.
- [PR #42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42): exact HEAD `021bed269f9ea8ac8ce53caeea44263c098aa2dd`, separate Undo roster/route/test files. 
- A70 three paths **do not collide** with the changed-file lists of #56/#58. This verifies file ownership only, not composite semantic compatibility.

## 3. Immutable source contract

[A70 R23A semantic contract](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a70-r23a-action-provenance/docs/web-005/WEB-005_A70_R23A_ACTION_PROVENANCE_CONTRACT.md), blob `5213cbb8c2d449d855b04f94cfefc1e2981916ce`.

[Machine-readable rules](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a70-r23a-action-provenance/docs/web-005/WEB-005_A70_R23A_ACTION_PROVENANCE_RULES.json), blob `c531f7d64bcb26c8f7d0925eeeb15cf21618a435`.

**P23-01 is preserved:** a genuine system BYE has `resultHistory` and exactly one non-undoable `system_bye_assigned` (not a made-up manual `match_result_submitted`).

**No authority output:** validation success is never an import authorization, new tournament CAS/Undo token, or claim of authenticated backup provenance.

## 4. Final handoff fields (to be filled only from actual source/receipts)

- Separate DRAFT PR: **PENDING**.
- Actual PR HEAD: **PENDING**.
- Test-first commit: **PENDING**.
- Source implementation and test count: **PENDING**.
- Native / local smoke test commands and actual exits: **PENDING**.
- Independent A60 exact-SHA review: **PENDING**.
- Merge, importer wiring, production SQL, historical Undo execution, deploy: **NOT AUTHORIZED**.
