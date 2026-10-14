# WEB-005 / A60 — R18 INDEPENDENT QA (EXACT-SHA)

**TASK** `WEB-005-T130-A60-R18` · **AGENT** A60 Independent QA & Release Gates · **MODE** STRICT READ ONLY application, own documentation publication only · **DATE** 2026-10-14 Europe/Warsaw.  
**MASTER CONTROL** `WEB-005_WAVE_R18_AGENT_PROMPTS.md`, Git blob `fd08cedcbd2db3222e4a444403180414d1666f6c`. **BASE** `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.  
**FINAL SOURCE** `P08_SOURCE_ACCEPTED_CONDITIONAL / P09_SOURCE_ACCEPTED_CONDITIONAL / P20_SOURCE_ACCEPTED_SCOPED_FULL_PRIVACY_REVIEW_OPEN / P21_SOURCE_BLOCKED`.  
**RUNTIME** `A50_R18_NATIVE_APPLICATION_TESTS=0; ALL CURRENT DOMAIN TESTS NOT_EXECUTED`. **HANDOFF** `NOT_READY`; **RELEASE** `NO_GO`; **SWARM006** `HOLD`.

## 1. Source provenance, old/new PR heads and R17 preservation

Independent A60 original [R17 signed report](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R17_INDEPENDENT_QA.md) and [R17 original matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R17_PACKAGE_MATRIX.json) were read. All **21 candidate PR #34–54** were live-checked as OPEN DRAFT/unmerged against identical release base. **18 PRs unchanged**; three R18 HEADs advanced: P09/#42 `25b09f1a48a85ae882b817118f5d8c23bffbe383` → `021bed269f9ea8ac8ce53caeea44263c098aa2dd`; P20/#53 `8f959733258aed0cab15298dd0684ca068045e6f` → `8710f7fe5946d7f62e366303a97722d4201fc96b`; P21/#54 `dbba0eb82920b4f324866b1b983e1211459f52ec` → `9866e5d2e73c99e01c2934a38ca1c62455efd2ed`. P08/#41 remains `f03cf3d09988a04ba9c2856e205d21f994ff67f1`.

Complete 21-row source/runtime/policy machine matrix [here](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_PACKAGE_MATRIX.json), Git blob `b693f64ba31bb99ef1cc1a4b7eb9300a8db7c2dd`. The narrow A60 R17 source acceptance of unchanged packages is preserved **only on identical HEAD SHA** and is not full functional, integration or release acceptance.

| Packet | PR | Exact current R18 HEAD SHA | Independent SOURCE verdict | Native app QA |
|---|---|---|---|---|
| P01 | [#35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35) | `7cb283aa82273a1e22daf9051a82311eef53760c` | SOURCE_ACCEPTED | NOT_EXECUTED |
| P02 | [#36](https://github.com/C8LyNn/aplikacja-turnieje/pull/36) | `85ad0b86136fc3491c9ef18663d9b01396179349` | SOURCE_ACCEPTED | NOT_EXECUTED |
| P03 | [#34](https://github.com/C8LyNn/aplikacja-turnieje/pull/34) | `fae2eea2f22df3f1b02ad035a7db00bc411ea73f` | SOURCE_ACCEPTED_CONDITIONAL | NOT_EXECUTED |
| P04 | [#37](https://github.com/C8LyNn/aplikacja-turnieje/pull/37) | `fcfd8a6f5b997c90f2b62f0a3529fa64287a03d7` | SOURCE_ACCEPTED_CONDITIONAL | NOT_EXECUTED |
| P05 | [#38](https://github.com/C8LyNn/aplikacja-turnieje/pull/38) | `2d36864f4d2f1c838073f387fd3c8efb3378c43b` | SOURCE_ACCEPTED_OFFLINE_ONLY | NOT_EXECUTED |
| P06 | [#39](https://github.com/C8LyNn/aplikacja-turnieje/pull/39) | `16053ee132756ca05b6f2cd1f0cabae823905387` | SOURCE_ACCEPTED_CONDITIONAL | NOT_EXECUTED |
| P07 | [#40](https://github.com/C8LyNn/aplikacja-turnieje/pull/40) | `9a8287271299a59fc9291b8d253299a8d109a35d` | SOURCE_ACCEPTED | NOT_EXECUTED |
| P08 | [#41](https://github.com/C8LyNn/aplikacja-turnieje/pull/41) | `f03cf3d09988a04ba9c2856e205d21f994ff67f1` | SOURCE_ACCEPTED_CONDITIONAL | NOT_EXECUTED |
| P09 | [#42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42) | `021bed269f9ea8ac8ce53caeea44263c098aa2dd` | SOURCE_ACCEPTED_CONDITIONAL | NOT_EXECUTED |
| P10 | [#43](https://github.com/C8LyNn/aplikacja-turnieje/pull/43) | `96a6068f69027574ac76e18d4d5a2c444b5a914a` | SOURCE_ACCEPTED_CONDITIONAL | NOT_EXECUTED |
| P11 | [#44](https://github.com/C8LyNn/aplikacja-turnieje/pull/44) | `2f0187b7242681c394c09058b5ef647667206bd6` | SOURCE_ACCEPTED_CONDITIONAL | NOT_EXECUTED |
| P12 | [#45](https://github.com/C8LyNn/aplikacja-turnieje/pull/45) | `a7a87bc019731191dbfa44bee6939e3fa25e27f4` | SOURCE_ACCEPTED_CONDITIONAL | NOT_EXECUTED |
| P13 | [#46](https://github.com/C8LyNn/aplikacja-turnieje/pull/46) | `7f60849e389a7ed35fdd39dd5493c4c4c267d860` | SOURCE_ACCEPTED_CONDITIONAL | NOT_EXECUTED |
| P14 | [#47](https://github.com/C8LyNn/aplikacja-turnieje/pull/47) | `f09a13623faca8d7ab29b09a2c5b43907c2acd0b` | SOURCE_ACCEPTED_CONDITIONAL | NOT_EXECUTED |
| P15 | [#48](https://github.com/C8LyNn/aplikacja-turnieje/pull/48) | `2a8a4c72cb4a3a37402a346fd0acc83b03b39be3` | SOURCE_ACCEPTED_CONDITIONAL | NOT_EXECUTED |
| P16 | [#49](https://github.com/C8LyNn/aplikacja-turnieje/pull/49) | `99298b81501c3e7764d653604923522a19b9f05c` | SOURCE_ACCEPTED_CONDITIONAL | NOT_EXECUTED |
| P17 | [#50](https://github.com/C8LyNn/aplikacja-turnieje/pull/50) | `5457a74187edc263730c3a4b25a663bdf5531ee9` | SOURCE_ACCEPTED_CONDITIONAL | NOT_EXECUTED |
| P18 | [#51](https://github.com/C8LyNn/aplikacja-turnieje/pull/51) | `2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a` | SOURCE_ACCEPTED_CONDITIONAL | NOT_EXECUTED |
| P19 | [#52](https://github.com/C8LyNn/aplikacja-turnieje/pull/52) | `cce73ec47445102b216b3f8eceb4ec9de67eb1a7` | SOURCE_ACCEPTED_CONDITIONAL | NOT_EXECUTED |
| P20 | [#53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53) | `8710f7fe5946d7f62e366303a97722d4201fc96b` | SOURCE_ACCEPTED_SCOPED_FULL_PRIVACY_REVIEW_OPEN | NOT_EXECUTED |
| P21 | [#54](https://github.com/C8LyNn/aplikacja-turnieje/pull/54) | `9866e5d2e73c99e01c2934a38ca1c62455efd2ed` | SOURCE_BLOCKED | NOT_EXECUTED |

## 2. P08 / PR41 — Backup B1 (unchanged R17 source)

**HEAD** `f03cf3d09988a04ba9c2856e205d21f994ff67f1` — **SOURCE_ACCEPTED_CONDITIONAL**, same Git blob `a8482fa7137f1d71817c8b4ec43da7d6292f8183` in `artifacts/api-server/src/application/backups/backup-v3-flow-integrity.ts`. QPE per-basket position ordering and route receipt `sourceBasketPosition` exact non-null match are source-correct, `null` remains legal for actual legacy writer. The 400/zero-clone legal/invalid fixtures are authored, NOT EXECUTED. PG16 standalone physically isolated positive V3/legacy, invalid mutation, child-count zero-write and induced late rollback remain explicit runtime release debt. Backup B2 historical/revisions/legacy owner choices remain unsigned. No R18 A90 code GO.

## 3. P09 / PR42 — independently accept new roster Undo global LIFO guard, runtime pending

**OLD** `25b09f1a48a85ae882b817118f5d8c23bffbe383` → **NEW** `021bed269f9ea8ac8ce53caeea44263c098aa2dd`, same old release base. **SOURCE_ACCEPTED_CONDITIONAL** on this exact commit.

- `artifacts/api-server/src/application/players/tournament-roster.ts` Git blob `b47bc6e1452173fbc65b236909efe01aebf76116`: the existing transaction acquires the draft tournament lock then locks the selected roster action with `FOR UPDATE`; **before any roster/action-log writes** it reselects tournament-global latest non-undone, non-null payload `ORDER BY createdAt DESC,id DESC LIMIT 1` and rejects stale action ID with typed `UNDO_ACTION_CHANGED`.
- `artifacts/api-server/src/routes/tournaments.ts` blob `6d9608104700bd0619754e362bc30d5af053bd0b`: roster `UNDO_ACTION_CHANGED` maps to **HTTP 409**; independent from generic/revert-match gate and preserves the existing roster service's own transaction, no nested route lock added.
- `artifacts/api-server/test/revert-match.integration.test.ts` blob `3479ab5fe888416858346f82691d4c57f369df25`: four R17 authored deterministic roster X wait for tournament row lock/Y inserts newer undoable action, zero X writes, and positive latest delete/restore Undo tests retained; **all NOT_EXECUTED**. No PG16 interleaving evidence or typecheck exit. Need Y latest preserved, X 409 zero writes, lawful Undo 200 and prior generic/revert-match regression. This is not global complete T040 Direct Revert MP2B CAS/Host signoff.

**A60 verdict:** `SOURCE_ACCEPTED_CONDITIONAL` for roster global LIFO only. No PG PASS, no full feature QA, no SWARM006 GO.

## 4. P20 / PR53 — safe current match-owner binding, unresolved legacy orphan

**OLD** `8f959733258aed0cab15298dd0684ca068045e6f` → **NEW** `8710f7fe5946d7f62e366303a97722d4201fc96b`, in A100 existing branch. **SOURCE_ACCEPTED_SCOPED**, `FULL_PRIVACY_REVIEW_OPEN`, not full security certification.

- `artifacts/tournament-manager/src/lib/deadlock-bans-picks.ts`, blob `59fbc215607fd82f55dc5af6d938310cc9f2ef69`: the live `useMatchGamePicks` checks `getVerifiedMatchTournamentOwner(queryClient,matchId)` before forming an enabled private picks query. It requires authoritative successful tournament-scoped cached matches DTO `{id,tournamentId}`, never numeric ID guess; when absent uses disabled `[matches,0,game-picks]`. Verified owner is attached to query metadata `web005VerifiedTournamentId`.
- `artifacts/tournament-manager/src/lib/tournament-query-invalidation.ts`, blob `955409d1456f13f3f291215712a1afcf322ad094`: verified per-match meta enables scoped cancel/remove on logout/token rotation or denied 401/403 even after canonical A match-list disappears; bans tuple handled, unrelated B keys preserved, typed match key guards reject arbitrary shapes.
- `artifacts/tournament-manager/src/lib/tournament-auth-query-cache.test.tsx`: author reports **22 authored cache cases**, including 401+403, delayed enabled HTTP response, A/B ownership, unknown/ambiguous and 7-vs-70 boundaries, **NOT_EXECUTED**. See [A100 actual R18 authorship report](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A100/WEB-005_A100_R18_HANDOFF.md).
- **Residual SOURCE_CONFIRMED retention / STATIC_INFERRED rebind hazard:** an older untagged `['matches',mid,'game-picks']` query with no owner meta and no cached matching list is not removable without unsafe global eviction and can persist. New hook does not display/fetch it without proof, but when a matching list later reappears it can select that same legacy query key. No test proves that a stale result cannot be reused under a different credential identity before an authorized refetch. This is not a claimed observed privacy breach. Require one exact negative `legacy cached -> credential changed/list absent -> later verified list -> no old cached picks rendered`, positive B preservation; alternatively explicit owner/HQ accepted bounded residual with exact impact. Module-global headers/host-local state remain independently scoped.
- A50 has not run React tests or `pnpm typecheck`, so no standalone RTL PASS. A30 R18 peer reviewed earlier R17 SHA, not automatically this new SHA.

**A60 verdict:** `SOURCE_ACCEPTED_SCOPED_FOR_NEW_PROVEN_OWNERSHIP`; full comprehensive privacy disposition **still OPEN**. The source fix does not substitute for 401/403/late-observer runtime tests or a waiver on historical untagged cache state.

## 5. P21 / PR54 — fail-first tests only, full source bug persists

**OLD** `dbba0eb82920b4f324866b1b983e1211459f52ec` → **NEW** `9866e5d2e73c99e01c2934a38ca1c62455efd2ed`. `artifacts/tournament-manager/src/pages/tournament-detail.rr-readback.test.tsx` Git blob `c907d4431f632f82d1ae9bc14d7520292c332a70` adds two parameterized synthetic `MIX-401`/`MIX-403` fail-first assertions that historic RR31 read denial must not hide lawful current DE32 and Overview. These are **authored not executed**.

Production `tournament-detail.tsx` Git blob `7d03d3ea7a14883fd7d6b0010eebd14c1f11d00d` **unchanged**, and `RoundRobinReadbackBridge` still returns a whole-tabs error for `rrStageIds.some` denied historic RR stage detail. A120 correctly held removing it alone because **PR47-owned** `stage-progress-view.tsx` manages manually selected historical RR and may show stale `detailQuery.data` after a 401/403 even with error. Removing parent blanket protection without child-local privacy guard could expose previously private rows. [A120 R18 exact handoff](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A120/WEB-005_A120_R18_HANDOFF.md) requests A00 **exclusive file/hunk GO** for PR47-owned child and test, plus PR54 page source fix. No such newly granted GO/source patch established. **SOURCE_BLOCKED**, NOT a proven browser exploit.

**Required test-first closure:** old RR 403 denies only selected RR panel + suppresses its old cached participants; lawful DE/Overview 200 remain visible; manual select RR31 protected even if cached data/error coexist; whole-tournament auth revocation remains blocked; retry only RR31, latest N+1 canonical source and no refetch storm. Actual RTL/browser NOT_EXECUTED.

## 6. Independent execution and CI reality

- **A60 R18 actual code tests:** none. Commands/process exits `NOT_EXECUTED`; read-only GitHub source/PR/blob/CI/docs inspection + doc publication only.
- [A50 actual R18 receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R18_RECEIPT.md) reports **0 native React/API/PG16 application tests**. Node/Git preflight exit0; absent complete approved checkout/pnpm/test deps/isolated PG16; local git checkout preflight exit128. No real app TAP counts/exits. Do not substitute PLAN-only harness or author test definitions.
- Automatic CI: PR41 exact HEAD run [38623319193](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38623319193) failed upstream Pack19; PR42 exact HEAD no workflow returned; PR53 newest exact HEAD automatic run [38627584615](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38627584615) blocked at Pack19; PR54 run [38626801186](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38626801186) fails Pack19 prior to target React. PR35 fixes Pack19 only on its separate draft HEAD. These are not target feature regression results.
- Previous A60 PR40 pure Node Pack17 contract **24/24 PASS** at prior R14 is a *scoped, earlier exact-SHA test*, NOT Pack17 `--full` or composited app QA. Do not convert historical standalone evidence into a current complete PASS.

## 7. Original WEB-004 R2 38-case traceability and product decisions

Preserve original **38 historical cases: 0 PASS / 3 FAIL_EXTERNAL_CI / 33 BLOCKED / 2 NOT_RUN**. The original 38-row per-ID matrix/disposition with verified owner signatures is **not available** in A60 verified records; do not invent missing 9 identifiers, mark a historical row WONT_FIX without owner, or equate generic source review with owner-approved backlog closure. This is an independent closeout blocker.

Outstanding unsigned HQ/owner decisions include T055 basket full-graph CAS transport + 409/412/version/legacy/draft behavior, terminal Swiss TS-A/TS-B, SE currentRound, Swiss rematch/BYE/NC, DE GF/reset ranking, T060 Backup B2 portable history/revisions/legacy, T040 public Direct Revert completion CAS/Host rollout, Steam absent-secret 403/503 and session TTL/digest/rotation. [A80 R18 sport report](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A80/WEB-005_A80_R18_HANDOFF.md) explicitly records no owner signatures. A110 R18 Basket signable form is likewise not a signed policy. A60 cannot choose product behavior for HQ.

**Cross-PR collision DAG:** PR39/42/44/46/51 routes; PR41/48 Backup; PR43/50/54 tournament detail; PR47 child manual stage selection. No composite source, no merge or PR reopen. Release source still `1fdc401d...`, all 21 candidate patches DRAFT/UNMERGED.

## 8. Formal handoff viability and ranked A00 decisions

**Strict classification = `NOT_READY`, not unconditional GO and not currently `READY_ONLY_IF_OWNER_WAIVES_RUNTIME`.** A waiver for 0 native per-PR tests cannot waive an open source/privacy guard or fabricate owner signoffs. [Full separate readiness decision](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_FINAL_HANDOFF_READINESS.md).

| Priority | Owner | Required evidence/action | A60 status |
|---|---|---|---|
| P0 | A00 + A120/PR47 owner | Explicit exclusive child `stage-progress-view.tsx` GO and PR54 two-boundary UI privacy fix, new HEAD/test-first independent source review | **P21 SOURCE_BLOCKED** |
| P0 | A30/A100/HQ | Test or formally accept bounded legacy orphan-cache rebind risk; verify match attribution, 401/403, A/B and observer under exact PR53 HEAD | **P20 REVIEW/OWNER_WAIVER_REQUIRED** |
| P0 | A00/HQ/A10 | Sign sport/Basket/Backup/Direct Revert/Steam/session decisions and publish actual 38-case WEB004 owner disposition ledger | **POLICY_OPEN / BACKLOG_UNCLOSED** |
| P0 | A00 owner + A50/A20 | Provide trusted full checkout, Node22/pnpm10 frozen dependencies, physical dedicated PG16 with written reset consent; collect exact SHA commands/exits/TAP | **RUNTIME_NOT_EXECUTED** |
| P0 | A00/HQ | Only after source/policy completion, explicitly choose full native test executor before handoff **or** sign `RUNTIME_DEBT_TO_SWARM006` with SWARM006 composite tests a hard release STOP | **WAIVER_NOT_GRANTED / NO_HANDOFF** |
| P1 | A10/00 | Complete 21 PR heads/conflict graph and A60/A50 signed receipts; final-only one package when all gates satisfied | **NO_INTEGRATION** |

**BOUNDARY:** No A60 application code edits, new functional PRs, merge/cherry-pick/rebase, shared/production SQL or schema reset, paid/manual CI rerun, staging/live/Replit or SWARM006 dispatch. A60 publication is independent documentation only.

**FINAL:** `WEB-005-T130-A60-R18 — REPORT_PUBLISHED / P09_SOURCE_ACCEPTED_CONDITIONAL / P20_SCOPED_SOURCE_REVIEW_OPEN / P21_SOURCE_BLOCKED / WEB004_38_NOT_SIGNED / APP_RUNTIME_0 / HANDOFF_NOT_READY / RELEASE_NO_GO / SWARM006_HOLD`.
