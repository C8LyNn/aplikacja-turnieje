# WEB-005 — DEVELOPMENT FIRST / WAVE 5 — A90 WAVE5_HANDOFF

**Agent / Task ID:** A90 — Backup V3 Integrity & Restore / `WEB-005-T060-A90-WAVE5-C03-PRECONE-QA`  
**Date:** 2026-10-18 (Europe/Warsaw)  
**Scope:** R1 read-only exact-SHA evidence + raw-profile/preclone/strict-ingress DB-free tests and future importer admission conditions.  
**Task status:** `DONE` (source review/evidence/decision report); `BLOCKED` (actual importer wiring/end-to-end restore).  
**Integration readiness:** `CONDITIONAL` **test-only additional PR129 contract coverage after A60**; `NO` for enabling positive Backup V3 import, release, protected merge, or SWARM-006.

## 1. Exact source, PRs, and changed paths

| Component | Read-back exact HEAD / state | Role / inclusion |
|---|---|---|
| [C01 #60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60) | `fa3261b2c9510e110ac9eba21726812d3401a525` reference | Ancestor, not standalone release |
| [C02 #101](https://github.com/C8LyNn/aplikacja-turnieje/pull/101) | `a5bfd07b822c223fd995604dc2e228935ab81498` DRAFT | Parent of C03 |
| **[C03 #134](https://github.com/C8LyNn/aplikacja-turnieje/pull/134)** | **`80bb4ca7a9a359fbe76dbab1478a1af16ded0174`**; BASE `a5bfd07...`, OPEN DRAFT, UNMERGED | C03 two allowed adapter source/test blob replacements from exact [#100](https://github.com/C8LyNn/aplikacja-turnieje/pull/100); **NOT_WIRED** |
| **[A90 #129](https://github.com/C8LyNn/aplikacja-turnieje/pull/129)** | **`35449b148aa782139a5327164cb6ed5d6aa3bfdd`**; BASE [#100](https://github.com/C8LyNn/aplikacja-turnieje/pull/100) `6e198dc2c24cff651f8e75898c6e6e97eec9b0e4`, OPEN DRAFT, UNMERGED | ONE **added test-only** file `artifacts/api-server/test/backup-v3-ingress-boundary.wave3.test.ts`, Git blob **`643fcc876d793b9d86c5d3700f599c4eab88c8db`**; not in C03 |
| [#56 strict](https://github.com/C8LyNn/aplikacja-turnieje/pull/56) | `a7f71a7e7efdabd479b358a3cee80bc6359c4321` DRAFT | strict-policy pure validator |
| [#58 raw preflight](https://github.com/C8LyNn/aplikacja-turnieje/pull/58) | `e8100f7b0c1071c2a98880d4eb7947514fc58185` DRAFT | raw V2/V3 profile discriminator |
| [#64 A70 action-local](https://github.com/C8LyNn/aplikacja-turnieje/pull/64) | `7837e412626e88761c70f1a2ceeb822d7ed101e1` DRAFT | isolated action-local validator candidate; not bound to C03 adapter's production call ports |
| [#67 A30 security tests](https://github.com/C8LyNn/aplikacja-turnieje/pull/67) | `880824f18b8913602955578dfd76eeac7976e32a` DRAFT | prospective issuer/ingress security contract, NOT an implemented trust verifier |
| [#105 A50 root cause](https://github.com/C8LyNn/aplikacja-turnieje/pull/105) | `7befb8bbfc9d150469e5405859b0e8b4e789f8a6` DRAFT | owns C01 API first-failure triage; not an A90 code change |

**Four byte-identical Git objects independently re-fetched on C03 HEAD and PR129 HEAD:**
- `backup-v3-profile-gate.ts` — **`518526d8d9ff2cef368261788e12c9f8290754f5`**.
- `backup-v3-strict-policy.ts` — **`595c68b87a5361623bef6293519ed668e9d4e493`**.
- `backup-preclone-adapter.ts` — **`0465e11b2420fa00f2de5cc14fa4d81858c76ff0`**.
- `backup-preclone-adapter.test.ts` — **`51b658b1775f88c5d00ff721247ec6ede49feb86`**.

The PR134-vs-PR129 file lists **DO NOT OVERLAP**: #134 modifies 2 existing files; #129 adds one independent test. Comparing their commit DAG directly shows **diverged ancestry** (C03 behind/ahead relative to PR129), not an already integrated combined QA SHA. **Do not say 38/38 tests passed on C03**: adapter 20/20 and extra ingress 18/18 passed in **two different native workflows**. Integrating #129 should be an A40-owned future composite *only if* A10 manifest and A60 independent exact-SHA review approve it.

**Wave 5 modifications:** `NO APPLICATION CODE CHANGES`. Only this new Markdown `docs/web-005/agent-reports/A90/WAVE5_HANDOFF.md` in isolated docs-only branch `docs/web-005/a90-wave5-backup-validation-closure-20261018`; no source PR added or reopened.

## 2. Actual native DB-free test evidence, command, failure and limitations

**A90 did NOT execute a new native monorepo checkout in Wave 5.** Local diagnostic: `node --version` → **v22.16.0**; `git --version` → **2.47.3**; `pnpm --version` → **command not found**; `git ls-remote https://github.com/C8LyNn/aplikacja-turnieje.git HEAD` → **exit 128**, DNS `Could not resolve host: github.com`. GitHub connector supports exact source/CI read but not a materialized full installed monorepo. Thus no invented new Wave5 native command run, TAP, database reset or CI dispatch. Instead the following **actually executed automatic GitHub Actions native** evidence was independently **retrieved, parsed and corroborated** at the exact commits:

| Source HEAD and automatic CI | Actual command / exit scope | Verified PASS | Overall outcome |
|---|---|---|---|
| **C03 `80bb4ca7...`** — [run 39133034753, job 117691909864](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39133034753) | Runner: workspace `pnpm run typecheck:libs && pnpm -r --filter "./artifacts/**" --filter "./scripts" --if-present run typecheck`; API unit `node --import tsx ./test/run-tests.ts unit` in package script. | Workspace TS typecheck **PASS**; **20/20 `R23C` + `development-first` native adapter Node/TAP cases `ok`**, 0 named FAIL. | **FAIL**: later `BLOCKED: API integration tests execution failed exit 1; signal none`. Not integrated API PASS. |
| **#129 `35449b148...`** — [run 39133733273, job 117693928028](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39133733273) | Same automatic typecheck and API unit runner, no manual paid retry. | Workspace TS **PASS**; **20/20** adapter cases **PASS**, plus **18/18** `WAVE3-A90-01…14` + `WAVE4-A90-01…04` **PASS**, 0 named failures. | **FAIL**: same later API integration `exit 1`; imported transaction/exported DB snapshot NOT TESTED. |

The 18 A90 boundary cases include legal synthetic historical V2 completed system BYE, compatible historical V3, strict without authenticated issuer, detectable marker stripping and full stripping remaining **unattested**, duplicate raw JSON member, Zod-like stripping/changed version denial, invalid BYE winner, duplicate stage round/match semantic rejection, strict completed-history mismatch, absent A70 closure, async semantic/closure callbacks, forged `trusted` / `verified`, and four Wave4 V3 export-**shaped** fixtures. In Wave4 positive path, real **DB-free `validateBackupV3`** is called on a synthetic draft, and rejects active-stage mismatch or stale featured match. This is **NOT** an actual DB-backed `exportBackupV3` run or import clone. The fixture initially failed on missing stage-1 membership; fixed at current #129 SHA, final 4/4 Wave4 positive/negative native PASS. Other tests inject *synthetic semantic/A70 callback spies*, not genuine full-domain verification.

**What was NOT_EXECUTED:** A90-initiated new native pnpm/TAP in this wave; simultaneous C03+PR129 combined test at one SHA; real HTTP raw-byte ingress; authenticated modern signer/issuer; production or disposable PG16 importer/exporter/transaction, rollback, Undo capability enforcement; full game/frontend/live cross-flow. Prior automatic actions include a runner-managed PostgreSQL service, but a failed API aggregate run **cannot** be presented as independently authorized positive PG16 restore tests.

## 3. Verified denial behavior — classification ≠ authentication ≠ import authorization

Direct exact-source behavior of `validateRawBackupBeforeClone` (same Git blob on #134/#129):

| Raw input / stage | Current typed result | Any authority? |
|---|---|---|
| Not raw JSON string, unknown/hybrid structure, duplicate JSON key, detectable strict marker stripping | `RAW_JSON_REQUIRED` or `PROFILE_REJECTED` | **NO**; no parser/importer invoked on raw reject |
| Missing real parser / V2/V3 domain validator / required A70 callback | `MISSING_DEPENDENCY` | **NO** |
| Async/thenable parser or parser drops strict markers/changes version | `PARSER_FAILED` / `PARSED_PROFILE_CONFLICT` | **NO** |
| Semantically invalid completed BYE, stale featured match, mismatched stage, invalid history | `SEMANTIC_VALIDATION_FAILED` / `STRICT_POLICY_FAILED` | **NO** |
| Modern strict source shape and passed synthetic checks but **no cryptographic issuer trust** | `STRICT_ATTESTATION_REQUIRED` | **NO**, even caller-supplied `trusted=true` |
| Recognized V2/V3 legacy source shape and callback success | `LEGACY_COMPAT_RESTRICTED` | **NO**; no historical Undo/Revert/CAS |

**Critical invariant:** all outcomes contain `authenticated:false`, `importAuthorized:false` and all historical Undo/Revert/CAS capabilities `false`. The adapter is **pure** and does not call `importBackupV2`, `importBackupV3`, INSERT or create tokens. This is proven **at module/source level and in synthetic callback/test results** — **NOT** proof that a future HTTP route cannot accidentally bypass or misinterpret a status. A fully stripped modern payload indistinguishable from historical can only be treated as **unattested legacy shape**; raw profile does not prove a historical issuer.

**Data validation** = compatible raw shape + lossless parsing + **real** V2/V3 semantic checks + strict history, revision and A70 action-local closure.  
**Source identity/trust** = separate server-owned issuer registry/key lifecycle, authenticated signed bytes and anti-downgrade context, NOT a source `strictPolicy` marker, `producer`, `trusted` boolean or caller-defined public key. Neither category authorizes HTTP caller action by itself.

## 4. Concrete remaining gates before any real importer wiring

1. **C03 exact-source acceptance:** A60 independent inspect PR #134 `80bb4ca7...`, accept or reject 20-case source/CI evidence. A10 pinned manifest must distinguish stacked PR #66→#100→#129 and C01→C02→C03; no double-apply.
2. **Optional test-only #129 inclusion:** A60 independent exact-HEAD QA `35449b...`; A40 may take **only the one unique test file** into a newly pinned disposable composite after source and dependency review. Re-run all 38 targeted A90 cases and typecheck **on one composite SHA**; no new PR proposed by A90 now.
3. **Real raw HTTP capture before Zod:** current `POST /tournaments/import` consumes already parsed `req.body` and `ImportTournamentBody.safeParse` can strip unknown modern fields. Requires separate reviewed raw HTTP JSON duplicate-key, canonicalization/profile parity and bounded ingress design; ensure a blocked input causes **zero credential issuance/clone**.
4. **Real validation bindings:** inject lossless version-specific parsers and genuine complete `validateBackupV2`/`validateBackupV3` into C03 pure adapter; require synchronous `undefined` proof (no async Promise); bind the exact independently approved **A70 action-local closure** rather than global-ID-only stub; verify no stored source ID is treated as new tenant authority.
5. **Owner-governed issuer trust and legacy admissions:** A00/HQ + A30 must separately decide authenticated modern issuer/envelope, signature/key rotation and anti-downgrade; authorize **restricted historic restore** with server-persisted inability to execute old Undo/Revert/CAS. Existing owner B1–B6 decisions do NOT confer automatically trusted issuer status or positive restore GO.
6. **Clone safety and E2E:** eliminate unsafe known nested-ID remap `map.get(oldId) ?? oldId` for privileged identifiers, generate clone-local revision/permissions/credentials, typed 400 with zero-clone for invalid input, full transaction rollback on late failure. These require separate A20 physically isolated PG16 and explicit owner test/reset GO. Independently resolve [C01 API failure #73](https://github.com/C8LyNn/aplikacja-turnieje/issues/73) with A50, obtain A60 exact-new-SHA E2E QA, preserve A140 Replit live/Steam and separate release GO.

**Owner/handoff:** A10: source registry; A40: optional composite **test-only** integration and future owned wiring; A60: independent exact PR134/129 QA; A50: API aggregate first-failure; A30/A00: trusted issuer/legacy rights decisions; A20: disposable PG16 only after approval. No authorization to change another agent's active files.

## 5. Closure, GO/STOP

**WAVE5 A90 result:** `DONE_DB_FREE_EVIDENCE / C03_RAW_PROFILE_PRECLONE_STRICT_SOURCE_MATCH / C03_20_OF_20_NATIVE_PASS / PR129_18_OF_18_NATIVE_PASS_SEPARATE_SHA / C01_API_AGGREGATE_FAIL / IMPORTER_NOT_WIRED / SOURCE_ISSUER_NOT_AUTHENTICATED / ACTUAL_EXPORT_IMPORT_NOT_EXECUTED`.

- **YES:** use this documented exact-SHA evidence for A60/A10/A40 review.
- **CONDITIONAL:** incorporate #129's unique test file into a future isolated composite **after independent A60 QA**, then execute a combined native matrix.
- **NO:** claim working Backup V3 restore, accept historical Undo/CAS, approve protected merge or release, run SQL/PG16 reset without separate GO, deploy Replit/live or start SWARM-006.

**Files touched by A90 in this Wave5:** one documentation Markdown report only; **NO CODE CHANGES**, **NO NEW PR**, no game sources/assets, no existing A40/A140 branch edits.
