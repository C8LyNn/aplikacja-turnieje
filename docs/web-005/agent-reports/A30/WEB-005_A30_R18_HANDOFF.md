# WEB-005 — A30 R18 HANDOFF to Implementation Lead A00

**Date:** 2026-10-14 Europe/Warsaw · **Agent:** A30 Security Implementation · **Task:** WEB-005-T030-T031-A30-R18  
**Mode:** SOURCE ONLY / security peer; **A60 retains exclusive independent release QA**.  
**Control:** [WEB-005 R18.1 central instructions](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R18_AGENT_PROMPTS.md), blob `fd08cedcbd2db3222e4a444403180414d1666f6c`.  
**Release base:** `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.  
**Detailed source review:** [WEB-005_A30_R18_S2B_PEER.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/b0288e2cefc859a6ee1972b7a141487328d04d0c/docs/web-005/agent-reports/A30/WEB-005_A30_R18_S2B_PEER.md), publication commit `b0288e2cefc859a6ee1972b7a141487328d04d0c` (includes R18 exact-HEAD chronological checkpoints, last §10).

## 1. Exact PR HEADs and R17→R18 changes (at A30 source checkpoint)

| Packet | PR | Old R17 SHA | Verified R18 HEAD | Result |
|---|---|---|---|---|
| P03 Steam Catalog | [#34](https://github.com/C8LyNn/aplikacja-turnieje/pull/34) | `fae2eea2f22df3f1b02ad035a7db00bc411ea73f` | **unchanged** | SOURCE_ACCEPTED_CONDITIONAL by A60 R17; HTTP/PG and 403/503 policy pending |
| P04 Proxy | [#37](https://github.com/C8LyNn/aplikacja-turnieje/pull/37) | `fcfd8a6f5b997c90f2b62f0a3529fa64287a03d7` | **unchanged** | SOURCE_ACCEPTED_CONDITIONAL; Express spoof and deployment topology pending |
| P11 S1A | [#44](https://github.com/C8LyNn/aplikacja-turnieje/pull/44) | `2f0187b7242681c394c09058b5ef647667206bd6` | **unchanged** | SOURCE_ACCEPTED_CONDITIONAL; isolated PG16 races pending |
| P13 S1B-D | [#46](https://github.com/C8LyNn/aplikacja-turnieje/pull/46) | `7f60849e389a7ed35fdd39dd5493c4c4c267d860` | **unchanged** | SOURCE_ACCEPTED_CONDITIONAL; authorized cascade/403 PG16 pending |
| P16 S1B-P | [#49](https://github.com/C8LyNn/aplikacja-turnieje/pull/49) | `99298b81501c3e7764d653604923522a19b9f05c` | **unchanged** | SOURCE_ACCEPTED_CONDITIONAL; four 403/200/409 PG16 operations pending |
| P20 S2B | [#53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53) | `8f959733258aed0cab15298dd0684ca068045e6f` | `8710f7fe5946d7f62e366303a97722d4201fc96b` | **7 new R18 commits**; A30 SOURCE_REVIEWED_CONDITIONAL on latest source, **A60 R18 exact-HEAD signature PENDING**, real frontend test PENDING |

All six remained **OPEN/DRAFT/UNMERGED**, same base, no composite branch. If #53 moves again, updated SHA takes precedence and requires re-review. R17 A60's previous `SOURCE_BLOCKED_FULL_PRIVACY_UNKNOWN_OWNER` is valid historical evidence for `8f959733…`, **not automatic judgment of the new R18 HEAD**. See [A60 R17 independent QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R17_INDEPENDENT_QA.md) and [A60 R17 machine matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R17_PACKAGE_MATRIX.json).

## 2. A30 current R18 S2B source evidence and condition

**Source fix present at #53 latest HEAD:** `artifacts/tournament-manager/src/lib/deadlock-bans-picks.ts` blob `59fbc215607fd82f55dc5af6d938310cc9f2ef69` now obtains unique match→tournament owner from a successful canonical tournament match-list DTO, attaches `web005VerifiedTournamentId` **before private picks GET**, and disables the unknown/ambiguous owner fetch. `artifacts/tournament-manager/src/lib/tournament-query-invalidation.ts` blob `955409d1456f13f3f291215712a1afcf322ad094` persists exact query-owner metadata for targeted logout and denied 401/403 handling, including when canonical match-list cache is absent; there is **no global match cache wipe**. An existing QueryClientProvider test fixture is repaired. Latest test blob `37f7a9923e9081b4fd4340f1833790f9abd28813` covers enabled late HTTP response, 401+403, unknown owner, A/B isolation — tests are **AUTHORED, NOT EXECUTED**.

**A30 conditional QA questions — not alleged production exploits:**
- **Legacy query/key vs credential epoch:** A previously cached **unscoped** `["matches",mid,"game-picks"]` may survive when owner evidence is missing, then be read under a later, newly verified owner/changed role because the hook uses the same match-only key. Require A50/A60 to seed legacy PRIVATE_A_ONLY, revoke A with no parent list, later mount active hook in new role after a matching list arrives, and assert no old private result is displayed/reused before fresh auth. Classification `STATIC_INFERRED`; not verified via browser.
- **Host route/context correctness:** `getVerifiedMatchTournamentOwner` scans cached successful lists for *all* tournaments, without taking current Host tournament ID. Require A→B/7→70 route/role tests to show a unique stale A list cannot authorize or render a B-context request, with correct outgoing scoped header and no clearing valid public B.
- **Real concurrent frontend behavior:** execute `enabled:true` pending HTTP, late unabortable response after logout/401/403, mutation invalidation parity, legal viewer/support/organizer positive sessions. No failure or PASS invented.

**Source-policy separation:** server API checks `requireTournamentRead` before protected ban and picks SELECT; 403 on private visibility failure. This is a **client cache privacy consistency issue**, not established backend authorization bypass. A60 must issue `SOURCE_ACCEPTED` or `SOURCE_BLOCKED` independently on **the exact new PR53 SHA**.

## 3. A50 tests / actual evidence

**Actual A30 R18 native application runs:** **0** · Commands `NOT_EXECUTED` · exit/TAP `N/A`. GitHub connector only. [A50 R17 receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R17_RECEIPT.md) confirmed 0 native app tests and unavailable approved complete runnable checkout + pnpm. No independent A50 R18 execution receipt was present at the A30 checkpoint. New PR53 authored tests and unrelated GitHub Actions failure at preceding Pack19 do not count as application PASS.

**A50 exact per-PR safe runner after owner provides trusted executor**, real checkout with Node22/pnpm10 and frozen dependencies. For #53 pin current SHA first:

```bash
git fetch origin fix/web-005/t080-s2a-private-auth-query-cache-r13
git switch --detach 8710f7fe5946d7f62e366303a97722d4201fc96b
git rev-parse HEAD
node --version
pnpm --version
pnpm install --frozen-lockfile
cd artifacts/tournament-manager
export TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json"
pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/hooks/use-tournament-auth.test.tsx
pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/lib/tournament-auth-query-cache.test.tsx ./src/lib/tournament-query-invalidation.test.ts
pnpm typecheck
```

**Other suites** (separate clean detached exact PR HEADs and approved dedicated PG16 as required):
- #34: `steam-catalog-access.test.ts`, `steam-catalog-admin-middleware.test.ts`, `steam-catalog-admin.integration.test.ts`; verify three denied writes **zero DB/upstream calls**, lawful public GET and admin positives.
- #37: `request-source.test.ts`; verify IPv4/v6/mapped broad CIDR rejects, XFF/XFH/XFP spoofing and valid narrow trusted proxy; `proxy-addr@2.0.8` override/lock source confirmed.
- #44: `session-revocation-race.integration.test.ts`; queued support/organizer under lock 403 zero writes + valid bans/picks.
- #46: `tournament-delete-revocation.integration.test.ts`; queued stale DELETE 403 zero cascade + lawful 204 and rollback.
- #49: `auth-organizer-revocation-r12.integration.test.ts`; four stale write 403 zero protected writes, lawful 200 and viewer removal private_online 409.

For PostgreSQL: owner/A20 must first verify a dedicated disposable test DB, `TEST_DATABASE_URL`, `tm_test_*` schema and narrow explicit destructive reset consent. Never touch shared/prod, never fallback to `DATABASE_URL`.

## 4. Open decisions and formal handoff gate

**OWNER/HQ policy remains open:** Steam absent admin-secret 403 vs 503; session absolute/idle TTL; support token hash-at-rest; organizer password rotation/token migration/logout rules. A30 cannot decide these, nor T055 Basket CAS/Swiss/DE/Backup/Direct Revert decisions owned by other agents.

**GO:** A50 actual targeted test execution with trusted executor; A60 independent exact-head QA; A00 coordinate 21-PR final manifest, 38 WEB-004 finding dispositions and possible separately owner-authorized runtime debt.  
**STOP:** A30 app code, new PR, full source self-approval, merge/cherry-pick/rebase, staging/live, Replit, paid rerun, SQL migration, shared DB, SWARM-006 launch.

**Final-only SWARM-006:** remains HOLD until A00 obtains independently reviewed source dispositions, completed policy/exception ledger and separate explicit owner/HQ `FINAL_HANDOFF_GO`. If per-PR runtime still absent, separately signed `RUNTIME_DEBT_TO_SWARM006` is required, with full integration tests still a hard **RELEASE STOP**.

**A30 R18 signed peer handoff:** `REPORT_PUBLISHED / PR53_PATCH_REVISED / SOURCE_REVIEWED_CONDITIONAL / A60_EXACT_SHA_PENDING / APP_RUNTIME_NOT_EXECUTED / OWNER_POLICIES_OPEN / WEB005_RELEASE_NO_GO / SWARM006_HOLD`. **Next:** A50 → A60 → A00.
