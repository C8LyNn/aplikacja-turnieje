# WEB-005 / DECISIONS

**Owner:** 00 — Implementation Lead; **date:** 2026-10-14. Decisions apply to the pinned baseline and may be revised explicitly after verified changes.

| ID | Decision | State | Rationale and revisit condition |
|---|---|---|---|
| D001 | Replit FROZEN; no production calls/changes | ENFORCED | User instruction; no Replit tools, production DB/runtime/secrets, paid operations |
| D002 | PR #32 must not be merged/deployed | STOP | Open; 856 files; 2 historical CI failures; incomplete regression/migration/auth |
| D003 | T010 source-contract correction | GO CONDITIONAL | Pin SHA, minimal test diff, preserve `repeatable read` + `accessMode: read only`, independent A60 QA |
| D004 | T020 source/ledger/manifest investigation | GO | No SQL execution on production |
| D005 | T020 migration files or SQL execution | STOP UNTIL PLAN | Competing ordinals 0030/0031 and unknown migration ledger; require 00 approval and isolated DB |
| D006 | T030 catalog write-route code hardening | GO CONDITIONAL | 3 mutating routes lack guard on release; use isolated tests; no production token operations |
| D007 | T130 A60 QA preflight + review | GO | Cannot implement what it independently reviews |
| D008 | T040 lifecycle/undo | HOLD | Prior PR #7 and stacked #27 OPEN/draft; reconcile first |
| D009 | Full release gate, PR #32 certification | STOP | Pack19 historical FAILURE; Pack20–26 and Pack17 SKIPPED; manual/staging QA pending |
| D010 | Production deployment, merge, runtime secret changes | OWNER/HQ APPROVAL REQUIRED | Explicit external decision after gates and Replit unfreeze |
| D011 | WEB-004 handoff completeness | BLOCKED / B001 | Exact consolidated document not found; maintain provisional scope |
| D012 | Four branches task/control created | COMPLETED | Readback required: all branch tips equal pinned release SHA before source edits |
| D013 | Central registers on coordinator-only task branch | GO | Keep all non-implementation documents at `docs/web-005/` on `chore/web-005/t000-wave1-control`; no update to main/release |

## CI provenance

- [Actions push 38407345710](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38407345710): historical FAILURE, HEAD `1fdc401d...`.
- [Actions PR 38407744200](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38407744200): historical FAILURE, Pack19 test expected literal `readOnly:true`; implementation uses `accessMode:"read only"`.
- These are not new tests. No CI rerun approved (avoid unexpected costs).

## Evidence boundaries

- Confirmed through read-only GitHub connector: refs/PR metadata, code, workflow and logs, release/editor migration paths and catalog auth divergence.
- No production/staging runtime or database checked. Repository refs do not prove the deployed version.
- No release merge, deployments, expensive CI re-runs, secrets read/write, or production mutations authorized.
- The three implementation branches are empty from the pinned baseline as of branch creation; task execution awaits their corresponding agent runs.