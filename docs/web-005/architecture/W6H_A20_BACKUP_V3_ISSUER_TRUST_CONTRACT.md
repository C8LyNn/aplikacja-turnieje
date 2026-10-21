# WEB-005 / W6H — A20 authenticated Backup V3 issuer/trust contract (CANDIDATE)

**Role:** A20 contract/design owner, **A90 implements** isolated auth/attestation and anti-downgrade source, A30 security acceptance, A60 QA, A00 key/trust policy owner.  
**Status:** `SOURCE_CONTRACT_READY / ISSUER_AND_LEGACY_POLICY_OWNER_GO_REQUIRED / IMPORTER_NOT_WIRED / PG16_NO_GO`. This file is NOT an exporter, importer, key store, signature implementation, SQL change or release approval.  
**Pinned source:** C03 PR #134 `80bb4ca7a9a359fbe76dbab1478a1af16ded0174`. Related anti-downgrade test contract PR #67 HEAD `880824f18b8913602955578dfd76eeac7976e32a`; do not graft its branch blindly.

## 1. Verified existing pure code and security gap

- Raw profile gate `artifacts/api-server/src/application/backups/backup-v3-profile-gate.ts` Git blob `518526d8d9ff2cef368261788e12c9f8290754f5` detects `LEGACY_COMPAT_UNATTESTED`, `STRICT_AUTH_REQUIRED` and `REJECT` based on bounded raw JSON shape. **Never treats historical shape as proof of origin.** Important: stripped modern strict backup may be byte-indistinguishable from unsigned historical payload absent external server provenance.
- Strict policy `backup-v3-strict-policy.ts` blob `595c68b87a5361623bef6293519ed668e9d4e493` detects `STRICT_MARKED` / `UNATTESTED` / `INVALID_PROFILE`. The marker `web005.backup-v3.strict.v1` is not cryptographic authentication. Missing marker must **not** silently downgrade.
- `backup-v3-action-provenance.ts` blob `9c3650180aed4f8aa5f2cd09b6d5d6ffc3de6b7c` validates action-local/stage-local referential closure on strict V3; successful pure validation is not historical Undo, revert, CAS or import permission.
- `backup-preclone-adapter.ts` blob `0465e11b2420fa00f2de5cc14fa4d81858c76ff0` accepts injected parse/validate ports yet returns `authenticated:false` and `importAuthorized:false` always. DO NOT weaken this gate without new tested authenticated adapter boundary.
- PR67's fail-first BI01–BI16 corpus specifically challenges stripped marker, unknown issuer, forged signature, schema confusion, unknown/misbound IDs, preclone writes, unsigned V2/V3 limited restore, rollback and credential isolation. Some cases require physical HTTP/PG16 and are **NOT_RUN**; don't claim pass.

## 2. Trust boundary and first safe option: deny-by-default

**Recommended starting policy until A00 signs another:** only server-issued, cryptographically verified modern strict envelope may be considered for a separately feature-gated import; **all unsigned/unattested V2 and V3 payloads fail closed as `REJECT` for current import service**, regardless of visually historical shape or filename. Legacy preview may be read-only, sanitized and clearly UNTRUSTED. Authenticated modern strict must still pass complete domain/role policy before *any* DB write.

A00 may later authorize a **LEGACY_RESTRICTED** path, but only by explicit decision and a trusted provenance mechanism independent of the uploaded document (e.g. server-held historical record/key binding). The provenance must prove origin/allowlisting **without** relying on JSON fields that attacker can remove or alter; unsigned imports cannot regain Undo/CAS solely from a marker. If such external provenance is unavailable, safe minimal option remains REJECT, not "best effort" historical import.

### Separation of rights

`authenticatedIssuer` = signed bytes verified against **server-owned trusted key**.  
`authorizedImport` = issuer trust **AND** exact payload/domain validation **AND** authenticated current organizer **AND** target import policy **AND** new clone credentials/epoch **AND** all feature gates.  
`historicalUndo / historicalRevert / historicalCasReplay` = **false for all imported source actions** until new target-side server action creation with independently authorized provenance; never switch to true just because issuer signature is valid.  
Issuer signature proves source **authenticity/integrity, not tenant authorization or entitlement to replay actions**.

## 3. Proposed signed-envelope v1 format (not existing API)

**A90 may implement equivalent typed shape after A00 approval**. Use an outer, strictly encoded envelope, with independent bytes of an inner backup payload; never sign "whatever happens to be left after Zod strips fields."

```ts
type SignedBackupEnvelopeV1 = Readonly<{
  envelopeType: "web005.backup.signed.v1";
  protocolVersion: 1;
  issuerId: string;          // key lookup only; untrusted until verified
  keyId: string;             // rotation/revocation lookup only
  algorithm: "Ed25519";      // pinned allowlist; no "none", RSA fallback, or algorithm confusion
  issuedAt: string;          // server clock; bounded skew/lifetime policy
  expiresAt: string;         // optional only if A00 explicitly accepts missing expiry
  payloadType: "web005.backup-v3.strict.v1";
  payloadEncoding: "base64url";
  payloadBytes: string;      // exact base64url-encoded UTF-8 JSON byte stream
  payloadSha256: string;     // lowercase hex digest of exact decoded bytes
  signatureEncoding: "base64url";
  signature: string;         // Ed25519 over versioned, domain-separated signed bytes
}>;
```

**Canonical signing bytes proposal:** fixed domain prefix `WEB005/BACKUP-ISSUER/V1\0` followed by a length-prefixed, strictly specified binary encoding of **all metadata relevant to trust** (envelopeType/version, issuerId/keyId/algorithm, times, payloadType/encoding, payload length, SHA256 digest). Signature verified over this exact encoding; independently recompute payload SHA256 over exact decoded payloadBytes and compare **constant-time where relevant**. Use test vectors maintained by A90/A30; reject unknown/duplicated envelope keys, noncanonical base64url, oversized payload, invalid UTF-8, marker or schema mismatch. Prefer single precisely specified encoded payload to ambiguous JSON signing; do not canonicalize attacker-supplied object after Zod drops unknown fields.

- Strict signed envelope **must not** allow absent `strictPolicy`, altered profile, mixed V2/V3 fields, missing signed fields or substituted `payloadBytes`. Parsing failures or signature failures never fall back to unsigned-legacy branch.
- Read and enforce `maxJsonChars/maxDepth/maxNodes/maxArrayItems/maxObjectKeys` (existing profile gate limits) and additional bounded envelope/decode/signature sizes **before** expensive cryptography or Zod; explicit bytes not loosely coerced strings.
- Trusted public keys configured **server-side**: allowlist (issuerId/keyId/publicKey/algorithm/scopes/notBefore/notAfter/revokedAt). IssuerId or keyId in upload is only a lookup hint and MUST NOT select attacker-provided certificate/public key or arbitrary remote JWKS URI. Unknown/revoked/not-yet-valid/expired key fails closed.
- **Private key lives in external server secret/KMS/HSM**, not GitHub, backup file, client bundle, database export or log. Only designated exporter may sign after acquiring coherent read-only source snapshot and authorization. No self-sign by browser/importer.
- Key rotation/revocation: previously signed files continue only under A00 signed policy for expiry and revocation; revoked issuers fail new import even with mathematically valid signature. Audit issuer ID, key ID, payload digest, validation result, non-sensitive trace; never raw signature/key/credential in public logs.
- Replay resistance: signature alone is portable and replayable. Default importing the *same signed file* again must **not reauthorize historical actions**. If A00 requires one-use import, add a server-side consumed `issuerId + envelopeId/nonce` register (migration gated) or idempotent audit table; otherwise explicitly allow a new fresh clone each time with new organizer credentials and basket epoch and no action replay. A00 must choose.

## 4. Required ingress execution order — zero writes until authorization

1. Bound and strictly parse raw envelope bytes, preserving unknown/duplicate-field detection. Classify unsigned bare V2/V3 separately as UNATTESTED, **not trusted legacy**.
2. Resolve **server-owned** trusted issuer key by scoped ID and keyId; check expected algorithm, key status, issuer authority, issuance time and replay/idempotency policy. Verify detached Ed25519 signature over exact signing bytes **before trusting the inner profile**.
3. Verify raw payload digest/encoding and strict V3 marker/schema; reject stripped/downgraded marker, unknown/unsupported version, any mixed profile, inconsistent raw-vs-parsed projection, and invalid JSON limits. Never strip then silently reclassify.
4. Run current pure full semantic V3 validator, strict policy (`PR56`), raw profile (`PR58`), action-local provenance (`PR64`), and preclone adapter (`C03`); **all** must agree on strict status, ownership and referential integrity. Callback ports must be server-supplied typed validators and completed synchronously, no user-supplied bypass. ID references resolve *within the same action/stage*, not only somewhere in exported backup.
5. Authenticate current actor independently of issuer signature; enforce import/create-target entitlement, credentials, rate limits and privacy policy. No imported organizer/viewer/support credentials or authorization epoch; require newly chosen target secrets per existing product policy.
6. Only after steps 1–5 return an internal **non-serializable validation capability** scoped to exact digest + request/actor + target creation plan (no bearer token in JSON) for *one* guarded cloning transaction. Current pure modules still return no authority; only a later designated ingress orchestration layer can mint the internal capability. Validate again inside transaction where applicable.
7. On insertion failure, transaction rollback ALL copied tables and newly minted credentials. Source action references must be remapped clone-locally; imported Undo/CAS/revert authorization remains disabled; fresh target basket edit epoch (`A20 CAS contract`) minted. No real importer/HTTP wiring in SWARM-005 without file-scoped GO.

### Fail-closed outcome matrix

| Trigger | Classification | HTTP once explicitly wired | DB writes |
|---|---|---|---|
| No/unknown issuer; bad signature; missing/malformed strict marker; strip/downgrade; unknown algorithm; foreign IDs | `REJECT` | 400 `INVALID_BACKUP_V3` (or 401/403 for authenticated actor failure) | 0 |
| Unsigned V2/V3 shaped document without trusted external provenance | `REJECT` default; A00-approved `LEGACY_RESTRICTED` optional future | 400 default | 0 default |
| Valid signed strict but organizer has no rights | `REJECT` | 401/403 | 0 |
| Valid signed strict but full domain/invariants fail | `REJECT` | 400 `INVALID_BACKUP_V3` | 0 |
| Signed+authorized+valid, cloned under fresh local security identities | `STRICT_VERIFIED` **not itself import authority** | success only after separate activation | one guarded transaction |
| Late insert/constraint failure | `REJECT` / ROLLBACK | safe non-2xx, separately decided 400/500 code | 0 net |

Never return to old/legacy mode on a modern-profile parsing error. Never treat client `strictPolicy`, file extension, timestamps, host code, self-declared producer version or valid Zod schema as issuer evidence.

## 5. Test-first RED/GREEN owned by A90/A30/A60 (NOT_RUN by A20)

**RED before implementation:**
- BI-01 stripped `strictPolicy` from otherwise signed strict, marker tamper -> REJECT/no fallback.
- BI-02 unknown issuer, BI-03 wrong key/forged sig, BI-04 V2 version confusion, BI-05 Zod marker stripping -> REJECT, 0 writes.
- Nested wrong-stage or wrong-match action ID that points to some *other valid global ID* -> REJECT; signed digest verification must not override domain validation.
- Mixed envelope algorithms, duplicate JSON keys, malformed b64url, signature over wrong domain/version, expiry/not-yet-valid/revoked key, wrong payload SHA256, oversize/depth limits, forged nested signer publicKey and tenant replay -> REJECT.
- A positive ephemeral Ed25519 test-key vector with server-pinned PUBLIC key and no logged/exported PRIVATE key -> `STRICT_VERIFIED` only. **No actual importer permission** in pure tests.
- Legal historical V2 and V3 with null/absent optional arrays: REJECT default; if A00 allows restricted mode, verify forced `historicalUndo=false`/`historicalRevert=false`/`historicalCasReplay=false` regardless of static shape.

**DB/HTTP future NO-GO:** PR67 `BI-13..BI-16` verified rollback, organizer/viewer credential separation, clone graph closure, and zero preclone writes on actual isolated PG16 only after owner G0–G4. Do not run schema resets/migrations now. No real private key or credentials in fixtures.

**Evidence discipline:** A90 new isolated branch, new source/test blobs and true Node22 RED/GREEN TAP with exits; A30 signed issuer/anti-downgrade audit; A60 independent exact HEAD check. Until all necessary acceptance gates, `BACKUP_ISSUER_SOURCE_CONDITIONAL`, not full import/auth/Undo PASS. Do not claim any C03 pure 38/38 tests prove signing or ingress rights.

## 6. Explicit A00 owner decisions — gate, not assumptions

| Decision | Owner choices | Fail-closed pending state |
|---|---|---|
| `BKT-01` | Official issuer identity: single deployment signing key vs per-tenant key registry; who can export/sign | **HOLD** signing/import privilege; recommend **single service-owned issuer with scoped keyring**, no user-provided keys |
| `BKT-02` | Envelope schema/version/encoding/limits, Ed25519 only, key rotation/expiry/revocation policy and trust store custody | **HOLD** positive classification until signed; recommend domain-separated exact payload-byte digest |
| `BKT-03` | Unsigned V2/V3 historical acceptance: reject-all vs server-attested restricted one-time clone | **REJECT** all unsigned by default; no historic Undo/CAS under either option |
| `BKT-04` | Replay/nonce/expiry policy and import idempotency + issuer revocation behavior | **HOLD** privileged replay; fresh clone credentials/epoch never imported |
| `BKT-05` | Wire point: pure A90 verifier now vs later SWARM-006 importer/HTTP activation; target roles/HTTP error mapping | Pure verifier/testable now; **no wiring**, 0 DB writes |
| `BKT-06` | If ledger schema needed for issuer/replay, D01–D04 canonical migration allocator/rollback approval | **HOLD** schema/SQL/PG16 |

**Disposition:** `AUTHENTICATED_ISSUER_CONTRACT_READY_FOR_A00 / A90_CODE_PENDING / A30_SECURITY_GATE_PENDING / NO_IMPORTER_AUTHORITY / SWARM006_NOT_ACTIVATED`.
