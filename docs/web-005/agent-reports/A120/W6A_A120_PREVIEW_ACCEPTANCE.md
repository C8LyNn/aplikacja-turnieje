# WEB-005 / WAVE 6A — A120 LOCAL PREVIEW ACCEPTANCE

**Task:** `WEB005-W6A-A120-PREVIEW-ACCEPTANCE` · **Role:** A120 — Presentation & Bracket Views  
**Mode:** TEST-ONLY / SOURCE-ONLY / OPERATOR_REQUIRED for real local preview.  
**Prepared:** 2026-10-19 Europe/Warsaw.  
**Authority:** [W6A MASTER DISPATCH](https://docs.google.com/document/d/1ujc0yc5MRoe4wPr07y9op029B8s8U8rGd9TNhJB-AEs/edit), A120 section and §0–§3/§5–§8.  
**Actual W6A result:** `PREVIEW_CONTRACT_PREPARED / REAL_PREVIEW_NOT_RUN / FULL_CHECKOUT_NOT_AVAILABLE / RELEASE_NO_GO`. This document contains **future executable commands and expected outcomes**, not test receipts.

## 1. Frozen exact source and QA dependencies

| Ref | Exact HEAD | State |
|---|---|---|
| Release | `1db3734b8988940acc6be8b992420a58fc39624a` | Unchanged reference |
| [PR103](https://github.com/C8LyNn/aplikacja-turnieje/pull/103) pure router | `9fb85b2ca5c137c6107a360bbdb45efec6bf1dde` | OPEN DRAFT, helper UNWIRED |
| [PR142](https://github.com/C8LyNn/aplikacja-turnieje/pull/142) async exists fix | `b289cbd75ebc828d3e562eabef5ae40d1e92cce5` | OPEN DRAFT, child of PR103 |
| [PR120](https://github.com/C8LyNn/aplikacja-turnieje/pull/120) presentation test suite | `e97e9d582e76cc4c4b6ba5bb784c89feb6be50ab` | OPEN DRAFT, **sibling** child of PR103; NOT based on PR142 |
| [PR135](https://github.com/C8LyNn/aplikacja-turnieje/pull/135) local readiness | `cb261868f68b5bab3559398e514013dbd2a21078` | OPEN DRAFT, A20-owned operator preflight |
| [PR134](https://github.com/C8LyNn/aplikacja-turnieje/pull/134) C03 | `80bb4ca7a9a359fbe76dbab1478a1af16ded0174` | Frozen; API integration exit 1 |
| [PR116](https://github.com/C8LyNn/aplikacja-turnieje/pull/116) Replit protection | `e89798e5a553c738428d61e37a20dc72685f7e8e` | A140 NO_AUTO_COPY zones |

**Independent A60 W5R:** [W5R_A60_FINAL_QA.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/e0375536cc77b97b92bb7b9d0f7bb53f80dbc9e1/docs/web-005/agent-reports/A60/W5R_A60_FINAL_QA.md) exact file blob `af1a681f422d4c057ab12ae1790c870a178ce1b6`. A60 executed **17/17 native Node22 PASS, exit 0** on byte-matched PR142 test files and accepted **only** the synchronous fail-closed classifier at exact PR142 SHA. A60 did **NOT** accept a real HTTP server adapter or a PR120+PR142 combined source tree. No existing merge/composite is authorized.

**Current A120 executor preflight (actual):** `node --version` → `v22.16.0`; `pnpm` → NOT_FOUND; `git` → 2.47.3; no full `pnpm-workspace.yaml`/monorepo checkout in available container folders. Thus no PR120 4-source-test native run, frontend typecheck/build, browser or preview smoke in W6A. A20's previous **13/13 Node PASS** is limited to its preflight unit tool, **not** this preview.

## 2. Trusted full-checkout prerequisites and exactly what to run

**Operator-owned only** after A20's [separate Windows disposable-checkout instructions](https://github.com/C8LyNn/aplikacja-turnieje/blob/cb261868f68b5bab3559398e514013dbd2a21078/docs/web-005/agent-reports/A20/W5R/W5R_A20_EXECUTOR_UNBLOCK.md). No live Replit folder, existing active branch, production environment, Windows PGDATA, or user credential copying. Operator must record approved isolated folder, full 40-char git HEAD, clean-tree status, Node version, SHA256 of `pnpm-lock.yaml`, plus **presence/NAMES only** of DB/PG/REPLIT/DEPLOYMENT_TASK variables (if any → STOP without printing values). A20 verifies workspace completeness first. Node tests below do **not** need pnpm or a database, but they **do** need all tracked files, including public assets.

**Two different detached source worktrees/checkout refs are required** because PR142 and PR120 are siblings. Do not merge, rebase or copy files to simulate a combined source:

    # Windows PowerShell — run only inside A20-verified isolated FULL checkout of PR120 HEAD
    git rev-parse HEAD
    # Must exactly print e97e9d582e76cc4c4b6ba5bb784c89feb6be50ab
    node --version
    node --test scripts/deployment/presentation-route-source-contract.test.mjs
    # Expected: 4 tests / 4 PASS / 0 FAIL / 0 SKIP; otherwise FAIL/BLOCKED
    node --test scripts/deployment/presentation-route-refresh.integration.test.mjs
    # Expected: 12 tests / 12 PASS / 0 FAIL; simulated HTTP only

    # In a SEPARATE A20-approved isolated full checkout of PR142 HEAD:
    git rev-parse HEAD
    # Must exactly print b289cbd75ebc828d3e562eabef5ae40d1e92cce5
    node --test scripts/deployment/static-route-policy.test.mjs scripts/deployment/static-route-policy.async-exists.test.mjs
    # Expected: 17 tests / 17 PASS / 0 FAIL / 0 SKIP

Record each **actual** process exit/TAP and provenance; the numbers above are EXPECTATIONS or historical A60 receipt, not new W6A execution. If either worktree lacks dependencies/assets and a source test reports SKIP, **stop and report SKIP, never promote to PASS**. Running root `pnpm test`, package install, API server or PG16 is NOT authorized by this contract.

## 3. Local preview acceptance matrix (future, NOT_RUN)

Only after A20/A00 separately approve an isolated complete local preview and **prove listening on loopback 127.0.0.1** (never broadly bind API). Set a verified **explicit** preview base such as `http://127.0.0.1:5173`. Do not use a Replit/live hostname or any public URL. PR103/142 is UNWIRED; an unadapted Vite or Replit static host may still fail missing-resource 404. **Do not change or deploy host rules as part of this test.**

| Test ID | GET path (replace 42 with a **synthetic** fixture ID) | Expected response / UI, not yet observed |
|---|---|---|
| LP-01 | `/tournaments/42/bracket` | HTTP 200 HTML SPA document; browser directly opens bracket and F5 preserves route; real bracket requires mock/approved API fixture |
| LP-02 | `/tournaments/42?tab=standings` | 200 SPA shell, organizer standings tab stays selected after browser reload; `/standings` is NOT a registered equivalent |
| LP-03 | `/tournaments/42/audience?section=standings` | 200 SPA shell; public standings section stays selected after reload |
| LP-04 | `/tournaments/42/audience?section=bracket` | 200 SPA shell; bracket audience section after reload |
| LP-05 | `/tournaments/42/host?tab=tabela`, `/tournaments/42/projector` | 200 SPA shell; host/projector content, permissions and errors checked independently in browser |
| LP-06 | `/stream`, `/stream/overlay/camera-chat`, `/developer/overlay/camera-chat` | 200 SPA shell; actual stream and OBS overlays preserved after reload |
| LP-07 | `/experimental/tournaments/42/bracket`, `/experimental/tournaments/42/audience?section=standings` | 200 SPA shell; experimental path/query preserved |
| LP-08 | `/portfolio/`, `/portfolio/projects/`, `/stream/animated-effects/` | HTTP 200 **actual standalone HTML**, no rewriting to the wrong app; directory index physically present |
| LP-09 | `/__w6a_absent__/x.ttf`, `/__w6a_absent__/x.wasm`, `/__w6a_absent__/x.js` | **Actual HTTP 404** (NOT HTML200 SPA), non-HTML Content-Type, no `<div id="root"` |
| LP-10 | `/stream/animated-effects/assets/index-CQVbN-Tt.js`, `/stream/animated-effects/assets/index-B16dW5Hr.css` | HTTP 200, valid JS and CSS MIME; no SPA HTML substitution |
| LP-11 | `/prototypes/minigames/core-clash-unity/Build/WebGL.loader.js`, `.../WebGL.wasm`, game index | Existing exact game bytes preserved; real response 200, JS/WASM proper MIME, wasm magic `0061736d`; **never edit game files** |
| LP-12 | Browser at 320, 360, 390, 768, 1440 and 1920px widths | SE/DE graph horizontal scroll, winner label, standings table reachable; no clipped essential controls. **Not inferable from HTTP shell or CSS strings** |

**Release Git-tree immutable blob provenance** for legitimate static assets:
- portfolio index `197bd447df2449947fda3203ab76e7a63e58a48f`; projects index `98a74d8ab002d9ac34d01c042715ca3d6db4f7f4`.
- Animated Effects index `5af45933e47ac0bb84de9fb95cc761cc82b804e7`, icon `6893eb13237060adc0c968a690149a49faa2d7d3`, JS `07d3c219efb536760752bc63ae3cd185c9d35ed9`, CSS `d21707305988bae194d78b691a0a426d80b5ed9e`.
- Unity game index `0f9a2d47faabbd499953bbc92818a51ef7b54d9a`, loader `d43cae7d1aeeacfafee6ddfa39b1b223f430eb6a`, WASM `1a1b6c042bbad352be9cd240ebbe925f3ecae588` (21,294,320 bytes). These are **Git blob SHA-1, not SHA-256**. Only after actual full local preview operator approval may returned binary bytes be compared with immutable Git blobs; do not download 21MB WASM speculatively in this wave. If host intentionally transforms/compresses bytes, establish decoded-byte equivalence before comparing and log content encoding. No asset copying or modifications.

## 4. Small executable loopback-only HTTP contract (operator, NOT_RUN)

This is a **PowerShell here-string feeding Node22**. Run it only after approval and a verified local preview exists. The script refuses every non-loopback URL, uses GET without following redirects, collects **status/MIME** and performs basic SPA/missing/static assertions. It cannot verify rendered standings/brackets or game-byte hashes. All lines after setting the URL are read-only requests; no deployment or database access.

```powershell
$env:W6A_PREVIEW_URL = 'http://127.0.0.1:5173'  # approved local loopback ONLY
@'
const base = process.env.W6A_PREVIEW_URL;
let origin;
try { origin = new URL(base); } catch { console.error('STOP: invalid URL'); process.exit(2); }
if (origin.protocol !== 'http:' || origin.hostname !== '127.0.0.1' ||
    origin.pathname !== '/' || origin.search || origin.hash) {
  console.error('STOP: non-loopback or non-root preview target'); process.exit(2);
}
const paths = [
  ['/tournaments/42/bracket','spa'],
  ['/tournaments/42?tab=standings','spa'],
  ['/tournaments/42/audience?section=standings','spa'],
  ['/tournaments/42/audience?section=bracket','spa'],
  ['/tournaments/42/host?tab=tabela','spa'],
  ['/tournaments/42/projector','spa'],
  ['/experimental/tournaments/42/bracket','spa'],
  ['/stream','spa'],
  ['/stream/overlay/camera-chat','spa'],
  ['/portfolio/','html'], ['/portfolio/projects/','html'],
  ['/stream/animated-effects/','html'],
  ['/__w6a_absent__/x.ttf','missing'],
  ['/__w6a_absent__/x.wasm','missing'],
  ['/__w6a_absent__/x.js','missing'],
  ['/stream/animated-effects/assets/index-CQVbN-Tt.js','js'],
  ['/stream/animated-effects/assets/index-B16dW5Hr.css','css'],
];
let failures = 0;
for (const [path,kind] of paths) {
  try {
    const response = await fetch(new URL(path,origin),{
      redirect:'manual',signal:AbortSignal.timeout(10000)
    });
    const mime = (response.headers.get('content-type')||'').toLowerCase();
    const body = await response.text();
    const isHtml = mime.includes('text/html');
    const hasSpa = /id=["']root["']/.test(body);
    const ok = kind==='missing'
      ? response.status===404 && !isHtml && !hasSpa
      : kind==='spa'
      ? response.status===200 && isHtml && hasSpa
      : kind==='html'
      ? response.status===200 && isHtml && /<html|<!doctype/i.test(body)
      : kind==='js'
      ? response.status===200 && /javascript|ecmascript/.test(mime) && !isHtml
      : response.status===200 && mime.includes('text/css') && !isHtml;
    if (!ok) failures++;
    console.log((ok?'PASS':'FAIL')+' '+response.status+' '+mime+' '+path);
  } catch (e) { failures++; console.log('FAIL REQUEST '+path+' '+e.name); }
}
console.log('W6A PREVIEW '+(failures===0?'PASS':'FAIL')+
  ' total='+paths.length+' failed='+failures);
process.exitCode = failures?1:0;
'@ | node --input-type=module
$probeExit = $LASTEXITCODE
Write-Output "W6A_PREVIEW_EXIT=$probeExit"
```

**Expected only if a correctly wired approved host exists:** `17 total / 0 failed / exit 0`. If a server returns SPA HTML200 for missing TTF/WASM/JS, those checks **MUST FAIL**; do not suppress failures or rewrite the server in A120's lane. For direct browser F5 (LP-01..07) and visual/mobile checks (LP-12), capture network HAR/screenshots and stage/authorization fixture provenance separately. No browser was launched in W6A. Do not use API/PG16 to seed fixture 42 without separate explicit approval.

## 5. Test result ledger / ownership STOP

| Scope | W6A actual status | Next owner |
|---|---|---|
| GitHub PR heads and exact release Git tree | **SOURCE_CONFIRMED** | A10 / A60 |
| PR142 native 17/17 on exact SHA | **PRIOR_A60_PASS** (not rerun by A120 in W6A) | A60 |
| PR120 four formerly skipped full-checkout SOURCE cases | **NOT_RUN / OPERATOR_REQUIRED** | A20 provides full source; A60/A120 safely execute |
| PR120 synthetic HTTP suite on full checkout | **NOT_RUN** this wave; previous 12 PASS fixture is not host PASS | A20 / A60 |
| Approved local preview loopback HTTP GET matrix | **NOT_RUN / OPERATOR_REQUIRED** | A20 setup, A40 source parity, A120/A60 acceptance |
| Real F5, protected/private route behavior, responsive browser QA | **NOT_RUN / OPERATOR_REQUIRED** | authorized frontend/browser QA |
| Game asset HTTP-byte Git integrity | **NOT_RUN** | A40/A140 source-preservation owner |
| C03 app/API integration | **FAIL/UNKNOWN first API assertion** from prior authentic CI, unchanged | A50 / A60 / A00 |

**No new code or separate source PR in W6A.** The pure classifier is NOT_WIRED to the local/production host; HTTP-404 claim is UNVERIFIED. No path collisions created: PR142 and PR120 are different children of PR103; preserve both, do not rebase or merge in W6A. PR116 Replit STOP_NO_AUTO_COPY applies to all areas. No C04 creation, PG16/SQL/Docker, asset/game modifications, protected merge, deployment, paid CI, Replit live or SWARM-006.

**Verdict:** `A120_W6A_PREVIEW_CONTRACT_READY / SOURCE_ONLY / REAL_PREVIEW_NOT_RUN / OPERATOR_REQUIRED / RELEASE_NO_GO`.
