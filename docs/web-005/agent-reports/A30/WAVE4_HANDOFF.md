# WEB-005 — A30 / WAVE 4 — AUTHORIZATION & INTEGRATION READINESS

Date: 2026-10-18 (Europe/Warsaw). Task: WEB-005-A30-WAVE4-AUTH-READINESS.
Mode: SECURITY / READ-ONLY / NON-DESTRUCTIVE. STATUS: DONE source triage; product integration readiness PARTIAL.
BASE SHA: f8502adf670ad65399cb21ae31c0f03d63c6a7b3 (A30 WAVE 3 handoff).
HEAD SHA: exact report publication SHA to be provided in GitHub handoff, avoiding self-referential file hashes.
Changed paths: docs/web-005/agent-reports/A30/WAVE4_HANDOFF.md and its .sha256 sidecar. NO CODE CHANGES.
Tests: no Node/pnpm/browser/PG16/SQL/Docker/CI tests. NOT TESTED. Ten explicit read-only source assertions matched expected patterns; not runtime QA, not a security PASS.

## Sources and exact application SHA

- Draft PR #63 / A110: 52f3e1db334fc5b178fb3f4ed21d4099a0d6558f — Basket CAS client and draft sources.
  https://github.com/C8LyNn/aplikacja-turnieje/pull/63
- Draft PR #101 / A40: a5bfd07b822c223fd995604dc2e228935ab81498 — pure Backup V3 preclone and action provenance, NO imported authority.
  https://github.com/C8LyNn/aplikacja-turnieje/pull/101
- Draft PR #100: 6e198dc2c24cff651f8e75898c6e6e97eec9b0e4; PR #104: e8af1dbcd1bd468f09c629e38db4b87bc85bfa8f. Both have changed paths overlapping PR #101, independently tracked by A10/A40.
- Draft PR #119 / A70: b650a8e8de1841802c60f2af356bf0b404bd8018 — roster Undo typed payload and transaction checks, plus inspected existing tournaments router.
  https://github.com/C8LyNn/aplikacja-turnieje/pull/119
- API route inspected from #119 SHA: artifacts/api-server/src/routes/tournaments.ts (Git blob 6d9608104700bd0619754e362bc30d5af053bd0b).
- Auth policy from #119 SHA: artifacts/api-server/src/access-policy.ts (blob 2efd5a51e365e9b3aed598eb3289178911f87af6).
- Related issues: #74 Basket CAS auth/draft, #76 owner gates, #77 independent QA, #86 R23H history, #99 SQL source block.
  https://github.com/C8LyNn/aplikacja-turnieje/issues/76

## SEC-W4-01 — Basket CAS backend contract gap — P1 integration blocker, not a proven exploit

At #63 SHA, stage-basket-cas-client.ts: lines 158–167 require both featureEnabled and serverCasVerified flags; lines 99–109 reject absent/weak ETags; lines 179–194 require a real GET strong ETag, lines 197–239 send If-Match and require 412/428 and fresh revision semantics, rejecting unchanged ETag. File explicitly states it is not wired to current StageBasketsPanel.

At #119 SHA, tournaments.ts lines 778–816: GET stage-baskets checks requireTournamentRead and directly returns JSON. PUT checks requireOrganizer then calls replaceStageBasketConfiguration. The inspected endpoint contains neither an explicit strong app ETag setter nor an If-Match compare-and-swap precondition, 412/428 protocol handling. Automatic Express weak ETag is not a revision-scoped CAS token.

Impact: if UI CAS activation is enabled against this legacy route, GET cannot furnish the required strong backend contract, and legacy PUT cannot guarantee conflict rejection. Organizer authorization IS present; unauthorized access or successful lost update was NOT runtime demonstrated.

Action: A00/A50 (authorized backend owner) must implement or prove strong GET ETag, durable monotonic revision, atomic conditional PUT/412 stale/428 absent, new canonical revision, and role/tournament scoping. A110 must leave feature and server verification gates OFF until verified. A60 to independently test two-writer conflicts, 401/403, 412/428, reauthorization and exact newer server SHA. No SQL/migration or merge authority granted.

Applicability: ACTIVE for real CAS client/server integration; DEFERRED_BY_SCOPE for standalone frontend/DB-free tests that do not activate the feature.

## SEC-W4-02 — Legacy Undo malformed persisted payload handling — P1 robustness finding, runtime unconfirmed

At #119 SHA, tournaments.ts lines 2297–2306 require write actor, lines 2308–2335 find latest undoable action, and line 2337 calls JSON.parse(lastAction.undoPayload) BEFORE local try/catch at lines 2340 and 2360. Malformed persisted JSON would bypass those domain-specific handlers and reach generic route error handling. The exact HTTP result is NOT TESTED, no crash or unauthorized mutation asserted.

Positive safeguards: tournament-roster.ts lines 211–257 lock tournament/action, check global-LIFO and use a typed parser for roster undo with a specific ROSTER_UNDO_UNAVAILABLE error; access-policy.ts guards write access and support session revalidation. This is not an authentication bypass.

Action: A70 to add a narrow synthetic bad-JSON route regression and fail-closed domain error mapping, without changing already active A70 PR #119 from A30. A60 to QA exact fix SHA and confirm no mutation. A10 to track any new route diff.

Applicability: ACTIVE for release candidate including legacy Undo endpoint; not for unrelated DB-free presentation changes.

## SEC-W4-03 — Backup V3 provenance and importer authority — intentional boundary / separate owner HOLD

At #101 SHA, backup-preclone-adapter.ts explicitly describes a pure, not-wired, preclone validator; returns authenticated:false, importAuthorized:false and disables historical Undo/CAS replay. backup-v3-action-provenance.ts states strict schema/profile validation is not producer authentication and issues no action/CAS capability.

Action: A00/A90 must decide trusted issuer/authenticated import and safe downgrade/legacy restrictions before any real import or persistence wiring. A40 may continue pure DB-free C02 Draft; A60 may independently test synthetic fail-closed cases. Do not misconstrue pure validator PASS as import authority. This is a governance HOLD for future write, not a proven defect in the pure code.

## Controls confirmed, not runtime certified

- Basket GET has a tournament visibility access guard; Basket PUT has a stronger organizer guard.
- Basket CAS client requires server proof and does not automatically retry stale 412; no activation observed in the inspected module.
- Undo route requires tournament write authorization; roster Undo has typed payload/foreign target and global-LIFO checks.
- Backup pure preclone explicitly denies authentication and import/Undo/CAS authority.

## Security-deferred backlog

Carry forward all historic P0-31-01..07 as OPEN and keep 7 P1 / 3 P2 per prior A30/A60 snapshot; none are closed by this report. Triggers remain: PG connection, non-owned schema/CASCADE, S2 CREATEDB and FORCE teardown, inherited runner DSN, PG Docker image/volume/netns, or destructive G0–G5 consent. The detailed conditional backlog remains in:
https://github.com/C8LyNn/aplikacja-turnieje/blob/f8502adf670ad65399cb21ae31c0f03d63c6a7b3/docs/web-005/agent-reports/A30/WAVE3_HANDOFF.md

Do not require whole R23H for verifiably DB-free work. Actual destructive PG16 C01/#89 remains SECURITY_BLOCKED / G0_NO_GO with R5 blockers B01/B02/B03 documented in Issue #99. A W4 P1 does not inflate historic P0 count.

## Read-only checks

Ten connector-fetched source-text assertions matched: Basket route read and organizer guard; absence of explicit If-Match and strong app ETag route logic; client CAS gate and strong ETag reject, client If-Match; preclone authenticated:false; Undo raw JSON.parse outside local handling; mutation access policy write guard. These are SOURCE TEXT MATCHES ONLY, not an executed app test suite. Runtime tests NOT EXECUTED.

## WAVE4_HANDOFF

AGENT: A30 Security Coordination.
TASK: W4 critical authorization and access control paths.
STATUS: DONE narrowly scoped source triage; integration security readiness PARTIAL; no automated GO.
BASE SHA: f8502adf670ad65399cb21ae31c0f03d63c6a7b3.
HEAD SHA: see immutable GitHub report publication receipt.
CHANGED FILES: this report + .sha256; NO CODE CHANGES.
TESTS: 10/10 static source-pattern checks MATCH, application tests NOT TESTED.
PR/LINK: isolated docs branch, no code PR, immutable report link in GitHub issue handoff.
KNOWN ISSUES: SEC-W4-01 CAS server contract; SEC-W4-02 Undo malformed history; SEC-W4-03 intentional Backup issuer/write trust gate.
CONFLICTS: A40 #101 overlaps #100/#104 source files, A110 owns #63, A70 owns #119 and legacy router, A30 touched none.
NEXT STEP: A00 assign backend CAS server owner and import trust decision, A50 implement authorized contract if assigned, A70 reproduce corrupt JSON handling, A60 independent QA, A10/A40 reconcile C02 conflict lineage.

No Docker, SQL, PostgreSQL, production migrations, protected merge, live Replit sync, deploy or release permission has been issued.
