# WEB-005 — R23D / A90 — Issue #76 Backup V3 trust & gated source sequencing

**Task:** R23D / A90, Issue #76 — Backup trust and CAS backend decision gate  
**Date:** 2026-10-16 (Europe/Warsaw)  
**Role:** A90 / Backup V3 Integrity & Restore  
**Mode:** GOVERNANCE + SOURCE-PROVENANCE REVIEW / DOCS ONLY — NOT A SOURCE IMPLEMENTATION GO  
**Source outcome:** `A90_R23D_OWNER_DECISION_PACKET_PUBLISHED`  
**Decision status:** `BACKUP_TRUST_WAIT_A00_HQ / D01_D04_WAIT_OWNER / BACKUP_WIRING_HOLD / CAS_SERVER_HOLD / RELEASE_NO_GO / SWARM006_HOLD`  
**Authority caveat:** all recommendations in this document are **proposed for A00/HQ**. They are not a forged owner signature, code authorization or production consent.

## 0. Actual task and current control

- [R23D dispatch](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R23D_EXECUTION_DISPATCH_20261016.md), verified blob `226b6a89c3fd8348eac814221de1c9715ee6ae25`, gives A90 **Issue #76 only** together with A00/A20/A30; project game domain frozen and no live Replit deploy.
- [Issue #76](https://github.com/C8LyNn/aplikacja-turnieje/issues/76), OPEN: **P0 governance/architecture**, no code changes until separately permitted, explicit written GO/HOLD per subgate, no self-approval. On the first R23D read it had **zero issue comments**, and thus no issue-local A00/HQ trust signoff to act upon. This handoff comment is not itself that signature.
- [Issue #73](https://github.com/C8LyNn/aplikacja-turnieje/issues/73) C01 API exit 1 first-failure triage remained OPEN with no issue comments at source check; [#75](https://github.com/C8LyNn/aplikacja-turnieje/issues/75) C02 requires #73 triage and an independent source QA gate. A90 does not bypass either.
- **Current release ref independently verified via GitHub**: `release/tournament-ops-20261013-01@1db3734b8988940acc6be8b992420a58fc39624a`. Most earlier isolated Backup source PRs still target **older release ancestry** `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`. This is an explicit lineage/reconciliation dependency; do not mistake source compatibility with live Replit state.
- R23D dispatch documents **Replit published checkpoint `cb55335ea8e789d5e0f7912955da7d679d7dbb5f` as local-only** and 140 Replit/release source drifts (90 local-only, 50 different blobs). No direct Replit workspace access, reconciliation or live changes were undertaken in this task; these statistics are inherited dispatch facts, not an A90 independent diff calculation.

## 1. Current exact Backup source and test inventory

| Candidate | Actual HEAD SHA read from GitHub | Status / source scope | Evidence |
|---|---|---|---|
| [PR #56](https://github.com/C8LyNn/aplikacja-turnieje/pull/56) strict B2/B3/B4/B5 policy | `a7f71a7e7efdabd479b358a3cee80bc6359c4321` | OPEN DRAFT, unmerged, NOT_WIRED | Strict module Git blob `595c68b87a5361623bef6293519ed668e9d4e493`; genuine BYE P23-01 source fixed; strict marker does not prove issuer |
| [PR #58](https://github.com/C8LyNn/aplikacja-turnieje/pull/58) raw V2/V3 profile preflight | `e8100f7b0c1071c2a98880d4eb7947514fc58185` | OPEN DRAFT, unmerged, NOT_WIRED | Profile module Git blob `518526d8d9ff2cef368261788e12c9f8290754f5`; `LEGACY_COMPAT_UNATTESTED` gives zero history privileges |
| [PR #60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60) composite C01 | `fa3261b2c9510e110ac9eba21726812d3401a525` | OPEN DRAFT, not a release | Includes exact above PR56/PR58 source blobs; API integration aggregate failure still requires #73 first-failure handling |
| [PR #66](https://github.com/C8LyNn/aplikacja-turnieje/pull/66) raw-to-validated preclone adapter | `7490c974b7c84404559fd590bd09817a71c2134f` | OPEN DRAFT, unmerged, NOT_WIRED; base is C01, **not release** | Adapter blob `c02ca0aa877017456142f081eff9e9f877522ca2`; test blob `dc3d44ef8bd25b5b94dbd99f5447836c000a4c6d` |
| [PR #64](https://github.com/C8LyNn/aplikacja-turnieje/pull/64) A70 action-local validator | `7837e412626e88761c70f1a2ceeb822d7ed101e1` | OPEN DRAFT, unmerged, pure source NOT_WIRED, separate A60 QA | New source blob `9c3650180aed4f8aa5f2cd09b6d5d6ffc3de6b7c`; real `validateBackupV3ActionLocalProvenance` exists as isolated candidate, **not** integrated into PR66 |
| [PR #67](https://github.com/C8LyNn/aplikacja-turnieje/pull/67) A30 ingress security contract | `880824f18b8913602955578dfd76eeac7976e32a` | OPEN DRAFT, unmerged, test-first source only | Ingress test Git blob `957141164ab45a9a9bca0b92cb33ae99b964fefb`; explicit EXPECTED RED future adapter contracts, PG16 SKIP until separately authorized |
| [PR #38](https://github.com/C8LyNn/aplikacja-turnieje/pull/38) A20 migration identity graph | `2d36864f4d2f1c838073f387fd3c8efb3378c43b` | OPEN DRAFT, unmerged, proposed manifest | D01–D04 decision packet is owner-pending, not an APPLIED migration ledger |
| [PR #63](https://github.com/C8LyNn/aplikacja-turnieje/pull/63) A110 CAS feature-gated client | `3ddcfea2ba47f4314fced3022d00922f8cedb0e3` | OPEN DRAFT, unmerged; server CAS missing | Client is feature-gated off, must not cut over before persisted revision and atomic If-Match server |

**R23D no code edits:** no source/git blobbytes modified in any of these PRs; do not treat this documentation packet as a new app patch, runtime test or independent A60 verdict.

## 2. Approved product policy — preserve decisions, do not reopen them

1. **B1=A (explicit owner):** modern strict and safe compatible historical V2/V3 — [B1 approval](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R21_OWNER_BACKUP_B1_COMPATIBILITY_APPROVAL.md), blob `a0579990ace09d85eea62cfcab33b8ad54ea6fdc`.
2. **B2=B, B3=A, B4=A, B5=A, B6=A (delegated A00 under owner topic authorization)** — [B2–B6 owner-delegated selection](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R21_OWNER_DELEGATED_BACKUP_B2_B6_DECISIONS.md), blob `e6da9f88f1b4e520bae1f1b6183e862a0ff51c1a`. Policy: strict current/latest history parity, distinct portable match-state CAS revision, typed action provenance plus deterministic LIFO, fail-closed recognized nested IDs, typed preclone 400/no writes and late transactional rollback. Valid old copies may be admitted only on an **explicit restricted server-enforced** compatibility path without inferred historical Undo/Revert/CAS.
3. **T055 Basket D1=B / D2=B / D3=B / D4=A / D5=B / D6=B** — [signed owner selection](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R21_OWNER_T055_BASKET_CAS_APPROVAL.md), blob `36a14ef3be7852c202cc003264bf17e67da2f022`. Persisted monotonic basket revision, GET strong ETag / PUT If-Match, 412 stale, 428 missing, in-lock stage/roster preconditions, retain draft and explicit manual reconciliation. **Not** DB migration or server cutover authorization.

**Separate new security decision remains open:** how to authenticate a genuine **modern issuer** and bind source bytes to a verifiable trust root, which legal legacy sources can be recovered in restricted mode, and how to enforce that restriction after clone. B1–B6 is not permission to trust user-supplied markers, booleans, public keys, or timestamps.

## 3. A90 Backup trust decision cells for A00/HQ — explicit proposal, no proxy-signature

| Gate | A90 safe proposed direction | Decision status / consequence |
|---|---|---|
| **BT-01 authenticated issuer** | Owner-administered issuer registry or other independently verified immutable issuance trust root. User JSON `trusted:true`, `producer`, `issuerId`, `keyId`, self-supplied public key and strict marker NEVER count as trust. | **WAIT_OWNER**, until approved: **all strict modern → `STRICT_ATTESTATION_REQUIRED`** |
| **BT-02 canonical authenticated envelope protocol** | Review A30's versioned `web005.backup.envelope.v1` with complete payload SHA-256, deterministic RFC8785-compatible canonical bytes/domain separation, Ed25519 signature and explicit key/algorithm allowlist as a **proposal**, NOT an implemented or chosen cryptographic scheme. Define key rotation/revocation, retired-key replay and offline-backup policy before code. | **WAIT_OWNER + A30 SECURITY GO**; no signature code or test secrets created |
| **BT-03 strict failure behavior** | Unknown issuer/key, modified content/profile, contradictory envelope, invalid signature or stripped marker = preclone typed denial, no legacy fallback; no untrusted `verified=true` override. Bind immutable verified profile through raw-byte ingress BEFORE Zod, exact V3 parser, full domain/PR56/A70 checks, clone mapping and HTTP. | **HOLD_WIRING**; current PR66 intentionally ALWAYS denies strict even after test callback success |
| **BT-04 legal historic compatibility** | B1-A/B2-B approved restricted recovery: positive historical format recognition **plus** full current validator/schema/domain checks, no unverifiable old privileged action replay; per-clone persisted/reconstructible restriction and all Undo/Revert/CAS entrypoints gated. Legacy status from PR58 alone ≠ origin or permission. | **WAIT_OWNER** on concrete admission/quarantine UX, storage and enforcement contract; current PR66 `LEGACY_COMPAT_RESTRICTED` **never grants import** |
| **BT-05 future parser/binding ownership** | Reserve A90 raw-byte adapter/dispatcher and version-specific validators; A30 owns security acceptance; A70 owns full action-local semantics; A20 owns revision/migrations; A50 native tests, A60 independent acceptance, A00/HQ grants exact file-scoped GO. Keep producer signing/export and live importer mutation in **separate** individually approved lanes. | **WAIT_GO**; no PR56/58/64/66/67 silent integration |
| **BT-06 unsafe restoration/remapping** | Require clone-local ID maps without `map.get(oldId) ?? oldId` for recognized operational IDs in strict; correct action-local stage/tenant/history binding, portable revision rebase, global Undo ordinal; no forged old tokens/secret carryover. Backed by B2–B6 and A70. | **HOLD_UNTIL_IMPLEMENTED_AND_TESTED** |

**A30 reference:** [R23C ingress security contract](https://github.com/C8LyNn/aplikacja-turnieje/blob/880824f18b8913602955578dfd76eeac7976e32a/docs/web-005/agent-reports/A30/WEB-005_A30_R23C_BACKUP_INGRESS_SECURITY_CONTRACT.md), blob `85541cad621231a3077b384b9c54f479cc2bf260`; explicitly proposes envelope and lists owner's trust decisions, and its 12 pure and 6 PG16 contract suites do NOT implement or authorize the real ingress. **Never apply PR58's current backup-root classifier directly to an outer signed envelope** without a reviewed unwrap/verification trust boundary.

**A70 dependency update:** contrary to earlier R23C handoff wording, source implementation exists in PR64. It is **not yet approved/wired**; replace A70 test stub in future only after independent exact-SHA QA, static typing, user-approved composite integration and real action-local negative tests.

## 4. Neighboring migration/CAS execution gates — A20/A00 owns decisions

**Verified [A20 D01–D04 packet](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A20/WEB-005_A20_R23B_A00_DECISION_PACKET.md)**, blob `1a6475847fe9a7726b0fb8806891098c2ea3abbe`: its actual status remains `PENDING_OWNER_APPROVAL`. A90 makes no DB signature or number allocation.

| Gate | A20 proposed policy, NOT yet owner signed | R23D status |
|---|---|---|
| D01 | `APPROVE_SOURCE_GRAPH_ONLY`: preserve immutable 14 source identities and checksum DAG of original 0027–0040; not proof of SQL execution | **WAIT_OWNER** |
| D02 | `RELEASE_FIRST_EDITOR_SECOND`: release 0030/0031 distinct from editor 0030/0031, propose editor canonical 0032–0040 | **WAIT_OWNER** |
| D03 | `SOURCE_AND_RUNTIME_RECEIPT_REQUIRED / UNKNOWN_FAIL_CLOSED`: read-only explicitly authorized physical PG catalog + migration ledger + executed-input SHA + immutable deployment receipts before any APPLIED claim | **WAIT_OWNER**; no physical SQL accessed |
| D04 | `A00_CONTROLLED_SERIALIZED_ALLOCATOR`: repository lease + unique logical and numeric IDs; T055 migration **REQUESTED_NOT_ALLOCATED**, numeric ID `null` | **WAIT_OWNER**, no slot occupied |

**Cross-stream dependency:** until D01–D04 and an actual history/DB execution receipt, neither Steam/editor catalog DDL reconciliation nor T055 persisted `basketConfigRevision` migration can safely receive SQL GO. The new Backup V3 importer cannot safely revive old basket ETags/CAS state; clone identity and starting local revision require separate A20/A90 implementation and test. Existing CAS client PR63 must stay feature-gated OFF until genuine backend GET/ETag and atomic PUT/If-Match are verified. The #72 Steam/security/migrations lane and #74 client lane remain separate task owners; A90 does not take over their code.

## 5. Implementable NEXT WAVE once exact A00/HQ signatures are issued

**Sequencing proposal (do not execute from this packet alone):**

- **G0 — owner governance:** issue dated, named, permalinked D01–D04 decision + BT-01..BT-04 trust/legacy decisions; specify allowed file paths, pinned dependency SHA, executor, test boundaries, rollback and A60 acceptance for each implementation wave. A00 signs; A30 co-reviews security, A20 DB.
- **G1 — source integrity:** resolve #73 C01 aggregate API test first failure and enable #75 C02 only on independently reviewed source packs. Reconcile new release `1db373...` versus original PR baselines `1fdc401...`, and keep the 140-path Replit live drift out of automatic merges. Preserve game byte identity and live checkpoint, no direct deploy.
- **G2 — pure auth/closure:** integrate PR64 A70 action-local module as an explicitly approved trusted dependency in a **new disposable** composite; test against PR56/58/66 API/fixtures and all A30 fail-first security cases. If owner selects signed envelope, separately implement canonical signed-byte verification/issuer registry and typed validated profile. No private key in source.
- **G3 — schema/parser/full domain:** bind genuine exact-version full `validateBackupV2`/`validateBackupV3`, preserve verified source profile through raw-before-Zod without loss, full strict action graph and import permission solely from server trust+role policy (never source JSON). Use actual archived V2/V3 producer fixtures with exact provenance; absent archive authenticity remains UNVERIFIED.
- **G4 — clone restrictions and rollback:** owner-approved restricted historical recovery must persist enforced capability limits on all mutation entrypoints and clone-local ID remap/CAS. Test 400/no clone on bad raw, BYE/history/action-local cross-match, forged issuer/marker stripping, recovered old copy with unsafe undo blocked; late failure full rollback. PG16 only after separate A20 physical identity plus owner **explicit test reset GO**.
- **G5 — release eligibility:** independent A60 exact composite SHA source+native/API/PG16/security review and A10 append-only source lineage, A00 written handoff decision, reconciliation against Replit/live checkpoint and separate deployment release process. Do NOT run SWARM-006 before formal GO.

**STOP chain:** no game source/assets/canvas/loaders, no importer/exporter/route edits in this R23D issue, no merge to main/develop/release, no force push, no SQL/migration assignment/schema reset, no paid CI rerun, no production Replit republish, no SWARM-006. An issue, old owner policy and author source PASS do not authorize a new step.

## 6. Execution/QA receipt for this R23D A90 task

| Evidence / operation | Actually performed? | Result |
|---|---|---|
| Dispatch and exact Issue #76 | GitHub read | verified dispatch blob and OPEN P0 governance issue; zero issue comments on initial read |
| Current PR #56/#58/#60/#64/#66/#67/#38/#63 HEAD, draft/merge state | GitHub API reads | exact HEADs in §1; all still OPEN DRAFT/unmerged |
| Live release ref | GitHub Git ref read | `1db3734b8988940acc6be8b992420a58fc39624a` |
| Owner policies B1/B2–B6/T055 and D01–D04 A20 packet | GitHub content read | approval scope distinguished; D01–D04 remain owner unsigned |
| A30 and A70 R23C source/contract | Exact blob read | source artifacts exist; not live-integrated or independently accepted as a unit in this task |
| A90 R23C PR66 previous automatic CI evidence | Previously retrieved actual GitHub workflow [38742658793](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38742658793) | `PASS workspace typecheck`; **15/15 A90 adapter native Node/TAP PASS**; **overall workflow FAIL** at aggregate API integration exit 1. This is *previous PR evidence*, not a new R23D test run |
| New R23D native Node/pnpm/HTTP/PG16 or browser tests | **NOT_EXECUTED** | No source changed, no new runnable R23D suite, no authorized DB reset |
| New R23D application code, game code or migrations | **NO CHANGES** | Documentation-only isolated branch; therefore no new application code SHA or release rollback required |
| Physical production/live/Replit state | **NO ACCESS/CHANGE** | No deploy/republish executed; actual live browser safety remains independently unverified |

**Review type:** A90 documentation/source governance self-check only, **NOT an independent A60 source acceptance or runtime certification**.

## 7. Owner/HQ decision record template — REQUIRED, intentionally UNSIGNED

- **Owner/authority identity:** `PENDING_A00_HQ`
- **Signed timestamp (Europe/Warsaw):** `PENDING`
- **Authoritative permalink:** `PENDING`
- **D01, D02, D03, D04:** `PENDING` (separate choices)
- **BT-01 issuer and immutable trust root:** `PENDING`
- **BT-02 signature/envelope encoding/key lifecycle/offline/backward compatibility:** `PENDING`
- **BT-03 strict untrusted/invalid marker response policy:** `PENDING`
- **BT-04 actual legacy admission UX + persisted restricted capability enforcement:** `PENDING`
- **Concrete follow-up file-scoped GO (owner, source SHA, test/PG16 bounds, rollback):** `NOT_GRANTED`
- **Protected merge, live deployment, SWARM-006:** `NO_GO`

**A90 final recommendation to Issue #76:** `HOLD_BOTH_BACKUP_INTEGRATION_AND_T055_DB_CUTOVER` until the above signed gates; allow **source review and documentation** to continue without falsely promoting approval. Forward this packet to **A00 owner**, A30 security, A20 migration, A70 action-local, A60 independent QA and A10 registry.

**Final status:** `R23D_A90_ISSUE76_PACKET_PUBLISHED / BACKUP_TRUST_WAIT_OWNER / D01_D04_WAIT_OWNER / CODE_NOT_AUTHORIZED / NO_APP_CHANGES / QA_DOCS_ONLY / RELEASE_NO_GO / SWARM006_HOLD`.
