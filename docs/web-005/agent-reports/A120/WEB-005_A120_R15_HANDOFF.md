# WEB-005 — AGENT A120 — WAVE R15 HANDOFF FOR A00

**DATE:** 2026-10-14 Europe/Warsaw  
**AGENT:** A120 — Presentation & Bracket Views  
**TASK:** `WEB-005-T100-A120-R15`  
**MODE / AUTHORITY:** `SOURCE ONLY` per central `WEB-005_WAVE_R15_AGENT_PROMPTS.md` blob `e6950cbff7e521ed9b3ff774e7787e8d598a966d`, §§0–2 and `AGENT A120`. No code lane, no new PR, no merge/deploy/integration authority.
**FINAL STATUS:** `R15 AUTHOR QA PACKAGE COMPLETE`; T100 `PATCH_PROPOSED / A50 RUNTIME NOT VERIFIED / A60 SOURCE_ACCEPTED NOT VERIFIED / RELEASE_NO_GO`.

## 1. Exact GitHub pointers (verified at R15 readback)

**Repository:** `C8LyNn/aplikacja-turnieje`.  
**SOURCE_BASE:** `release/tournament-ops-20261013-01` HEAD `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.

- **P14 / PR47** https://github.com/C8LyNn/aplikacja-turnieje/pull/47 — `OPEN DRAFT`, unmerged, HEAD **`f09a13623faca8d7ab29b09a2c5b43907c2acd0b`**, 6 changed files. F052 DE stage-scoped details, F053 five-format labels, F055 completed hero precedence, F054 official winnerId **regression only**.
- **P21 / PR54** https://github.com/C8LyNn/aplikacja-turnieje/pull/54 — `OPEN DRAFT`, unmerged, HEAD **`dbba0eb82920b4f324866b1b983e1211459f52ec`**, 2 changed files. F058 external RR match/stage result canonical detail+standings readback, source-only private RR denied-data suppression.
- **PR53 (A100 auth privacy)** https://github.com/C8LyNn/aplikacja-turnieje/pull/53 — HEAD `6a8f0c3e5775eb056df75ebdd7b33df7cbc78979`, independent unmerged draft.
- **PR43 CSV** https://github.com/C8LyNn/aplikacja-turnieje/pull/43 — HEAD `96a6068f69027574ac76e18d4d5a2c444b5a914a`, draft.
- **PR50 Backup preview** https://github.com/C8LyNn/aplikacja-turnieje/pull/50 — HEAD `5457a74187edc263730c3a4b25a663bdf5531ee9`, draft.
- **PR45 RR terminal-roster backend** https://github.com/C8LyNn/aplikacja-turnieje/pull/45 — HEAD `a7a87bc019731191dbfa44bee6939e3fa25e27f4`, draft.
- **Exact integrated/composite SHA:** NONE VERIFIED. No WEB-005 merge/main or production rollout.

**Reviewed actual source paths:**

PR47: `artifacts/tournament-manager/src/components/stage-progress-view.tsx`, `src/components/stage-progress-view.test.tsx`, `src/pages/tournament-bracket.tsx`, `src/pages/public-stage-views.test.tsx`, `src/pages/tournament-audience.tsx`, `src/pages/tournament-audience.test.tsx`.  
PR54: `artifacts/tournament-manager/src/pages/tournament-detail.tsx` (blob `7d03d3ea7a14883fd7d6b0010eebd14c1f11d00d`) and `src/pages/tournament-detail.rr-readback.test.tsx` (blob `21eaad81248eb26c9430dfcd77ccb261ca11f191`).  
PR53 privacy interaction inspected: `src/lib/tournament-query-invalidation.ts`, `src/context/auth-context.tsx` and release `src/lib/deadlock-bans-picks.ts`.  
All shorthand `src/` paths above live under `artifacts/tournament-manager/`.

## 2. Source evidence and scope (NOT A60 acceptance)

- **SOURCE_CONFIRMED prior F058 gap:** `tournament-detail.tsx` polls `/matches` and `/stages` every 5 seconds, but `StageProgressView` has its own canonical stage-details React Query cache. External browser/host writes don't trigger the viewing browser's local mutation invalidation. User-visible stale ranks are `STATIC_INFERRED` until browser repro.
- **PATCH_PROPOSED PR54:** readback bridge fingerprints RR-specific canonical stage status and match result/revision, invalidates stage detail + tournament aggregate standings only on a changed snapshot; ignores non-RR; hides cached RR details upon its observed query 401/403; no client recomputation of ranks and no backend sport policy change. Actual request races and first-paint visibility require runtime QA.
- **PATCH_PROPOSED PR47:** selected DE graph comes from existing dedicated endpoint with read-only presentation and error/mismatch handling; public stage format labels reuse `STAGE_FORMAT_LABELS`; completed tournament wins over stale featured hero, official champion retained via `winnerId`. F054 has no new fix.
- **PR53/A100 privacy scope:** source `removeTournamentAuthQueries` matches `/api/tournaments/<id>...` keys. Existing noncanonical keys `["tournaments",id,"player-bans"]`, `["matches",matchId,"game-picks"]` are not covered by that matcher. Match-only attribution is not safe to guess. A100 owns S2B remediation and separate GO; A120 made NO auth changes or claims of a complete privacy fix.
- **Other possible compatibility check:** PR53 uses `useQueryClient` within `AuthProvider`; pre-existing test fixture may not wrap it in `QueryClientProvider`. This is a source-observed test harness risk, not an executed failure, owned by A100/A50/A60.

## 3. Executable test and browser matrix delivered

**PRIMARY REQUIRED ARTIFACT:** [`WEB-005_A120_R15_T100_ACCEPTANCE.md`](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A120/WEB-005_A120_R15_T100_ACCEPTANCE.md).

This includes:
- Safe separate detached worktree instructions for PR47/PR54 exact HEADs; frozen install; Node22/pnpm10, front-end `pnpm --filter @workspace/tournament-manager test`, `typecheck`, `build` commands; optional focused existing TSX runner paths (plus PowerShell instructions).
- **PR47 bounded React matrix** RT-T100-01/02/03/04/05/06/07/10: DE Upper/Lower/GF/Reset, old stage response rejection, loading/403/500+retry, selected-stage labels for all five formats, active featured vs completed final champion (winnerId retention).
- **PR54 bounded React matrix** F058-R13-01..06 (with separate 401 and 403 runtime cases): RR N→N+1 stage/standings readback, old deferred N response cannot overwrite N+1, unauthorized cache hide, non-RR no refetch, stage-only reopen, unchanged/rejected event no-op.
- **Bounded isolated browser matrix** BR-01..06 with two synthetic sessions, actual request timeline, screenshot/evidence, no production site, no invented release/sport policy; failed backend dependency explicitly marked BLOCKED.
- A50 required `SHA/cwd/Node/pnpm/command/exit/test counts/logs` plus exact branch isolation; A60 strict independent acceptance criteria.

**Tests actually run by A120 R15:** **`NOT_EXECUTED`** (React, typecheck, build, browser and PostgreSQL; no process exit codes). GitHub metadata/source inspection and authored test definitions are not an app PASS. **No verified A50 real execution receipt** or independent A60 signed exact-SHA report URL was located in inspected GitHub PR reviews and central documentation at this stage; possible separate agent outputs are `NOT_VERIFIED_BY_COORDINATOR` rather than declared nonexistent.

**CI truth:** PR47 run `38596198607` = `FAILURE` at prior Pack19 snapshot consistency; PR54 run `38606249912` = `FAILURE` at the same Pack19 gate. The release baseline matcher expects `readOnly:true`; code uses `accessMode:"read only"`. Existing PR35 owns the correction. **No verified T100 RTL/typecheck/browser test ran in either workflow**; not evidence of T100 PASS or FAIL. No manual paid rerun.

## 4. Dependencies and verified conflict levels

- **Confirmed same-file change:** PR54, PR43 and PR50 all modify `artifacts/tournament-manager/src/pages/tournament-detail.tsx` on separate release-derived branches. This is a **file collision risk**, NOT a verified git same-hunk conflict or authorization to combine. Future authorized SWARM-006 integrator must inspect the actual composed hunk resolution and run combined QA.
- **Presentation cross-PR:** PR47 changes `StageProgressView` child and PR54 wraps organizer Tabs containing it. Tests on two separate SHAs cannot prove final combined rendering or request/caching behavior; later authorized composite QA only.
- **Privacy:** PR53 global cache and its uncovered noncanonical bans/picks keys interact with PR54 page-only 401/403 hiding, but A100 owns the code and policy. Future integrated negative private logout/refetch test needed; no broad purge invented.
- **Backend:** PR45 canonical RR terminal stage roster semantics plus PR39/42 Revert/Undo remain separately reviewed drafts; frontend test fixtures must not pretend a legally finalized sporty backend state was runtime verified.
- **Open owner policy:** DE GF placements, terminal Swiss, SE actionable rounds, basket CAS, Backup B2, auth TTL/hash, Direct Revert remain outside A120's R15 scope.

## 5. GO/STOP, one unblocker, next A00 action

**GO used:** verified live GitHub current SHA/PR/source/tests, prior A120 handoffs, CI failures and privacy/collision evidence; authored runnable bounded QA plan; published R15 T100 acceptance + this handoff in `docs/web-005/agent-reports/A120/` on central documentation branch.

**STOP respected:** **NO application code edits**, PR head changes, new PR, merge/cherry-pick/rebase, composite branch, Replit, staging/live/deploy, DB reset, paid CI rerun, unauthorized reviewer self-acceptance or SWARM-006.

**One decisive unblocker for T100:** A50 sends **two real exact-SHA frontend test/typecheck/build receipts** — PR47 and PR54 — to A60; A60 issues independent `SOURCE_ACCEPTED` / `FAIL` on pinned heads with executed evidence; A00 decides whether any precise FAIL merits its own newly-authorized corrective lane. If unable to run, A50 publishes executable `BLOCKED` receipt and A00 remedies environment instead of granting PASS.

**Does T100 need another source patch now?** **NOT DEMONSTRATED.** F052/F053/F055 and F058 have isolated candidate fixes; F054 remains a regression. Present obstacle is **QA + dependency/integration acceptance**, not proven absence of a third implementation. Do not turn hypothetical defects into PR55 without failure evidence and explicit owner GO.

**FINAL:** `WEB-005` still OPEN; `RELEASE_NO_GO`; `SWARM-006 HOLD`, one final transfer only after whole accepted backlog closes and HQ approves.
