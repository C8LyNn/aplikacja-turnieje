# WEB-005 / BACKLOG

**Owner:** 00 — Implementation Lead (local coordinator; subordinate to global HQ Queen)  
**Updated:** 2026-10-14  
**Execution:** WAVE 1 — task branches created, implementation/test execution NOT YET VERIFIED  
**Single source of truth:** this file + DECISIONS.md on `chore/web-005/t000-wave1-control` only. No automatic merge/deployment.

## Verified immutable references

- `main`: `c50cc48e6fa508592bda3f4838111e9cff5af80c`
- `release/tournament-ops-20261013-01`: `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`
- `codex/game-catalog-editor-reliability`: `28da3ef94f3b30f90c1b3b70a88ab7f61462d99c`
- [PR #32](https://github.com/C8LyNn/aplikacja-turnieje/pull/32): OPEN, unmerged; 856 changed files / 51 commits at verification.
- Production deployed SHA/DB migration history: **UNKNOWN**; no Replit inspection authorized.
- Full `WEB-004_TO_WEB-005_HANDOFF_R1_2026-10-14.md`: **NOT FOUND** (B001); this backlog is provisional.

## Wave 1 ownership (task is not proof of agent execution)

| Task / owner | Source scope | Exclusive task branch | State / authority | Acceptance evidence |
|---|---|---|---|---|
| T010 / 10 — A10 | `qa/pack19/source-contract.test.mjs`, readiness transaction contract + workflow QA | `fix/web-005/t010-pack19-contract` | READY / minimal code fix GO conditional | fail-before/pass-after, source/route semantics, Pack19–26, full gates as available, independent A60 |
| T020 / 20 — A10 | `lib/db/migrations/` and migration runner/ledger research | `fix/web-005/t020-migration-reconciliation` | READY / ANALYSIS ONLY; SQL changes STOP pending 00 plan approval | unique manifest, upgrade matrix, recovery plan, isolated PostgreSQL16 test design, A60 |
| T030 / 30 — A10 | `artifacts/api-server/src/routes/steam-game-catalog.ts` + narrowly required catalog access guard/tests | `fix/web-005/t030-steam-catalog-write-auth` | READY / code-only hardening GO conditional | three mutators denied for unauthorized actors, authorized catalog-admin preserved, tests/zero side effects, A60 |
| T130 / 60 — A60 | review all three task diffs, CI/DB/security regression matrix | no implementation branch | READY / independent QA GO | commit-pinned independent verdict with exact tests and evidence |

**State meaning:** READY means authorization and branch prepared. **No worker completion or new tests are asserted.**

## Deferred work

| Task | Priority | Topic | Status / dependency |
|---|---|---|---|
| T040 | P0 | Match lifecycle / Undo / cancellation | BACKLOG; reconcile PR #7 then stacked PR #27, dependent on wave 1 |
| T050 | P0/P1 | SE/DE, brackets, BYE, groups/baskets routing | BACKLOG; wave 1 dependency |
| T060 | P0/P1 | Backup V3 / correction journal / restore | BACKLOG; migration strategy first |
| T070 | P1 | Backend / API contracts | BACKLOG |
| T080 | P1 | Privacy / sessions | BACKLOG |
| T090 | P1 | Host / scoring / queue | BACKLOG |
| T100 | P1/P2 | Standings / winners / projector | BACKLOG |
| T110 | P2 | UX / polling / accessibility | BACKLOG |
| T120 | P1 | Version / deployment readiness | BACKLOG; deployment requires owner permission |

## Wave gates and status vocabulary

- Wave 1: T010 + T020 + T030 with T130 A60 in parallel; max 3 active implementations + 1 independent QA lane.
- Wave 2 T040/T050/T060: HOLD until dependency and plan review; release remains NO MERGE / NO DEPLOY.
- `SOURCE` (inspected code), `HISTORICAL_CI` (old actual jobs), `TESTED` (new executed tests), `STAGING`, `PRODUCTION_VERIFIED` are distinct.
- `PASS | FAIL | BLOCKED | NOT_EXECUTED` must include commit SHA, command, fixture, exit code, expected/actual.
- Lifecycle: `BACKLOG → READY → IN_PROGRESS → IMPLEMENTED → QA_REVIEW → PR_READY → ACCEPTED → ARCHIVED`; `MERGED`, `DEPLOYED` are separate states.

## Blockers

- **B001** Full WEB-004 handoff unavailable; current scope based on blueprint and selected original audit state files.
- **B002** PR32 CI blocked in Pack19; later steps in known runs SKIPPED.
- **B003** Release/editor 0030/0031 migration collision; database execution ledger UNKNOWN.
- **B004** Catalog-admin secret activation requires owner approval. Code guard must fail closed.
- **B005** Production deployed SHA and DB schema UNKNOWN; Replit frozen.
- **B006** Independent green QA + staging/manual release readiness not demonstrated.
- **B007** `main`, release, editor and newly-created branches not protected; no branch rules changed.

## Next intake contract

Each worker returns `TASK`, `BASE_SHA`, `HEAD_SHA`, `BRANCH`, `FILES_CHANGED`, `TESTS_RUN` (command+exit), `TESTS_NOT_RUN`, `PR`, `SECURITY/REGRESSION_RISK`, `ROLLBACK`, `NEXT_OWNER`, `READY_FOR_ARCHIVE`.
Coordinator 00 updates this register **only after real GitHub readback or a substantiated worker HANDOFF**, and obtains independent A60 review before ACCEPTED.