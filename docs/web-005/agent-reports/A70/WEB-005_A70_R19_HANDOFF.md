# WEB-005 — A70 R19 FINAL HANDOFF → A00

**Agent:** A70 — Match Lifecycle & Undo  
**Task:** WEB-005-T040-A70-R19, 2026-10-14 Europe/Warsaw  
**Mode:** SOURCE ONLY — PR42 frozen, no new code GO, no merge, no SWARM-006 dispatch.  
**Coordinator:** WEB-005 A00 under global HQ/Queen.  
**Control:** `docs/web-005/WEB-005_WAVE_R19_AGENT_PROMPTS.md` R19.1 §§0–2 and AGENT A70.  
**Release:** `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.  
**Report source:** `docs/web-005/agent-reports/A70/WEB-005_A70_R19_HANDOFF.md` on `chore/web-005/t000-wave1-control`.  
**Owner-signable detailed document:** [WEB-005_A70_R19_REVERT_POLICY_QA.md](../../WEB-005_A70_R19_REVERT_POLICY_QA.md).  
**Status:** `PR42_SOURCE_ACCEPTED_CONDITIONAL / PG16_NOT_EXECUTED / MP2B_POLICY_OPEN / RELEASE_NO_GO / SWARM006_HOLD`.

## 1. PR source freeze, verified R19

| Package | Old R18 HEAD = new R19 HEAD | State |
|---|---|---|
| [P09 PR42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42) roster/global Undo LIFO | **021bed269f9ea8ac8ce53caeea44263c098aa2dd** = **same** | OPEN DRAFT, UNMERGED, A60 R18 SOURCE_ACCEPTED_CONDITIONAL |
| [P06 PR39](https://github.com/C8LyNn/aplikacja-turnieje/pull/39) Cancel/Restore | 16053ee132756ca05b6f2cd1f0cabae823905387 | OPEN DRAFT, separate package |
| [P18 PR51](https://github.com/C8LyNn/aplikacja-turnieje/pull/51) malformed historical Undo | 2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a | OPEN DRAFT, separate package |

Current PR42 source blobs unchanged:
- `artifacts/api-server/src/application/players/tournament-roster.ts` = `b47bc6e1452173fbc65b236909efe01aebf76116` (R18 +21/-1 vs R17).
- `artifacts/api-server/src/routes/tournaments.ts` = `6d9608104700bd0619754e362bc30d5af053bd0b` (R18 +1/-1).
- `artifacts/api-server/test/revert-match.integration.test.ts` = `3479ab5fe888416858346f82691d4c57f369df25` (four R17 roster regression case definitions, unchanged).

**No R19 application source edits, no new PR, no cherry-pick.** PR39/42/44/46/51 independently edit `routes/tournaments.ts`; PR42/51 independently edit `revert-match.integration.test.ts`. Future authorized SWARM-006 integrator handles conflict reconciliation only after final transfer permission, never A70 R19. P20/PR53 and P21/PR54 are **other agents' active R19 lanes**; their initial R19 HEAD is not promised to remain stable.

## 2. Independent exact-SHA QA and actual tests

**Independent signed review:** [A60 R18](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_INDEPENDENT_QA.md) assessed PR42 at exactly `021bed269f9ea8ac8ce53caeea44263c098aa2dd` as **SOURCE_ACCEPTED_CONDITIONAL**: same-transaction roster global latest Undo check, locked tournament and candidate, typed 409. The [independent handoff gate](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_FINAL_HANDOFF_READINESS.md) = **NOT_READY** (source blocker elsewhere, owner dispositions/38 rows, native tests, policy).

**Real A50 [R18 receipt](../A50/WEB-005_A50_R18_RECEIPT.md):** physically trusted complete checkout/pnpm and isolated PG16 unavailable, **0 actual native app tests**. A70 R19 executed **NO application commands**. Thus:
- Node/pnpm typecheck: **NOT_EXECUTED**; exit status **N/A**.
- API HTTP/test-runner: **NOT_EXECUTED**; TAP pass/fail/skip **N/A**.
- PostgreSQL16 integration / before-after snapshots: **NOT_EXECUTED**.
- New PR42 exact SHA Actions: 0 matched at intake; GitHub PR review submissions: 0, although A60 primary document independently exists.

**A50 next execution after owner/A20 physical isolation/consent:** full clean checkout `021bed269f9ea8ac8ce53caeea44263c098aa2dd`, Node22/pnpm10 locked deps, dedicated physically isolated PostgreSQL16 TEST_DATABASE_URL (never prod/shared), `TEST_DATABASE_SCHEMA=tm_test_t040_r19_roster`, owner-approved `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA`. Only then:
~~~sh
pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/revert-match.integration.test.ts
~~~
Record exact git SHA, two real exits, TAP counts, PG fingerprint excluding credentials, and SQL before/after of draft tournament/players/action_log/matches/result_history/stages/stage_participants/game-picks.

**Four authored PR42 roster cases:** queued X `delete_player` stale behind B, B commits newer Y → X 409 UNDO_ACTION_CHANGED and post-Y zero-write; queued X `restore_player` same; valid latest delete and valid latest restore → 200 once, no duplicate. Also check current Y's lawful Undo 200 after rejected X and preexisting generic `restore_status` / completion `revert_match` global LIFO 409/200. A proposed B-ROLLBACK/no-Y control is NOT already authored or run. Avoid treating authored cases/static checks as PASS.

**One concrete owner unblocker:** A00 connects an authorized trusted per-SHA test executor with complete repo, Node22/pnpm10/frozen deps; A20+owner separately approve an actual physically isolated PG16 database and explicit scoped test-schema reset. Alternatively, a signed runtime-debt exception is only conceivable **after** all source/policy/38-case closeout gates, and does not authorize staging/live.

## 3. Public Direct Revert CAS + Host — unsigned signable MP2B choice

**SOURCE_CONFIRMED:** public POST `/matches/:id/revert` still forwards no CAS request body despite domain optional `expectedMatchRevision` and `expectedCompletionActionId` checks. OpenAPI, generated backend Zod and React client plus Host do not provide this token-pair contract. General action-log GET is latest-50 only and cannot provide authoritative old active completion ID.

**Signable policy packet:** [WEB-005_A70_R19_REVERT_POLICY_QA.md](../../WEB-005_A70_R19_REVERT_POLICY_QA.md) §3 / decision `WEB-005-T040-MP2B-DECISION-R19`.

Three explicit owner options: **A** strict dual CAS synchronized API+Host cutover, old tabs refresh; **B** strict new path plus explicitly versioned/gated short-lived legacy Host bridge with named sunset/risk; **C** DEFER with no new code GO. **A70 SELECTED NONE.** Proposed shared contract missing/invalid typed body 422 `INVALID_REVERT_PRECONDITION`; stale revision 409 `CONCURRENT_MODIFICATION`; stale completion ID 409 `UNDO_ACTION_CHANGED`; all rejects zero-write; success once; authorized revision-linked `activeCompletionActionId` read beyond last 50; no silent Host retry; internal T050 correction receipts unaffected. Invalid raw JSON 400 vs 422, one canonical external field name, precedence, read-model endpoint/roles and rollout choice require owner signature.

**OWNER/HQ signatures verified in central decisions for MP2B:** **NONE**. Hence `POLICY_OPEN`; this document neither sets policy nor authorizes code. A future Direct Revert patch requires **separate** task/code GO and exclusive `routes/tournaments.ts` file ownership against #39/#42/#44/#46/#51.

## 4. Coordinator 00 next actions and STOP

1. **P09 runtime:** assign actual A50 physically safe exact-PR42 PG16 execution or record `ENV_BLOCKED`, obtain A60 assessment of real receipt.
2. **T040 MP2B policy:** route R19 binary A/B (or explicit DEFER C) form to named HQ/owner for signature; decide wire field names, invalid-body error and legacy Host cutoff, version-linked completion ID read authorization. No self-approval.
3. **Whole backlog:** A00/A10/A60 reconcile current 21 PR head manifest, other agents' P20/P21 R19 changes, the original WEB-004 38-case per-finding **owner-approved** disposition and all remaining policy signatures. A60 R18 `HANDOFF_NOT_READY` stands until independent new evidence.
4. **Handoff:** no automatic final transfer. Separate named owner/HQ `FINAL_HANDOFF_GO` (and, if applicable, separate `HANDOFF_WITH_RUNTIME_TEST_DEBT` waiver) required after source/policy/38-case gates. Composite QA remains SWARM-006 release STOP until actually executed and accepted.

**STOP obeyed:** no code changes PR42, no other agents' PR modifications, merge/rebase/cherry-pick, paid CI run, destructive SQL, staging/live, Replit, SWARM-006 activation or handoff.

**A70 R19 scope completed with documentation only; WEB-005 IN_PROGRESS / RELEASE_NO_GO / SWARM006_HOLD.**