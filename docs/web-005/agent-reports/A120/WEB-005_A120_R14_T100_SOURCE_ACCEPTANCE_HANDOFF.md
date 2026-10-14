# WEB-005 — A120 / R14 — T100 SOURCE ACCEPTANCE HANDOFF

**WAVE:** R14.1 · 2026-10-14 Europe/Warsaw  
**AGENT:** A120 — Presentation & Bracket Views  
**TASK:** `WEB-005-T100-A120-R14`  
**AUTHORITY:** central `WEB-005_WAVE_R14_AGENT_PROMPTS.md` at `chore/web-005/t000-wave1-control`, blob `e3fc34cee212e23c7516a2271af1080c96eff9a0`, §§0–2 and `AGENT A120`.  
**MODE:** SOURCE-ONLY / AUTHOR QA SUPPORT; **NO CODE, NO NEW PR, NO MERGE GO**.  
**VERDICT:** `PATCH_PROPOSED / QA_PENDING / RUNTIME_NOT_VERIFIED / RELEASE_NO_GO`. This is **author evidence**, NOT A60 independent `SOURCE_ACCEPTED`.

## 1. GitHub source pins and factual scope (rechecked in R14)

| Candidate | Base / exact HEAD and status | Diff |
|---|---|---|
| **PR47 / T100 PR-A / F052, F053, F055 and F054 retention** | https://github.com/C8LyNn/aplikacja-turnieje/pull/47 · HEAD `f09a13623faca8d7ab29b09a2c5b43907c2acd0b` · OPEN DRAFT, UNMERGED | **6 files**, 9 commits ahead of release |
| **PR54 / T100 PR-B / F058** | https://github.com/C8LyNn/aplikacja-turnieje/pull/54 · HEAD `dbba0eb82920b4f324866b1b983e1211459f52ec` · OPEN DRAFT, UNMERGED | **2 files**, 5 commits ahead of release |
| **Shared release base** | `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`, verified unchanged | No composite/merged T100 HEAD |
| **PR43 / CSV** | https://github.com/C8LyNn/aplikacja-turnieje/pull/43 · HEAD `96a6068f69027574ac76e18d4d5a2c444b5a914a`, OPEN DRAFT | Touches `src/pages/tournament-detail.tsx` |
| **PR50 / Backup UX** | https://github.com/C8LyNn/aplikacja-turnieje/pull/50 · HEAD `5457a74187edc263730c3a4b25a663bdf5531ee9`, OPEN DRAFT | Also touches `src/pages/tournament-detail.tsx` |
| **PR45 / RR terminal roster** | https://github.com/C8LyNn/aplikacja-turnieje/pull/45 · HEAD `a7a87bc019731191dbfa44bee6939e3fa25e27f4`, OPEN DRAFT | Separate backend `revert-match.ts` changes; PG16 accepted evidence not established |

All PRs in this table independently base on the same release SHA; PR54 **does not include** PR47 changes. Not integrated or tested together. No `APPROVED` GitHub review found for PR47 or PR54 at R14 preflight; a separate A60 report may exist elsewhere and must be obtained before assigning acceptance. Do not infer that absence of GitHub approval proves absence of any A60 review.

**Exact PR47 file set:**

- `artifacts/tournament-manager/src/components/stage-progress-view.tsx` — dedicated DE Details graph (source blob `fd95b1fa4812e3af14a95c8146410dcb7aae4fa6`).
- `src/components/stage-progress-view.test.tsx` — DE positive, loading/error/late-stage and identity fixtures (`ced3edc0bcd1c2d44948f2e9760f427b0eda493e`).
- `src/pages/tournament-bracket.tsx`, `src/pages/public-stage-views.test.tsx`.
- `src/pages/tournament-audience.tsx`, `src/pages/tournament-audience.test.tsx`.

**Exact PR54 file set:**

- `artifacts/tournament-manager/src/pages/tournament-detail.tsx` (blob `7d03d3ea7a14883fd7d6b0010eebd14c1f11d00d`) — scoped `RoundRobinReadbackBridge` observing canonical `/matches` + `/stages` and invalidating exact RR Stage Details and aggregate Standings query keys on changed snapshot; tab-spanning denial presentation for RR 401/403.
- `src/pages/tournament-detail.rr-readback.test.tsx` (blob `21eaad81248eb26c9430dfcd77ccb261ca11f191`) — **6 conceptual `test(` declarations**; HTTP 401/403 parametrization expands one declaration to **two runtime cases**. No execution-count inference until A50 runs them.

## 2. Source evidence — what is confirmed, what is not

### PR54 F058 (RR fresh canonical server readback)

**SOURCE_CONFIRMED baseline bug:** Parent `tournament-detail.tsx` polls `useListMatches` and `useListTournamentStages` every **5000 ms**; the nested `StageProgressView` uses a separate `useGetTournamentStage(tournamentId, stageId)` query without its own refetch interval. The backend's stage detail endpoint supplies stage-specific participant `status, finalRank, stageSeed`; aggregate tournament standings is not interchangeable with that roster. Existing local `invalidateTournamentDependentQueries` handles some same-client writes but cannot be assumed to fire when a different browser/host updates results. Thus the **missing cross-client detail refresh trigger is source-confirmed**; an actual stale production screen remains `STATIC_INFERRED` until reproduced in an isolated browser.

**PATCH_PROPOSED PR54:** The page-local bridge stores a fingerprint per RR stage of canonical stage status/winner/round and match ID/revision/status/result/scores; on a changed fingerprint for an already observed same tournament/stage, it invalidates the exact generated `getGetTournamentStageQueryKey` and tournament standings key, letting React Query retrieve server data. Unchanged polls do not invalidate; non-RR stages are excluded. Bridge remains mounted across organizer tabs (also while aggregate Standings tab is displayed). A 401/403 from the RR stage detail query causes tab-level cached presentation to be hidden with a manual retry. No client-created winner, ranking, requalification, sporting rule or backend write.

**RUNTIME NOT VERIFIED:** Promise race/cancellation, cross-tab behavior, denial cache transition, polling periodicity, readback latency, screenshot state, React type safety. It is also **not an atomic API snapshot**; list/matches/details may reflect different moments until successful convergence. The local 401/403 guard does not replace A100's global session cache cleanup and must not be described as resolving every private-page leak.

### PR47 F052/F053/F055 + F054 regression

**SOURCE_CONFIRMED PATCH_PROPOSED:** selected nonplanned DE Details retrieves `useGetDoubleEliminationStage` keyed by selected `tournamentId/stageId` and renders read-only `DoubleEliminationBracket` with loading, 403/500 error+retry, empty, and mismatched response guards. Public Bracket uses shared five-format `STAGE_FORMAT_LABELS` for the selected stage; Audience shares canonical format labels for tournament-level badges. Audience prioritizes completed summary before a retained featured match and derives winner from `tournament.winnerId`. **F054 is retention only:** its source repair existed already in PR32; don't create another champion fix.

**RUNTIME NOT VERIFIED:** real DE layout/accessibility and reset sections, 403/500 data hiding in practice, late stage switch race, 5-format display compatibility, completed-vs-active Audience and persisted champion regression.

## 3. A50 exact-SHA execution package — commands PROPOSED, NOT RUN BY A120

Run on **separate exact checkouts** (NO composite merge) with verified Node22/pnpm10 and locked workspace install. From monorepo root:

```bash
git rev-parse HEAD
node --version
pnpm --version
pnpm --filter @workspace/tournament-manager test
pnpm --filter @workspace/tournament-manager typecheck
pnpm --filter @workspace/tournament-manager build
```

Run the same sequence independently for PR54 head `dbba0eb82920b4f324866b1b983e1211459f52ec`, and PR47 head `f09a13623faca8d7ab29b09a2c5b43907c2acd0b`. Always record the **actual** `git rev-parse HEAD` result before claiming evidence.

Optional focused runner **from `artifacts/tournament-manager` package working directory**, where `tsx` is installed:

```bash
TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json" node --import tsx --import ./test/setup-dom.mjs --test src/pages/tournament-detail.rr-readback.test.tsx
```

For PR47 (different checkout, same package cwd):

```bash
TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json" node --import tsx --import ./test/setup-dom.mjs --test src/components/stage-progress-view.test.tsx src/pages/public-stage-views.test.tsx src/pages/tournament-audience.test.tsx
```

This focused command is shell syntax for POSIX; on Windows PowerShell set `$env:TSX_TSCONFIG_PATH = (Resolve-Path './test/tsconfig.json').Path` then invoke `node --import tsx --import ./test/setup-dom.mjs --test ...` from package cwd, and clear/restore the temporary environment variable afterward. The supported cross-platform `pnpm --filter ... test` command is preferred for the full suite.

**Required log fields:** `task_id`, `PR`, `base_sha`, `head_sha`, `cwd`, `Node/pnpm versions`, locked dependency install confirmation, `command`, `exit_code`, TAP/RTL `PASS/FAIL/SKIP`, timestamp, resolved response/fixture IDs, redacted log links. Frontend mocked tests require no PostgreSQL, should not connect to shared DB. No manual paid CI rerun authorized.

### A50/A60 strict PR54 matrix (run as authored; determine validity, don't presume PASS)

| Test / fixture | Canonical stimuli | Required independent observation |
|---|---|---|
| **F058-R13-01** | RR stage31 details snapshot v1; external match revision 2 then stage active/revision3 | new canonical stage GET replaces backend fields, aggregate standings invalidated; unchanged polling produces no refetch storm |
| **F058-R13-02** | delayed old GET for RR N resolves after newer successful N+1 | older N cannot overwrite newer rendered content on same tournament+stage; capture request ordering |
| **F058-R13-03 / 401 and 403** | cached private detail v1; future canonical GET denied; retry authorized 200 v2 | no stale RR participants/standings shown after denial, manual retry may restore only successful v2; confirm no transient flash or disclosure |
| **F058-R13-04** | DE/non-RR match change | zero RR-driven extra detail fetch; SE/DE and PR47 read-only DE continue functioning |
| **F058-R13-05** | RR terminal completed→active from another host while match revision unchanged | stage-lifecycle fingerprint alone triggers canonical readback; actual player state sourced only from backend |
| **F058-R13-06** | blocked Revert/Undo 409; server snapshot remains the same | no fabricated client “reopened” state and no forced ranks |
| **Browser BR-T100-02 / RR-BR04** | approved isolated two-session RR fixture incl. SE8→RR4 backend semantics | screenshots + GET chronology show eventual convergence, historical nonqualifiers never regain eligible RR membership; PR45's PG16 backend correctness must be validated separately |

### A50/A60 strict PR47 matrix

| Contract | Exact user-visible requirement |
|---|---|
| **RT-T100-01** | selected DE graph includes Upper/Lower/Grand Final/Reset; request belongs to selected stage; no edit controls |
| **RT-T100-02** | late RR20 payload cannot contaminate selected DE21 and mismatched canonical DE stage ID is rejected |
| **RT-T100-03** | 403/500 → error without retained DE graph → authenticated retry, plus delayed fetch/empty state |
| **RT-T100-04** | DE selected stage label is `Podwójna eliminacja` even if legacy tournament format is RR |
| **RT-T100-05/06** | completed Audience wins over featured hero; live active featured hero continues to render |
| **RT-T100-07** | official champion by `winnerId`, not first aggregate standings row (existing F054 regression only) |
| **RT-T100-10** | five canonical format names, including group stage and DE; tournament-level Audience label not falsely rewritten to stage format |
| **Browser BR-T100-01/03/DE-BR04** | approved isolated DE/Bracket/Audience layout, state change and late-query response; record screenshots and route/GET trace |

**A60 additionally checks** PR47's error handling of cached `detailQuery.data` after a 401/403 on **generic Stage Details** (as distinct from the dedicated DE query); PR54's bridge hides denied RR data **only on the tournament Details surface**. Global query cache after logout/role changes belongs to A100 PR53 security acceptance. Whether a cache issue is a demonstrated defect requires real controlled repro and exact route scope; no extrapolation to all pages.

## 4. CI truth and independent review gate

- PR47 head `f09a13623faca8d7ab29b09a2c5b43907c2acd0b` automatic Actions `38596198607` → **FAILURE** at job `115963443350` `Pack 19 snapshot consistency tests`.
- PR54 head `dbba0eb82920b4f324866b1b983e1211459f52ec` automatic Actions `38606249912` → **FAILURE** at job `115997784820` `Pack 19 snapshot consistency tests`.
- Both Pack19 gate failures expected obsolete matcher `readOnly:true` while actual Drizzle code uses `accessMode:"read only"`; separate open PR35 fixes the matcher. Both workflows halted prior to T100 React/typecheck/build; **neither is runtime evidence for T100**. No manual rerun.
- R14 lookup: GitHub review submissions on PR47 and PR54 `0` each; **A60 signed external report not verified**. No `SOURCE_ACCEPTED` label issued by this author. A50 actual app command+exit evidence on these exact SHAs not found in the inspected PR/CI history and is **NOT VERIFIED**, not categorical proof no other system has records.
- Previous R11/R13 author static-check counts are source inspection only, not independent signoff.

## 5. Dependencies, integration collisions, ownership boundaries

**EXACT SAME-PATH COLLISION:** `artifacts/tournament-manager/src/pages/tournament-detail.tsx` is independently modified by PR54 (RR bridge), PR43 (CSV FileReader) and PR50 (Backup preview). This is a **confirmed shared-file change**, not yet proof of an unavoidable same-hunk merge conflict. Whoever eventually integrates must inspect combined diffs and reconcile it; WEB-005 A120 has no merge/cherry-pick/rebase authority.

**Presentation dependency:** PR47 modifies `src/components/stage-progress-view.tsx` and DE UI, while PR54 modifies the page that mounts it. Their individual working source branches do not include each other; cross-PR interaction must be checked only in authorized later integration. No home-made composite branch.

**Backend sports dependency:** PR45 RR terminal roster reopen changes `src/application/matches/revert-match.ts` (API server). It is `PATCH_PROPOSED`, not independently PG16 verified by A120. PR39 MP1 and PR42 MP2A define lifecycle/Undo candidate behavior; no A120-authorized policies chosen. Acceptance must use canonical server Stage Details and legal 409/authorization semantics.

**Privacy/auth ownership:** PR53 A100 (HEAD `6a8f0c3e5775eb056df75ebdd7b33df7cbc78979`) owns global private query cache and logout/revocation. PR54's page-local RR 401/403 guard must be tested together with A100's separately approved policy, but A120 must not alter auth helpers or claim all private caches safe.

## 6. Decision to A00 — is new T100 implementation actually needed?

**No separate source-confirmed new implementation task from R14 evidence.** The confirmed initial bugs have isolated draft patches: F052/F053/F055 in PR47; F058 in PR54; F054 source-correctness is covered by pre-existing PR32 + retention tests. R14 reveals **acceptance debt** (A50 runtime, A60 independent exact-SHA review, later integrated conflict testing), not an authorized rationale for PR55+.

**ONLY IF** A50/A60 prove a focused FAIL tied to pinned PR47/54 SHA, A00 may issue a *new explicit corrective GO* and an exclusive file lane. If private revocation needs global auth/cache changes, delegate scope to A100; if terminal RR/backend mismatch, delegate to A80/A70; if same-path integration incompatibility, reserve for future SWARM-006. Avoid speculative code churn.

**One unblocker:** A50 must produce real React/typecheck/build evidence on **both exact SHAs** and hand logs to A60 for signed disposition. Without that, T100 stays `PATCH_PROPOSED / QA_PENDING / RELEASE_NO_GO`.

**STOP:** no code edits, new PR, merge/rebase/cherry-pick, composite SHA, staging/live/deploy, SQL or shared DB tests, paid rerun, SWARM-006.  
**NEXT:** A50 test evidence → A60 independent source+runtime verdict → A00 resolve genuine FAIL and owner dependencies → later single final SWARM-006 handoff only after formal WEB-005 closure.
