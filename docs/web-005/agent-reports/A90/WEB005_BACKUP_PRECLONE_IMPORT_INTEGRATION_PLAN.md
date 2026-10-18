# WEB-005 / A90 / DEVELOPMENT FIRST WAVE 2 — Backup V3 raw-to-validated import integration plan

**Date:** 2026-10-18 (Europe/Warsaw)  
**Role:** A90 — Backup V3 Integrity & Restore  
**Task class:** source-reviewed **DESIGN + TEST-CONTRACT ONLY**, no application/DB mutations  
**Single highest-impact objective:** define a fail-closed insertion boundary for real \`POST /tournaments/import\` before any clone write, without silently turning the existing pure PR #100 adapter into import authorization.  
**Status:** \`BACKUP_IMPORT_PRECLONE_INTEGRATION_DESIGN_READY / REAL_WIRING_NOT_AUTHORIZED / OWNER_TRUST_WAIT / A60_INDEPENDENT_QA_PENDING / RELEASE_NO_GO / SWARM006_HOLD\`.

## 1. Verified exact source inventory and release divergence

| Component | Exact Git SHA / blob | Status and actual responsibility |
|---|---|---|
| **Release baseline** | \`release/tournament-ops-20261013-01@1db3734b8988940acc6be8b992420a58fc39624a\` | Checked live ref on 2026-10-18, **not** same as historical original release parent \`1fdc401d...\` of early PRs |
| [PR #56](https://github.com/C8LyNn/aplikacja-turnieje/pull/56) | HEAD \`a7f71a7e7efdabd479b358a3cee80bc6359c4321\`; strict module blob \`595c68b87a5361623bef6293519ed668e9d4e493\` | Strict core metadata/history/CAS/provenance checks; no producer authentication |
| [PR #58](https://github.com/C8LyNn/aplikacja-turnieje/pull/58) | HEAD \`e8100f7b0c1071c2a98880d4eb7947514fc58185\`; profile blob \`518526d8d9ff2cef368261788e12c9f8290754f5\` | Bounded raw V2/V3 shape preflight, \`LEGACY_COMPAT_UNATTESTED\` or \`STRICT_AUTH_REQUIRED\`, neither privileged |
| [PR #64](https://github.com/C8LyNn/aplikacja-turnieje/pull/64) | HEAD \`7837e412626e88761c70f1a2ceeb822d7ed101e1\`; A70 source blob \`9c3650180aed4f8aa5f2cd09b6d5d6ffc3de6b7c\` | Real isolated \`validateBackupV3ActionLocalProvenance\` **exists**, not yet accepted/wired into adapter |
| [PR #66](https://github.com/C8LyNn/aplikacja-turnieje/pull/66) | HEAD \`7490c974b7c84404559fd590bd09817a71c2134f\` | Pure raw adapter V2/V3, requires future external full semantic ports; never returns import authority |
| **[PR #100](https://github.com/C8LyNn/aplikacja-turnieje/pull/100)** | **HEAD \`6e198dc2c24cff651f8e75898c6e6e97eec9b0e4\`**, adapter blob \`0465e11b2420fa00f2de5cc14fa4d81858c76ff0\`, test blob \`51b658b1775f88c5d00ff721247ec6ede49feb86\` | Test-first hardens synchronous parser/semantic/A70 validation-port contract; 20 total tests, no import authorization |
| [PR #67](https://github.com/C8LyNn/aplikacja-turnieje/pull/67) | HEAD \`880824f18b8913602955578dfd76eeac7976e32a\`; security contract blob \`85541cad621231a3077b384b9c54f479cc2bf260\` | Future ingress acceptance and provisional envelope proposal, not implemented trust |
| [PR #105](https://github.com/C8LyNn/aplikacja-turnieje/pull/105) | HEAD \`779fa705fd585fe15d2cf56f23c0357e0cbe5a44\` | A50 C01 API first-failure DB-free diagnostic, **do not overlap** |
| [Issue #76](https://github.com/C8LyNn/aplikacja-turnieje/issues/76) | OPEN at inspection | A00/HQ trust model, actual legacy restricted capability enforcement and D01–D04 decision gate **not signed here** |
| [Issue #75](https://github.com/C8LyNn/aplikacja-turnieje/issues/75) | OPEN | A40 owns C02 dependency graph/composite and Replit drift; A90 does not merge or alter C02 |

All above Backup candidate PRs are **OPEN DRAFT / unmerged** when inspected. None proves the source-compatible composite is a released or Replit-live import path.

**Grounded release source (live release ref):**
- [\`artifacts/api-server/src/routes/tournaments.ts\`](https://github.com/C8LyNn/aplikacja-turnieje/blob/1db3734b8988940acc6be8b992420a58fc39624a/artifacts/api-server/src/routes/tournaments.ts), Git blob \`6767e7ac6c4d43cf39faa8a61534bdb92b898e14\`, **lines 2951–3119**: current HTTP route reads **already parsed \`req.body\`**, strips wrapper \`backup\`, validates fresh credentials and basic version, calls \`ImportTournamentBody.safeParse(req.body)\` at **3035**, reattaches one \`gameConfig\` raw field, hashes fresh credentials starting **3072**, then calls \`importBackupV2\` or \`importBackupV3\` at **3083–3086**.
- [Generated \`lib/api-zod/src/generated/api.ts\`](https://github.com/C8LyNn/aplikacja-turnieje/blob/1db3734b8988940acc6be8b992420a58fc39624a/lib/api-zod/src/generated/api.ts), blob \`38677491dba8fe0d99fb33158f76275479656af2\`: current \`ImportTournamentBody\` starts **3029**, V2/V3 \`schemaVersion: zod.number()\` rather than discriminated literals at **3031** and **3103**; modern \`strictPolicy\` is **not modelled**, so regular object parsing can strip security metadata. **Never trust re-serialized \`req.body\` as original raw bytes.**
- [\`backup-v2.ts\`](https://github.com/C8LyNn/aplikacja-turnieje/blob/1db3734b8988940acc6be8b992420a58fc39624a/artifacts/api-server/src/application/backups/backup-v2.ts), blob \`9afc658b403482f3e5aa5b50878897e876b49d28\`: \`validateBackupV2\` line **24**; import line **248**, calls validation line **252**, first write inside \`db.transaction\` starting **253**. Recognized Undo ID fallback \`map.get(value) ?? value\` at **226–242**.
- [\`backup-v3.ts\`](https://github.com/C8LyNn/aplikacja-turnieje/blob/1db3734b8988940acc6be8b992420a58fc39624a/artifacts/api-server/src/application/backups/backup-v3.ts), blob \`78d86246302fc8840696fd14c05c840304bc9f97\`: \`validateBackupV3\` line **656**; import line **1727**, validates line **1731**, first transaction **1735**. Nested source Undo remap fallback at **93–121**, including \`playerIds.get(value) ?? value\`. Legacy graph/clone rights cannot be inferred from raw shape alone.

## 2. Exact seam and trust boundaries — a future design, NOT executable wiring

\`\`\`text
HTTP raw request BYTES (future route-scoped verified raw capture, size/depth limits)
   |
   +-- Parse OUTER wrapper without losing duplicate-key evidence
   |   (credentials must stay separate from signed/validated backup payload)
   |
   +-- If versioned authenticated envelope: [FUTURE A00/A30-approved issuer trust]
   |     verify server-held trust root, signature over complete canonical payload,
   |     version/key/revocation and profile integrity BEFORE considering STRICT
   |     unknown/invalid issuer or envelope => DENY, NO legacy downgrade
   |
   +-- Raw BACKUP payload bytes -> PR58 profile preflight BEFORE Zod
   |   reject duplicates, hybrids, marker stripping, bad bounds/version
   |
   +-- Explicit VERSIONED V2/V3 lossless schema parse
   |   compare parsed V2/V3 security/critical fields to raw exactly
   |
   +-- TRUE full validateBackupV2 / validateBackupV3 (NOT test stubs)
   |   PR100 requires synchronous literal-void complete callbacks
   |
   +-- Modern strict: PR56 strict core + PR64 A70 action-local closure
   |   -> REQUIRE separately authenticated source producer & current caller
   |   -> otherwise STRICT_ATTESTATION_REQUIRED, zero writes
   |
   +-- Historical V2/V3: positive shape + real semantics + owner-approved
   |   restricted RESTORE mode; never source-history Undo/Revert/CAS authority
   |   -> absent enforced restriction => deny, zero writes
   |
   +-- Only after all gates: NEW credentials, independently allowed clone write
       in one transaction, clone-local ID remap and safe CAS seed,
       restricted capability persisted/enforced; failure => full rollback
\`\`\`

**Crucial API invariant:** current PR100 \`validateRawBackupBeforeClone\` has **no positive \`importAuthorized\` output** for either profile. For a structurally legal modern strict backup it always ends in \`STRICT_ATTESTATION_REQUIRED\`; for source-shaped historical it returns \`LEGACY_COMPAT_RESTRICTED\`, **not approved import**. Thus the first implementation wave must be **deny-only/read-only profile observation** or a separately signed trust-and-capability admission design; routing \`if (result.code === "LEGACY_COMPAT_RESTRICTED") importBackupV3(...)\` would be a security defect, not progress.

**No unreviewed new bypass tokens:** never add \`verified=true\`, \`trusted=true\`, client public key, magic issuer code, exception for unknown profile, or a no-op validation closure as the production fallback. A30's \`web005.backup.envelope.v1\` plus Ed25519/JCS is a **draft**, not signed or deployed. Owner explicitly chooses trust root, key lifecycle, signed/unsigned policy and allowed restricted recovery. The current preflight operates on an inner Backup V2/V3 root, **not** an outer envelope.

**Preserve caller policy separately:** source backup issuer verification authenticates **exported bytes** only, never the current HTTP organizer/administrator identity. Fresh clone credentials must stay new and distinct; old source tokens/passwords/hostCode cannot be imported. Keep existing credential error mapping (401/403/422 where applicable) and avoid logging raw secrets.

## 3. One prioritized safe engineering slice: GATE-0, read-only/no-write ingress proof

This Wave 2 prepares **only** the future GATE-0 contract, not code or writes. Under a NEW A00/HQ explicit **file-scoped GO**, give A90 a dedicated child Draft PR for:
1. **Raw capture boundary**, scoped solely to backup import requests with independent transport-byte limit and JSON duplicate-member rejection **before** body parsing. Capture whole outer HTTP JSON as immutable bytes; extracting nested backup bytes must retain original bytes/duplicate-key and do **not** merely use \`JSON.stringify(req.body.backup)\`.
2. **Lossless deterministic profile dispatch**, using already pinned PR58 + PR100 (and exact pinned PR56 strict) with version-specific verified schema ports; document mismatch with generated \`ImportTournamentBody\`, reject unknown sidecars/unsupported profile while preserving current gameConfig compatibility. No edits to actual importer/exporter and no DB provider in GATE-0.
3. **No-write observation/decision only:** return typed denial or internal validation evidence, NEVER call \`importBackupV2/V3\`; prove with a write-spy passed at a controlled test boundary and with protected caller privileges. A status like \`LEGACY_COMPAT_RESTRICTED\` must not return 201 or tokens.
4. **Action-local dependency:** PR64 real \`validateBackupV3ActionLocalProvenance\` is a proposed, **independently reviewed** strict-only validation port, not automatically included in PR100 or C02. Use only after A60 exact SHA and compatible source shape. No global-ID-only stand-in.
5. **Typed HTTP error contract proposal:** raw unsupported/inconsistent modern or failed strict policy → 400 \`INVALID_BACKUP_V3\` (or approved corresponding V2 error), no clone, no token; absent issuer trust or legacy admission → typed denial (status/code selected separately by A00/A30); reserved validation diagnostics must not leak signed bytes, passwords or sensitive IDs.
6. **Canary irreversibility check:** before any future positive restore implementation, require proof that no operation on blocked modern/legacy can reach \`hashPassword\` / DB write / token issuance. \`hashPassword\` is not itself DB write but should follow successful gating to avoid unnecessary work. Do not change the live error contract without A00 signoff.

**Files that would be touched only after separately authorized GO:** one new narrowly-scoped \`application/backups/*-ingress-preclone.ts\` pure orchestrator + tests; route-specific raw capture middleware/route registration only after A30 approval; \`routes/tournaments.ts\` and version-tagged Zod/OpenAPI parse surfaces **separate explicit GO**. **Not** \`backup-v2.ts\`/\`backup-v3.ts\` clone internals, credentials, \`@workspace/db\`, migrations, protected release or Replit live in GATE-0. A40 owns disposable composite source pins and any C02 dependency adoption, not A90.

## 4. Mandatory test-first acceptance matrix for the first GATE-0 read-only PR

All cases below are **DESIGNED, NOT EXECUTED** in Wave 2 (except old PR100 pure tests, separately described). They must run against exact future source SHA with actual raw ingress (not pre-parsed fixtures), and at least the pure cases require no PG16.

| ID | Input / attack | Expected status/evidence before DB |
|---|---|---|
| W2-01 | Actual raw V2 legitimate historical BYE with fresh credentials | Profile legacy unattested, full V2 semantic validator invocation; **import denied until restricted policy**, 0 writes |
| W2-02 | Actual raw V3 legal old optional-null/empty action history | Legacy unattested and structurally compatible; no original Undo/CAS authority; 0 writes |
| W2-03 | Modern strict marker + valid metadata but no trusted issuer | \`STRICT_ATTESTATION_REQUIRED\`, full strict checks do not imply authentication, 0 writes |
| W2-04 | Modern strict marker removed, modern sidecar remains | \`PROFILE_REJECTED\`, no downgrade, 0 writes |
| W2-05 | Fully stripped modern inner payload identical to legal historical shape | At most \`LEGACY_COMPAT_UNATTESTED\`, NEVER strict verified or Undo enabled, 0 writes |
| W2-06 | Duplicate nested JSON key \`strictPolicy\`/version/recipient | Reject from original raw bytes **before parser**, even if \`req.body\` loses duplicate, 0 writes |
| W2-07 | Zod strips \`strictPolicy\`, version changes or gameConfig normalization | \`PARSED_PROFILE_CONFLICT\` or prior deliberate typed reject; 0 writes |
| W2-08 | Async parser / async \`validateBackupV2/V3\` / async A70 closure | PR100: typed \`PARSER_FAILED\`, \`SEMANTIC_VALIDATION_FAILED\` or \`ACTION_LOCAL_CLOSURE_FAILED\`, flags false, 0 writes |
| W2-09 | Old semantically invalid BYE / duplicate match round-number pair | Full real domain validation failure, 0 writes (structural classification ≠ domain acceptance) |
| W2-10 | Nested action Undo ID for other existing match/stage/tournament | Actual A70 action-local fail; global membership must not confer authority, 0 writes |
| W2-11 | Fake \`trusted:true\`, arbitrary key, unsupported envelope version, forged signature | Typed reject, untrusted issuer/marker cannot create import credentials, 0 writes |
| W2-12 | Wrapped payload with valid new organizer/viewer password plus old source hostCode | Old hostCode forbidden, new passwords validated separately, 0 writes |
| W2-13 | Missing actual V2/V3 domain port or missing A70 strict dependency | \`MISSING_DEPENDENCY\`, 0 writes; no permissive test stub fallback |
| W2-14 | Imported user's former Undo payload has unrecognized or foreign ID | No \`map.get(oldId) ?? oldId\` privilege under modern strict; legacy source log non-executable or fail, 0 writes |
| W2-15 | Oversized input, deep arrays, invalid UTF-8 / malformed raw JSON | Bounded, typed rejection at transport/raw preflight, 0 writes |
| W2-16 | Future authenticated strict envelope with valid bytes but caller lacks restore permission | Distinguish issuer signature from current actor authorization; denied preclone, no token/write |

**Separate AFTER GATE-0 owner-authorized future PG16 cases (NOT_EXECUTED):** valid approved restore with clone-local ID remap and fresh credentials; last-write failpoint full transaction rollback/13-table census; persisted legacy restrictions across *all* mutation/Undo/Revert/CAS routes; cross-tenant old-token negative; qualified/staged routes and modern CAS revision normalization. Only A20 physically certified disposable PG16, distinct named owner SQL/reset GO and A60 independent QA may turn these from design into executable tests. No source test plan silently grants destructive PG16 authority.

## 5. Current evidence, blockers and ownership sequence

**Actual existing PR #100 test receipt (not new Wave 2 execution):** [automatic GitHub Actions 39125442053](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39125442053), exact source \`6e198dc...\`, native workspace TypeScript \`PASS\`; **20/20 named adapter Node/TAP tests PASS**, including 5 new sync/async port regressions; **workflow overall FAIL** later at aggregate API integration \`exit 1; signal none\`. Thus \`PURE_ADAPTER_TARGETED_PASS\`, not \`END_TO_END_IMPORT_PASS\`. No new Wave 2 test run, SQL or HTTP test has been executed or claimed.

| Gate | Owner / dependency | As of Wave 2 |
|---|---|---|
| T0 — pinned source lineage / A60 review | A10 + A60; PR56/58/64/66/100 exact SHA; release \`1db373...\` reconciliation | **OPEN**; not a release merge |
| T1 — raw ingress format and transport ownership | A00/A30 for route/parser modifications, A90 pure contract | **WAIT FILE-SCOPED GO** |
| T2 — producer attestation and key lifecycle | A00/HQ + A30, independent real signatures/issuer policy | **WAIT_OWNER**; no \`verified=true\` substitution |
| T3 — legacy restricted server capability and user-facing consent | A00/HQ + A70 + A90, must disable old action/CAS on server | **WAIT_OWNER / NOT_ENFORCED** |
| T4 — exact-version FULL validator binding + A70 action-local | A90/A70/A60, real source code and tests; no test stubs | **NOT_WIRED / SOURCE QA REQUIRED** |
| T5 — clone-local strict ID mapping and CAS init | A90/A20/A70 in future separate PR after trust and DB gate | **STOP**; legacy fallback still present in current importer |
| T6 — full runtime and rollback | A20/A50/A60 on authorized physically disposable PG16 | **NOT_EXECUTED / PG16 HOLD** |
| T7 — C02/release/Replit | A40/A10 + A00; C01 API root cause PR105, 140-path Replit live preservation | **NO MERGE / NO DEPLOY / SWARM006 HOLD** |

**Important operational boundary:** R23H's high-risk C01 PG16 testing cannot be borrowed as permission to test this plan; the design is DB-free and should stay DB-free until *its own* phase has explicit approval. A50 PR105 owns first-failure API diagnosis; A40 owns C02 sequencing; A140 owns live/Replit preservation. A90 does not duplicate them.

**Final recommendation to A00/HQ:** authorize at most **GATE-0 read-only, source-only** test-first work in specific paths after A30 source review, with refusal-only behavior. Reserve positive signed/legacy restore, HTTP wiring and any actual clone transaction for separate individually signed waves. Until then preserve both \`STRICT_ATTESTATION_REQUIRED\` and \`LEGACY_COMPAT_RESTRICTED\` as **NOT AUTHORIZED**.

**FINAL:** \`BACKUP_WAVE2_IMPORT_PLAN_PUBLISHED / SOURCE_REVIEW_READY / ZERO_APP_CHANGES / TEST_MATRIX_DESIGNED_NOT_EXECUTED / TRUST_WAIT_OWNER / DB_PG16_HOLD / REAL_IMPORT_NOT_INTEGRATED / RELEASE_NO_GO / SWARM006_HOLD\`.
