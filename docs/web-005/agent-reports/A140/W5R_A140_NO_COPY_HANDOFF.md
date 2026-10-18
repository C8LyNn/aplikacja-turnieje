# WEB-005 — W5R_A140_NO_COPY_HANDOFF

**Task ID:** `WEB-005-T140-W5R-REPLIT-PROTECTION`  
**Role:** A140 — Replit & Live Synchronization (TRACK-G / LIVE PRESERVATION)  
**Status:** **DONE** for W5R-scoped no-copy source matrix; **BLOCKED** for verification of actually published Live bytes  
**Integration verdict:** **SOURCE_ONLY / BLOCKED for any Live transfer**  
**Date:** 2026-10-18  
**Dispatch:** https://docs.google.com/document/d/1yKUPtfE0dC9a0nRAdi35OnYPDIZUN46u3bCkN2KeDTw/edit  
**PR:** https://github.com/C8LyNn/aplikacja-turnieje/pull/116 (existing Draft PR, NOT ready for merge)  
**Immutable source BASE SHA:** `1db3734b8988940acc6be8b992420a58fc39624a`  
**Initial A140 W5R PR HEAD SHA:** `133e67fc079affabeb22c92f04237f13db1f06e2`  
**A140 W5R STOP-manifest edit commit SHA:** `930967bd2f221da8cff0de273c07f40f10b0f10b`  
**Exact final PR HEAD:** see the current GitHub PR metadata / final W5R issue handoff; the document commit itself necessarily changes the HEAD.

## Read-only exact-source snapshot

- GitHub connector rechecked Draft PR #116 with initial HEAD `133e67fc079affabeb22c92f04237f13db1f06e2` (6 A140-only changed paths before this W5R update), base SHA `1db3734b8988940acc6be8b992420a58fc39624a`.
- Replit Agent read-only **WORKSPACE_ONLY** observed commit `5e68f0f4b7d73cb5ff6aad0065dbe54c5f691776`, tree `90ec61122e4e04b67a68e6a4b8e825f62c393afa`, branch `feat/double-elimination-full-integration`, clean working-tree state.
- Replit `git ls-tree HEAD` source OIDs checked (Agent-reported): `App.tsx` `91f9bc2155b13abf9d233e59e1cc573ebf590daa`; tournament `artifact.toml` `c4d8f2bc41e771f796be22506370f979922edd78`; `index.css` `120812ce2afc2d5fbce9d3cfe156e4aa64c02e92`; `pnpm-lock.yaml` `1e9e256937fe8cf7c5e469ae522b11d7c6b458a0`; `.replit` `1489e8ab835a947e398ab2babbd57f7a32a169d8`.
- Replit connector's latest publish status is `failed`, deployment ID `03378589-2eed-47f9-b501-c54a5bccfa7c`. **Published artifact/source SHA = UNKNOWN; runtime HTTP status = NOT_TESTED**. No live claims derive from tracked workspace.
- Historical Issue #72 mentions 140 paths across a different published checkpoint. This remains historical and **not independently reconstructed**.

## Updated NO-COPY STOP manifest

The existing 21-path A140 source provenance file is now extended **only** with `stop_matrix_w5r` containing eight explicit owner-scoped STOP categories: 

| Protected category | Mandatory W5R transfer decision | Next owner / acceptance gate |
|---|---|---|
| Steam Catalog admin write auth | **STOP_NO_AUTO_COPY** — release router has unguarded writes; both Steam router and Steam admin middleware are absent from Replit's tracked workspace. Do not infer published runtime. | A30/A40; review PR #34 guard and 503/403 negative tests before considering any catalog write route; DB gate separately |
| PG16 migrations | **STOP_NO_AUTO_COPY** — release/editor 0030 provenance conflict; executed migration ledger unverified. | A20/A22/A30, signed D01–D04; no SQL or migration actions |
| OBS and stream overlay | **STOP_NO_AUTO_COPY** — differing Replit `App.tsx`; GitHub release includes `/stream/overlay/camera-chat`. OBS runtime untested. | A120/A40, source/route/asset parity and isolated QA |
| Static route fallback | **STOP_NO_AUTO_COPY** — Replit tracked `/* → /index.html`; release also includes legacy `/dev/animated-effects` rules, not proved valid. | A120/A140, actual staging 404/MIME/direct-load; PR #103 pure helper is unwired |
| Unity / game assets | **STOP_NO_AUTO_COPY** — GitHub release Unity `index.html` exists; unverified cross-environment bundle. | Game owner + A120, complete bundled assets and checksums; no edits |
| Portfolio | **STOP_NO_AUTO_COPY** — Replit tracked portfolio index missing; GitHub release source exists. Published state unknown. | A120/A40, complete HTML/CSS/assets and route closure |
| Animated Effects static | **STOP_NO_AUTO_COPY** — Replit tracked index missing; GitHub release source exists. Published state unknown. | A120/A40, complete hashed JS/CSS/static bundle; no route placeholder |
| Replit environment/config/lockfile | **STOP_NO_AUTO_COPY** — `.replit`, static artifact TOML, Vite and lockfile differ between source trees. | A20/A40/A140, isolated reviewed source reconciliation and owner gate |

Machine-readable file:
`docs/web-005/agent-reports/A140/WEB-005_A140_WAVE4_TRANSFER_CANDIDATES.json`, updated W5R Git blob `c84b89e0ae1a39ef4024705ba9c305d8341ba5e5`; the original 21-path inventory and its transfer eligibility counts remain unchanged. The W5R section assigns **zero approved Live transfers**.

## Dependencies and collision check

- A40 C03 Draft PR #134 currently pinned HEAD `80bb4ca7a9a359fbe76dbab1478a1af16ded0174` and base C02 PR #101 `a5bfd07b822c223fd995604dc2e228935ab81498`.
- A140 PR #116 (prior 6 changed paths) and A40 C03 PR #134 (2 adapter/test paths) **have no changed-path collisions**. W5R edits are limited to the already A140-owned JSON and this report, so no cross-owner application source is touched.
- A120 PR #103 source-only routing helper current HEAD `9fb85b2ca5c137c6107a360bbdb45efec6bf1dde` was **not** copied, fixed, or modified by A140; MASTER DISPATCH assigns async exists fix to A120.
- PR #105 Basic Authorization redaction belongs to A50; PR #135 native preflight belongs to A20. A140 does not duplicate those tasks.
- Steam PR #34 `fae2eea2f22df3f1b02ad035a7db00bc411ea73f` is **not approved for Replit deployment**; no shared catalog-admin token or production DB exposure.

## Checks and executable evidence

**Actually performed:** 
1. GitHub PR metadata/changed path readback for #116/#134 and immutable GitHub release source files. No GitHub merge or deploy.
2. Replit Agent read-only `git rev-parse`, `git ls-tree HEAD`, `git status --porcelain` and rewrite source inspection (Agent-reported; current workspace only).
3. In the orchestration JavaScript V8 tool, parsed the existing manifest, appended only `stop_matrix_w5r` and asserted **9/9 in-memory structural/STOP-policy checks PASS** before saving. This is **not Node TAP**, nor application functionality testing.
4. GitHub source artifact edit via `update_file`: only the pre-existing A140 JSON at the verified blob SHA, edit commit `930967bd2f221da8cff0de273c07f40f10b0f10b`.
5. Replit provider last-publish state rechecked: `failed`.

**Test command & environment:** JavaScript in ChatGPT connector/orchestration V8; structural checks 9/9 PASS, no shell process or TAP exit code. **Native `node --test`, app-level CLI, Node TAP/exit, full CI, HTTP/browser, all database/PG16, deployment and rollback: NOT_RUN in W5R.** Prior historical A140 8/8 synthetic Node fixtures must not be counted as newly executed.

**Relevant shared CI (NOT A140-executed):** C03 GitHub Actions https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39133034753 — MASTER DISPATCH reports targeted adapter 20/20 PASS and workspace typecheck PASS, but full workflow **FAIL** because API integration exit 1; first failing TAP assertion UNKNOWN. This **does not** establish C03 integrated acceptance.

## Confirmed vs unverified

- **Confirmed source state:** GitHub release router contains Steam write operations without PR #34 admin guard. Replit read-only Agent reports those Steam files absent from tracked HEAD, and lists current rewrite as global fallback only. These facts make automatic copying unsafe.
- **Not confirmed:** which code is actually being served by Live; complete historic 140-path drift; runtime Steam/OBS/Unity/portfolio behavior; migration ledger; native app E2E. Absence from tracked workspace is **not** proof of absence from deployed Live.
- **File conflicts:** no A140/C03 changed-file overlap, but potential **semantic conflicts** with routes, auth, migrations, dependencies and game asset bundles. Preserve all until verified by owning agents.

## Handoff / stop decision

**A10 (source):** include W5R A140 source-only manifest delta at current PR #116 exact HEAD.  
**A40 (integration):** enforce the eight STOP categories as no-copy blacklist for C03 or a future source candidate. Do not stage live sync or treat unverified Replit artifacts as transfer sources.  
**A60 (QA):** separate manifest structural/source verification from actual published/runtime testing, and retain API integration FAIL.  
**A00:** choose future owner/provenance gates before any Live integration; no new implicit PG16 permissions.  

**Final:** `W5R_A140_STOP_MATRIX_DONE / REPLIT_WORKSPACE_ONLY_CONFIRMED / PUBLISHED_BYTES_UNKNOWN / SOURCE_ONLY / NO_COPY_NO_SYNC_NO_DEPLOY / RELEASE_NO_GO`.
