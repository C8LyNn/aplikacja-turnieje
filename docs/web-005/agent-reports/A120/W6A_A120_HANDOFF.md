# WEB-005 — WAVE 6A / A120 — W6A_HANDOFF

**ROLE / TASK:** A120 — Presentation & Bracket Views / `WEB005-W6A-A120-PREVIEW-ACCEPTANCE`.  
**STATUS:** **DONE — SOURCE_ONLY documentation contract; OPERATOR_REQUIRED / REAL_PREVIEW_NOT_RUN**.  
**Date:** 2026-10-19 Europe/Warsaw.  
**Integration verdict:** **SOURCE_ONLY / BLOCKED_RUNTIME**, not release or live GO.

## Required output

**[W6A_A120_PREVIEW_ACCEPTANCE.md — executable operator contract + 12-area acceptance matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A120/W6A_A120_PREVIEW_ACCEPTANCE.md)**, independently read back from GitHub **blob `c47a5f5d34ad3d833a282b7c187fb50b54f5a3be`**.

Includes real release path identifiers, loopback-only Node22 GET probe (17 HTTP routes/assets), expectations for genuine 200 SPA / 404 non-HTML missing static files, correct portfolio/Stream Animated Effects HTML and MIME, Unity source-vs-preview byte-identity by immutable Git blobs (21MB WASM cannot be assumed equal without separately approved download), manual F5/browser and responsive checkpoints. Also provides separate exact-source Node commands for PR120 `SOURCE-01..04` and PR142 original+async test suites, with strict zero-SKIP gate.

## Exact SHA / Git scope

- Release **base HEAD**: `1db3734b8988940acc6be8b992420a58fc39624a`, unchanged.
- [PR103](https://github.com/C8LyNn/aplikacja-turnieje/pull/103) HEAD `9fb85b2ca5c137c6107a360bbdb45efec6bf1dde`, base release — OPEN DRAFT, pure router not wired.
- [PR142](https://github.com/C8LyNn/aplikacja-turnieje/pull/142) HEAD `b289cbd75ebc828d3e562eabef5ae40d1e92cce5`, base PR103 — OPEN DRAFT; A60 independent source/native acceptance **17/17 PASS, exit0**, **prior W5R**, not rerun in W6A. Exact [A60 source report](https://github.com/C8LyNn/aplikacja-turnieje/blob/e0375536cc77b97b92bb7b9d0f7bb53f80dbc9e1/docs/web-005/agent-reports/A60/W5R_A60_FINAL_QA.md).
- [PR120](https://github.com/C8LyNn/aplikacja-turnieje/pull/120) HEAD `e97e9d582e76cc4c4b6ba5bb784c89feb6be50ab`, base PR103 — OPEN DRAFT; sibling to PR142, **NOT** composited with it. Original `12 PASS / 4 SKIP` synthetic suite is **prior Wave2/3 receipt**, NOT fresh W6A execution.
- A20 [PR135](https://github.com/C8LyNn/aplikacja-turnieje/pull/135) HEAD `cb261868f68b5bab3559398e514013dbd2a21078`, A20 native 13/13 from W5R with **full checkout still blocked**.
- A40 frozen C03 [PR134](https://github.com/C8LyNn/aplikacja-turnieje/pull/134) HEAD `80bb4ca7a9a359fbe76dbab1478a1af16ded0174`, full CI API integration **FAIL, first assertion UNKNOWN**; [Actions 39133034753](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39133034753).
- A140 [PR116](https://github.com/C8LyNn/aplikacja-turnieje/pull/116) HEAD `e89798e5a553c738428d61e37a20dc72685f7e8e`, live no-copy preservation applies.

**W6A changed paths:** ONLY `docs/web-005/agent-reports/A120/W6A_A120_PREVIEW_ACCEPTANCE.md` and `docs/web-005/agent-reports/A120/W6A_A120_HANDOFF.md` on controlled docs branch. **NO code, new Draft PR, current PR HEAD modification, Replit config, game files or asset changes.**

## Real commands / evidence (W6A only)

**Actually executed environment inventory (read-only container):**
- `node --version` → `v22.16.0`;
- `git --version` → `2.47.3`;
- `pnpm` → `NOT_FOUND`;
- `pwsh` → `NOT_FOUND`;
- inspection of `/mnt/data` and common working roots → **no full `pnpm-workspace.yaml` / repo checkout**.
- Connected GitHub `get_pr_info`, `fetch_file`, immutable `git/trees` → exact current HEADs, file blobs and actual tracked portfolio / Animated Effects / Unity game assets retrieved.

**NOT_RUN in W6A:** PR120 native `node --test` (4 source tests), PR142 native test (A60 prior PASS is retained only), full frontend typecheck/build/React, local HTTP preview probe (no authorized loopback preview), real browser/F5/viewport/HAR, runtime game-byte comparison, API/PG16, GitHub CI reruns. **No TAP count or exit code claimed for an unexecuted W6A test**. Exact proposed commands and EXPECTED results are in the acceptance contract and are **OPERATOR_REQUIRED**.

**Defect lineage:** PR103's Promise-truthy `exists` bug was already confirmed/fixed by PR142 and independently A60 accepted. This W6A task found no new reproducible code defect and **does not** recreate PR142 or add speculative routing rules. The broader live static `404` defect in Issue #70 is NOT FIXED/NOT TESTED by this pure classifier; no adapter is wired.

## Dependencies / next action / ownership STOP

**A20 / Windows operator:** approve fresh complete disposable local checkout(s), pin PR120 and PR142 on **separate detached SHAs**, record lockfile hash and env-variable **names only**, run the PR120 four previously skipped native source tests and PR142 suite. Do **not** install packages, start API or use any DB without further approval. If no verified checkout: **OPERATOR_REQUIRED / NOT_RUN**, no fabricated PASS.

**A60:** verify exact output/exits and independently accept the 4 real source tests on PR120 from full checkout. Preserve W5R PR142 17/17 source acceptance but do not extend it to combined source or browser E2E. Real visual responsive/permission testing only on a future A00-authorized preview with proper API fixtures.

**A40/A140:** own actual supported static hosting/preview adapter, Game/Unity asset preservation, Replit published checkpoint parity, Steam/OBS/portfolio NO_AUTO_COPY. W6A A120 contract must not be mistaken for runtime implementation or deployment authority.

**A10/A00:** register this test-only contract and sibling PR dependency; prevent double application of PR103; preserve C03 API FAIL, new #105 quoted-Basic A30 confidentiality fail and remaining gates. C04 and W6B are **not** automatically authorized.

**Safety respected:** no game logic/assets, PG16/SQL/Docker, broad socket/API start, package install, merge, protected branch edits, Replit live sync, deployment or SWARM-006.

**FINAL:** `A120_W6A_DONE_CONTRACT / SOURCE_ONLY / LOCAL_PREVIEW_NOT_RUN / OPERATOR_REQUIRED / RELEASE_NO_GO`.
