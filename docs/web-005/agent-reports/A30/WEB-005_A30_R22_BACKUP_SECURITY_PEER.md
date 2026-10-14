# WEB-005 — A30 R22 Backup V3 security peer: downgrade / foreign ID / restore privacy

**Task:** `WEB-005-T030-T031-A30-R22` · **Agent:** A30 Security Implementation · **Mode:** READ-ONLY APPLICATION / security peer, NOT A90 author and NOT A60 release QA · **Date:** 2026-10-15.  
**Binding master:** [R22.1 instructions](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R22_AGENT_PROMPTS.md), blob `f616bca63a441bc2a4eead64ff67586e57e2b6ca`, §§0–2 + AGENT A30.  
**Release base:** `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.  
**Approved decisions:** [B1=A](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R21_OWNER_BACKUP_B1_COMPATIBILITY_APPROVAL.md), blob `a0579990ace09d85eea62cfcab33b8ad54ea6fdc`; [B2=B, B3–B6=A](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R21_OWNER_DELEGATED_BACKUP_B2_B6_DECISIONS.md), blob `e6da9f88f1b4e520bae1f1b6183e862a0ff51c1a`. These are binding **product policy**, not implemented or tested code.  
**Independent [A60 R21](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R21_OWNER_SIGNOFF_INDEPENDENT_QA.md)** blob `47dc44f980734ce68dd63769ba3f25ad60dc899f`: old PR source-only QA; `HANDOFF_NOT_READY` and **0 native tests**. This historical QA does **not** accept a new A90 R22 validator.

## 1. Scope / risk classification / baseline source pins

**A90 exclusive code lane L2** is a **new isolated pure strict-profile validator module + its unit tests**, test-first on a new R22 feature branch and new PR. **No R22 GO** to modify `backup-v3.ts`, `routes/tournaments.ts`, generated API/Zod/OpenAPI, existing PR41/PR48, DB transaction or restore pipeline. Therefore even a future source-accepted L2 unit validator is **NOT an enforced HTTP import guard** until separately authorized wiring + independent QA.

At initial R22 intake, no newly registered R22 feature PR/branch or A90 R22 module had been verified; **do not fabricate a new A90 SHA or claim its tests PASS**. A30 can evaluate the newly approved B1–B6 risk model against **immutable existing** source:

| Baseline evidence | Exact blob/source | Security boundary |
|---|---|---|
| `artifacts/api-server/src/application/backups/backup-v3.ts` (release) | `78d86246302fc8840696fd14c05c840304bc9f97` L77–122, L656+, L1528–1623, L1727+, L2240+ | `remapUndoPayload()` uses `playerIds.get(value) ?? value` and `matchIds.get(value) ?? value`, retaining unmapped recognized source IDs; existing `validateBackupV3` validates action top-level stage/match links but not all nested ID remaps. This is a **baseline source-confirmed hazard** relative to future B5 strict import; no successful exploit shown. |
| PR41 [P08](https://github.com/C8LyNn/aplikacja-turnieje/pull/41) | HEAD `f03cf3d09988a04ba9c2856e205d21f994ff67f1`; flow validator blob `a8482fa7137f1d71817c8b4ec43da7d6292f8183`; its `backup-v3.ts` blob `701b9b01ab2d7fda134e6fdc67c3d01d236b9a3e` | Existing **separate** QP/QPE/OP and route-flow integrity validation, accepted only conditionally by A60; not a modern/legacy profile classifier and not a B2–B6 acceptance. The same numeric-ID fallback remains. |
| PR48 [P15](https://github.com/C8LyNn/aplikacja-turnieje/pull/48) | HEAD `2a8a4c72cb4a3a37402a346fd0acc83b03b39be3` | Earlier independent B3A source candidate; **not** evidence of portable modern-profile B3 revision + full B2 policy integration. No source changes by A30. |
| `lib/api-zod/src/generated/api.ts` (release) | `38677491dba8fe0d99fb33158f76275479656af2` L3029–3364 | `ImportTournamentBody` uses Zod object parsing; present schema has **no strict-profile marker**. A new unrecognized marker is not guaranteed to reach a validator after `safeParse` (default object stripping), and `undoPayload` is `zod.record(zod.string(),zod.unknown()).nullable()`: syntax, not typed foreign-reference provenance. |
| `artifacts/api-server/src/routes/tournaments.ts` (release) | `6767e7ac6c4d43cf39faa8a61534bdb92b898e14` L2940–3118 | GET `/tournaments/:id/export` requires organizer; POST `/tournaments/import` creates **a separate clone** with fresh supplied organizer (+ viewer/support where applicable) credentials. Explicitly rejects historical `hostCode` in request or backup tournament and v1, validates Zod and routes V2/V3, returns a **new clone-bound** organizer token. HTTP errors include 400 `INVALID_BACKUP_V3` on `BackupV3ValidationError`. The route restores to a new root, **not** an existing tournament; lack of an old-source organizer token in public clone creation is not by itself proof of an unauthorized existing-tournament mutation. |

**Immediate architecture gate:** proposed pure L2 validator cannot decide trust based only on `marker === strict ? strict : legacy` nor claim to enforce B6 400/no-clone while not called from the import route.

## 2. Security threats and required fail-closed behaviors

### T1 / P0 — missing-marker downgrade from modern strict to permissive legacy

**Threat:** A modern/hybrid V3 with stripped, blank/null or unknown profile marker is treated as legacy, bypassing mandatory history, portable match revision, typed completion action/provenance, and strict nested IDs.

**Acceptance design:** classify new strict profile only on a clear known marker plus required structural invariants; **legacy eligibility must have independent positive recognition of actually emitted historical formats**, not merely absence of marker. If modern-only fields/incompatible action tuples coexist with missing marker, classify `INVALID/AMBIGUOUS`, not legacy. Unknown/incorrect marker fails closed. Crucially, marker metadata must survive **raw body → Zod parse → domain validator**, and the validator must not be run solely on stripped parsed objects without access to original marker/provenance. Preserve legal historical V2/V3, including `resultHistory:[]`, `actionLog:[]`, `undoPayload:null`, absent optional phases; disable unsafe Undo/Revert for nonprovable historical provenance.

**Limit:** if an adversary can transform a purported modern document into a byte-for-byte indistinguishable *valid historical* shape, an unauthenticated self-declared marker cannot cryptographically prove origin. In that case, even the legacy path must apply **common security invariants**, restrict undo, and must not receive modern-only privileges. Stronger anti-downgrade authenticity would need a separate producer/server provenance design and its own A00 GO; don't promise impossibility under an untrusted format marker.

### T2 / P0 — recognized nested Undo IDs accidentally bind foreign entities

**Source-backed entry:** baseline `remapUndoPayload` recursively walks object/arrays and maps numeric keys `playerId`, `player1Id`, `player2Id`, `winnerId` plus `matchId` and `prevFeaturedMatchId`; **unmapped** recognized source IDs silently retain original integer. A colliding real DB ID might refer to an **unrelated tournament**, or fail in a later Undo. No claim of successful cross-tenant mutation: other Undo guards exist, and this unsafe case has not been physically tested.

**Required modern strict validation:** for each *typed* action and recognized numeric player/match reference, require a declared matching source export ID, a verified clone-local remap, correct stage/tournament relationship, type and allowed nullability. Unknown or foreign referenced IDs, positive integers missing from maps, role-inconsistent winners, mismatched stage, or impossible active Undo action are rejected **before any clone INSERT**; never `map.get(id) ?? id`. Preserve truly opaque legal legacy keys without interpreting arbitrary unknown names as foreign references, but do not execute untrusted historical undo lacking proof. Reject recursive oversized/nested payloads safely if they exceed defined bounds (resource protection).

### T3 / P1 — cross-tenant restore/auth/private-data boundary

Public `POST /tournaments/import` intentionally creates a **new tournament**, and the route generates fresh credentials (does not restore old `hostCode`). Guard must ensure `hostCode` and old source organizer/support/viewer hashes, bearer tokens, audit session IDs, CAS/owner identity tokens or trusted role flags **cannot be promoted into the clone** via nested payloads or apparent action provenance. Imported action logs are historical data, not proof that a current support/organizer actor is authorized. Restrict export to organizer; after clone restore, require a new valid clone credential for organizer-only reads/writes; `private_online` must require a fresh viewer password. Anonymous import alone is not proof of existing-tournament auth bypass. Compare the clone's privacy and foreign key relationships under isolated integration tests, never production.

### T4 / P1 — B2/B3/B4/B6 consistency and transaction safety

New strict completed matches need accurate latest-history parity and typed active completion action with deterministic order, not sorted solely by `createdAt`. `match state revision` is **not** `resultHistory.revision`. Unmapped old CAS/session tokens must not grant post-restore write rights. Strict invalid data needs typed preclone 400 `INVALID_BACKUP_V3` and **0 new clone rows** after future import wiring; genuine late PostgreSQL failure requires a full transaction rollback and no partial-success credentials or leaked technical traces. A **pure validator unit PASS never proves** preclone zero-write or rollback of the real importer; these require separate authorized HTTP/isolated PG16 integration QA and new exact-SHA independent A60 acceptance.

## 3. A90 L2 exact negative/positive unit fixture contract (AUTHORED DESIGN ONLY)

**Inputs:** minimal synthetically generated `TournamentBackupV3`-shaped frozen fixtures; explicitly distinguish `rawDocument` before parsing vs typed parsed payload, and profile-selection outcome vs semantic validation. If the validator's API is `errors[]` rather than `ok/error`, assert semantically equivalent reject/accept; do not invent implementation function names or execute code in A30.

| ID | Fixture/action | Expected pure-profile outcome |
|---|---|---|
| `SEC-DOWN-01` | Valid new strict V3 with complete history, typed action and revision, **remove marker only** | **REJECT as modern/hybrid or untrusted ambiguous**; never silently `LEGACY_ALLOWED`. |
| `SEC-DOWN-02` | Valid strict marker modified to unknown/null/empty/false; contradictory modern-only fields still present | Reject unknown marker; no marker-overwrite fallback. |
| `SEC-DOWN-03` | Modern-only capability/action/revision fields with marker absent, inserted through raw body and Zod parse | Reject **after parsing**; assert marker/provenance was not silently stripped or bypassed. |
| `SEC-DOWN-04` | Mixed strict+legacy shape with missing mandatory modern history/active action, but historically legal empty arrays | No downgrade of detectable modern/hybrid; strict profile fails, while a truly recognized original legacy document separately passes safe compatibility. |
| `SEC-REF-01` | Strict nested `undoPayload.matchId` points outside exported matches; source integer happens to equal an unrelated target-DB ID | Preclone validation rejects *unmapped* ID; zero foreign-ID fallback. |
| `SEC-REF-02` | Strict nested `playerId`, `player1Id`, `player2Id`, `winnerId`, `prevFeaturedMatchId` reference nonexistent/foreign source IDs | Reject each recognized foreign ID. Test both object keys and nested array items. |
| `SEC-REF-03` | Present source match ID but belongs to a different declared source stage/action context | Reject incorrect tenant/stage provenance rather than accepting numeric membership alone. |
| `SEC-ACT-01` | Strict completed match lacks current typed completion action identity or deterministic action ordinal; two active actions tie in timestamp | Reject missing/ambiguous provenance; do not use timestamp as sole total order. |
| `SEC-HIST-01` | Modern completed match latest history contradicts winner/status/scores, or required latest tuple absent | Reject under signed B2=B; don't reroute to legacy. |
| `SEC-REV-01` | Strict match revision absent, malformed or improperly equated to `resultHistory.revision` | Reject invalid revision; distinct revision domains respected when valid but differing. |
| `SEC-POS-01` | Legitimate old unmarked V3 with `resultHistory:[]`, `actionLog:[]`, `undoPayload:null` and optional phases absent | Accept **only recognized legal legacy shape**; mark unsafe Undo/Revert disabled; never fabricate revision or action IDs. |
| `SEC-POS-02` | Valid modern strict: nested source refs all declared, typed action consistent, match revision and latest history consistent | Validate successfully; return clear strict classification; integration/restore success NOT IMPLIED. |
| `SEC-POS-03` | Legal historical document with unknown opaque legacy extension key that is not a recognized typed ID | Avoid false-positive foreign-ID reject; keep nonexecuted unsafe action disabled where source proof lacking. |

**Security priority for A90:** `SEC-DOWN-01/02/03` and `SEC-REF-01/02/03` are P0 fail-first. Any future A90 new PR must identify new branch, exact HEAD and changed modules/tests, and mark tests `NOT_EXECUTED` unless real command+exit evidence exists. A60 independently reviews its actual HEAD; do not claim a blanket `SOURCE_ACCEPTED` from this proposed contract.

## 4. Future A50/A60 HTTP and PG16 integration acceptance (NOT authorized R22 implementation)

For a later **separately approved** full importer wiring and test executor, verify with isolated synthetic backups:
- `400 INVALID_BACKUP_V3` for stripped/forged modern marker and recognized foreign ID **before** DB clone root/children creation or upstream effects. Check all table counts, not only final HTTP status.
- A forced late transaction failure rolls back tournament, stages, players, matches, history and action rows together. No returned organizerToken on error.
- Valid legal old V2/V3 restores with restricted unsafe Undo/Revert; no silent credentials/hostCode transplant and private restored viewers require fresh viewer password.
- Export read from a private tournament without organizer privilege remains 403; import must not grant access to **the source** tenant nor read its protected data merely through a supplied source ID. New organizerToken must be valid only for the newly created clone.
- Source revision / nested ID clone remap and subsequent authorized Global Undo, CAS and Direct Revert remain coherent on isolated PG16; malicious foreign ID must not produce a writable cross-tenant reference.

**No native R22 A30 commands run:** `NOT_EXECUTED / 0 app tests / exit N/A`; connected GitHub source/PR readback only. No production requests, injected payloads, paid CI, shared database, staging or SWARM-006.

## 5. Other security owner dependencies and final disposition

- **P03 [PR34](https://github.com/C8LyNn/aplikacja-turnieje/pull/34)** HEAD `fae2eea2f22df3f1b02ad035a7db00bc411ea73f`, OPEN/DRAFT/UNMERGED: source fail-closed Steam catalog three-write guard remains earlier A60 conditional; **owner Steam absent-secret 403/503** remains `POLICY_OPEN`. No change to HTTP semantics without signed owner + new specific GO.
- **P20 [PR53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53)** HEAD `d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34`, OPEN/DRAFT/UNMERGED: A60 R20/R21 **SOURCE_ACCEPTED_SCOPED** on verified-owner cache rebinding; old ownerless raw QueryClient retention remains **POLICY_OPEN**, no observed production leak, real RTL still `NOT_EXECUTED`.
- **Session policy:** absolute/idle TTL, support token digest, organizer token/password rotation and legacy compatibility remain `POLICY_OPEN`; Backup B1–B6 decisions did **not** resolve these separate auth topics.
- **Sport, T055, B1–B6:** the central R22 owner policy decisions are **approved**; do not re-ask. Product approval alone is not implementation, A60 runtime PASS or merged release.
- [A60 R21](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R21_OWNER_SIGNOFF_INDEPENDENT_QA.md) = `HANDOFF_NOT_READY`, inherited 21 source candidates with unchanged exact SHA, 0 native tests; original WEB004 38-case provenance/dispositions unresolved. **No actual new A90 R22 validator SHA accepted by A30 at this snapshot.**

**A30 R22 peer verdict:** `NEW_OWNER_BACKUP_B1_B6_SECURITY_REQUIREMENT / BASELINE_FOREIGN_ID_FALLBACK_SOURCE_CONFIRMED / MISSING_MARKER_DOWNGRADE_RISK_PROPOSED_NOT_EXPLOITED / ZOD_MARKER_ROUNDTRIP_INTEGRATION_GAP / A90_STRICT_VALIDATOR_ONLY_NO_IMPORT_WIRING / A60_NEW_SHA_PENDING / RUNTIME_NOT_EXECUTED / STEAM_SESSION_LEGACY_CACHE_POLICY_OPEN / WEB005_RELEASE_NO_GO / SWARM006_HOLD`.

**Next:** A90 implements **only** authorized isolated L2 pure validator/tests as one separate new PR; A60 independently accepts/rejects the exact HEAD; A00 plans separate future import-route/Zod wiring with owner/exclusivity and DB QA, no implicit release. A30 makes no source changes, does not grant code GO, and does not start SWARM-006.
