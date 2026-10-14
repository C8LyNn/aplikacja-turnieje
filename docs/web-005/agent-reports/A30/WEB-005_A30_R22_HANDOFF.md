# WEB-005 — A30 R22 HANDOFF to coordinator A00

**Agent:** A30 — Security Implementation / independent security peer, **not** A60 release QA.  
**Task:** `WEB-005-T030-T031-A30-R22` · **Mode:** READ-ONLY application + own documentation only.  
**Control:** [WAVE R22.1](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R22_AGENT_PROMPTS.md) blob `f616bca63a441bc2a4eead64ff67586e57e2b6ca` §§0–§2 and AGENT A30.  
**Release baseline:** `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.  
**Full published security review:** [WEB-005_A30_R22_BACKUP_SECURITY_PEER.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/08142aea11ab3711329285f67d6526558da1d3fd/docs/web-005/agent-reports/A30/WEB-005_A30_R22_BACKUP_SECURITY_PEER.md), committed `08142aea11ab3711329285f67d6526558da1d3fd`, section 6 reviews actual new PR56.  
**Direct comment to source author A90:** [PR #56 #issuecomment-6179723949](https://github.com/C8LyNn/aplikacja-turnieje/pull/56#issuecomment-6179723949).

## Exact new PR and previous security candidates

| Candidate | Exact verified HEAD | QA / authorization at this review |
|---|---|---|
| **R22 L2 [PR #56](https://github.com/C8LyNn/aplikacja-turnieje/pull/56)** | `77707092202ca79277de7bc57cc4e37e4c033171` | **OPEN/DRAFT/UNMERGED**, 3 commits above release, **2 new files**: `artifacts/api-server/src/application/backups/backup-v3-strict-policy.ts` blob `c663c3d8347f22caf9375ae48a6f7670a6629d34`, and `artifacts/api-server/test/backup-v3-strict-policy.test.ts` blob `fdd1f5a7efc95f87ef4fcf38eb0393563bf56adc`. **A30 peer: SOURCE_REVIEWED_CONDITIONAL**; not import-wired and not signed by A60 R22 yet. |
| P08 [PR #41](https://github.com/C8LyNn/aplikacja-turnieje/pull/41) | `f03cf3d09988a04ba9c2856e205d21f994ff67f1` | Existing QP/QPE/OP flow validation, inherited **A60 SOURCE_ACCEPTED_CONDITIONAL**, physical PG16 NOT_EXECUTED; no new A30 code. |
| P15 [PR #48](https://github.com/C8LyNn/aplikacja-turnieje/pull/48) | `2a8a4c72cb4a3a37402a346fd0acc83b03b39be3` | Existing B3A export snapshot candidate; not proof of portable strict revision or restore. |
| P03 [PR #34](https://github.com/C8LyNn/aplikacja-turnieje/pull/34) | `fae2eea2f22df3f1b02ad035a7db00bc411ea73f` | Steam three-write guard source conditional; absent-secret 403/503 owner policy still OPEN. |
| P20 [PR #53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53) | `d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34` | A60 scoped source acceptance for verified-owner cache; old ownerless raw retention policy OPEN; no observed production UI leak. |

All exact PRs above remain based on release; none merged. **A60 R21** [independent QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R21_OWNER_SIGNOFF_INDEPENDENT_QA.md), blob `47dc44f980734ce68dd63769ba3f25ad60dc899f`, said `HANDOFF_NOT_READY` for old candidates and **cannot accept PR56 before its own exact-SHA review**.

## Findings / exact A90 follow-up

**Positive scope:** new pure strict-profile module explicitly classifies missing marker as `UNATTESTED`; strict entrypoint rejects unmarked/invalid profile and checks new match revision, latest-result-history parity, typed action order, nested globally known player/match IDs. **8 authored unit `test()` cases, NOT_EXECUTED**. It is deliberately NOT_WIRED to importer, exporter, API/Zod or DB.

**A30 source gap P1:** module checks recognized nested Undo `matchId` against existence anywhere in exported match IDs, **not** against the same action's top-level `matchBackupId`/stage. Required A90 fail-first fixture: action on match 21 with nested `undoPayload.matchId=22` where both matches are valid export IDs, and matching state revisions, must **reject**. Similarly verify stage-local winner/player IDs only where semantics demand; `prevFeaturedMatchId` may legally be tournament-global. **Source-confirmed missing cross-action check, no exploit/PG mutation demonstrated.**

**Additional format check:** strict completed BYE/walkover/no_contest may have system-origin actions rather than `match_result_submitted`. Source currently requires a currently active typed submission for all completed matches; A70/A90/A60 must establish valid system-action provenance/exception and a positive fixture before broad strict certification.

**Future integration STOP:** baseline `backup-v3.ts` remaps missing known IDs by `map.get(oldId) ?? oldId`; this risk is not removed from live importer by the isolated pure module. `ImportTournamentBody` generated Zod schema lacks strict marker, so future separately GO-authorized raw marker preservation and **positive legacy provenance recognition** are mandatory. Modern stripped-marker objects cannot silently enter legacy. Current importer creates a new clone with new credentials and protects export via organizer; no proven production cross-tenant exploit or bypass. Do not claim `HTTP 400`, zero DB mutation, rollback or safe legacy import from unit-source alone.

## Actual execution / owner / final gate

- **A30 R22 app source/test file modifications:** **0**. Only own `docs/web-005/agent-reports/A30` receipts and PR56 comment. **No additional security implementation PR by A30.**
- **A30 actual native application tests:** **0 / NOT_EXECUTED**, no command/exit/TAP; source/API metadata review only. A90 PR56 explicitly labels eight authored unit tests **NOT_EXECUTED** due missing connected frozen pnpm checkout; **not 8 PASS**. [PR56 Actions 38646256645](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38646256645): locked install PASS, SE safety unit PASS, inherited Pack19 FAIL, later gates SKIPPED — no isolated strict-policy unit test acceptance.
- **Owner decisions already settled (do not re-ask):** Backup B1=A and delegated B2=B/B3–B6=A, S1–S6 Swiss/SE/DE, T055 D1–D6; these product choices **do not** authorize import wiring or DB changes. **Still OPEN:** Steam 403/503, session TTL/digest/rotation, PR53 ownerless raw-cache disposition, MP2B, original WEB004 case provenance and signed dispositions.
- **A60 R22 new SHA** exact independent review of PR56 required; report not verified at A30 source checkpoint. **A00 future action:** register PR56 as new `R22_NEW_SOURCE_CANDIDATE`, obtain A90 test-first action/stage fixture and system BYE positive contract, A60 independent QA. Request separate future exact-file GO for strict marker transport/legacy recognition/import hook, with A20 physical isolated PG16 preflight and later actual A50 tests.
- **STOP:** no A30 code edits, PR merge/rebase/cherry-pick, production/shared DB migrations, paid CI rerun, deployment, Replit integration, or SWARM-006 dispatch. `HANDOFF_NOT_READY / RELEASE_NO_GO / SWARM006_HOLD`.

**A30 signed R22 terminal:** `SECURITY_PEER_PUBLISHED / PR56_NEW_SHA_REVIEWED_CONDITIONAL / ACTION_LOCAL_ID_GAP / STRICT_ENTRYPOINT_DOWNGRADE_FAIL_CLOSED / LIVE_IMPORT_NOT_WIRED / TESTS_NOT_EXECUTED / A60_R22_PENDING / RELEASE_NO_GO / SWARM006_HOLD`.
