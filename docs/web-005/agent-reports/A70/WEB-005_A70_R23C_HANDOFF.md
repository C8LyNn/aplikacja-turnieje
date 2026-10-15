# WEB-005 — A70 R23C / Action-local provenance validator final handoff → A90 / A60 / A00

**Task:** WEB-005-T040-A70-R23C-ACTION-LOCAL-CLOSURE  
**Agent:** A70 / Match Lifecycle & Undo  
**Date:** 2026-10-15 Europe/Warsaw  
**Scope/mode:** NARROW PURE DOMAIN IMPLEMENTATION, TEST-FIRST; NOT_WIRED  
**Result:** **ACTION_LOCAL_VALIDATOR_SOURCE_READY_FOR_QA** (SOURCE ONLY, **RUNTIME_NOT_EXECUTED / QA_PENDING**).  
**NEW DRAFT PR:** [#64 — isolated action-local Backup V3 provenance validator](https://github.com/C8LyNn/aplikacja-turnieje/pull/64)  
**Branch:** `feat/web-005/t040-r23c-action-local-provenance`  
**Pinned release base:** `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`  
**Code candidate before this report update:** `78171fef5fd4aeefdc5543b7e6d7c63a59da8d52`. **Use live PR HEAD after report commit for independent exact-SHA QA.**  
**Historical scope contract:** [A70 R23A Markdown](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a70-r23a-action-provenance/docs/web-005/WEB-005_A70_R23A_ACTION_PROVENANCE_CONTRACT.md) and [JSON rules](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a70-r23a-action-provenance/docs/web-005/WEB-005_A70_R23A_ACTION_PROVENANCE_RULES.json).

## 0. EXCLUSIVE FILE ALLOWLIST — prepublished before implementation

The following EXACT paths were checked absent on the original release base, listed here, committed as this preflight document **before the test-first file and source module** and not expanded later:

1. `artifacts/api-server/src/application/backups/backup-v3-action-provenance.ts` — NEW pure validator.
2. `artifacts/api-server/test/backup-v3-action-provenance.test.ts` — NEW pure node:test suite.
3. `docs/web-005/agent-reports/A70/WEB-005_A70_R23C_HANDOFF.md` — this preflight/closeout report.

Initial owner/scope commit `67f09ae3f62f712f4e390c90454cc0a2deb6ebde`. First test commit `b7732899297a59b18c6c1848581017554702fd37` **precedes** first implementation commit `88ffc754bcd10134bf5cf574c1e0f5928be0a2b3`. Test fixture revision `0a65cde38cd4fd5c782c135a68c5bb762834d029`; domain-only refinements through `78171fef5fd4aeefdc5543b7e6d7c63a59da8d52`.

**Commit compare @ code candidate:** 6 commits ahead of frozen release, EXACT three added files; `0` modified original files. The candidate compares cleanly against independently unmerged:
- [PR56](https://github.com/C8LyNn/aplikacja-turnieje/pull/56) exact checked HEAD `a7f71a7e7efdabd479b358a3cee80bc6359c4321`, changes only `backup-v3-strict-policy.ts`/its test.
- [PR58](https://github.com/C8LyNn/aplikacja-turnieje/pull/58) exact checked HEAD `e8100f7b0c1071c2a98880d4eb7947514fc58185`, changes only `backup-v3-profile-gate.ts`/its test.
- [PR42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42) `021bed269f9ea8ac8ce53caeea44263c098aa2dd`, separate tournament Undo files.
**Disjoint filenames ≠ tested integrated semantics.** PR56 and PR58 were NOT edited, rebased, cherry-picked or wired.

## 1. Delivered pure public API and enforced semantics

Module exports:

~~~ts
export type ActionLocalProvenanceIssueCode = ...;
export type ActionLocalProvenanceIssue = Readonly<{code:string;path:string;message:string}>;
export class ActionLocalProvenanceError extends Error {
  readonly code = "INVALID_BACKUP_V3";
  readonly issues: readonly ActionLocalProvenanceIssue[];
}
export function validateBackupV3ActionLocalProvenance(input: unknown): void;
~~~

The preclone strict-only validator accepts complete modern V3 source graph projections containing `players`, `stages`, `stageParticipants`, `matches`, `resultHistory`, `actionLog` and `strictPolicy`. It **does not** read/write a DB, make HTTP requests, generate a clone or return a match/action token or authorization. A caller must separately authenticate profile/producer, perform full base V3 validation, correctly remap all clone-local references, and then enforce retained capability flags in mutation entrypoints. Raw marker equality alone is NOT trust.

**Enforced:**

- Stage-member match entrants and winners, stage/match/history identity and latest-history parity, immutable older history retained on a pending result. Validate played BO score threshold/winner, walkover, non-SE/DE no_contest and one-player system BYE.
- Exact actionType ↔ Undo payload type; recognized source Undo IDs must be scalar, declared, and action-local. Especially `action.matchBackupId===undoPayload.matchId` for `revert_match`, `restore_status`, `restore_best_of`, `restore_cancelled_match`, `restore_players_swap`; stage participant closure for historical pre-swap IDs.
- Special semantics of nullable `prevFeaturedMatchId`: previous match in same tournament may legitimately differ from newly featured match **and stage**; `match_unfeatured` legitimately records `action.matchBackupId=null`.
- **P23-01:** genuine BYE has one same-match/stage `system_bye_assigned` with `undoPayload=null` and `canUndo=false`, zero manual completions. Missing/forged/undoable system BYE rejected.
- Each typed `completionActions[sourceActionIndex]` binds exactly one manual source action to the **same** match and existing historical revision, with active status matching Undo flags and last current completed result. A later chronological completion cannot point to an older revision. Pending after a reverted result may retain historical undone completions.
- All source actions have unique, contiguous portable chronological ordinals and unique portable IDs, even for identical timestamps; source timestamps cannot contradict ascending ordinal. Fail on ambiguous/malformed source history/order; do not yield an executor authority.
- Unexpected original `action.id`, source action ID or expected CAS tokens in source action records/strict metadata are refused; `strictPolicy.matchStateRevisions` must cover matches with positive portable revisions but is **not** returned as a new clone CAS token.
- Unknown action types can be preserved **only as inert nonundoable audit records**, never inferred to be new executable Undo commands; non-undoable `match_result_reverted` is NOT evidence of one specific manual completion since generic Undo may produce that audit.

## 2. Test-first coverage and honest execution

**18 authored node:test definitions** (several with multiple negative mutations):

| Case | Expected semantics |
|---|---|
| AP01 | Valid played; matchStateRevision not equated with resultHistory revision; validator returns `void` |
| AP02 | Valid walkover with no fabricated scores |
| AP03 | no_contest legal Swiss/RR, rejected SE/DE |
| AP04 / P23-01 | Valid system BYE without manual action; seven negative forged/missing variants and counterfeit manual completion |
| AP06 | Two valid export matches A/B, payload target B but action A → reject action-local mismatch |
| AP07 | Wrong-stage entrant, action stage, historical stage → reject |
| AP08–09 | Legal cross-stage previous featured ID or null; foreign/string/array/object ID → reject |
| AP10 | Wrong scalar shape for known Undo matchId, even when declared ID exists |
| AP11 | Complete → Revert → recomplete, history remains; exactly one active completion; pending after a second revert valid |
| AP12 | Identical action timestamps accepted with distinct ordinal; duplicate portable identity/order/invalid sourceIndex rejected |
| AP13 | Generic Undo audit `match_result_reverted` not interpreted as manual completion; forbid executable audit payload |
| AP14 | Historical swap IDs belonging to wrong stage rejected |
| AP15 | Previous undone completion + pending match + retained immutable history accepted |
| AP16 | Wrong action/payload pair, unexpected original action ID, unknown executable Undo type rejected |
| AP17 | Forged history revision, missing typed completion and inconsistent active flag rejected |
| AP18 | Portable source match revision validated but never returned as target CAS; forged external expected completion ID rejected |
| AP19 | History/current parity, negative series scores, false winner, manual BYE impersonation rejected |

**Source inspection actually performed:** 14 deterministic read-only checklist assertions (required module/test symbols, no imported DB/HTTP, action-local closure, P23-01, chronology, historical tests): **14/14 source-string checks PASS**, but these checks do NOT execute the validator.

**Actual Node22/pnpm10 full repo typecheck:** **NOT_EXECUTED**.  
**Actual node:test TAP:** **NOT_EXECUTED**, 18 definitions ≠ 18 passing tests.  
**PostgreSQL16/HTTP/API/restore:** **NOT_EXECUTED** and out of task scope.

Reason: R23C source work was performed through connected GitHub on an isolated branch, not an approved complete Node/pnpm monorepo checkout with its pinned dependencies and physically approved native PG16 environment. No fake TAP, typecheck exit, coverage percentage or review approval is reported.

**A50 recommended exact-head native commands, only on trusted clean complete checkout:**
~~~sh
pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/api-server exec node --import tsx --test ./test/backup-v3-action-provenance.test.ts
~~~
Capture actual exit statuses/TAP. A60 independently reviews the **new final PR64 HEAD**; if either command fails, mark `SOURCE_FIX_REQUIRED` and return exact diagnostics to A70 for an explicitly scoped follow-up. Pure unit tests should need no DB; do not start PG16 reset or pay for CI just to test this module.

## 3. Limits / integration blockers — NOT repaired here

1. PR56 strict-core and PR58 raw profile gate are separate unmerged prototypes; no importer invokes the new module. Existing `backup-v3.ts` still has dangerous `sourceMap.get(value) ?? value` fallback and does not serialize stable action IDs/new portable total order.
2. Validator requires full `stages`/`stageParticipants` graph (actual V3 supports these), so PR56's smaller pure unit fixture **is not** sufficient without adapting its fixture or composing a full V3 fixture. Domain API accepts strict marked objects, not trusted historical V2/V3. It does not attest producer cryptographically.
3. Historic roster actions may reference players deleted after Undo; without separately attested tombstones or immutable action provenance there is no safe action-local player closure. Strict rejects such unknown IDs; safe, positively recognized legacy requires A90/A30 bounded read-only or disabled-Undo semantics, **not** synthetic invented IDs.
4. Original DB `action_log` has no immutable foreign key to specific `result_history.revision`; portable typed link plus action ordinal checks detect many forgeries but cannot cryptographically prove publisher truthfulness. Attested exporter/integrator must preserve causal joins/tie-breakers.
5. This module is a source-validation gate **only**; real strict import success, historical authentication, action remapping, durable disabled-Undo flags, late rollback, current Host/Direct Revert CAS, and test runtime remain separate release gates. Do not interpret source action order/portable CAS as authorization or clone-local identity.

## 4. Precise agent handoff

**A90 — Backup V3 core/integration owner:** independently check actual strict exporter graph, combine raw PR58 profile preflight + PR56 strict validator + this A70 action-local check in the correct trust/preclone sequence only under NEW explicit integration GO. Never pass a legacy/untrusted candidate as strict attested, never use `?? oldId` remap. Use clone-local CAS and source total-order mapping without granting source action IDs power to mutate clones; never fabricate manual `match_result_submitted` for system BYE.

**A30 — security peer:** attack stage/tenant ID coincidences, source action/Undo local binding, cross-stage `prevFeaturedMatchId` correctness, malformed arrays/unknown nested operational keys, forged completion/history/ordinal, marker downgrade, DoS/cycles/accessor objects; review distinction between action context validation and issuer provenance. Any new failure should be a dedicated separate-author source patch or accepted pending QA issue, not silent full-import GO.

**A20 — DB/migrations:** validate real stage-scoped FKs, \`matches.revision\` vs \`result_history.revision\` histories, action-ID ordering (timestamp, ID), clone-local CAS, transactional rollback and potential durable legacy capability restrictions; only separate DB GO could add migration/schema. None was run.

**A60 — independent QA:** review exact final draft PR #64 HEAD and dependency bounds. Report authored tests separately from actual TAP; attempt lawful no-DB pure tests via trusted A50 executor; check source static defects before \`SOURCE_ACCEPTED\`. No self-certification by A70.

**A00/HQ:** source candidate may be registered for future controlled composite integration; PR64 is draft/unmerged, not SWARM006 dispatch or release GO.

## 5. STOP

**No changes to pre-existing application files, PR #56, PR #58, PR #42, importer, backup restore paths, database, historical Undo executor, routes, Host, migrations or public API. No merge, production SQL, deploy or SWARM-006.**

**Verdict:** **ACTION_LOCAL_VALIDATOR_SOURCE_READY_FOR_QA** — a test-first isolated source candidate awaiting real test executions and independent exact-SHA QA.
