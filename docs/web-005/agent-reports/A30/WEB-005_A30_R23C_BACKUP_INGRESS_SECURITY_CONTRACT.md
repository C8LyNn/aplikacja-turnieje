# WEB-005 / R23C / A30 — BACKUP INGRESS SECURITY ACCEPTANCE CONTRACT

**Task:** `WEB-005-T030-A30-R23C-BACKUP-INGRESS-SECURITY`  
**Mode:** SECURITY CONTRACT + FAIL-FIRST TESTS, isolated test-only source, no importer changes. **Date:** 2026-10-15.  
**Disposition:** `BACKUP_SECURITY_ACCEPTANCE_CONTRACT_READY` (contract/RED corpus ready, **NOT** integrated/accepted production security).  
**STOP:** no real import, production key, SQL, staging, deployment, merge, paid CI or SWARM-006.

## 1. Exact immutable upstream pins and actual integration boundary

- Release baseline: `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.
- [PR #56 strict core](https://github.com/C8LyNn/aplikacja-turnieje/pull/56): **`a7f71a7e7efdabd479b358a3cee80bc6359c4321`**, OPEN/DRAFT; source blob `595c68b87a5361623bef6293519ed668e9d4e493`. Its pure marker classification and action/history validation are independently scoped QA, **NOT_WIRED**.
- [PR #58 raw preflight](https://github.com/C8LyNn/aplikacja-turnieje/pull/58): **`e8100f7b0c1071c2a98880d4eb7947514fc58185`**, OPEN/DRAFT; source blob `518526d8d9ff2cef368261788e12c9f8290754f5`. `LEGACY_COMPAT_UNATTESTED` and `STRICT_AUTH_REQUIRED` both return `authenticated:false` and **all** `importAuthorized/historicalUndo/historicalRevert/historicalCasReplay:false`. Source-recognition **is not** issuer verification.
- [PR #60 / A40 first composite B1](https://github.com/C8LyNn/aplikacja-turnieje/pull/60): **`fa3261b2c9510e110ac9eba21726812d3401a525`**, OPEN/DRAFT. Exact parent release `1fdc401d...`, 14 unchanged source files from PR35/36/40/56/57/58, one disposable composite commit. Contains no production Backup HTTP/Zod importer/exporter wiring and no DB migration; composite source ≠ released functionality.
- [A30 P23-02 original security design](https://github.com/C8LyNn/aplikacja-turnieje/blob/5b9f396b8f723ee300b10d1b2a80f18edc3b33e8/docs/web-005/agent-reports/A30/WEB-005_A30_BACKUP_V3_P23_02_ANTI_DOWNGRADE_SECURITY_DESIGN.md) blob `4890a4e41374056a6383fdad523fdbc0a2fd97d9`, approved product Backup B1=A and B2=B/B3–B6=A; design ≠ code GO.
- Independently verified [A60 post-fix P23-01 exact PR56 review](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_PR56_P23_01_POST_FIX_INDEPENDENT_QA.md): scoped isolated JS test `22/22 PASS`, **not** full composite/native HTTP/PG16 verified.

Existing release HTTP ingress `artifacts/api-server/src/routes/tournaments.ts#L2951-L3119` calls `ImportTournamentBody.safeParse(req.body)` prior to V3 importer. Generated `lib/api-zod/src/generated/api.ts` lacks the strict marker and V2/V3 union uses broad `schemaVersion: zod.number()`; unknown fields can be stripped. `backup-v3.ts#L77-L121` and `backup-v2.ts#L226-L242` use remap `map.get(id) ?? id` for recognized nested Undo references. These are **source-confirmed** gaps; neither PR58 nor PR60 closes them at HTTP ingress.

## 2. Draft authenticated modern envelope: `web005.backup.envelope.v1`

**NOT A RUNNING PROTOCOL / NO PRODUCT KEY DEPLOYMENT.** Required proposed raw on-wire layout, independent of organizer/viewer/support fresh passwords:

```json
{
  "envelopeVersion": 1,
  "profile": "web005.backup-v3.strict.v1",
  "issuerId": "ISSUER_ID_FROM_APPROVED_TRUST_REGISTRY",
  "keyId": "ROTATING_PUBLIC_KEY_IDENTIFIER",
  "algorithm": "Ed25519",
  "issuedAt": "2026-10-15T00:00:00.000Z",
  "payloadDigestAlgorithm": "SHA-256",
  "payloadDigest": "<hex SHA-256 of canonically encoded full backup payload>",
  "signature": "<base64url Ed25519 detached signature>",
  "backup": {
    "schemaVersion": 3,
    "resultModelVersion": "series_v1",
    "rankingPolicy": "match_record_v1",
    "strictPolicy": {
      "profile": "web005.backup-v3.strict.v1",
      "version": 1,
      "matchStateRevisions": [],
      "actionOrder": [],
      "completionActions": []
    }
  }
}
```

**Normative draft requirements before any cryptographic code:**

1. A00/HQ chooses issuer identities, trusted public key source, rotation/revocation, retired-key verification, backup portability/offline requirements, signature clock/expiry policy and whether all modern imports require proof. A30 **does not** install/initialize an issuer registry. No signing private key, seed, HMAC shared secret or active token checked into this repository.
2. Canonicalization MUST be version-pinned and deterministic (proposed RFC 8785 JSON Canonicalization Scheme or equivalent reviewed binary encoding). Signature input is **domain-separated** and covers `envelopeVersion`, `profile`, `issuerId`, `keyId`, `algorithm`, `issuedAt`, `payloadDigestAlgorithm`, `payloadDigest` plus **complete canonical backup**, including `strictPolicy`, source IDs, modern revisions, action log, nested Undo and capabilities. The single `signature` field itself is excluded. Separate typed test vectors are mandatory; never sign only the mutable marker.
3. Verify signature against server-controlled trusted issuer/key ID and algorithm allowlist; a self-declared `producer`, `trusted`, `keyId`, `issuerId` or embedded arbitrary public key carries **ZERO** trust. Unknown issuer, invalid/modified signature, unsupported version, algorithm confusion, unknown key or revoked key ⇒ **HTTP 400 INVALID_BACKUP_V3 / ZERO preclone writes / NO downgrade**.
4. Preserve verified envelope/profile and canonical bytes through **raw ingress → typed Zod → common V3 validator → strict validator → clone transaction**. Do **not** run PR58 directly on the envelope wrapper as if it were its legacy V3 root; its present API expects a backup root and has no trusted issuer parameter.
5. A source backup that becomes byte-for-byte indistinguishable from a historically legal unsigned document cannot be proven modern without **out-of-band authentic provenance**. **`LEGACY_COMPAT_UNATTESTED`** may be positively shape-recognized and restricted by binding owner policy; it is never labelled `VERIFIED_STRICT`, and never receives historical destructive Undo/Revert or old CAS/session/token replay capabilities.
6. When product admits a legal unsigned old V2/V3 backup, enforce restricted mode **on the server** and persist restrictions with the clone (or equivalent proven safe rule), not just in UI. Old Undo logs can be omitted, quarantined or stored as non-executable historical evidence only under an exact A70-approved provenance policy.
7. Signing a backup authenticates **export bytes/issuer**, not the caller’s tournament authorization. Source organizer access still gates export; restore creates separate clone with **fresh** organizer/viewer/support credentials and clone-bound tokens.

**Open A00/HQ decisions:** trusted issuer and key lifecycle; whether Ed25519/JCS is the chosen protocol; ephemeral/offline issuer support; signed strict required vs unsigned strict fully validated but never privileged; explicit limited legacy import mode and organizer warning; typed 400/4xx mapping for credential and late DB failures. Backup B1–B6 product selections remain approved and are NOT re-opened.

## 3. Test-only files and adapter interface

This **dedicated test branch**, based on release, adds only:

| File | Function | What is proved today |
|---|---|---|
| `artifacts/api-server/test/fixtures/backup-v3-ingress-security.v1.mjs` | v1 synthetic V2/V3/strict fixture corpus (never real credentials/keys) | 16 named obligations and pure deterministic source shapes; no application security implementation |
| `artifacts/api-server/test/backup-v3-ingress-security.contract.test.mjs` | 12 named JS Node `node:test` suites + manifest sanity check; future pure ingress adapter contract | **RED until a future adapter exists**, no production import path called |
| `artifacts/api-server/test/backup-v3-ingress-security.pg16.contract.test.mjs` | 6 real HTTP/PG16 cases, explicitly safety-gated | **SKIP when no physical PG16 / A20 authorization**; not native HTTP/rollback PASS |

Future separately authorized adapter path supplied via `WEB005_BACKUP_INGRESS_SECURITY_ADAPTER` must export:

- `evaluateRawIngress({rawJson,issuers,captureWrite})` ⇒ `{decision:"REJECT"|"STRICT_VERIFIED"|"LEGACY_RESTRICTED",httpStatus?,code?,authenticated,capabilities?,serverEnforcedRestrictions?}`. `captureWrite` records forbidden prevalidation writes, not actual PG simulation; direct pure tests must show no calls.
- `inspectZodRoundTrip({rawJson})` ⇒ `{rawProfile,parsedProfile,profilePreserved,backupVersion}` with no unexpected marker stripping.
- `validateStrictSourceGraph({backup})` ⇒ `{ok,code?,issues?}`, validates recognized **action-local** and stage-local refs, not only exported ID membership. This pure seam runs only *after* authenticated profile dispatch in integrated code.
- `canonicalPayloadBytes(backup)` ⇒ `Uint8Array` of canonical payload bytes used for SHA-256 digest; `canonicalSigningBytes({envelope,backup})` ⇒ `Uint8Array` of versioned domain-separated signed bytes. The positive test creates an **in-memory ephemeral Ed25519 key pair**, never writes a private key; only the public test key is supplied under `issuers`.

**Important:** these are an *acceptance adapter specification*, not existing exports of PR56/58. The exact function/API names are test-side seam names that A00/A90 may adapt when formally implementing; tests must be updated through independent review if an equivalent interface is chosen. A test stub that returns hardcoded answers **cannot** be presented as actual ingress acceptance.

Future certified PG adapter `WEB005_BACKUP_INGRESS_PG_ADAPTER` exports `runPgScenario({caseId,rawJson,failpoint,...})` ⇒ evidence with actual `realHttp:true`, `realPg16:true`, `headSha`, full before/after table snapshots, authentic credential negative probes and induced rollback. It MUST NOT set flags true without physical execution. Source adapter is a harness boundary, **not** authorization for DB access.

### Execution commands and provenance

Pure fail-first suite (no install, no DB, safe to run in checkout; **expected RED** pending adapter):

```bash
cd artifacts/api-server
node --test ./test/backup-v3-ingress-security.contract.test.mjs
```

PG16 test suite (safe default **SKIP**, no DB touch until **all** verified owner/A20/A50 prerequisites are true):

```bash
cd artifacts/api-server
node --test ./test/backup-v3-ingress-security.pg16.contract.test.mjs
```

The executor must independently verify full **Git SHA** and exact fixture/test **blob SHA** before recording TAP. `NOT_EXECUTED`, `RED` and `SKIP` are **NOT** application PASS. Node `--check` or fixture-manifest PASS alone does not establish ingress protection.

**PG16 nonnegotiable preflight:** independent physical host and database identity attestation from A20, approved `TEST_DATABASE_URL` database name containing `test` and excluding prod/live/main/staging, named `tm_test_*` schema, `NODE_TEST_CONTEXT=1`, `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA`, **explicit A20/owner authorizations** `WEB005_A20_PG16_APPROVED=YES`, `WEB005_ALLOW_ISOLATED_PG16=YES` and `WEB005_PG16_HOST_ATTESTATION` plus valid real test adapter. **Environment flags alone are NOT proof** of physical isolation; no one should attempt a shared host by setting flags.

## 4. Test acceptance matrix — real HTTP and DB are future-only

| Case | Layer | Negative/positive | Expected before binding; eventual HTTP/result |
|---|---|---|---|
| **BI-01** marker stripping | Pure+future HTTP | Envelope modern strict but inner `strictPolicy` removed | **400 INVALID_BACKUP_V3**, 0 writes, never downgrade |
| **BI-02** unknown issuer | Pure | Unknown issuer/key for otherwise intact strict | **400 INVALID_BACKUP_V3**, 0 writes |
| **BI-03** bad signature | Pure | Known ephemeral issuer + forged Ed25519 bytes | **400 INVALID_BACKUP_V3**, 0 writes |
| **BI-04** version/profile confusion | Pure | V2 schema with strict profile, unknown version and algorithm | **400 INVALID_BACKUP_V3**, no legacy fallback |
| **BI-05** Zod strict marker stripping | Pure→future HTTP | Marker/raw canonical bytes differ from typed parsed result | **FAIL contract**; parser must preserve or explicit 400, never silently accept |
| **BI-06** unsafe legacy Undo | Pure→PG | Legitimate legacy-like structure with unverifiable action ID | **400** OR allow only explicitly restricted import: `historicalUndo/Revert/CasReplay=false` server enforced |
| **BI-07** foreign known-field IDs | Pure→future HTTP | Nested winner/match ID absent from export | **400 INVALID_BACKUP_V3**, not `map.get(oldId) ?? oldId` |
| **BI-08** action-local mismatch | Pure→PG | Action for match21 references exported match22 in undoPayload | **400 INVALID_BACKUP_V3**, 0 writes despite global ID membership |
| **BI-09** preclone write check | Pure→PG | Any failed signature/foreign ID | **400**, `preCloneWrites=0` verified in physical PG |
| **BI-10** legal old V2 | Pure→PG | Signed-origin unknown old shape with no strict fields | `LEGACY_RESTRICTED` or explicit reject pending policy; no historic privileges |
| **BI-11** legal old V3 | Pure→PG | Empty history/action arrays, optional phases absent | `LEGACY_RESTRICTED`, not fake strict; actual lawful restore tested separately |
| **BI-12** valid signed strict | Pure→future HTTP | Ephemeral Ed25519 public trust pin and signed complete payload | `STRICT_VERIFIED` only after real signature, mutation ⇒ 400 |
| **BI-13** late clone failure | Certified PG16 | Force failure after child INSERT before commit | HTTP non2xx, safe `BACKUP_IMPORT_ROLLED_BACK`, all clone tables unchanged, zero credentials |
| **BI-14** restore role binding | Certified PG16 | Old source organizer vs clone, valid new clone organizer | Old token cross-tenant 403, new clone organizer 200, historic Undo blocked |
| **BI-15** private viewer | Certified PG16 | `private_online` restored, old viewer/support credentials | Old/anonymous 403, newly chosen viewer 200, no role escalation |
| **BI-16** clone graph closure | Certified PG16 | Clone-local stage/player/match/action graph | 201 valid, 0 foreign references, 0 orphan and 0 executable unproven historical action |

**HTTP contract:** malformed/tampered/unauthorized *data* ⇒ 400 `INVALID_BACKUP_V3` before any DB write. Wrong organizer/viewer/support privileges ⇒ **403** (where auth domain chooses 401 for anonymous, keep signed semantics; never 200). Missing fresh private-online passwords ⇒ existing **422**. Stale CAS ⇒ separately approved 409/412/422 per endpoint. Unexpected genuine late PG failure ⇒ rollback and non2xx user-safe `BACKUP_IMPORT_ROLLED_BACK` (current route uses 400; a future 500 change needs A00 error-contract review). No stack/hash/token leakage.

## 5. Future source GO / owner dependencies

1. **A00/HQ:** issuer trust and key rotation, signed-vs-unsigned strict, positive historical import restriction policy, immutable signed envelope version/encoding; choose owner signoff in a single decision record. No trust assumptions from user input.
2. **A90:** future source-only raw-byte/pre-Zod canonical envelope verify and profile dispatch; maintain authenticated-vs-unattested **typed classification** and modern strict sidecar integrity; do not edit PR56/58 without owner SHA-specific GO. Export signed strict in separate owner-approved lane, no repository private signing keys.
3. **A20:** physical PG16 identity/reset approval, match state revision and basket T055 CAS restore contract, rollback and target migration provenance. No production SQL.
4. **A70:** source-action ownership stage/match rules, typed system BYE, full Undo LIFO, safe legacy restricted restore with enforced server errors and permissible recovery of locally newly-authorized provenance.
5. **A40/A60/A50:** composite #60 is source-only; first independently review exact new test-only PR. A50 execute pure RED and, once future production adapter exists, true new-head passing tests. A60 sign exact SHA and test receipts, not merely source.
6. **A00:** separate future file-scoped GO for actual importer/exporter/schema route wiring; exact dependency/conflict plan for PR41/48/56/58 and protected release; no merge/release by this document.

**Security acceptance is only reached when every applicable pure/HTTP/PG16 case PASS on an exact independently reviewed integration candidate.** It is **not** reached by merely authoring RED tests. `BACKUP_SECURITY_ACCEPTANCE_CONTRACT_READY` means only that deterministic contract gates are prepared.

**Final A30:** `TEST_FIRST_CORPUS_AUTHORED / AUTHENTICATED_ENVELOPE_V1_DRAFTED / SOURCE_PINS_VERIFIED / FUTURE_ADAPTER_MISSING_EXPECT_RED / PG16_NO_GO_EXPECT_SKIP / APP_IMPORT_NOT_RUN / RELEASE_NO_GO / SWARM006_HOLD`.
