# WEB-005 — A70 / DEVELOPMENT FIRST / WAVE 2 — preflight and handoff

**Task:** T040-A70-WAVE2-ROSTER-UNDO-PAYLOAD-SAFETY  
**Agent:** A70 — Match Lifecycle & Undo  
**Mode:** scoped test-first functional hardening; PG16/DB execution prohibited without separate safety approval.  
**Branch:** `fix/web-005/t040-wave2-roster-undo-payload-safety`  
**Exact base:** PR #42 `021bed269f9ea8ac8ce53caeea44263c098aa2dd` (OPEN DRAFT, NOT MERGED); distinct from PR #104 `e8af1dbcd1bd468f09c629e38db4b87bc85bfa8f`.

## Exclusive edit allowlist, published before source change

1. **NEW** `artifacts/api-server/src/application/players/roster-undo-payload.ts`: pure parser for `player_added/delete_player`, `player_edited/restore_player`, strictly scoped player IDs and previous fields.
2. **NEW** `artifacts/api-server/test/roster-undo-payload.test.ts`: unit tests first; legitimate old and new snapshots, malformed/double/stale/version-shaped payloads, clone-foreign IDs, type mismatch and no input mutation.
3. **EXISTING A70-owned PR42 path** `artifacts/api-server/src/application/players/tournament-roster.ts`: replace unsafe JSON cast + arbitrary `prevData` propagation in `undoTournamentRosterAction` ONLY, preserving same transaction lock/LIFO/auth; translate parse errors to `ROSTER_UNDO_UNAVAILABLE`.
4. This file `docs/web-005/agent-reports/A70/WEB-005_A70_WAVE2_HANDOFF.md`: source/candidate QA and exact SHA handoff.

**No other file changes permitted.** In particular do NOT edit `routes/tournaments.ts`, existing `revert-match.integration.test.ts`, PR #42, PR #51, PR #56/#58/#64/#104, game files, imported DB schema, migration files, importer or Replit live.

## Confirmed source issue before code

The existing PR42 roster service parses persisted action_log JSON with `JSON.parse(...) as Record<string,unknown>`; `delete_player` uses `Number(payload.playerId)`, and `restore_player` accepts any object as `prevData`, casts it to TypeScript `PlayerUpdate` and passes all its keys to `tx.update(playersTable).set(changes)`. TypeScript's cast does not remove `id`, `tournamentId`, `status`, etc. The service also selects its branch from payload.type without verifying actionType is the corresponding roster provenance.

A malformed or imported legacy action could therefore cause a mutation outside the documented historical player snapshot, even after correct tournament/global LIFO locks. This is **source-reproduced a path to unsafe writes**, **NOT** a claim that hostile import has already executed at runtime or that PG16 was tested.

## Baseline scenarios reviewed

- **Multiple calls:** existing `test/revert-match.integration.test.ts` asserts valid first Undo (200) and second does not repeat the same action; **authored, runtime not rechecked**.
- **Stale X/newer Y:** PR42 includes deterministic `pg_blocking_pids` barrier and source 409 `UNDO_ACTION_CHANGED`; **test exists, NOT_EXECUTED** in Wave 2.
- **Version conflict:** internal match Revert guards `expectedMatchRevision`/`expectedCompletionActionId`, but public Direct Revert required CAS remains separate owner MP2B policy. Do NOT change that policy/route in this PR.
- **Interrupted operation:** existing match Revert uses `afterMatchReset` fault hook and full transactional rollback test. Roster source uses single DB transaction; DB rollback not runtime-verified. Pure tests can verify rejected payload causes no input mutation, not promise SQL rollback.

## Next

Publish test-first new parser tests, a small pure parser module, wire parser ONLY into PR42 roster service in a NEW dependent Draft PR; run safe locally executable tests if possible; independent A60 per-exact-SHA QA mandatory. A10/A40 must not automatically include stacked PR42 in composite without overlap and live drift checks.

**STOP:** no destructive PG16/SQL, migrations, live publish, game changes, merge, cherry-pick, SWARM-006.


## WAVE2_HANDOFF — executed work

**New isolated DRAFT PR:** [#119](https://github.com/C8LyNn/aplikacja-turnieje/pull/119); base [#42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42) exact unchanged `021bed269f9ea8ac8ce53caeea44263c098aa2dd`. **Source implementation commit before this documentation update:** `efd12be1b4c0a4f43e1090d721b1be6b5336043c`. Final full HEAD must be read from PR #119 after this report commit. No standalone release merge/rebase/cherry-pick.

**Evidence / exactly four changed paths** from GitHub compare to PR42:
- `artifacts/api-server/src/application/players/roster-undo-payload.ts` — **NEW** +112, Git blob `8acb76e19a49274dcaa07349b7c7aeb1c2d330fd`.
- `artifacts/api-server/test/roster-undo-payload.test.ts` — **NEW** +146, Git blob `174722ff3468420aa213354afa1c7f14c5e69db8`.
- `artifacts/api-server/src/application/players/tournament-roster.ts` — +9/-8 in exclusively the existing roster Undo branch, Git blob `fa3c50b9ac86d0b99d5521a7a8ccaee0ed50eefe`. Import pure parser, validate under same tournament and latest action locks, catch invalid persisted source with `ROSTER_UNDO_UNAVAILABLE`, apply only allowlisted `prevData` properties; previous global LIFO and one-transaction contract unchanged.
- `docs/web-005/agent-reports/A70/WEB-005_A70_WAVE2_HANDOFF.md` — source allowlist and actual QA receipt.

**Test-first commit sequence:** preflight `9f9946316221c03defe2bcb74ec40d3fefabe34a` → tests `8f49c5cd7e77fd6cfe82e2b0fb66bf404a0cb963` → pure parser `3758712701adb481a104039aaf3ae683ad5b8c47` → service-only integration `efd12be1b4c0a4f43e1090d721b1be6b5336043c`. 11 test definitions written before production logic.

### Actually executed safe local QA (no database)

Node.js `v22.16.0`; TypeScript CLI `5.8.3`. Git's blob format was recomputed on the local parser and test bytes:
- Parser **exact matched source Git blob** `8acb76e19a49274dcaa07349b7c7aeb1c2d330fd` (3,642 UTF-8 bytes).
- Tests **exact matched test Git blob** `174722ff3468420aa213354afa1c7f14c5e69db8` (5,690 UTF-8 bytes) **BEFORE** transient environment-only import-specifier change from `../src/application/players/roster-undo-payload` to `../src/application/players/roster-undo-payload.ts` for Node's native TypeScript stripping. Actual tested assertions/fixtures otherwise identical.
- **Actual command:** `node --experimental-strip-types --test /mnt/data/t040_wave2_localqa/test/roster-undo-payload.test.ts` → **EXIT 0; TAP tests=11, pass=11, fail=0, skipped=0, cancelled=0** (Node experimental type-stripping warning, nonfatal).
- **Actual command:** `tsc --strict --noEmit --target es2022 --module esnext --moduleResolution bundler --lib es2022 /mnt/data/t040_wave2_localqa/src/roster-undo-payload.ts` → **EXIT 0**, isolated parser only.
- GitHub source-inspection check: parser imported into `undoTournamentRosterAction`, branch matches persisted `actionType`, changes copied from safe fields and performed after locked LIFO check.
- **NOT_EXECUTED:** monorepo `pnpm --filter @workspace/api-server typecheck`, full HTTP/API tests, PG16 integration tests, physical rollback, C01/C02 CI, browser validation. This is an isolated local source-verified unit run, **not** an application/native PG16 acceptance.

### Impact and edge cases

- **Positive:** valid `delete_player`, full modern `restore_player` and sparse historically plausible fields, with new independent snapshot to avoid mutating JSON source; nonnull name trimmed.
- **Negative:** foreign source `actionType` (including `match_started` falsely carrying `delete_player`), player IDs encoded as strings/null/arrays/unsafe number, foreign/extra keys such as `id`, `tournamentId`, `status`, source expected revision fields, seed out of PG 32-bit range, malformed snapshots. Typed parser fails before DB writes.
- **Repeated / stale / conflict / interruption:** baseline PR42 test authoring was reviewed but its 409/200 and rollback outcomes were **not rerun in PG16**. Pure parser test R09 confirms repeated parsing doesn't mutate the prior snapshot; does **not** prove server duplicate idempotency or rollback.
- **Known remaining limitation:** `undo-last` route initially calls `JSON.parse(lastAction.undoPayload)` outside the roster service. Malformed *JSON syntax* can throw before this parser; that pre-existing route-level handling is **outside this isolated PR** and needs separate route authorization/QA if required. API Direct Revert external CAS remains owner-policy-gated MP2B and untouched.
- Current completed stage/DE/Swiss sports rules and Replit/live state unaffected. Importer remains outside source patch and is not an evidence source for trusted historical Undo.

### QA ownership, rollback and deployment gate

**A60:** independently source-review final HEAD of PR #119, including potential unsafe schema fields, release API compatibility and exact test outcomes. **A50:** on trusted complete checkout at exact new HEAD, Node22/pnpm10/frozen dependencies, run whole-project `pnpm --filter @workspace/api-server typecheck` and safe no-DB `pnpm --filter @workspace/api-server exec node --import tsx --test ./test/roster-undo-payload.test.ts`; only after separate owner/A20 physical PG16 isolation/reset consent run PR42 existing Undo race/rollback integration suite at this PR head. Store real exit/TAP/PG snapshots.

**A10/A40:** register PR #119 **as stacked child of PR #42**, do not integrate as an independent patch without its parent/owner resolution; A40 C02 must not inherit the still-failing C01 integration result as green. Preserve latest release vs Replit-live differences and secure import provenance.

**Rollback:** close/discard unmerged Draft PR #119. No database or live rollback needed because this task performs no schema change, merge, deployment or hosted-side mutation.

**Final status:** `WAVE2_HANDOFF / SOURCE_PATCH_PUBLISHED / ISOLATED_PARSER_TEST_11_PASS / SOURCE_QA_A60_PENDING / FULL_APP_QA_NOT_EXECUTED / RELEASE_NO_GO / SWARM006_HOLD`.
