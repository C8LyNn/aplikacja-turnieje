# WEB-005 — A30 R19 final handoff to A00

**Task:** `WEB-005-T030-T031-A30-R19` · **Role:** A30 / Security Implementation (independent security peer, **not** A60) · **Mode:** STRICT READ-ONLY for application code.  
**Central R19.1 instructions:** [prompt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R19_AGENT_PROMPTS.md), blob `076b14ca7ea953c818309502cce322c7dd6a7bef`.  
**Release base:** `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.  
**Full independent A30 source peer evidence:** [WEB-005_A30_R19_SECURITY_PEER.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/b0adad1fe59220b88400a86c706f86c4f8639b64/docs/web-005/agent-reports/A30/WEB-005_A30_R19_SECURITY_PEER.md), commit `b0adad1fe59220b88400a86c706f86c4f8639b64`, section 6 current HEAD addendum.  
**A100 author R19 technical report:** [WEB-005_A100_R19_LEGACY_CACHE_REBIND.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A100/WEB-005_A100_R19_LEGACY_CACHE_REBIND.md), blob `6fca0ff5b92003b3fffca19f88045b4d26c44657`. Author report is **not** independent A60 QA.

## 1. Exact SHA and reviewed code

**P20 / [PR #53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53):** R18 independently QA-reviewed OLD `8710f7fe5946d7f62e366303a97722d4201fc96b` → R19 NEW `d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34` (**4 new commits** on same existing branch, same release base; OPEN/DRAFT/UNMERGED; no A30 code commits).

| R19 A100-owned change | Exact new Git blob | A30 independent source assessment |
|---|---|---|
| `artifacts/tournament-manager/src/lib/deadlock-bans-picks.ts` | `1a5404e8a0dccf12063d6efb6248c2253cafee4a` | Verified owner at query creation; old untagged exact raw match key with missing/mismatched meta **cannot be rebound**: new `["matches",mid,"game-picks","verified-owner",tid]` used instead; missing owner disables fetch. |
| `artifacts/tournament-manager/src/lib/tournament-query-invalidation.ts` | `e2c12c88c051f20f08474ee0dc9f877207923624` | Only exact 3- or 5-segment match-picks keys recognized; metadata-attributed A removed on logout/revocation and 401/403, even after parent match-list cache disappears. No global `matches` purge. |
| `artifacts/tournament-manager/src/lib/tournament-auth-query-cache.test.tsx` | `2196851691735e560b36099caa3d33ac649ccf84` | One focused R19 legacy-rebind test (A=7/701 old secret, B=8/801 preserved, late response, authorized new value, new logout evicts scoped key); **AUTHORED, NOT EXECUTED**. Author reports 23 total cache cases, not an executed test count. |

**Security peer verdict (on exact `d1aebf…`):** `LEGACY_REBIND_SOURCE_RECONCILED_SCOPED / OLD_RAW_ORPHAN_STILL_RETAINED / NO_OBSERVED_BROWSER_EXPLOIT / RUNTIME_NOT_EXECUTED / A60_R19_EXACT_SHA_SIGNOFF_PENDING`.

The patch is limited to the initial R19 A100-owned three files. It avoids the prior source-level key identity collision: the new verified key does not adopt stale data from pre-R18 untagged raw query. The existing mutation `invalidateQueries` prefix covers both three- and five-element keys; its actual React runtime remains a test gate. Valid B data is preserved by the scoped predicate. No numeric match ID is trusted as tenant proof, and an absent/ambiguous owner disables the protected GET.

**Important distinction:** the old legacy untagged cache record can remain in QueryClient when no owner evidence exists, because it cannot be safely attributed for a targeted purge. The new hook avoids selecting it once valid ownership reappears, but this does not implement physical erasure/migration of historical unknown-owner entries. If owner/HQ requires stronger at-rest memory erasure, ask for a separate bounded migration/disposition or explicit written `OWNER_ACCEPTED_EXCEPTION` with independent A60 risk opinion. Do not call the retained record a confirmed user-visible leak.

## 2. Independent QA and runtime truth

**Independent A60 [R18 QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_INDEPENDENT_QA.md), blob `656a8850a6358e5b4b2517220a5fc55f99dc014f`:** PR53 `SOURCE_ACCEPTED_SCOPED_FOR_NEW_PROVEN_OWNERSHIP / FULL_PRIVACY_REVIEW_OPEN` at **old** `8710f7fe…`. It cannot be transferred to new `d1aebf…`. **A60 R19 exact-new-SHA verdict was not published/verified at this handoff checkpoint.**

**A30 R19 native frontend/API/PG16 test executions:** `0`; command `NOT_EXECUTED`; cwd/env/TAP/exit `N/A`. Connected GitHub source and QA readback only.  
**Author A100 R19 native frontend/typecheck:** `NOT_EXECUTED`.  
**[A50 R18 actual receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R18_RECEIPT.md):** `0` native application tests; owner-supplied trusted complete checkout with Node22/pnpm10/frozen dependencies still needed. No successful R19 A50 actual TAP receipt was verified by A30 at the time of this writing.

**A50 exact-command verification on `d1aebf…` only if an owner-approved real executor is connected:**

```bash
git fetch origin fix/web-005/t080-s2a-private-auth-query-cache-r13
git switch --detach d1aebfcab4c9ac9db6203dd5bf7da4c758df9d34
git rev-parse HEAD
node --version
pnpm --version
pnpm install --frozen-lockfile
cd artifacts/tournament-manager
export TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json"
pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/lib/tournament-auth-query-cache.test.tsx
pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/hooks/use-tournament-auth.test.tsx
pnpm typecheck
```

Mandatory actual assertions before A60 accepts full privacy: R19 legacy old raw A retained but never rendered/new query's old data remains undefined before fresh authenticated GET; B public remains; late A nonabortable completion never repopulates owner-qualified query; 401 and actual 403 deny only A; valid viewer/support/organizer and full Host A→B navigation do not send old auth headers or render old A state. Unknown/ambiguous match ownership disabled. No test PASS without real run/TAP/exit.

## 3. Security dependencies unchanged; no re-audit/merge

All below remain OPEN DRAFT/UNMERGED on same release SHA; A60 R18 narrow source verdict **SOURCE_ACCEPTED_CONDITIONAL**, physical dedicated PG16 test not run:

| Packet | PR / immutable HEAD | Still required |
|---|---|---|
| P11 | [#44](https://github.com/C8LyNn/aplikacja-turnieje/pull/44) `2f0187b7242681c394c09058b5ef647667206bd6` | Stale queued organizer/support locked mutation 403, zero protected writes, positive valid writes, no auth/caching conflation. |
| P13 | [#46](https://github.com/C8LyNn/aplikacja-turnieje/pull/46) `7f60849e389a7ed35fdd39dd5493c4c4c267d860` | Organizer DELETE post-lock revalidation, revoked 403 zero cascade, lawful 204 and rollback. |
| P16 | [#49](https://github.com/C8LyNn/aplikacja-turnieje/pull/49) `99298b81501c3e7764d653604923522a19b9f05c` | Four password/visibility changes post-lock stale 403/zero writes, lawful 200 and parity 409. |

No A30 source changes to PR54 (A120 owns R19). **PR54 did advance independently during R19** and needs exact HEAD review by A60/A120; A30 does not claim its acceptance. PR34 Steam 403/503 and PR37 proxy trust have unchanged source-only conditional review and real HTTP/runtime/policy debt as previously documented; they are not reopened by this limited task.

## 4. Coordinator 00 / A60 review requirements and stop gate

**A60** independently diff old `8710f7fe…` → new `d1aebf…`, reproduce source semantics with the R19 test as evidence authored-only, explicitly classify `SOURCE_ACCEPTED_SCOPED` vs `SOURCE_BLOCKED` and residual unknown-owner retention. Do not allow A100 self-signature to replace independent QA.  
**A50** run the exact clean checkout tests; owner first supplies trusted PC/VM + full repo/pnpm and explicit safe execution approval. PostgreSQL work on PR44/46/49 separately requires A20 physical disposable PG16 isolation and signed test schema reset consent.  
**A00 / owner/HQ** resolve in-memory legacy orphan retention policy if a hard erasure guarantee is required; session absolute/idle TTL, support token hashing, organizer password rotation, Steam missing-secret 403 vs 503 all **UNSIGNED**. The wider Basket CAS, Swiss/SE/DE, Backup B2, Direct Revert policies belong to other assigned agents. Do not silently choose.  
**A00 final gate** remains subject to original WEB-004 38 historical cases with owner-signed per-case disposition, 21 PR DAG with independent A60 exact SHA evidence, actual A50 tests or separate written runtime-debt waiver **after source/policy closure**, and explicit HQ `FINAL_HANDOFF_GO`. None is issued by A30.

**STOP:** A30 code, PR creation, merge/rebase/cherry-pick, prod/staging/live/Replit, paid CI rerun, shared/production SQL/reset, SWARM-006 dispatch. No composite or deployment.

**FINAL R19 A30 peer handoff:** `REPORT_PUBLISHED / PR53_R19_LEGACY_REBIND_SOURCE_RECONCILED_SCOPED / UNKNOWN_OWNER_RAW_CACHE_RETAINED / A60_NEW_HEAD_PENDING / APP_TESTS_0 / OWNER_POLICY_OPEN / HANDOFF_NOT_AUTHORIZED / RELEASE_NO_GO / SWARM006_HOLD`.  
**Next:** `A50 real RTL → A60 independent exact-SHA acceptance → A00 owner/handoff decision`.
