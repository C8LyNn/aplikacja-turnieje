# WEB-005 — NEXT REMEDIATION WAVE R9
Date: 2026-10-14 | owner: WEB-005/00 | source of truth: WEB-004 HANDOFF R2
Status: IMPLEMENTATION PLANNING / RELEASE NO-GO / SWARM-006 FINAL-ONLY HANDOFF

## Evidence carried forward
Seven draft PRs remain unmerged: P01 #35 7cb283aa82273a1e22daf9051a82311eef53760c, P02 #36 85ad0b86136fc3491c9ef18663d9b01396179349, P03 #34 fae2eea2f22df3f1b02ad035a7db00bc411ea73f, P04 #37 fcfd8a6f5b997c90f2b62f0a3529fa64287a03d7, P05 #38 2d36864f4d2f1c838073f387fd3c8efb3378c43b, P06 #39 16053ee132756ca05b6f2cd1f0cabae823905387, P07 #40 9a8287271299a59fc9291b8d253299a8d109a35d.
Agent 10 prepared R3 internal P01-P07 manifest, 37 source files; QA_ACCEPTED and full integrated tests are not established. Agent40/QA reports 24/24 synthetic Pack17 contract PASS, Pack17 --full with PG16 NOT_EXECUTED. Agent50 T133 R3 reports 50/50 harness tests PASS but native API/PG/frontend tests NOT_EXECUTED. No integrated SHA.
New A80/A90/A100/A110/A120 outputs are SOURCE-ONLY design/fixtures, not code patches.

## Proposed code-only lanes for R9 — explicit 00 agent-specific GO required, maximum 3
LANE 1 — A90 T060-B1 P0: implement small fail-closed pre-clone Backup V3 QP→QPE→OP/route-arrival consistency guard, tests SW-03/04/05/08/09/10/15/16, 400 INVALID_BACKUP_V3 and zero committed clone rows on reject. No SQL, no real user backups, no unsanctioned historical compatibility policy; B2/B3 later.
LANE 2 — A70 T040-MP2A P0: implement global Undo latest-action LIFO recheck under tournament lock including revert_match branch, stale/ABA/no-write negative tests. PR #39 MP1 is separate; do not duplicate it or bulk-merge #7/#27. Direct Revert CAS MP2B remains design until scoped GO.
LANE 3 — A100 T080-S1 P1: implement post-lock organizer/support reauthorization for bans/game picks and transaction-atomic mutations with deterministic revoked-token concurrency tests. No TTL/token storage/password rotation changes until policy approved.
One file owner at a time: T040/A70 owns revert-match.ts, A80 T050 source-only until released. A100 routes/tournaments.ts must not overlap any active A70 edits; if overlap, hold A100 coding and continue source tests.

## Parallel noncoding task assignments
A10 T018 R4: maintain rolling exact-SHA manifest P01+ within WEB-005; no SWARM-006 transmission.
A20 T021 R4: PR38 exact HEAD independent QA support; historical 0030/0031 source/ledger assumptions, no SQL GO.
A30 T030/T031 R7: source and security runtime contract for Steam/proxy PR34/37, support A100; 403/503 policy open.
A40 T017 R4: PR40 current HEAD QA and test-only repairs, no repeat Pack17 implementation; real --full still required.
A50 T133 R4: safe physical PG16 preflight and real application tests if authorized environment exists, strict exit codes and no prod fallback.
A60 T130 R9: independent source/runtime evidence for existing P01–P07 and later R9 PRs; preserve WEB-004 38-case audit matrix and conditional countersign.
A80 T050/T051 R2: Swiss terminal deny-vs-reopen policy, RR/SE pointer, Swiss5/6 and DE standings test-first; no simultaneous revert-match code.
A110 T055/T110 R2: basket CAS 409/412 policy, retained drafts and UX-042/044/045/046 test-first source-only.
A120 T100 R2: minimal presentation fixes test-first; await lifecycle semantics; no redesign.

## Policy gates
Owner/HQ must decide POLICY-TERMINAL-SWISS, POLICY-SE-ROUND, POLICY-SWISS/RR/DE, POLICY-BASKET, POLICY-BACKUP portable revisions and historical fixtures, POLICY-CANCEL CAS, POLICY-STEAM 403/503 and POLICY-CACHE/SESSION TTL. Do not silently decide behavior.
Independent QA must distinguish SOURCE_READY vs QA_ACCEPTED vs RUNTIME_VERIFIED, with SHA, command, fixtures and exit code. A draft PR does not close a ticket.

## Cross-swarm boundary
WEB-004 finished Bug Hunting 002 and is not asked for more reports. WEB-005 completes the accepted remediation backlog before ONE FINAL handoff. SWARM-006 remains on hold; it will eventually own integration, composite SHA, full regression/staging and controlled release after HQ authority. SWARM-007 designs file/communication architecture including Google Drive; no automatic sync asserted. No merge, live SQL, production, Replit or paid CI authorized by this R9 plan.
