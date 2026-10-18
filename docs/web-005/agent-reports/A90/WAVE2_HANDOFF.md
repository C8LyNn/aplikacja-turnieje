# WEB-005 — A90 / DEVELOPMENT FIRST WAVE 2 — WAVE2_HANDOFF

**Agent:** A90 / Backup V3 Integrity & Restore  
**Date:** 2026-10-18 (Europe/Warsaw)  
**Assignment:** Verify current Backup V3 components including PR #100; produce one safe, source-grounded plan for real importer validation integration, **without enabling unapproved writes**.  
**Final verdict:** `WAVE2_HANDOFF_PUBLISHED / BACKUP_PRECLONE_INTEGRATION_DESIGN_READY / OWNER_TRUST_WAIT / APPLICATION_UNCHANGED / RELEASE_NO_GO`.

## 1. Actual deliverable and exact SHA

**[Full Backup V3 read-only preclone integration plan and 16-case acceptance matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a90-development-first-wave2-import-plan-20261018/docs/web-005/agent-reports/A90/WEB005_BACKUP_PRECLONE_IMPORT_INTEGRATION_PLAN.md)** — Git blob SHA-1 **`565cc2e955486b894340f67114a4e04cb756dd8e`**, last content update commit **`00490ce9d2da02e49cce46ae6bcc136f028aec3a`**; 130 lines. This is an **authored implementation plan**, not application code or a certified QA run.

**Pinned source-read evidence (all read from connected GitHub):**

| Source | Git exact HEAD or blob | Status |
|---|---|---|
| [PR #100 A90 sync-port fix](https://github.com/C8LyNn/aplikacja-turnieje/pull/100) | **`6e198dc2c24cff651f8e75898c6e6e97eec9b0e4`**; adapter blob `0465e11b2420fa00f2de5cc14fa4d81858c76ff0` | OPEN DRAFT, NOT_WIRED |
| [PR #66 predecessor](https://github.com/C8LyNn/aplikacja-turnieje/pull/66) | `7490c974b7c84404559fd590bd09817a71c2134f` | OPEN DRAFT, pure no-import gate |
| [PR #56 strict](https://github.com/C8LyNn/aplikacja-turnieje/pull/56) | `a7f71a7e7efdabd479b358a3cee80bc6359c4321` | OPEN DRAFT |
| [PR #58 raw V2/V3 profile](https://github.com/C8LyNn/aplikacja-turnieje/pull/58) | `e8100f7b0c1071c2a98880d4eb7947514fc58185` | OPEN DRAFT |
| [PR #64 A70 action-local](https://github.com/C8LyNn/aplikacja-turnieje/pull/64) | `7837e412626e88761c70f1a2ceeb822d7ed101e1` | OPEN DRAFT, candidate not wired |
| [PR #67 A30 ingress contract](https://github.com/C8LyNn/aplikacja-turnieje/pull/67) | `880824f18b8913602955578dfd76eeac7976e32a` | OPEN DRAFT, future fail-first acceptance |
| [PR #105 A50 API root cause](https://github.com/C8LyNn/aplikacja-turnieje/pull/105) | `779fa705fd585fe15d2cf56f23c0357e0cbe5a44` | OPEN DRAFT, separate ownership |
| Release branch | `1db3734b8988940acc6be8b992420a58fc39624a` | Reconciliation from old source baseline needed |

**Actual release importer code verified:** `artifacts/api-server/src/routes/tournaments.ts` Git blob `6767e7ac6c4d43cf39faa8a61534bdb92b898e14` (route 2951, Zod 3035, credential hashing 3072, importer dispatch 3083–3086); `backup-v2.ts` blob `9afc658b403482f3e5aa5b50878897e876b49d28` and `backup-v3.ts` blob `78d86246302fc8840696fd14c05c840304bc9f97`. The release route receives already-parsed `req.body`, and generated `ImportTournamentBody` schema-version fields are broad numeric, without modern strict sidecar. The Undo remap `map.get(oldId) ?? oldId` requires **future separate source hardening** before privilege-bearing restore.

## 2. One priority and handoff decision

**Highest-impact issue:** the live import route has no raw-before-Zod security ingress boundary, while pure PR #100 can only return non-authorizing `STRICT_ATTESTATION_REQUIRED` and `LEGACY_COMPAT_RESTRICTED`. Directly connecting `LEGACY_COMPAT_RESTRICTED` to `importBackupV2/V3` would be unsafe. No producer attestation root, irreversible restricted-mode enforcement or authorized clone-write transition exists yet.

**Future safe sequence (explicit new GO required):** actual raw byte capture → envelope/issuer trust decision (modern only, if owner-approved) → PR #58 profile preflight → lossless version-tagged schema parse and raw/typed parity → full V2/V3 semantic validation → PR #56 strict + PR #64 action-local for modern → owner-approved restricted legacy capability enforcement / verified modern import authorization → fresh credentials → guarded clone-local transaction/rollback. The **initial GATE-0 engineering workstream must be denial-only and DB-free**. Authorization cannot be inferred from a marker, test stub, raw shape, self-declared `trusted` or any current PR100 result.

**Test-first contract:** 16 cases W2-01–W2-16 defined in the main plan, covering modern marker removal, duplicates in original raw JSON, parser stripping, asynchronous ports, false trust, historical BYE, foreign action/Undo IDs, owner credentials and 0-write guarantees. Cases are **DESIGNED / NOT_EXECUTED** in Wave 2; actual archived source fixtures remain unverified. Production HTTP wiring and full PG16 rollback need future distinct owner/A20 explicit GO and independent A60 QA.

## 3. Actual tests and modifications in Wave 2

| Area | Actual status |
|---|---|
| Source read and exact SHA checks | PASS: GitHub PRs, live release ref, route, Zod, importer, PR100, A70/A30 |
| Document generation/read-back | PASS: new plan and `WAVE2_HANDOFF` on independent docs-only branch |
| New application/source fixes | **NONE** — Wave 2 assignment was safe integration planning |
| New executable tests | **NONE / NOT_EXECUTED**, 16 future tests **DESIGNED** |
| Existing PR #100 evidence (not Wave 2 execution) | [GitHub Actions 39125442053](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39125442053): native TS typecheck PASS; **20/20 adapter Node/TAP PASS**; overall workflow **FAIL** at aggregate API integration exit 1 |
| PostgreSQL16 / SQL / Docker / migration / shared reset | **NOT_EXECUTED / HOLD** |
| Games, static frontend, importer, exporter, HTTP, Zod, C02 | **NO SOURCE CHANGES** |
| Live Replit, protected merge, production deployment, SWARM-006 | **NOT EXECUTED / NO_GO** |
| Independent A60 QA of Wave 2 plan | **PENDING**; author source review is not A60 approval |

## 4. Who owns the next decision

**A10:** register this documentation-only branch and exact plan/report Git blobs; preserve distinct ancestry of PR #100 vs release and avoid counting any W2 tests as passed.  
**A40:** consume the ordered dependency DAG and conflict boundaries as **input only**; do not cherry-pick into C02 or release without independent source acceptance, owner trust and source lineage reconciliation.  
**A60:** review raw-byte/Zod/strict/legacy fail-closed boundary at pinned SHAs, plus actual C01 API integration failure; this plan has **no new test receipt**.  
**A30/A00/HQ:** approve issuer trust, key lifecycle, explicit legacy restricted-mode admission/enforcement, exact file-scoped GATE-0 authorization.  
**A70:** independently validate PR #64 and future genuine action-local binding. **A20/A50:** separate disposable PG16/runtime gates and C01 API diagnostics; no A90 overlap.

**Closeout:** `WAVE2_HANDOFF_PUBLISHED / SOURCE_INTEGRATION_PLAN_READY_FOR_REVIEW / CODE_NOT_AUTHORIZED / BACKUP_V3_NOT_INTEGRATED / TRUST_WAIT_OWNER / DB_TESTS_NOT_EXECUTED / RELEASE_NO_GO / SWARM006_HOLD`.
