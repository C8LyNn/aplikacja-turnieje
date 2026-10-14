# WEB-005 — A120 — R15 T100 Acceptance Matrix (EXACT-SHA / SOURCE ONLY)

**AGENT:** A120 — Presentation & Bracket Views  
**TASK:** `WEB-005-T100-A120-R15` · **WAVE:** R15.1 (2026-10-14 Europe/Warsaw)  
**AUTHORITY:** central `docs/web-005/WEB-005_WAVE_R15_AGENT_PROMPTS.md` blob `e6950cbff7e521ed9b3ff774e7787e8d598a966d`, §§0–2 + `AGENT A120`.  
**MODE:** `SOURCE ONLY`; no code, merge, new PR, CI rerun, production browser or SWARM-006.  
**EVIDENCE:** `SOURCE_CONFIRMED` details below; `PATCH_PROPOSED` for both PRs; `RUNTIME_VERIFIED: NOT VERIFIED`; `SOURCE_ACCEPTED BY A60: NOT VERIFIED`; `RELEASE_NO_GO`. Authored/defined tests are **NOT executed PASS**.

## 1. Exact frozen PR pins / source scope

- **Repository:** `C8LyNn/aplikacja-turnieje`; release base `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` (verified unchanged in R15).
- **P14 / PR #47:** https://github.com/C8LyNn/aplikacja-turnieje/pull/47 ; `OPEN DRAFT / UNMERGED`; HEAD **`f09a13623faca8d7ab29b09a2c5b43907c2acd0b`**; exactly **six** changed files, nine commits from base:
  - `artifacts/tournament-manager/src/components/stage-progress-view.tsx` (blob `fd95b1fa4812e3af14a95c8146410dcb7aae4fa6`);
  - `artifacts/tournament-manager/src/components/stage-progress-view.test.tsx` (blob `ced3edc0bcd1c2d44948f2e9760f427b0eda493e`);
  - `src/pages/tournament-bracket.tsx`, `src/pages/public-stage-views.test.tsx`, `src/pages/tournament-audience.tsx` (blob `ffe5ce79bfb975c03bc934a0364502a80682bc4f`), `src/pages/tournament-audience.test.tsx` (all under `artifacts/tournament-manager`).
- **P21 / PR #54:** https://github.com/C8LyNn/aplikacja-turnieje/pull/54 ; `OPEN DRAFT / UNMERGED`; HEAD **`dbba0eb82920b4f324866b1b983e1211459f52ec`**; exactly **two** changed files, five commits from base:
  - `artifacts/tournament-manager/src/pages/tournament-detail.tsx` blob `7d03d3ea7a14883fd7d6b0010eebd14c1f11d00d`;
  - `artifacts/tournament-manager/src/pages/tournament-detail.rr-readback.test.tsx` blob `21eaad81248eb26c9430dfcd77ccb261ca11f191`.
- PR #47 and #54 each branch from release; **PR #54 does NOT contain PR #47**. No composite hash or integrated regression exists. Freeze exact SHAs during QA: if moved, restart evidence classification and record new SHA.
- R15 live GitHub checks found **0 review submissions** for PR47/54. An independent A60 report might be on a separate agent surface; direct signed exact-SHA link was **not verified here**. No `SOURCE_ACCEPTED` claimed.

## 2. A50: safe frontend-only executable runbook — separate checkouts

**Prerequisites:** authorized local nonproduction checkout, `git`, Node **22**, pnpm **10**, unmodified lockfile/dependencies, no production API keys/tokens or shared PostgreSQL. Confirm tests only use mocked HTTP/React Query. No repository merge, paid CI rerun or composite branch.

**Prepare exact branches safely** from a local repo checkout using separate detached worktrees (choose the path names freely; do not force-reset any existing worktree). The following are **proposed commands, NOT run by A120**:

```bash
git fetch --no-tags origin fix/web-005/t100-presentation-pr-a-r11
git fetch --no-tags origin fix/web-005/t100-rr-readback-r13
git cat-file -t f09a13623faca8d7ab29b09a2c5b43907c2acd0b
git cat-file -t dbba0eb82920b4f324866b1b983e1211459f52ec
git worktree add --detach ../web005-t100-pr47 f09a13623faca8d7ab29b09a2c5b43907c2acd0b
git worktree add --detach ../web005-t100-pr54 dbba0eb82920b4f324866b1b983e1211459f52ec
```

Execute the **following commands once per worktree** from its **monorepo root**, never assume they ran because a file exists:

```bash
git rev-parse HEAD
git status --short
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm --filter @workspace/tournament-manager test
pnpm --filter @workspace/tournament-manager typecheck
pnpm --filter @workspace/tournament-manager build
```

If frozen install is impossible, `BLOCKED`: record missing package/internet/lockfile error and exit; **do not** use unsafe `--no-frozen-lockfile`, unapproved paid CI, shared DB or a fabricated PASS. For test-only assurance, full test run is the primary command.

**Optional focused commands:** change directory to each worktree's `artifacts/tournament-manager`, whose `test/run-tests.mjs` uses `node --import tsx --import ./test/setup-dom.mjs --test` and `TSX_TSCONFIG_PATH`:

```bash
# POSIX, from the package directory in PR47 worktree:
TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json" node --import tsx --import ./test/setup-dom.mjs --test \
  src/components/stage-progress-view.test.tsx \
  src/pages/public-stage-views.test.tsx \
  src/pages/tournament-audience.test.tsx

# POSIX, from the package directory in PR54 worktree:
TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json" node --import tsx --import ./test/setup-dom.mjs --test \
  src/pages/tournament-detail.rr-readback.test.tsx
```

Windows PowerShell equivalent (from each package directory): set `$env:TSX_TSCONFIG_PATH = (Resolve-Path ./test/tsconfig.json).Path`; invoke `node --import tsx --import ./test/setup-dom.mjs --test <the exact files above>`; record `$LASTEXITCODE`; restore/remove the temporary environment variable afterward.

**Receipts REQUIRED for each run:** `agent=A50`, `task`, `PR`, `git rev-parse HEAD`, `base_sha`, `cwd`, local run timestamp, Node/pnpm version, frozen-install outcome, command, *actual process exit code*, TAP tests/pass/fail/skip/timeout, anonymized logs/screenshots, test environment and explicit `NOT_EXECUTED` for missing gates. Separate `RT_SOURCE_ONLY` from `RUNTIME_VERIFIED`. No secrets in logs.

## 3. Bounded PR47 React matrix — exact expected outcomes

| ID / source | Input or fixture | REQUIRED expected observation |
|---|---|---|
| **DE-01 / RT-T100-01** `stage-progress-view.test.tsx` | selected stage DE21, revision 4, includes Upper, Lower, Grand Final, Grand Final Reset | dedicated `/api/tournaments/9001/stages/21/double-elimination` GET; all 4 sections, `canManage=false`, `canReset=false`; no score mutation controls/requests |
| **DE-02 / RT-T100-02** same | old RR20 deferred GET resolves after selecting DE21; dedicated DE graph carries wrong stageId=99 variant | selected DE21 remains the only graph; historical RR20 player not shown; wrong-ID response rejected |
| **DE-03 / RT-T100-03** same | dedicated DE GET 403/500→manual retry 200; delayed request, valid empty graph | visible fail state and retry with no retained DE graph; loading and empty state distinct; successful retry restores response |
| **LABEL-04 / RT-T100-04** `public-stage-views.test.tsx` | tournament compatibility format RR; active selected stage DE | stage heading uses **Podwójna eliminacja**, not raw enum/tournament RR; correctly selected DE endpoint |
| **FINAL-05 / RT-T100-05** `tournament-audience.test.tsx` | completed, `featuredMatchId=901`, winnerId=202, standing rank1=201 | completed summary overrides hero; visible official winner player 202, no lingering live hero |
| **ACTIVE-06 / RT-T100-06** same | active featured match 901 | hero visible; no false completed summary |
| **CHAMP-07 / RT-T100-07** existing Audience regression | persisted winnerId points to a different player than rank1 | winner by ID (F054 **RETENTION ONLY**; no new patch) |
| **LABEL-10 / RT-T100-10** Audience and public stage | test group stage & DE, verify all five map entries source | labels: `single_elimination=Drabinka eliminacyjna`, `double_elimination=Podwójna eliminacja`, `group_stage=Faza grupowa`, `round_robin=Każdy z każdym`, `swiss=System szwajcarski`; Audience tournament-wide badge uses `tournament.format` intentionally |

A60 must independently inspect if asserted DOM paths genuinely cover UX (especially completed winner text vs parent element, stale cache after generic `detailQuery.error` 401/403 and accessibility). **Authored assertions are not yet a demonstrated PASS.**

## 4. Bounded PR54 React matrix — source N→N+1 and no stale private data

| ID / source | Deterministic stimulus | REQUIRED expected observation |
|---|---|---|
| **RR-01 / F058-R13-01** `tournament-detail.rr-readback.test.tsx` | cached canonical RR stage detail N=1, parent matches revision→2, then stage active / revision→3 | exactly selected RR key invalidated and new canonical GET updates v2/v3; tournament standings invalidated; identical snapshot doesn't spin refetches; no client-computed rank |
| **RR-02 / F058-R13-02** same | old detail N promise intentionally held, new N+1 refetch succeeds, old N resolves late | older N never overwrites newer result; record request chronology and abort/React Query cancellation behavior |
| **RR-03a/b / F058-R13-03** same | previously authorized v1 cached; following RR detail GET returns HTTP 401 or 403; retry 200 v2 | cache-backed private content not visible after denial, including first paint; retry only after valid server response; 401 and 403 are independent runtime cases |
| **RR-04 / F058-R13-04** same | only DE/non-RR stage changes | RR bridge does not trigger extra stage-detail GET; no SE/DE presentation regression |
| **RR-05 / F058-R13-05** same | external terminal RR completed→active; matches unchanged | stage lifecycle change alone invalidates canonical RR detail, reads stage-specific status/rank; no fabricated restart |
| **RR-06 / F058-R13-06** same | denied Undo/Revert returns 409 and server snapshots unchanged | no invalidation storm or locally synthesized pending/winner/rank changes |

**SOURCE_CONFIRMED original gap:** `tournament-detail.tsx` parent `/matches` and `/stages` polls every 5s, but `StageProgressView` separately caches `GET /stages/:id` without that polling. Other-browser mutations do not invoke current viewer's local invalidation. **STATIC_INFERRED**, not browser-confirmed: user can see stale RR finalRank/status until successful canonical readback. PR54's fingerprint observer is `PATCH_PROPOSED`; actual race/401/403 behavior requires A50 execution and A60 independent signoff.

## 5. Bounded browser acceptance protocol — isolated/nonproduction only

**Precondition:** owner-approved isolated browser fixture (two independent sessions/browsers, fake synthetic players and matches), latest PR HEAD checked out **separately** and served with safe local/mock API. No user data, no live tournament, no production result writes. Browser cases are **MANUAL TEST SCRIPTS**; no automated Playwright harness claimed. Test URL/routes should be taken from the actual running preview, not invented here. If no isolated runnable application/API fixture exists, **`BLOCKED / NOT_EXECUTED`**, not PASS.

| Browser case | Steps in isolated fixture | Required screenshot/HTTP evidence |
|---|---|---|
| **BR-01 DE Details/public** (PR47) | Open organizer Details for tournament 9001 with selected DE21; navigate to public Bracket, verify Upper→Lower→Grand Final→Reset; switch to RR20 and back | screenshots of four DE sections and selected stage, Network GET stageId21, no score/reset write requests, no RR20 graph residue |
| **BR-02 labels** (PR47) | Test fixtures for all five stage formats, including legacy tournament.format RR with active DE stage | five Polish labels, correct selected-stage label vs tournament-wide badge; no raw known enum |
| **BR-03 final/featured** (PR47) | Active featured match shown; server switches tournament to completed while featured ID persists and standings leader differs from official winner | active hero before; completed final summary after, persisted winnerId, no hero overlay on completed, Network response match/tournament versions |
| **BR-04 RR external update** (PR54) | Organizer browser A and second host browser B on same synthetic RR; B changes a result and later performs allowed terminal reopen; A remains in Standings tab | capture N and N+1 GET responses for `/matches`, `/stages`, `/stages/:id`, `/standings`; after successful authorized read A uses server rank/status, no old rank assertion; document latency without asserting fixed SLA |
| **BR-05 RR delay/denial** (PR54) | Delay old N `/stages/:id` GET, respond N+1 first then N late; in separate 401/403 fixture revoke RR Stage Details access after authorized cache, then permit retry | no stale N overwrite; private RR rows hidden on 401/403 and restored only after valid 200; timestamped request order + screenshot; do NOT use real secrets |
| **BR-06 non-RR no-storm** (PR54) | Switch fixture to DE/SE, repeat ordinary polling and one DE-only match update | no RR stage-detail refetch due solely to DE; original DE read-only behavior intact, no unbounded requests |

**If backend sports PR45 is not independently accepted, browser RR terminal reopen semantics are `BLOCKED_DEPENDENCY`** and must not be simulated as if production policy were signed. Can still test mock readback component with artificial canonical successful/denied GETs, clearly label the distinction.

## 6. Cross-PR interaction audit: privacy, collision and later integrated-only checks

**A100 / PR53 private cache:** https://github.com/C8LyNn/aplikacja-turnieje/pull/53 HEAD `6a8f0c3e5775eb056df75ebdd7b33df7cbc78979`, OPEN DRAFT. New `removeTournamentAuthQueries` primarily matches query keys beginning `/api/tournaments/<id>`, while existing `lib/deadlock-bans-picks.ts` uses `["tournaments",tournamentId,"player-bans"]` and `["matches",matchId,"game-picks"]`. Neither shape is covered by that URL matcher. The second key requires explicit match→tournament attribution: **never clear unrelated tournaments globally to simulate success**. The existing `use-tournament-auth.test.tsx` fixture may render `AuthProvider` without `QueryClientProvider` while PR53 introduces `useQueryClient`. These are source-risk hypotheses/known gap candidates owned by A100, not an A120 code lane or asserted runtime exploit. A50/A60 should verify PR53 on its own exact SHA; full combined auth/privacy acceptance belongs to authorized future integration.

**PR54 vs PR43/PR50:** Both https://github.com/C8LyNn/aplikacja-turnieje/pull/43 (CSV, HEAD `96a6068f69027574ac76e18d4d5a2c444b5a914a`) and https://github.com/C8LyNn/aplikacja-turnieje/pull/50 (Backup preview, HEAD `5457a74187edc263730c3a4b25a663bdf5531ee9`) change the **same** `artifacts/tournament-manager/src/pages/tournament-detail.tsx` file as PR54. This is **SOURCE_CONFIRMED file-level integration overlap**, not a verified same-hunk git conflict until integrator attempts a permitted merge. No merging, cherry-picking or rebase in WEB-005.

**PR47↔PR54:** PR47 changes `src/components/stage-progress-view.tsx`, which is mounted by PR54's parent Details page; individual source tests cannot prove their combined runtime behavior. Future SWARM-006 authorized integration test must cover their effects together with PR43/PR50 and A100/PR53 on a **future composite SHA**, not inferred from independent branches.

**A80/PR45 sports dependency:** https://github.com/C8LyNn/aplikacja-turnieje/pull/45 (HEAD `a7a87bc019731191dbfa44bee6939e3fa25e27f4`) fixes stage-scoped terminal RR roster, but backend disposable-PG16 acceptance is not independently verified by A120. No local standings recomputation can substitute for that evidence.

**Pack19 baseline:** PR47 automatic workflow `38596198607`, PR54 `38606249912` both `COMPLETED FAILURE` at early `Pack 19 snapshot consistency tests`; historical matcher `readOnly:true` versus current `accessMode:"read only"`, corrected separately in PR35. No T100 React/typecheck/browser steps verified from those CI workflows; don't label T100 FAIL based on Pack19 and don't claim runtime PASS. No manual paid reruns.

## 7. Go / Hold / Final A00 decision

- **T100 NEW SOURCE PATCH NEEDED?** None demonstrated by A120 R15. Already identified F052/F053/F055 have draft PR47, F058 has draft PR54, and F054 champion remains a regression-only PR32 fix. An exact-SHA A50/A60 failure can justify a **new separate A00 code-lane GO**, not automatic code churn. Failure of a test fixture alone requires evidence of whether implementation or fixture is wrong.
- **What remains OPEN:** `RUNTIME_VERIFIED` React/typecheck/build on both exact SHA, signed `SOURCE_ACCEPTED` by A60, controlled browser cases, A100 private cache interaction, authorized cross-PR regression after formal handoff.
- **One principal unblocker:** A50 publishes **real command+exit receipts** for exact PR47 and PR54 SHAs, then A60 publishes independent acceptance/rejection referring to those exact SHAs. No verified direct A50/A60 R14 artifact URL was identified in GitHub PR/central-doc checks, so `NOT_VERIFIED_BY_COORDINATOR` not “did not exist”.
- **STOP:** no app code/PR/merge/cherry-pick/rebase, composite SHA, staging/live, production SQL, shared DB or paid CI rerun, no SWARM-006.
- **RELEASE GATE:** `RELEASE_NO_GO`; next decision A00/HQ, final-only SWARM-006 after full WEB-005 closeout.
