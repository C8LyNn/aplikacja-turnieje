# WEB-005 — A30 / DEVELOPMENT FIRST — WAVE 2 HANDOFF

**Task:** `WEB-005-A30-WAVE2-SECURITY-TRIAGE`  
**Agent:** A30 — Security Coordination V2; supervisor A00; independent security specialist A31.  
**Date:** 2026-10-18 (Europe/Warsaw). **Priority:** HIGH.  
**Mode:** READ-ONLY SECURITY TRIAGE + DOCUMENTATION PUBLICATION; no Docker, SQL, database migrations, tests, OCI images/builds, merge, deployment, source-code mutation or change to executable policy.  
**Status:** `WAVE2_A30_DOCUMENTARY_COMPLETE / POLICY_REVIEW_PENDING_A00_A60 / SECURITY_DEFERRED_SCOPED`.  
**Safety boundary:** R23H destructive PG16 work is still `SECURITY_BLOCKED / G0_NO_GO / G1–G5_HOLD` until its own current approval/evidence conditions are met. A DB-free PR may be reviewed/tested independently, but **this document grants no merge/deploy/SQL authorization**.

## 1. Selected single high-impact task

**Selected:** replace repeating all of R23H for every change with a **short, evidence-bound A30 change-intake checklist + active/deferred security risk register**, using the already published risk-based policy rather than reopening the entire source audit.

**Reason:** prevents DB-specific P0s from blocking parallel frontend/UI/docs or DB-free diagnostics, while retaining STOP on real PG16 destructive operations and on security-sensitive auth/secret/production paths. One scoped independent review → QA is the normal development progression; production merge and effects approvals are separate.

**Baselines (checked by GitHub connector at this handoff):**
- [A30 proposed risk-based policy](https://github.com/C8LyNn/aplikacja-turnieje/blob/b1d1c16c34d99ab3245afa38f4ede629ee979e80/docs/web-005/agent-reports/A30/WEB005_RISK_BASED_SECURITY_POLICY.md), immutable documentation commit `b1d1c16c34d99ab3245afa38f4ede629ee979e80`, Git blob `2bdd4a517fcd27e350b4afbe7005d126816acbaf`; **PROPOSED / no formal global adoption receipt verified**.
- [A30 R4 security consolidation](https://github.com/C8LyNn/aplikacja-turnieje/blob/10dbf29df7ec3608f1887c58ca2331547dc9ef02/docs/web-005/agent-reports/A30/R23H_R4_FINAL_SECURITY_CONSOLIDATION.md), Git blob `f678b2d1785dee1f940655000bcd737ed5b4a412`. Inherited R4 register **7 historical P0 OPEN, 7 P1 OPEN, 3 P2 OPEN**; source documentation is not a runtime pass.
- [A31 source security report R4](https://github.com/C8LyNn/aplikacja-turnieje/blob/6bbda1fe20b711404c03c2c8a6527d5852a923b0/docs/web-005/agent-reports/A31/R23H_R4_A31_PRIVILEGE_AND_DESTRUCTIVE_PATH_REVIEW.md): one C01 effective `CREATEDB` principal and unsafe failed-CREATE→FORCE-drop path in original source; no generalized exoneration.
- [A22 independent R5-R2 re-review, Issue #99](https://github.com/C8LyNn/aplikacja-turnieje/issues/99): Draft [PR #89](https://github.com/C8LyNn/aplikacja-turnieje/pull/89) source **`8b1b708d4b24cd94de4d15b2beed516b21da711a`** has remaining **B01 S1 dependent-object CASCADE scope; B02 inaccurate per-slot catalog terminal state; B03 Drizzle uncertain STOP→DROP** source blockers. These are additional **subfindings within existing DB threat areas**, not an automatic count of 10 historical P0. P0-31-01…07 remain open; `G0_NO_GO`.
- **Relevant current PR metadata (all observed OPEN/DRAFT/UNMERGED):** [PR #103 A120 SPA/asset route policy](https://github.com/C8LyNn/aplikacja-turnieje/pull/103) HEAD `9fb85b2ca5c137c6107a360bbdb45efec6bf1dde` (unwired/pure static route policy); [PR #105 A50 C01 first-failure DB-free diagnostics](https://github.com/C8LyNn/aplikacja-turnieje/pull/105) HEAD `779fa705fd585fe15d2cf56f23c0357e0cbe5a44` (DB-free investigation only); [PR #104 A70 Undo authority hardening](https://github.com/C8LyNn/aplikacja-turnieje/pull/104) HEAD `e8af1dbcd1bd468f09c629e38db4b87bc85bfa8f` (security-sensitive action tokens; not automatically treated as harmless frontend); [PR #89 A50 PG16 Variant B](https://github.com/C8LyNn/aplikacja-turnieje/pull/89) HEAD `8b1b708d4b24cd94de4d15b2beed516b21da711a` (D4 / SQL P0 applicability). This records **metadata/source-report classification only**, not a full diff review or new QA verdict.

## 2. Minimal DEVELOPMENT FIRST security checklist (copy into each relevant PR)

**SC-01 — Trace exact identity:** record task/issue, base+HEAD SHA, changed paths, planned test commands, dependencies and side effects. For a new revision, reclassify; don't use an old QA receipt on a new HEAD.

**SC-02 — Classify by effective execution footprint, not PR name:**
- `D0` docs/pure offline only; `D1` browser/frontend with mocks, no DB endpoint or secrets; `D2` pure backend / controlled read-only source and **verified no DB write**; `D3` approved new isolated database with limited DML and no destructive DDL; `D4` destructive disposable DB lab (`CREATEDB`, migrations, `CASCADE`, `DROP DATABASE FORCE`, `push --force`); `D5` shared/prod data or protected merge/deploy.
- Highest reached lane wins. If uncertain, classify `UNKNOWN` and halt only the affected action pending independent determination. **A CI/E2E step that actually connects to PG is not D1 merely because the source diff is frontend.**

**SC-03 — Show data-plane absence for D0/D1/D2:** check source diff and referenced scripts, imported code, tests/CI job graph, runtime URLs/env/credentials, external services, auth flows and secrets. Quote exact command or source evidence. A mock or static route-policy test can be DB-free; live HTTP/E2E to a configured backend cannot be assumed DB-free. If no proof, escalate to D3/D4/D5 as appropriate.

**SC-04 — Auth/secret/data impact independently checked:** even with zero PG16 access, permission/Undo/401/403/re-auth/CAS/session changes, raw logs, secrets, XSS/URL/file upload and Backup import trust require feature-specific threat review. R23H PG controls may be N/A, **general security does not become N/A**. Non-prod test-data and account scopes must be proven.

**SC-05 — Scope-specific STOP condition:** record precise STOP for untrusted DSN, unexpectedly contacted DB, foreign resource, writable production secret, missing auth, unbounded file deletion, unauthorized fallback, unverified ownership/DDL or logging secret. On a STOP, do not paper over with skips, retries, [skip ci] claims or permission elevation.

**SC-06 — One independent review:** distinct reviewer verifies implementation diff, lane/side-effect claim and tests; A31/A22 joins only for actual destructive SQL, A30 consults only for cross-domain security changes. One reviewed source SHA is necessary; a review is *not* permission to operate on the database or to merge.

**SC-07 — Adequate QA:** D1 UI/SPA/reload/static assets with mocked/staging-safe context; D2 isolated unit/API mocks; D3 scoped DB checks only after DB operator approval; D4 separately signed exact PG16 gates; D5 production/release gate. Report `PASS/FAIL/NOT_EXECUTED` with real command/exit/log and environment. `[skip ci]` means absent CI evidence, never PASS.

**SC-08 — Separate write authority:** NO broad grant from A30 checklist. SQL, schema cleanup, migrations, destructive fixtures, merge to protected branch and deploy remain separately approved by their owners. Never infer G0/G1… from source review.

**SC-09 — Record outcomes and triggers:** `RISK_NA_FOR_THIS_CHANGE` (documented) vs `RISK_OPEN_BLOCKING_THIS_ACTION` vs `RISK_DEFERRED_UNTIL_TRIGGER` vs `RISK_CLOSED_WITH_EVIDENCE`. N/A to D1 does not CLOSE a global P0.

**SC-10 — Handoff:** send A10 registry, A40 dependency/interface impact only if any, and A60 evidence and risk applicability; avoid parallel touching A40 integration or A140 live sync.

**Result of a DB-free change with SC-01..SC-10 checked:** it may continue normal independent review/QA without full R23H. This alone grants **neither protected merge nor deployment**.

## 3. Triage decision matrix — Wave 2 practical examples

| Workstream | Preliminary scope (subject to per-diff confirmation by reviewer) | R23H posture | Independent reviewer / QA focus |
|---|---|---|---|
| **A120 PR #103 pure SPA/asset route policy** `9fb85b2...` | **Candidate D1**, if no real backend/migration/secret invocation in scripts or route interactions | All P0-31-01..07 `NOT_APPLICABLE_TO_SCOPED_DB_FREE_CHECK`; no PostgreSQL preflight required | A120 changes reviewed by independent A60 or designated FE reviewer; direct deep links, refresh fallback, missing assets and UI test receipts. No merge GO. |
| **A50 PR #105 DB-free first-error diagnostics** `779fa705...` | **Candidate D2**, evidence/logging and test commands must be verified; `[skip ci]` indicates not executed CI | C01 runtime PG16 suite is separate **D4** and remains HOLD; no fabricated DB-integration failure reproduction | Independent reviewer + A60 assess first actual failure/log provenance, secrets scrub and `NOT_EXECUTED` flags. |
| **A70 PR #104 authority tokens** `e8af1dbc...` | D2 if pure source/mocked; **auth-sensitive** even without DB | PG-related P0 may be N/A; Undo/CAS authorization flaws remain in-scope independently | A60 and app-domain reviewer check privilege boundary, version conflict, replay and auth escalation. |
| **A50 PR #89 Variant B PG16 fixtures** `8b1b708...` | D4 because `CASCADE`, `CREATEDB`, child `push --force`, auto-DROP | All 7 PG-specific P0 **APPLY**; latest Issue #99 lists B01/B02/B03; G0 NO_GO | A22/A31 source specialist and A60 independent QA, owner/operator future per-phase consents. No SQL or Docker. |
| **A90 Backup V3 validation** | D2 only for pure validation; D5 whenever real import/write/trust boundary is wired | R23H PG P0 may be N/A for pure adapter, not for runtime database writes | Verify fail-closed auth/issuer and no unapproved write capability. |

These are **triage examples**, not reviewed/approved PR security verdicts. Reconfirm HEAD and diffs when applying to a specific PR; changing SHA or test command invalidates classification.

## 4. SECURITY-DEFERRED backlog — historical risk identity retained

Every row remains `OPEN` globally until source+applicable execution evidence independently demonstrates closure. **Defer only the control for tasks that cannot reach its threatened asset.** Status `DEFERRED_BY_SCOPE` is not a waiver for D4/D5; it automatically flips back to `ACTIVE_BLOCKER` once triggered.

| ID | Owner | DEFER only when | Reactivate immediately when | Minimum acceptance evidence at trigger |
|---|---|---|---|---|
| **P0-31-01** BASE+4 / SQL force scope | A20/A22/A24 | No SQL/PG fixture | C01 actual PG integration, S2 scratch create, Drizzle forced push | Bound 1 S1 + 4 S2 footprint, 2 forced pushes, 4 FORCE teardowns, signed action scope |
| **P0-31-02** wrong PG target / Windows native | A20/A24/operator | Zero effective PG connections | PG connect or target/cert drift | Actual container+volume+PG system_identifier+SCRAM user+Windows-native no-touch |
| **P0-31-03** S1 CASCADE foreign dependencies | A22/A31/A50 | No schema/migration mutation | S1 reset, DROP SCHEMA CASCADE, migration/aux helpers | Own S1 CREATE/OID/owner/dependency closure; for PR89 also B01 dependent object classes |
| **P0-31-04** cluster-wide CREATEDB + force/drop collision | A20/A22/A31/A50 | No CREATE/DROP DB | any scratch CREATE/force teardown | Dedicated empty cluster, nonprivileged actual common role, CREATE-success guard and owner/OID/exclusive-writer proof; B02 per-slot journal correctness |
| **P0-31-05** inherited DSN, child Drizzle | A50/A24 | No DB runner/secret-bearing child | Test launcher, real DSN, any Drizzle child CLI | Sealed env/signature target, no foreign connection, both force-push effects; B03 pre-exec/uncertain-to-cleanup STOP |
| **P0-31-06** effective Docker/OCI isolation | A21/A20/A24 | No PG Docker execution | PG image/container/volume created or host port requested | Exact Option A, immutable image, effective no-port/mount, physical G1/G2 cert |
| **P0-31-07** phase-consent enforcement | A00/HQ+A20+operator+A50 | DB-free pure source review | destructive action, G0–G5, shared/prod operation | Authentic action-specific approval, deny unknown scope, A60 receipt; never auto GO |
| **P1-31-01** PG admin bootstrap secret | A20/A21 | No PG container | PG bootstrap secret mounted/used | ACL, removal/rotation or documented narrowly approved residual exposure |
| **P1-31-02** runner filesystem/cache | A50/A24 | No PG runner execution | Node/tsx/Drizzle test environment | Exhaustive transitive write-path + readonly/tmpfs behavior evidence |
| **P1-31-03** pg_isready insufficient | A20/A24 | No authenticated PG use | Actual SQL connection | SCRAM authenticated + physical DB identity proof |
| **P1-31-04** transitive migrations/DDL | A22/A31 | No migration/DDL | specialist fixture/Drizzle/production migration | Exact source statement ledger, SQL effects; avoid inferred no-op |
| **P1-31-05** TAP/log credential leakage | A23/A50 | No secret/DSN/raw DB evidence | SQL/TAP/debug logs/Drive upload | Redaction review, access controls, independent cloud-byte hash |
| **P1-31-06** Docker freshness/context ownership | A21/A24 | No Docker resources | New volume/project/context or cleanup | Rejection of preexisting/foreign resource, unique IDs, no host contamination |
| **P1-R3-CUSTODY** frozen-index late delta | A23 | Not taking G0 source authorization decision | A00/A60 R23H or new security-critical evidence | Append-only complete immutable R4/R5 evidence provenance+hashes+ACL |
| **P2-31-01** Docker operator hardening | A21/A20 | No privileged Docker access | docker.sock/host bind/privileged context/production | least privilege, version, daemon ACL and socket policy |
| **P2-31-02** quotas/seccomp/caps | A21/A50 | No resource or sandbox exposure | shared resources/DoS/run instability | explicit limits + image compatibility |
| **P2-GDRIVE-MIRROR** local Windows G: parity | A23/A80 | Only independently verified remote file used | Local G:\ copy used as source-of-truth, deployment payload or recovery | exact local-vs-remote SHA and last-update proof |

### Deferred queue rules

- **Keep 17 historic entries:** P0 7 + P1 7 + P2 3 (last confirmed by A60 R3/A30 R4). No R5 subfinding adds an extra count unless owner independently records a truly distinct new risk.
- **Active for actual destructive DB work now:** all applicable P0, especially PR89 B01/B02/B03 mapping; no safety downgrade from `DEFERRED` status on a frontend-only task.
- **Owner and when-to-return always explicit:** at new PR/HEAD SHA, changed test command, first live API/DB access, secret, CREATE/DROP/migration, or pre-merge/pre-deploy; any transition triggers an independent review delta (no full R23H repeat unless destructive scope applies).
- **Administrative status:** `TRIAGED / DEFERRED_BY_SCOPE / ACTIVE_BLOCKER / DESIGN_ONLY / VERIFIED`. `CLOSED` requires actual evidence and relevant independent acceptor; no policy-only auto closure.
- **Review cadence proposal:** at each Wave/PR intake, plus before any G0/D4/D5 action. A00 decides whether to adopt this as project governance; not an executable enforcement mechanism until accepted.

## 5. WAVE2_HANDOFF — exact work/evidence/results

| Field | Value |
|---|---|
| `workstream` | A30 Security Coordination / WAVE 2 |
| `chosen_task` | Minimal risk-based security intake checklist + SECURITY-DEFERRED dedup/re-entry backlog |
| `source_code_changes` | **NONE**; docs-only branch; no game/backend/frontend files modified |
| `head_source_baseline` | Previous A30 policy Git commit `b1d1c16c34d99ab3245afa38f4ede629ee979e80`; prior A30 R4 consolidation `10dbf29df7ec3608f1887c58ca2331547dc9ef02` |
| `current_pr_examples` | #89 `8b1b708d4b24cd94de4d15b2beed516b21da711a`; #103 `9fb85b2ca5c137c6107a360bbdb45efec6bf1dde`; #104 `e8af1dbcd1bd468f09c629e38db4b87bc85bfa8f`; #105 `779fa705fd585fe15d2cf56f23c0357e0cbe5a44` |
| `changed_files` | `docs/web-005/agent-reports/A30/WEB005_WAVE2_HANDOFF.md`, checksum sidecar `WEB005_WAVE2_HANDOFF.md.sha256` |
| `static_checks` | Source connector reads + current PR metadata and Issue #88/#99; manual crosswalk P0/P1/P2/trigger consistency |
| `tests` | `NOT_EXECUTED`; no SQL, Docker, Node unit/API, CI, browser QA; document SHA256 verification only |
| `independent_review` | `PENDING A60/A00`; reviewer must confirm lane criteria and issue #99 DB hard blockers |
| `merge_deploy_sql` | `NOT_AUTHORIZED / NOT_EXECUTED`; no Draft code PR warranted for docs-only output |
| `known_limitations` | PR triage examples use current metadata, not full changed-file/code audit; A00 formal adoption of overarching policy unverified; R5 SQL source fixes unaccepted; no runner/runtime safety evidence; separate ChatGPT threads not automatically notified by GitHub comments |

**A10 handoff:** index docs-only change/commit/hash and do not classify historical PG P0 as newly CLOSED. **A40:** no composite/integration modification; use lane flags to avoid unnecessary waits on DB-free feature work. **A60:** independently accept/reject scoped checklist and classify PR-specific applicability; retain separate review for Undo/Auth or new SQL entrypoints.

**Final A30 recommendation:** `WAVE2_A30_DOC_DELIVERED / SCOPED_SECURITY_POLICY_PROPOSED / R23H_P0_7_OPEN / G0_NO_GO`. This is one focused coordination deliverable, not reopening the R23H test certification process.
