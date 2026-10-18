# WEB-005 / A30 — WAVE 3 — SECURITY-DEFERRED TRIAGE

**Dispatch:** [WEB-005 DEVELOPMENT FIRST WAVE 3, 2026-10-18](https://docs.google.com/document/d/10cKgkk3XZTwudRMIQ620Q5DAYEsMZIb8zmqgBoRnmEE/edit).  
**ROLE:** A30 — Security Coordination V2.  
**TASK:** Minimum non-DB security controls + scoped reactivation register for historical P0.  
**STATUS:** **DONE (DOCUMENTARY / READ-ONLY)**; **NOT** runtime-security acceptance.  
**BASE SHA:** `25487bd2ffdff9ad277bd5685d2201d767454b5f` (previous isolated A30 WAVE 2 docs handoff); this report is on new isolated documentation-only branch `docs/web005-a30-wave3-security-deferred-20261018`.  
**HEAD SHA:** publication commit is separately recorded in linked GitHub issue handoff; see immutable link/commit of this exact report.  
**PR:** no code change; no Draft PR required for documentation-only output; report published directly on separate A30 branch.  
**TESTS:** `NOT RUN` — no test commands executed. Only connector read-only inspection of common dispatch, GitHub PR metadata, changed filenames and active issue descriptions; no claim of test PASS.  
**CONFLICTS:** none in this A30 report path; important non-A30 source overlaps noted below.  
**NEXT OWNER:** A00 (policy choice/authority), A10 (exact SHA+overlap registry), A60 (scoped independent QA), A40 (existing C02 Draft integration only).  
**Restriction:** no PostgreSQL, Docker, SQL, migration, CI, tests, merge, release/deploy, live Replit write, code modification, game asset change or gate approval.

## Minimum DEVELOPMENT FIRST / DB-free security checklist

This is the **minimal acceptance checklist for a particular DB-free change**, not a full R23H redo:

1. **Exact change boundary:** record task, base/HEAD SHA, changed paths, invoked scripts and test commands. Classify by actual effects, not a PR title. If a dependency or E2E test reaches a live backend/PG16, **reclassify** and stop the DB-reaching portion.
2. **Prove DB-free execution:** no real `DATABASE_URL`/`TEST_DATABASE_URL`/`PG*`, destructive CLI, migration or write-bearing API, and no unexpected network path. Mocks/pure adapters may be reviewed separately from their future live wiring.
3. **Protect secrets, identity and trust:** no credentials or raw user data in logs, artifacts or Git; auth/session/401/403/Undo/CAS/Backup provenance must remain fail-closed. Pure logic does not mean auth risks are deferred.
4. **Separate GitHub/release/Replit live:** preserve divergent Steam auth and migration lineage; never resolve drift with automatic sync or a blind cherry-pick. A140's preservation manifest and A10 collision registry control later source integration.
5. **Independent review + real QA:** implementation → one independent source/security review appropriate to change → scoped QA with exact command, exit and artifact. `NOT RUN` stays `NOT RUN`; green unit tests do not prove integration/production.
6. **No implicit operational authorization:** passing a DB-free source review never authorizes SQL, PG fixture creation, protected merge, production import or deploy. Any of these requires an explicit separate owner decision.
7. **Escalation trigger:** new DB endpoint, unmocked HTTP, permission elevation, sensitive data, source change to import/write/Undo/CAS, migration, PG CLI or environment uncertainty changes the risk lane before execution. Review only the delta plus inherited still-applicable controls; no blanket R23H for unaffected features.

**Applicable outcomes:** `DB_FREE_SCOPED_FOR_REVIEW` (only after verified path/script evidence), `AUTH_SENSITIVE_REVIEW_REQUIRED`, `PG_DESTRUCTIVE_HOLD`, `UNKNOWN_SCOPE_HOLD`. These are classifications, not approvals. For unverified PRs, use **CANDIDATE**, not scoped PASS.

## SECURITY-DEFERRED — historic P0 ledger (unchanged global severity)

`DEFERRED_BY_SCOPE` means not applicable to a verified independent DB-free task **only**. Historical **7 P0 OPEN** globally, and **7 P1 / 3 P2** remain in [A30 WAVE 2 detailed registry](https://github.com/C8LyNn/aplikacja-turnieje/blob/25487bd2ffdff9ad277bd5685d2201d767454b5f/docs/web-005/agent-reports/A30/WEB005_WAVE2_HANDOFF.md). No new formal closure or severity downgrade is asserted.

| Historical ID | Deferred for | Re-activate on | Minimum return control / owner |
|---|---|---|---|
| **P0-31-01** | DB-free tests and UI source | Actual C01 BASE/S2 test, `CREATE DATABASE`, Drizzle `push --force` | Exact 1 S1 BASE + 4 S2 footprint, two forced pushes and four auto teardown scopes; A20+A22+A24 |
| **P0-31-02** | No PG16 connectivity | Any physical PG target or SQL connect, target/port drift | Verify independent physical cluster and Windows-native noncontact; A20+A24+operator |
| **P0-31-03** | No schema resets/migrations | `DROP SCHEMA CASCADE`, S1 auxiliary schema or migration | Enforce run-owned schema/dependency checks; no foreign cascade; A22+A31+A50 |
| **P0-31-04** | No S2 create/drop | Cluster-wide `CREATEDB`, failed-CREATE/force-drop, C01 fixture | Verified disposable cluster, positive CREATE/owner/OID/run and fail-before-DROP; A20+A31+A50 |
| **P0-31-05** | No DB runner/child DSN | PG fixture launcher, inherited env, Drizzle child process | Sealed noninheritance, bound child target, actual STOP control; A50+A24 |
| **P0-31-06** | No Docker PG lab | PG image/volume/network creation or host-published endpoint | Verified no-host-port Option A and physical image/namespace/volume evidence; A21+A20+A24 |
| **P0-31-07** | Ordinary code-only review | Destructive SQL, PG G0–G5 action, production/shared data | Independently authorized exact scope; current R23H `G0_NO_GO`; A00+A20+operator |

**Known high-impact dependency:** [Draft PR #89](https://github.com/C8LyNn/aplikacja-turnieje/pull/89) HEAD `8b1b708d4b24cd94de4d15b2beed516b21da711a`, [A22 Issue #99](https://github.com/C8LyNn/aplikacja-turnieje/issues/99): **B01** S1 CASCADE dependency graph incomplete; **B02** incorrect per-slot catalog cleanup state; **B03** Drizzle uncertain STOP can allow teardown. These remain unresolved **within** existing applicable historical P0 families; avoid both erasing them and double-counting them as independent historical P0 identities. R23H PG execution remains `SECURITY_BLOCKED / G0_NO_GO`.

## WAVE 3 exact-priority triage: metadata + changed filenames reviewed, NOT code QA

| PR/owner | Exact head SHA checked | Risk and safe response |
|---|---|---|
| [#101 A40 C02](https://github.com/C8LyNn/aplikacja-turnieje/pull/101) | `a5bfd07b822c223fd995604dc2e228935ab81498` | Candidate DB-free **but Backup V3 profile/attestation and preclone provenance are trust-sensitive**. Changed modules overlap #100 and #104; A10 must maintain lineage/one-winner registry, A40 must keep Draft, avoid accidental validation/authorization downgrade. No editing A40 files. |
| [#116 A140 Replit preservation](https://github.com/C8LyNn/aplikacja-turnieje/pull/116) | `a0f1d8066bbcf4e4b602cb587aebf599e327d067` | Docs + offline QA script/tests, changed paths disjoint from #101 and this A30 doc; treat source provenance, log/credential redaction and no-live-sync as security controls. No editing A140. |
| [#105 A50 C01 first-failure](https://github.com/C8LyNn/aplikacja-turnieje/pull/105) | `30314baba473054ebe1475d030df7afb81a0474b` | DB-free evidence helper may progress; inspect raw log privacy and true first-failure provenance. `[skip ci]` and no PG reproduction are **not C01 runtime PASS**. |
| [#120 A120 presentation](https://github.com/C8LyNn/aplikacja-turnieje/pull/120) | `e97e9d582e76cc4c4b6ba5bb784c89feb6be50ab` | Test-only for direct-load and reload, candidate DB-free; no full R23H, but QA must assess actual runtime paths/CI calls. |
| [#118 A80 Swiss](https://github.com/C8LyNn/aplikacja-turnieje/pull/118) | `c2b5bcfa46ecc69d5342324ded2e87f09bc68c8e` | Domain source+unit regression, candidate DB-free. Auth/DB escalation only if test commands involve real backend/PG. |
| [#119 A70 Undo](https://github.com/C8LyNn/aplikacja-turnieje/pull/119) | `b650a8e8de1841802c60f2af356bf0b404bd8018` | DB-independent tests may progress, but persisted roster snapshot and Undo payload require security-sensitive state/provenance review; not unconditional UI-only waiver. |
| [#63 A110 Basket CAS](https://github.com/C8LyNn/aplikacja-turnieje/pull/63) | `52f3e1db334fc5b178fb3f4ed21d4099a0d6558f` | Frontend tests may run DB-free; [Issue #74](https://github.com/C8LyNn/aplikacja-turnieje/issues/74) requires preserve drafts after 401/403 and no cross-principal leak or unsafe auto-retry/If-Match fallback. No backend/persistence GO. |
| [#100 A60 Backup validator](https://github.com/C8LyNn/aplikacja-turnieje/pull/100) | `6e198dc2c24cff651f8e75898c6e6e97eec9b0e4` | Synchronous validator on pure preclone adapter; overlaps #101's adapter files and requires independent trust/error treatment before integration. |
| [#104 A70 Undo authority](https://github.com/C8LyNn/aplikacja-turnieje/pull/104) | `e8af1dbcd1bd468f09c629e38db4b87bc85bfa8f` | Overlaps #101 provenance module; review authority/replay/CAS tokens even without database access. |

**Source overlap is not evidence of an exploit.** This brief does not replace the comprehensive source registry delegated to A10, functional code/test QA delegated to A60, or C02 integration owned by A40.

## WAVE3_HANDOFF / compact contract

| Field | Recorded result |
|---|---|
| **ROLE** | A30 — Security Coordination |
| **TASK** | DB-free minimum security controls and seven-P0 SECURITY-DEFERRED trigger ledger |
| **STATUS** | **DONE — docs/read-only**; implementation and runtime proof **NOT CLAIMED** |
| **BASE SHA** | `25487bd2ffdff9ad277bd5685d2201d767454b5f` |
| **HEAD SHA** | Final new branch publication commit in GitHub handoff; PR source SHA references explicitly frozen above |
| **CHANGED PATHS** | This `docs/web-005/agent-reports/A30/WAVE3_HANDOFF.md` + optional SHA256 sidecar; **NO CODE CHANGES** |
| **TEST COMMANDS + RESULTS** | **NONE — NOT RUN**; no execution of app suites. Read-only connector inspection and document bytes/hash verification only |
| **PR/LINK** | No code PR; isolated A30 docs link published and sent separately |
| **CONFLICTS** | No file collision with A40 #101 or A140 #116 on own docs path. Important #101 vs #100/#104 changed-path overlap (A10/A40 ownership) |
| **NEXT OWNER** | A00 policy authority; A10 source registry; A60 scoped QA; A40 C02 integration decisions |

**Final posture:** `DEVELOPMENT_FIRST_DB_FREE_ALLOWED_FOR_SEPARATE_SCOPED_REVIEW / R23H_DESTRUCTIVE_SQL_HOLD / NO_MERGE / NO_DEPLOY`. No blanket R23H requirement for proven DB-free work; no automatic GO for unsafe operations, SQL, merge or live rollout.
