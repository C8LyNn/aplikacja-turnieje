# WEB-005 — A60 R17 HANDOFF → A00

**TASK / ROLE / MODE:** `WEB-005-T130-A60-R17` / Independent QA & Release Gates / STRICT READ-ONLY application, documentation publication only.  
**CONTROL:** `WEB-005_WAVE_R17_AGENT_PROMPTS.md` Git blob `c2dd8c1e2e2e3b5e245db61877da99f59c77a0ff`. **RELEASE:** `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.  
**STATUS:** `REPORT_PUBLISHED / R16_ARTIFACTS_UNAVAILABLE / R17_P08_SOURCE_ACCEPTED_CONDITIONAL / P09_P20_P21_FULL_SCOPE_BLOCKED / RELEASE_NO_GO / SWARM006_HOLD`.

## Direct GitHub deliverables

- [Independent R17 exact-SHA QA report](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R17_INDEPENDENT_QA.md)
- [Machine-readable 21-row R17 matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R17_PACKAGE_MATRIX.json)
- [Original signed A60 R15 report](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R15_INDEPENDENT_QA.md)
- [A50 R15 physical test/executor receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R15_RECEIPT.md)

## R16 recovery

No original A60-authored R16 run, report or artifact could be verified in the available A60 thread/library/GitHub. This is `R16_ARTIFACTS_UNAVAILABLE`, **not** retrospective PASS. Separate A70/A90/A100 R17 commits appeared during this audit and were independently reviewed on new HEADs below.

## Independent R17 live SHA and verdict summary

All 21 PR #34–54 remain OPEN DRAFT/unmerged; same release baseline. The initial R17 snapshot was superseded by **R17 test-first/source commits** in PR41/42/53. Original R16 A60 artifacts remain unavailable; do not retroactively label R17 commits as R16 results. 17 prior narrow source acceptances remained unchanged, P08 gains conditional source acceptance, and **three full source blockers P09/P20/P21 remain**.

| Packet / PR | Exact latest inspected R17 HEAD | Independent full-claim verdict | Owner |
|---|---|---|---|
| P08 / [#41](https://github.com/C8LyNn/aplikacja-turnieje/pull/41) | `f03cf3d09988a04ba9c2856e205d21f994ff67f1` | **SOURCE_ACCEPTED_CONDITIONAL**: QPE 1-based per-basket positions and route receipt non-null parity now coded; explicit null still legal. PG16 NOT_EXECUTED. | A90 L1 |
| P09 / [#42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42) | `25b09f1a48a85ae882b817118f5d8c23bffbe383` | **SOURCE_BLOCKED**: roster X/Y global LIFO PG tests authored; final production `undoTournamentRosterAction` no longer rechecks tournament-global latest after lock. | A70 L2 |
| P20 / [#53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53) | `8f959733258aed0cab15298dd0684ca068045e6f` | **SOURCE_ACCEPTED scoped / SOURCE_BLOCKED full privacy**: bans tuple fixed, match picks evicted with canonical cached match→tournament ownership, fixture fixed; no cached match list leaves unowned picks untouched. React NOT_EXECUTED. | A100 L3 + A30 policy peer |
| P21 / [#54](https://github.com/C8LyNn/aplikacja-turnieje/pull/54) | `dbba0eb82920b4f324866b1b983e1211459f52ec` | **SOURCE_BLOCKED_UI_SCOPE**: historical RR 401/403 still suppresses lawful DE/Overview; A120 oracle, no R17 code GO. | A120 |

**Only author-defined tests, NOT executed application PASS.** The [full A60 report](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R17_INDEPENDENT_QA.md) and [21-row machine matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R17_PACKAGE_MATRIX.json) carry exact source/evidence details.

## Actual execution and owner action

**A60 R17:** GitHub read-only source/CI/diff verification and publication, no app tests; commands/exit for app tests: `NOT_EXECUTED`. **A50:** no verified new native application TAP for current SHA; R15 report documents zero executed app tests and missing full checkout/pnpm/disposable PG16. Prior pure Node PR40 contract 24/24 PASS is scoped only, not full application validation.

A00 must provide an authorized exact per-PR clean checkout/Node22/pnpm10 executor and separately physically isolated PG16 `TEST_DATABASE_URL` plus `tm_test_*` with approved reset boundaries. A90 R17 source patch is conditionally accepted pending PG16; A70 must reinstate global roster latest-LIFO recheck after adding tests; A100/A30 must address or explicitly disposition unknown-owner picks residual and provide RTL. Only own preauthorized lane scope. A60 re-signs only on the new SHA, not their descriptions. A120 provides read-only mixed RR403/DE browser oracle; R17 **no fourth code GO**. A00/HQ still owns POLICY_OPEN product decisions and original WEB004 38-case disposition (0 PASS, 3 external CI FAIL, 33 BLOCKED, 2 NOT RUN historical).

**STOP:** no A60 code edit, merge/rebase/cherry-pick, new PR, unsafe DB, paid CI, staging/deploy or SWARM006 activation.  
**FINAL:** `WEB005_IN_PROGRESS / RELEASE_NO_GO / SWARM006_HOLD`.
