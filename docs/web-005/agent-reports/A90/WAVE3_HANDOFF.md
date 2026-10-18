# WEB-005 — A90 — WAVE3_HANDOFF

**ROLE:** A90 — Backup V3 Integrity & Restore  
**TASK:** DB-free RAW PROFILE → VALIDATED PRECLONE → STRICT DENIAL **TEST-ONLY**  
**DATE:** 2026-10-18 (Europe/Warsaw)  
**STATUS:** `DONE_SOURCE_PUBLISHED / A60_INDEPENDENT_QA_PENDING / NOT_WIRED / RELEASE_NO_GO`

## 1. Exact source and change custody

| Contract field | Actual outcome |
|---|---|
| **Dispatch** | [Common WAVE3 Google Doc](https://docs.google.com/document/d/10cKgkk3XZTwudRMIQ620Q5DAYEsMZIb8zmqgBoRnmEE/edit), title `WEB-005 — DEVELOPMENT FIRST — WAVE 3 — PARALLEL ROLE DISPATCH`, read revision `AHj4eMTrCpik1b_34kpVSOeHszrwCE6CsDl3e897_AOfhRJsYsAgc0fwqYIGmreQVVhjFasL8HaT_S3G2QoM_KPkkVm3YmuqqYRxdXrx6XE`; §A90 authorizes READ-ONLY / TEST-ONLY; forbids editing PR #100 |
| **BASE SHA** | `6e198dc2c24cff651f8e75898c6e6e97eec9b0e4` — exact [Draft PR #100](https://github.com/C8LyNn/aplikacja-turnieje/pull/100) pinned adapter implementation |
| **HEAD SHA** | **`a8a04f7f6656ec02c2baa0ac1027b39192da743d`** — new independent TEST-ONLY source commit |
| **Branch** | `test/web-005/a90-wave3-raw-preclone-strict-boundary` |
| **PR** | **[Draft PR #129](https://github.com/C8LyNn/aplikacja-turnieje/pull/129)**, OPEN/DRAFT/unmerged, base exact PR100 branch |
| **CHANGED PATHS** | Exactly ONE **ADDED** file: [`artifacts/api-server/test/backup-v3-ingress-boundary.wave3.test.ts`](https://github.com/C8LyNn/aplikacja-turnieje/blob/a8a04f7f6656ec02c2baa0ac1027b39192da743d/artifacts/api-server/test/backup-v3-ingress-boundary.wave3.test.ts), Git blob **`9ae00d93dbadb4456f8d07fcdb831de402864360`**, 287 lines; **no existing code altered** |
| **Unmodified dependency blobs** | PR58 raw gate `518526d8d9ff2cef368261788e12c9f8290754f5`; PR56 strict core `595c68b87a5361623bef6293519ed668e9d4e493`; PR100 preclone adapter `0465e11b2420fa00f2de5cc14fa4d81858c76ff0` |

**Conflict review:** A40 active [PR #101](https://github.com/C8LyNn/aplikacja-turnieje/pull/101) HEAD `a5bfd07b822c223fd995604dc2e228935ab81498`, changes/adds five candidate adapter/A70 files including **the existing** `backup-preclone-adapter.test.ts`; A140 active [PR #116](https://github.com/C8LyNn/aplikacja-turnieje/pull/116) HEAD `a0f1d8066bbcf4e4b602cb587aebf599e327d067`, changes three independent docs/scripts paths. The new unique `backup-v3-ingress-boundary.wave3.test.ts` **does not overlap either changed-file list**. Neither active branch was edited, merged, rebased or auto-synchronized. #101 may change later: recheck SHA before any integration.

## 2. Test matrix actually authored and exercised

**14 tests** (`WAVE3-A90-01…14`), synthetic only:
1. legal historical V2 `completed/system_bye` → versioned semantic callback, `LEGACY_COMPAT_RESTRICTED` but NO history authority;
2. source-shaped historical V3 → restricted, no Undo/Revert/CAS;
3. modern strict source core checks + fake callback invocation → `STRICT_ATTESTATION_REQUIRED`, never authenticated;
4. detectable strict marker removal with modern sidecar → pre-parser `PROFILE_REJECTED`;
5. fully stripped modern backup indistinguishable from historical → only `LEGACY_COMPAT_UNATTESTED`, no privileges;
6. duplicate nested `strictPolicy.version` JSON key -> `DUPLICATE_JSON_KEY` and no parser calls;
7. Zod-like stripping of `strictPolicy` → `PARSED_PROFILE_CONFLICT` before semantic;
8. version confusion V3 parsed as V2 → `PARSED_PROFILE_CONFLICT`;
9. invalid historical BYE winner → preflight reject;
10. duplicate V2 round/match detected by *synthetic* domain port -> `SEMANTIC_VALIDATION_FAILED`;
11. strict latest history completion time conflict -> actual PR56 strict core `STRICT_POLICY_FAILED` before action-local port;
12. missing A70 action-local dependency -> `MISSING_DEPENDENCY`;
13. async semantic or async A70 port -> typed failure, no mistaken `Validated` state;
14. client-provided `trusted:true` or `verified:true` port property -> no issuer trust.

All results assert `authenticated=false`, `importAuthorized=false`, historical Undo/Revert/CAS disabled and immutable decision/profile metadata. **The synthetic versioned semantic validators and A70 callbacks are spies for call sequencing only**, not actual `validateBackupV2`, `validateBackupV3` or independently certified PR64 action-local logic; no authenticated archive corpus and no real HTTP ingress available in PR100.

## 3. TEST COMMANDS + actual RESULTS

| Test / method | Actual execution and evidence |
|---|---|
| **Isolated V8 Code Mode self-check** | **EXECUTED** using exact GitHub blob content for PR58, PR56, PR100 and the new test file; in-memory TypeScript syntax erasure, source function bodies evaluated with minimal assert/test shim: **14/14 PASS, 0 FAIL**, ref `a8a04f7...`. **Not native Node/TAP or full TypeScript typecheck.** |
| **Native Node22 targeted suite (proposed command)** | `pnpm --filter @workspace/api-server exec node --import tsx --test ./test/backup-v3-ingress-boundary.wave3.test.ts`; author-invoked local **NOT_EXECUTED**. Automatic Actions outcome is recorded separately below when known. |
| **Native typecheck (proposed command)** | `pnpm --filter @workspace/api-server run typecheck`; author-invoked local **NOT_EXECUTED** |
| **GitHub Actions automatic check** | [Run #39128441792](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39128441792) at new exact HEAD: **IN_PROGRESS at initial publication**. Do not infer PASS; update after reading the actual job logs. |
| **Real V2/V3 validator/PR64 action-local integrated tests** | **NOT_EXECUTED / NOT_WIRED**; raw/preclone/strict test-only, not trusted source provenance |
| **HTTP/SQL/PG16/Docker/import/rollback/live** | **NOT_EXECUTED / NOT_AUTHORIZED**; no real DB connections or mutation permissions |

The current adapter returns no positive import authorization for either strict or legacy. Synthetic tests cannot prove the future raw HTTP parser preserves duplicate members or that old Undo capabilities are actually disabled on the live server.

## 4. CONFLICTS, blockers and NEXT OWNER

- **CONFLICTS:** no touched-path collisions with A40 #101 or A140 #116. **Dependency/merge risk:** #129 is a child of PR #100 (itself child of PR #66/C01); A40 C02 now has a separate adapter variant. Source package must NOT be independently merged/cherry-picked into C02 without A10 manifest and A60 exact-SHA QA.
- **Security blockers:** A00/HQ modern authenticated issuer and genuine signed-envelope trust root **WAIT_OWNER**; full V2/V3 domain binding and real A70 closure **NOT_WIRED**, current HTTP `req.body` is already parsed, source Undo remap fallback remains, no enforcement of legacy restricted undo/CAS. A30's ingress acceptance contract remains prospective.
- **A60:** perform independent code/test review of exact PR129 SHA. Native QA source PASS does not equal HTTP/PG16 certification.
- **A10:** append exact PR129 parent/HEAD, test blob and report blob to source registry; no modification of historical packs; distinguish authored vs actually executed tests.
- **A40:** dependency/changed-file check only, wait for independent QA before potentially including this unique test file in C02; do not modify active A40 branch.
- **A00/A30:** reserve later real raw ingress, issuer attestation and legacy capability enforcement for separately signed GO; **no implied authorization for positive imports**.
- **A140:** preserve Replit live; the tested source is NOT deployed.

**FINAL WAVE3:** `WAVE3_HANDOFF / A90_TEST_ONLY_SOURCE_PUBLISHED / PR129_DRAFT / ZERO_APP_CODE_CHANGES / PURE_V8_14_OF_14 / NATIVE_CI_PENDING / BACKUP_V3_NOT_INTEGRATED / RELEASE_NO_GO / SWARM006_HOLD`.
