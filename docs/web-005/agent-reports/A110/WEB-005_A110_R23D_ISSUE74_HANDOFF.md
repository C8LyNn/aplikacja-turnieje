# WEB-005 — A110 R23D / Issue #74 — Basket CAS GET 401/403 draft preservation

**Task / queue:** `WEB-005-T055-A110-R23D-ISSUE74` · [issue #74](https://github.com/C8LyNn/aplikacja-turnieje/issues/74) · P1 narrowly authorized frontend test-first correction  
**Agent:** A110 — Basket Concurrency & Frontend State · **Date:** 2026-10-16 Europe/Warsaw  
**Dispatch:** [WEB-005_R23D_EXECUTION_DISPATCH_20261016.md](../../WEB-005_R23D_EXECUTION_DISPATCH_20261016.md), Git blob `226b6a89c3fd8348eac814221de1c9715ee6ae25`.  
**Final author disposition:** `CAS_CLIENT_FIX_QA_PENDING / TESTS_AUTHORED_NOT_EXECUTED / SERVER_PENDING / FEATURE_DISABLED / NO_GAMES_CHANGED / NO_LIVE_DEPLOY / RELEASE_NO_GO / SWARM006_HOLD`.

## 1. Actual source mutation and exact live identity

**Existing** [DRAFT PR #63](https://github.com/C8LyNn/aplikacja-turnieje/pull/63) updated on its own isolated branch `WEB-005-T055-A110-R23C-CAS-CLIENT`; no new PR, no merge/rebase/cherry-pick.

| Source reference | Exact SHA |
|---|---|
| R23C starting PR63 HEAD | `3ddcfea2ba47f4314fced3022d00922f8cedb0e3` |
| **R23D updated HEAD** | **`a4119b29a78b72d400947d8dd5bd100c59d6444e`** |
| PR63 base | `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` |
| Current GitHub release reference (distinct) | `1db3734b8988940acc6be8b992420a58fc39624a` |
| Replit live local checkpoint (not Github) | `cb55335ea8e789d5e0f7912955da7d679d7dbb5f` (dispatch only, **not deployed or inspected** here) |

**R23D diff vs R23C PR63 HEAD:** only **four existing CAS frontend files**, no game, no backend, no DB or existing production screen changes:

| Changed file (PR63 branch) | R23D blob SHA | Purpose |
|---|---|---|
| `artifacts/tournament-manager/src/lib/stage-basket-cas-draft.ts` | `1176e4ded08b297133163a3c2481939df2015e33` | Preserve private draft **in memory** after GET 401/403, but revoke `view()` access, prevent writes and require explicit GET revalidation |
| `artifacts/tournament-manager/src/lib/stage-basket-cas-draft.test.ts` | `5802405c4e34956a997dc1b54eb701b1e0b73512` | Six new focused Node test cases R23D-74-01..05,07 |
| `artifacts/tournament-manager/src/components/basket-cas-conflict-review.tsx` | `8a6b96ec1c0918571291f66056cc9b574f421214` | Redacted authorization-blocked message; only explicit safe fetch control |
| `artifacts/tournament-manager/src/components/basket-cas-conflict-review.test.tsx` | `d45de50175038e50d43a78f44c09f84e5bbc856a` | One new RTL test R23D-74-06, no stale local/remote graph rendered |

**No changes under** `public/prototypes/minigames/` or any Core Clash, Unity WebGL, Evolution Runner, randomizer/game engine, canvas, HTML loader, binary, or balance source. Neither `tournament-detail.tsx` nor `stage-baskets-panel.tsx` was touched. The default-disabled isolated Basket CAS client remains **unmounted**. No protected merges, force-push, new migrations, SQL/PG16 reset, CI rerun, live deploy or Replit publish.

## 2. Root cause, security nuance and bounded fix

**Independent preceding finding:** [A60 R23C PR63 source QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R23C_PR63_A110_SOURCE_QA.md), Git blob `5ddf1db2a0aa04afc0b801ac3bd776c5e87f4c8d`, flagged P2-63-01: `refreshRemote()` on denied GET threw without handling privilege lifecycle and could retain readable local graph and canonical token. Old A60 recommendation was to clear data on GET 401/403, while later **owner A00 GitHub [issue #74](https://github.com/C8LyNn/aplikacja-turnieje/issues/74)** explicitly specifies **retaining the unsaved draft** while isolating unauthorized state. This is a **narrower owner-directed remedy**, **not** a claim of independent A60 acceptance. New independent A60 source QA on current SHA must resolve the privacy semantics.

**Implemented behavior:**
1. Failed `refreshRemote()` with 401/403 moves same-scope session to `authorization-blocked`, saves only the HTTP status, discards `remoteCanonical` reference from presentation and blocks `save()`/editing/manual reconciliation. Internal unsaved organizer graph stays in **ephemeral private memory**, not query cache/localStorage/sessionStorage.
2. `view()` in blocked phase always returns **null** for `localDraft` and `remoteCanonical`, `changes=[]`, no exposed base ETag. The unmounted optional React component renders only a generic access-denied message with explicit user-triggered GET; it never reveals old basket names/roster/colors or runs HTTP PUT.
3. If the **same** authenticated tournament/principal epoch becomes authorized again, a separately initiated successful server GET fetches a new canonical revision, transitions to manual `reviewing` and restores the local draft **only for that scope**. Reconcile still needs `confirmedByOrganizer:true` and a **separate** save; no automatic retry/rebase/overwrite. After 412/428, earlier draft-retention semantics stay unchanged.
4. Explicit `switchScope()` on another tournament or auth/principal epoch destroys the previous draft/ETag and invalidates old in-flight responses; `destroy()` still clears all. A stale 401 response from the old scope or an earlier same-scope request cannot put a newer authorized session back into blocked state; guarded by `epoch` and incrementing `remoteRequestId`.
5. Ordinary non-auth/network errors do not delete the local draft or pretend GET succeeded; they remain an explicit conflict/retry path. Previous PUT 401/403 behavior continues to clear scope, as originally designed. The externally supplied nonsecret `authContextId` **must rotate on actual principal/role/logout**; the module is not yet wired to any production auth lifecycle.

**Invariant:** retained `draft` in privileged in-memory closure ≠ authorization to render, edit, submit or send it. No denied GET may issue or promote a fresh canonical token.

## 3. Authored fail-first tests and honest QA

**R23D new cases:** R23D-74-01 GET403 retain internally/redact externally/block save and allow same-scope GET recovery; 02 GET401 after existing review hides stale remote; 03 auth/tenant switch irreversibly clears hidden draft; 04 old delayed 401 after scope switch cannot taint B; 05 stage/roster edits persist under blocked GET until revalidation; 06 RTL denied-page redaction and explicit refresh; 07 old denied GET cannot override newer successful same-scope GET.

**Counts:** original R23C 28 frontend cases + **7 R23D new cases = 35 authored tests** on PR63. **Do not call 35 PASS.**

**Actually executed by A110 this R23D:** no Node/TS typecheck/tsx/RTL/browser/integration test commands against a real pinned full repo; no command exit/TAP for these cases. This agent used the GitHub connector for exact source fetch/update, PR metadata and CI logs; the available isolated container does **not** hold an authorized complete checkout with frozen workspace dependencies. Execution status: `NOT_EXECUTED` (not test failure or PASS).

**Future safe A50 command** in isolated immutable clone of the **exact HEAD**:
```bash
git rev-parse HEAD  # require a4119b29a78b72d400947d8dd5bd100c59d6444e
pnpm install --frozen-lockfile
pnpm --filter @workspace/tournament-manager run typecheck
cd artifacts/tournament-manager
TSX_TSCONFIG_PATH=./test/tsconfig.json node --import tsx --import ./test/setup-dom.mjs --test \
  ./src/lib/stage-basket-cas-client.test.ts \
  ./src/lib/stage-basket-cas-draft.test.ts \
  ./src/components/basket-cas-conflict-review.test.tsx
```
No database test is required for this isolated frontend source; full PG16/backend/HTTP verified CAS D1–D5 remains a **separate** owner/A20/A50 QA gate with distinct written reset scope.

**Automatic CI at updated PR63 HEAD:** [GitHub Actions run 38876069415](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38876069415), `completed/failure`; [job 116891310569](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38876069415/job/116891310569) failed at inherited **Pack19 snapshot consistency**: old matcher expects `isolationLevel:"repeatable read",readOnly:true`, actual source uses `accessMode:"read only"`; verified from real job log. Subsequent gates skipped and **no R23D CAS frontend tests ran**. Independent PR35 already addresses Pack19 in its own branch; not fixed/bypassed here, no paid/manual CI rerun.

**Author source QA only (not independent):** exact PR/file SHA verified, no game paths, feature still default-disabled/unmounted, scoped 401/403 redaction tested in authored fixtures, no client-side ETag synthesis or automatic PUT retry added. **A60 independent source review on updated exact HEAD is PENDING**; earlier A60 R23C privacy blocker remains unresolved until fresh independent verdict.

## 4. Dependencies / rollback / handoff

- **Backend pending:** PR55 remains test-only; A20 basket revision/generation and authoritative migration ID + full writer/trigger lock audit pending; server real GET strong ETag/PUT If-Match 412/428 and A90 Backup V3 clone compatibility pending. No enabling of `featureEnabled` or `serverCasVerified` while backend unverified.
- **Integrator/release:** PR63 is still a draft based on old release `1fdc...`, while current GitHub release is `1db373...`, and the Replit live checkpoint is a separate local SHA. A00/A40 must reconcile integration and drift before any future independently authorized cutover; **never overwrite live Replit workspace from this branch**.
- **Rollback if independent QA rejects source:** the R23D source patch is five narrow additive commits on PR63 after R23C SHA `3ddcfea2ba47f4314fced3022d00922f8cedb0e3`; A00 can request a controlled follow-up rollback that restores only the four affected CAS source/test files to their old blobs. Do not force-push or merge without separate GO.
- **Next A60:** review the explicit `authorization-blocked` in-memory quarantine vs earlier suggested clear-on-403 policy, same-principal reauth path, no stale render, deferred GET ordering, explicit logout/role reset, 401/403 UI redaction, test validity and TypeScript compilation **on HEAD `a4119b29a78b72d400947d8dd5bd100c59d6444e`**. A10 register new SHA; A00 retains final release gate.

**Actual conclusion:** `R23D_ISSUE74_PATCH_SOURCE_PUBLISHED / CAS_CLIENT_FIX_QA_PENDING / TESTS_NOT_EXECUTED / FEATURE_OFF / NO_GAME_CHANGES / NO_LIVE / RELEASE_NO_GO / SWARM006_HOLD`.
