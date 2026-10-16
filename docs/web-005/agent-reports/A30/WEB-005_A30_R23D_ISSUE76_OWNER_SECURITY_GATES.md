# WEB-005 — R23D / A30 — ISSUE #76: security decision gates for A00/HQ

**Issue:** [#76 — D01–D04 / Backup issuer / Basket CAS server](https://github.com/C8LyNn/aplikacja-turnieje/issues/76) · **Dispatch:** [R23D](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R23D_EXECUTION_DISPATCH_20261016.md), blob `226b6a89c3fd8348eac814221de1c9715ee6ae25`.  
**Agent:** A30 Security Write-Auth Hardening · **Date:** 2026-10-16 · **Mode:** architectural security acceptance recommendations, documentation-only.  
**No A30 signature as owner or A60 release QA.** `WAIT_OWNER / SUBGATE_SOURCE_GO_NOT_GRANTED / NO_SQL / NO_DEPLOY / SWARM006_HOLD`.

## 1. Current exact source/decision evidence

| Gate | Actual evidence / SHA | Real status |
|---|---|---|
| **D01–D04 migration** | [A20 R23B D01–D04 packet](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A20/WEB-005_A20_R23B_A00_DECISION_PACKET.md), blob `1a6475847fe9a7726b0fb8806891098c2ea3abbe`; [PR #38](https://github.com/C8LyNn/aplikacja-turnieje/pull/38) `2d36864f4d2f1c838073f387fd3c8efb3378c43b`; manifest `28f493263a2cbfb919db1f99b220058175b46ba0` | **ALL FOUR PENDING_OWNER_APPROVAL** in verified packet. Graph source checksum is not applied-SQL receipt. Issue #76 contained **no signed comment** when checked. |
| **Backup strict** | [PR #56](https://github.com/C8LyNn/aplikacja-turnieje/pull/56) `a7f71a7e7efdabd479b358a3cee80bc6359c4321`, accepted as isolated pure source; [PR #58](https://github.com/C8LyNn/aplikacja-turnieje/pull/58) `e8100f7b0c1071c2a98880d4eb7947514fc58185`, raw shape classifier | Both **NOT_WIRED** to current HTTP/Zod/export/DB. No issuer verification and no privilege from untrusted structural shape. |
| **Backup security RED acceptance** | [A30 PR #67](https://github.com/C8LyNn/aplikacja-turnieje/pull/67) exact `880824f18b8913602955578dfd76eeac7976e32a` | Test-only DRAFT, future adapter missing `EXPECTED_RED`; six physically gated PG16 cases `SKIP_BY_DEFAULT`. Not security PASS or release GO. |
| **Basket CAS** | [PR #55](https://github.com/C8LyNn/aplikacja-turnieje/pull/55) `c3a4ea00ba933cbab36b3582859cb3eff20f0204`; A20 request `WEB-005-T055-BASKET-CAS-PERSISTENCE-V1` | Server full-graph `If-Match` persistence **NOT ACTIVE**. Tests/contract authored, standalone backend not integrated. Migration numerical ID **REQUESTED_NOT_ALLOCATED**. |
| **R23C composite B1** | [PR #60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60) `fa3261b2c9510e110ac9eba21726812d3401a525` | 14 source blobs; dispatch reports API integration run `38736073793` exit 1. No integrated source acceptance and no release permission. |
| **Steam security/live** | [A30 Issue #72 scoped QA](./WEB-005_A30_R23D_ISSUE72_SECURITY_PRESERVATION_QA.md), GitHub release `1db3734b8988940acc6be8b992420a58fc39624a` | Source gap in release write routes, editor protection must be preserved, published Replit code not attested, environment/DB never accessed. |

## 2. A30 recommended D01–D04 decision text — not an HQ approval

**D01 / documentation identity graph:** recommended `APPROVE_SOURCE_GRAPH_ONLY` for **14** immutable logical migration identities and source SHA-1/UTF-8 SHA-256. No renumbering SQL in place, no automatic inference that DB applied an identical file. **A00 choice required**: approve as source-only dictionary or HOLD, with a signed URL, time and accountable owner.

**D02 / total order policy:** recommended `RELEASE_FIRST_EDITOR_SECOND` in a proposed future canonical stream 0027–0040, preserving original filenames and historical collisions at 0030/0031. `release 0031 → editor canonical 0032` is **a policy ordering**, not an independent hard SQL dependency. **A00 choice required**; no SQL run, no forced backfill.

**D03 / actual runtime execution:** recommended `SOURCE_AND_RUNTIME_RECEIPT_REQUIRED / UNKNOWN_FAIL_CLOSED`. Separate authorized read-only physical PostgreSQL inventory: verified DB host/cluster/role/schema, actual ledger keys, catalog postconditions, runner executed-input SHA-256 and logs. If old receipts cannot be recovered, flag `EXECUTION_NOT_ATTESTABLE` and seek explicit decision; do **not** invent `APPLIED` from table existence. No query executed here; no physical PG access.

**D04 / migration numbering allocator:** recommended `A00_CONTROLLED_SERIALIZED_ALLOCATOR` with locked versioned ledger, unique logical and numeric IDs, atomic expected-HEAD check and exclusive lease. Basket CAS request stays `REQUESTED_NOT_ALLOCATED` with `numeric_migration_id=null`. Never choose `0041` from local maximum or apply a registration SQL in production. **A00 must explicitly sign and nominate allocator**; only after D01–D03 and new GO can numbers/DDL be planned.

**Per-gate current outcome:** `D01=WAIT_OWNER, D02=WAIT_OWNER, D03=WAIT_OWNER, D04=WAIT_OWNER`; `SQL_GO=false`, `NUMBER_ALLOCATION_GO=false`, `PROD_DB_READ_GO=false` until separately approved. None has a blanket code authorization from Issue #76.

## 3. Backup trust/security subgate: signed strict vs restricted legacy

**Recommended secure architecture, subject to HQ signature:** authenticated modern envelope `web005.backup.envelope.v1` (e.g. Ed25519 over canonical, domain-separated payload), **server-controlled issuer/key registry and rotation/revocation**, fail-closed unknown issuer/bad signature/profile downgrade. Raw-byte classification must precede any Zod stripping; trusted proof must bind every protected field including strict-policy metadata, actions, revisions, stage/match/Undo IDs.

**Legacy positive format compatibility ≠ authentication.** `LEGACY_COMPAT_UNATTESTED` admits only a documented positive historical V2/V3 shape under **server-enforced restricted restore**: no old executable historical Undo/Global Undo/Direct Revert, no historical CAS tokens/permissions carried to the clone, never use `map.get(id) ?? id` for a recognized foreign reference. A fully stripped malicious new backup that is byte-identical to genuine unsigned old V2/V3 cannot be distinguished by structure alone; honest compatibility requires restricting **all untrusted historical provenance**, or relying on signed external issuance records.

**A00/HQ choices (none made by A30):** trusted issuer identity/registry, whether Ed25519/JCS or equivalent, signatures mandatory for new strict, offline legacy admission, signers/key rotation, restricted-mode persistence, old Unsafe Undo disposition, test-issued ephemeral signing only. If no trusted issuer policy, **`BACKUP_INGRESS_SOURCE_GO=HOLD`**. If user chooses deferred trust, future source may remain pure test-first only and **not be represented as secure live import**.

**Acceptable future GO sequence, not authorized now:** A90 new isolated raw ingress trust adapter + unit negative fixtures → A60 exact SHA source QA → separately reserved route/OpenAPI/parser integration before DB mutation → A70 action-local/provenance/revert rules → A20 PG16 test identity and clone transaction evidence → A50 real exact-SHA HTTP and rollback tests → A60 independent integrated approval. PR #67 defines [16 scenario security matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/880824f18b8913602955578dfd76eeac7976e32a/docs/web-005/agent-reports/A30/WEB-005_A30_R23C_BACKUP_INGRESS_SECURITY_CONTRACT.md), **not a passing importer**.

## 4. Basket T055 CAS server ordering/ownership

**Owner already approved product D1–D6** in the R21 packet — **do not reopen that product choice**. The unimplemented part is server persistence, precondition and exactly scoped rollout.

**Required ordering/security invariants:**
1. **D01–D04 migration policy + physically attested DB** first, with A20-exclusive allocation/PG16; do not create basket revision SQL while collisions or DB applied history are unknown.
2. Backend writer contract: full basket graph PUT **requires** `If-Match` revision, atomically checks version under lock/transaction, updates graph and increments revision exactly once; stale writer must fail **412/409 as signed API contract**, with **zero partial writes**. Missing precondition must produce **428** or other explicitly approved 4xx (not silent accept); no “optimistic” fallback.
3. Preserve organizer authorization, actor ownership, support/viewer denial where required and zero cross-stage updates. Never increment revision after failed transaction.
4. A110 client stays feature-gated until backend actually advertises server CAS capability, discards stale responses safely while **retaining unsaved drafts** on conflict and after 401/403. No false readiness from a client-only option.
5. Positive/negative server readback and physical PG16 concurrency/rollback with exact SHA, then A60 independent source/runtime QA. Composite PR #60 and PR #55 cannot be treated as integrated server contract.

**Owner/source responsibility:** A20 data schema/migration and runner safety, A90 Backup revision mapping, A70 stage action provenance, A110 frontend feature-gated CAS, A40 composite source controls, A50 executor, A60 independent acceptance, A00/HQ policy & release authority. A30 reviews auth/tenant boundaries only and does not implement other agents' code.

## 5. Written GO/HOLD requested from A00/HQ

| Subgate | A30 recommendation | Actual authority |
|---|---|---|
| D01 | `SOURCE_GRAPH_ONLY_APPROVE` or HOLD | **WAIT_OWNER**, no SQL |
| D02 | `RELEASE_FIRST_EDITOR_SECOND` or HOLD | **WAIT_OWNER**, no runner |
| D03 | `SOURCE+RUNTIME_RECEIPTS_REQUIRED` | **WAIT_OWNER**, no physical read |
| D04 | `EXCLUSIVE_A00_ALLOCATOR` | **WAIT_OWNER**, no numeric reservation |
| Backup modern issuer | `SIGNED_STRICT_AUTHENTICATED`, unknown/tampered => 400 no writes | **WAIT_OWNER**, PR56/58 NOT_WIRED |
| Backup legacy | `UNATTESTED_RESTRICTED`, no old Undo/CAS/replay | **WAIT_OWNER**, no migration |
| Basket server | Backend If-Match + persistent revision after D01–D04; feature-gated frontend | **HOLD_IMPLEMENTATION**, owner product choices signed but no code GO |
| Overall source/release handoff | Only after A50/A60 exact SHA tests, true live source reconciliation, independent DB receipts | **RELEASE_NO_GO / SWARM006_HOLD** |

**What counts as owner signature:** explicit selected choice + owner role/identity, UTC timestamp, immutable link, accepted risk and scope, exact release/test gates and review trigger for any defer. An Issue owner assignment is **not** an approval; agent recommendations are **not** owner decisions.

**A30 R23D QA truth:** GitHub source/PR/issue inspection and read-only Replit workspace inspection only. No terminal checkout, no native test run, no API mutation, no SQL, no deployment, no touched game code; `APP_TESTS_NOT_EXECUTED / SQL_NOT_EXECUTED / EXIT_CODES_NA`. All blockers communicated to A00 as **pending concrete actions**, not implied source PASS.

**A30 Issue #76 terminal:** `SECURITY_GATE_PACKET_READY / D01_D04_WAIT_OWNER / BACKUP_ISSUER_WAIT_OWNER / LEGACY_SERVER_RESTRICTION_WAIT_OWNER / BASKET_CAS_BACKEND_HOLD / NO_NEW_CODE_GO / RELEASE_NO_GO / SWARM006_HOLD`.
