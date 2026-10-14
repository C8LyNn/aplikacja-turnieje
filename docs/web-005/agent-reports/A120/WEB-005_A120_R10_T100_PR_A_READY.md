# WEB-005 A120 R10 — T100 PR-A PATCH-READY QA CONTRACT
**Task:** WEB-005-T100-A120-R3 | **Mode:** SOURCE-ONLY | **Status:** DOCUMENTATION READY / CODE HOLD / RELEASE NO-GO | **Date:** 2026-10-14.

## Exact baseline, no implicit GO
Repository C8LyNn/aplikacja-turnieje. Release release/tournament-ops-20261013-01 @ 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7; main @ c50cc48e6fa508592bda3f4838111e9cff5af80c. PR32 OPEN/unmerged. PR41 @ e847cb705296a48ab5c68ece96776cd0e0bbb417 OPEN DRAFT; PR42 @ 1ae0ccb801f4177052bff1ec7041e55b8c992c8b OPEN DRAFT. R10 central prompt blob 68cc912f15d158a55e8c80cb5ed823dc20337bfd; prior R9 QA plan blob f9972e5dbb1d01bb95d897053039b35871bf1beb. Deployed/composite SHA unknown. R10 live code lanes: A100/L1, A80/L2, A110/L3. A120 has NO CODE GO.

## Finding → source/expected/negative contract
| Finding | Source actual on release | Expected future PR-A; negative control | Classification |
|---|---|---|---|
| F052 DE Details | src/components/stage-progress-view.tsx:169–271 lacks DE render branch; src/pages/tournament-bracket.tsx:84–103,304–309 already has dedicated DE endpoint/renderer. | Selected DE stage21 requests GET /api/tournaments/9001/stages/21/double-elimination; shows Upper, Lower, Grand Final (+Reset when present), loading/error/Retry. Read-only even for organizer, no score inputs/writes. No RR20 bleed or generic synthesized DE. | SOURCE_CONFIRMED; runtime NOT_EXECUTED |
| F053 stage-format | src/pages/tournament-bracket.tsx:30–34 and pages/tournament-audience.tsx:52–56 have incomplete three-format maps; canonical src/lib/tournament-stages-ui.ts:43–49 defines five. | Reuse STAGE_FORMAT_LABELS for SE, Swiss, RR, group, DE. Bracket label derives stage.format; terminal Audience badge translates its actual tournament.format. Mixed compat RR + DE stage must show stage DE on Bracket; preserve Marvel special label; never change tournament-format compatibility semantics. | SOURCE_CONFIRMED; runtime NOT_EXECUTED; compat POLICY_OPEN |
| F055 final overlay | pages/tournament-audience.tsx:234–241,446–574 puts heroMatch before tournament completed state. | Authoritative completed status displays final summary regardless of retained featuredMatchId=901, winnerId=202 instead of standings leader 201; active state retains match hero, no backend clearing of featured match. Preserve viewer gate and load/error. | SOURCE_CONFIRMED; runtime NOT_EXECUTED |
| F054 retention | PR32 source uses tournament.winnerId ID match (audience.tsx:230–233), existing test tournament-audience.test.tsx:164–185. | Rerun existing winner-vs-global-standings regression after future PR-A. NO duplicate fix; winner 202 must remain even if rankings leader=201. | PATCH_PROPOSED in PR32; retest NOT_EXECUTED |

## Separate future PR-B, not PR-A
F058: stage-progress-view.tsx:52–80 uses Stage Details read query without automatic external-change refresh. Missing trigger SOURCE_CONFIRMED; visible stale ranking after external reopen STATIC_INFERRED/NOT_REPRODUCED. Backend Stage Details participants/status/finalRank/stageSeed are authoritative (api-server/src/application/stages/stage-queries.ts:46–125); organizer ParticipantTable uses stage-specific matches, not tournament-wide standings. PR-B waits for A70/T040 Cancel/Revert and A80/T050 legal RR reopen/readback, plus A100 privacy boundary. No frontend-created ranking/tiebreak/winner/stage status or invented freshness SLA.

## Future PR-A strict file scope and ownership (not edited in R10)
1. artifacts/tournament-manager/src/components/stage-progress-view.tsx: top-level generated DE hook keyed by selected tournamentId/stageId, enabled only for existing nonplanned DE stage, ReadQueryState loading/error/retry and DoubleEliminationBracket in read-only mode (canManage=false). Never put React hooks in conditional render.
2. artifacts/tournament-manager/src/pages/tournament-bracket.tsx: single import/reuse canonical five-format mapping, publicStage.format authority.
3. artifacts/tournament-manager/src/pages/tournament-audience.tsx: completed-first LIVE render; shared labels; keep winnerId lookup and private gate.
4. Narrow test files: new src/components/stage-progress-view.test.tsx, existing src/pages/public-stage-views.test.tsx and src/pages/tournament-audience.test.tsx, optional lib label test. No API/DB/OpenAPI/generated client/lockfile edits. Future PR-B touches stage-progress-view.tsx as well: run sequentially after PR-A. Current R10 file owner gates remain in force.

## 9 isolated fixture families
DE-DETAILS-21 (9001, RR20 completed, DE21 active, graph revision4 Upper/Lower/GF/Reset); DE-ERROR-21 (DE GET deferred→500 or 403→Retry 200); DE-SWITCH-21 (old RR20 request resolves after selection of DE21); LABEL-MIXED (compat tournament RR vs selected DE stage); FINAL-FEATURED (9002 completed winnerId202 featured901 standings leader201); ACTIVE-FEATURED (same tournament active); RR-REOPEN-4 (9003 stage31 completed→active ONLY after signed backend readback, rejection409 remains unchanged); RR-8TO4-4 (SE8 Stage40→RR4 Stage41 only 401–404; exclude 405–408); RR-DELAY-4 (new stages/matches before delayed or failed Stage Details, then recovered GET). Full synthetic R9 JSON is template, not schema-complete; R10 fixture index in adjacent JSON reconstructs routes. All data fake, no credentials or production GETs.

## React Testing Library matrix — 10 planned, 0 executed
| ID | Fixture / action | Deterministic expected result | Future PR |
|---|---|---|---|
| RT-T100-01 | DE-DETAILS-21 / Details tab | Dedicated stage21 GET; Upper/Lower/GF/Reset, read-only, no writes | A |
| RT-T100-02 | DE-SWITCH-21 / deferred RR20 | Stage21 only, no RR20 players | A |
| RT-T100-03 | DE-ERROR-21 / deferred→error→retry | Visible loading/error/retry/recovered graph; 403 no exposure | A |
| RT-T100-04 | LABEL-MIXED / Bracket | Podwójna eliminacja stage, not raw enum or tournament RR | A |
| RT-T100-05 | FINAL-FEATURED / completed | Champion202 overlay, not hero901 or leader201 | A |
| RT-T100-06 | ACTIVE-FEATURED | Existing featured hero retained; no premature final overlay | A |
| RT-T100-07 | FINAL-FEATURED / existing winner regression | winnerId202 by ID before/after refetch; retention only | A |
| RT-T100-08 | RR-REOPEN-4 & RR-8TO4-4 | Reopened stage after legal backend: fresh rank/status, correct 401–404 roster; rejection409 no client reopen | B BLOCKED |
| RT-T100-09 | RR-DELAY-4 | Cached rank never marked newly confirmed; visible failure/retry and eventual correct details | B BLOCKED |
| RT-T100-10 | LABEL-MIXED + five known formats | All localized, stage/tournament label semantics distinct | A |
Exactly 10 contracts (8 A including preexisting retention; 2 B). No test-run PASS claimed; implementers record actual parameterized test count.

## Browser matrix — 4 planned, 0 executed
| ID | Isolated scenario | Expected evidence / gate |
|---|---|---|
| BR-T100-01 | DE Details→Bracket, Projector, Audience; DE-DETAILS-21/LABEL-MIXED | Same DE21 stage/revision/Upper-Lower-GF, screenshots+GET trace; PR-A |
| BR-T100-02 | RR-REOPEN-4/RR-8TO4-4 using signed mock or A50-approved isolated PG16 | Success: active stage, fresh rows; rejection409: no write and unchanged UI; PR-B BLOCKED |
| BR-T100-03 | FINAL-FEATURED ↔ ACTIVE-FEATURED Audience LIVE | Completed winner202 overlay; active featured hero, network trace/screenshots; PR-A |
| BR-T100-04 | DE-SWITCH-21 & RR-DELAY-4, late responses/error/retry | No stale-stage leak; DE half PR-A, RR half PR-B BLOCKED |
Do not invent browser SLA; isolate auth/QueryClient and synthetic fetch barriers; real private 401/403 cache policy belongs to A100/T080.

## A50 execution + A60 independent QA contract (PROPOSED, NOT RUN)
After A00 grants future code GO on a fresh release base and creates exact draft PR head, A50 confirms Node22, pnpm10, lockfile and sandbox. From repo root: git rev-parse HEAD; node --version; pnpm --version; pnpm --filter @workspace/tournament-manager test; pnpm --filter @workspace/tournament-manager typecheck; pnpm --filter @workspace/tournament-manager build. FE runner uses Node node:test + tsx + test/setup-dom.mjs under artifacts/tournament-manager; for targeted command set TSX_TSCONFIG_PATH correctly. Store per ID: fixture_id, exact SHA, environment, command, exit_code, expected/actual, request phase trace, screenshot/log. A60 reviews exact SHA independently. No paid CI, shared/production DB or live deployment.

## GO request, not a grant
GO for document/fixture handoff only, frontend code HOLD. A00 can authorize one small future T100-A lane only AFTER L1/L2/L3 formally frees a slot: F053+F052+F055, F054 retention, three source files plus narrow tests, draft PR only; then A50/A60 evidence. T100-B must get a separate later GO after A70/T040+A80/T050 signed semantics and follows PR-A serially. NO MERGE, NO PROD, NO SWARM-006.