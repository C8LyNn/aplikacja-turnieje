# WEB-005 A10 — R15 / QA Receipt Index

**Task:** `WEB-005-T018-A10-R10` · **Mode:** DOCS / READ-ONLY · **Date:** 2026-10-14 · **Receiver:** A00 Implementation Lead

**Status:** `INTERNAL_BUFFER / WEB005_IN_PROGRESS / RELEASE_NO_GO / SWARM006_NOT_DISPATCHED`.

Source control: [R15.1 central prompt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R15_AGENT_PROMPTS.md) (blob `e6950cbff7e521ed9b3ff774e7787e8d598a966d`).
Release base: `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`; all P01–P21 source PRs OPEN/DRAFT/UNMERGED on this base; no integrated SHA.
Inherited checksum evidence: A10 R14 manifest, 91 SHA-256 + Git blob SHA1 values, retained because exact PR HEADs have no drift.

## Executive coverage

| Indicator | Count | Interpretation |
|---|---:|---|
| SOURCE_READY | 21/21 | Source branch, PR, baseline and pinned HEAD exist |
| SOURCE_ACCEPTED (including **conditional**) | 18/21 | Last available independent A60 R13 matrix; some limited scope |
| Not source-accepted / partial / scope-blocked | 3/21 | P08, P09, P21; no inferred approval |
| QA_ACCEPTED_FULL | 0/21 | No complete release-grade evidence |
| RUNTIME_VERIFIED_FULL | 0/21 | Targeted/pass harness != complete application |
| Direct audited A50 test report URLs | 0/21 | `a50_test_report_url=null` until URL, exact command, env and exit are verified |
| Direct audited A60 verdict URLs | 0/21 | Local A60 R13 source matrix exists; public exact SHA verdict URL not verified |
| Explicit POLICY_OPEN flags inherited R14 | 4 | Partial classification; other policy dependencies are not deemed closed |
| Distinct changed paths / sha256 entries | 82 / 91 | Inherited exact HEAD proof; R15 did not redownload 91 files |
| Pairwise overlapping packet pairs | 14/210 | No Git merge has been attempted |

## 21-packet QA receipt dashboard

| Packet / PR | Pinned HEAD (prefix) | Source verdict, last A60 R13 | Full runtime | A50 receipt | A60 URL |
|---|---|---|---|---|---|
| [P01 / #35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35) | `7cb283aa8227` | SOURCE_ACCEPTED | NO | `null` | `null` |
| [P02 / #36](https://github.com/C8LyNn/aplikacja-turnieje/pull/36) | `85ad0b86136f` | SOURCE_ACCEPTED | NO | `null` | `null` |
| [P03 / #34](https://github.com/C8LyNn/aplikacja-turnieje/pull/34) | `fae2eea2f22d` | SOURCE_ACCEPTED | NO | `null` | `null` |
| [P04 / #37](https://github.com/C8LyNn/aplikacja-turnieje/pull/37) | `fcfd8a6f5b99` | SOURCE_ACCEPTED | NO | `null` | `null` |
| [P05 / #38](https://github.com/C8LyNn/aplikacja-turnieje/pull/38) | `2d36864f4d2f` | SOURCE_ACCEPTED_OFFLINE | NO | `null` | `null` |
| [P06 / #39](https://github.com/C8LyNn/aplikacja-turnieje/pull/39) | `16053ee13275` | SOURCE_ACCEPTED_CONDITIONAL | NO | `null` | `null` |
| [P07 / #40](https://github.com/C8LyNn/aplikacja-turnieje/pull/40) | `9a8287271299` | SOURCE_ACCEPTED | NO | `null` | `null` |
| [P08 / #41](https://github.com/C8LyNn/aplikacja-turnieje/pull/41) | `e847cb705296` | SOURCE_CONFIRMED_CONDITIONAL | NO | `null` | `null` |
| [P09 / #42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42) | `1ae0ccb801f4` | SOURCE_CONFIRMED_PARTIAL;SCOPE_BLOCKED | NO | `null` | `null` |
| [P10 / #43](https://github.com/C8LyNn/aplikacja-turnieje/pull/43) | `96a6068f6902` | SOURCE_ACCEPTED_CONDITIONAL | NO | `null` | `null` |
| [P11 / #44](https://github.com/C8LyNn/aplikacja-turnieje/pull/44) | `2f0187b72426` | SOURCE_ACCEPTED_CONDITIONAL | NO | `null` | `null` |
| [P12 / #45](https://github.com/C8LyNn/aplikacja-turnieje/pull/45) | `a7a87bc01973` | SOURCE_ACCEPTED_CONDITIONAL | NO | `null` | `null` |
| [P13 / #46](https://github.com/C8LyNn/aplikacja-turnieje/pull/46) | `7f60849e389a` | SOURCE_ACCEPTED_CONDITIONAL | NO | `null` | `null` |
| [P14 / #47](https://github.com/C8LyNn/aplikacja-turnieje/pull/47) | `f09a13623fac` | SOURCE_ACCEPTED_CONDITIONAL | NO | `null` | `null` |
| [P15 / #48](https://github.com/C8LyNn/aplikacja-turnieje/pull/48) | `2a8a4c72cb4a` | SOURCE_ACCEPTED_CONDITIONAL;R11_P0_CONFIG_FIXED | NO | `null` | `null` |
| [P16 / #49](undefined) | `99298b81501c` | SOURCE_ACCEPTED_CONDITIONAL | NO | `null` | `null` |
| [P17 / #50](undefined) | `5457a74187ed` | SOURCE_ACCEPTED_CONDITIONAL | NO | `null` | `null` |
| [P18 / #51](undefined) | `2fd8b5107a6f` | SOURCE_ACCEPTED_CONDITIONAL | NO | `null` | `null` |
| [P19 / #52](https://github.com/C8LyNn/aplikacja-turnieje/pull/52) | `cce73ec47445` | SOURCE_ACCEPTED_CONDITIONAL | NO | `null` | `null` |
| [P20 / #53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53) | `6a8f0c3e5775` | SOURCE_ACCEPTED_CONDITIONAL_FOR_PREFIXED_QUERIES;RESIDUAL_SCOPE_GAP | NO | `null` | `null` |
| [P21 / #54](https://github.com/C8LyNn/aplikacja-turnieje/pull/54) | `dbba0eb82920` | SOURCE_CONFIRMED_PARTIAL;P1_UI_SCOPE_REVIEW_REQUIRED | NO | `null` | `null` |

Source-review basis: independent file `WEB-005_A60_R13_PACKAGE_MATRIX.json`, local evidence, source verdict exact SHA matches current PR. It is **not** a verified direct GitHub receipt URL; file ownership remains with A60.

## Critical dependency & blockers

1. **Backend route collision:** P06/#39, P09/#42, P11/#44, P13/#46 and P18/#51 modify `artifacts/api-server/src/routes/tournaments.ts`. Later authorized integrator must reconcile Undo/LIFO, Cancel/Restore, security and corrupt-history invariants, with physical PG16 race tests; no merge conducted here.
2. **Backup collision:** P08/#41 and P15/#48 both change `backup-v3.ts` and related tests; B2 portable-history/revision policy remains owner/HQ-open.
3. **Frontend collision:** P10/#43, P17/#50 and P21/#54 modify `tournament-detail.tsx`; P14/#47 has stage-progress presentation dependency; P20/#53 has cross-view privacy cache interactions.
4. **P20 privacy limitation:** existing non-prefix React Query keys `["tournaments", id, "player-bans"]` and `["matches", matchId, "game-picks"]` are not matched by the PR53 URL-prefix cache eviction. `AuthProvider` fixture without `QueryClientProvider` potentially fails; no actual A50 runtime FAIL verified. A100 remains author; needs A60/A50 + explicit A00 code GO before change.
5. **P07 Pack17 negative probe:** A40 R13 independent pure contract source-mirror test had 15/17 expected outcomes, with two forged TAP cases accepted (T017-QA-01). This does not supersede real scoped 24/24 unit PASS; both must be reconciled by A40/A60. Real `--full` not evidenced.
6. **Pack19 CI:** on #52 `38605694664`, #53 `38606179795`, #54 `38606249912`, automatic workflows stopped at obsolete source matcher Pack19 before targeted RTL; PR35 fixes matcher but remains draft. No manual rerun approved.

## Direct evidence receipt contract (required to flip null)

**A50:** URL to immutable log/report on exact PR HEAD, `git rev-parse HEAD`, Node/pnpm/PG versions and isolated environment, actual command, start/end, exit code, test case output and failures, physical DB isolation proof if destructive. No app test by A10.

**A60:** independently authored exact-SHA acceptance/FAIL review URL; verdict scope and exceptions, link to A50 evidence. Conditional `SOURCE_ACCEPTED` alone never means `QA_ACCEPTED_FULL`.

**Owner/HQ:** decision ID plus disposition for every `POLICY_OPEN`/blocked backlog ticket before final WEB-005 closeout.

## SWARM-007 / future final-only receipt requirements

Record artifact ID, author/custodian, R-version, source commit/SHA-256, independent A60/A50 exact-SHA links, custody trail, retention, Google Drive archive receipt ID and accessibility. Google Drive folder URI and sync/transfer receipt are **null/not performed**.

Only after A00/HQ approves completed backlog and one final manifest may SWARM-006 begin integration; no interim dispatch, staging, live release or hidden composite SHA.

**Machine-readable source:** [R15 packet manifest](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R15_PACKAGE_MANIFEST.json).
