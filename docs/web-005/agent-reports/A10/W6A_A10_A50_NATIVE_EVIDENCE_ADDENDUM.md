# WEB-005 — W6A A10 / A50 Native Evidence Append-Only Addendum

**Task:** `WEB005-W6A-A10-IMMUTABLE-SOURCE-DELTA` · **Role:** A10 · **Date:** 2026-10-19 · **Status:** DONE (read-only evidence intake), A30+A60 acceptance pending.

Preserve the original [W6A_A10_IMMUTABLE_SOURCE_DELTA.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/W6A_A10_IMMUTABLE_SOURCE_DELTA.md) unchanged. This note adds an A50 native execution receipt discovered after that immutable snapshot; it does not change C03/C04 gate status.

## Exact A50 input and source scope

- PR #105 HEAD **`52db060c13999f4664fa51d2c965c264a045bc2d`**, BASE C01 **`fa3261b2c9510e110ac9eba21726812d3401a525`**, OPEN/DRAFT/UNMERGED.
- Tested code checkpoint `4a2c398625490a228a18769e1097442aabb2da4a`; later `52db060c...` adds **only** `docs/web-005/agent-reports/A50/W6A_A50_QUOTED_BASIC_FIX.md`, not changed source/test blobs.
- Redaction code file: `qa/pack17/failure-evidence.mjs` blob SHA-1 `6978ff19a40cc9f43413599d6a319ee26b7f80b5`.
- New negative test `qa/pack17/failure-evidence-w6a.test.mjs` blob SHA-1 `6e4d9f230f1c6abd70d18127d1721978bb2cb5ec`.
- Grounded [A50 W6A HANDOFF](https://github.com/C8LyNn/aplikacja-turnieje/blob/52db060c13999f4664fa51d2c965c264a045bc2d/docs/web-005/agent-reports/A50/W6A_A50_QUOTED_BASIC_FIX.md), report Git blob `81f988c135634423e5b9ef484cc552be420c9dc8`.

## Actual native DB-free receipts — A50 executed, NOT A10

| Execution | Command (working directory `qa/pack17/`) | True exit | TAP outcome |
|---|---|---:|---|
| RED old helper + 10 new quoted Basic tests | `node --test --test-reporter=tap failure-evidence-w6a.test.mjs` | 1 | 3 PASS / 7 FAIL, 0 skip |
| GREEN patched helper + same new 10 tests | same command on new helper | 0 | 10 PASS / 0 FAIL |
| GREEN all standard/W5R/W6A tests | `node --test --test-reporter=tap failure-evidence.test.mjs failure-evidence-w5r.test.mjs failure-evidence-w6a.test.mjs` | 0 | **33/33 PASS**, 0 fail/skip |
| GREEN Pack17 true exit/STOP | `node --test --test-reporter=tap run-gates-exit.test.mjs` | 0 | **3/3 PASS**, internally asserted child exits 1/1/0 |

These are A50 own native Node receipts at a byte-pinned code/test checkpoint; **A10 did not run these tests**. Earlier A30 report on previous PR105 SHA `be2b9557e7c555925b1c1e64755042e35c536932` remains historical **5/10 security-negative PASS, 5 FAIL, exit1**. **Independent A30 W6A confidentiality acceptance = PENDING; independent A60 exact-new-SHA execution = PENDING** at this review. Do not infer release GO or full API/PG16 PASS.

**Owner gate:** A50 source change recorded, A30+A60 independent acceptance required before any source composition. PR #105 full C01-based branch remains excluded from frozen C03 and the one-file PR129 allowlist. First original C01 API failure assertion UNKNOWN; no SQL or PG16 executed.

**A10 W6A_HANDOFF addendum:** `SOURCE_PATCH_NATIVE_AUTHOR_PASS / SECURITY_INDEPENDENT_QA_PENDING / C03_FROZEN / C04_NOT_AUTHORIZED / RELEASE_NO_GO / SWARM006_HOLD`.
