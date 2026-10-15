# Pack 03 Visual Hierarchy & Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one installable Pack 03 ZIP that gives the Experimental tournament frontend a semantically colored, layered visual hierarchy while preserving all Pack 02 behavior and Stable routes.

**Architecture:** Keep the existing Pack 02 routing and domain logic intact. Introduce a scoped Experimental visual-token contract in `experimental-tournaments.css`, expose those semantics through shared Experimental primitives, then add small status/tone annotations to existing Experimental surfaces. Package the changes as baseline-aware patch templates and scripts targeting commit `b7b8bec`.

**Tech Stack:** React 19, TypeScript, Tailwind-style utility classes, CSS custom properties, Wouter, Lucide, Node test runner, pnpm/Vite.

**Spec:** `docs/superpowers/specs/2026-10-01-pack-03-visual-hierarchy-design.md`

## Global Constraints

- Baseline commit is `b7b8bec feat: expand experimental tournament frontend`.
- Stable `/tournaments/*` must remain visually and behaviorally unchanged.
- Backend/API/database/migrations are untouched.
- No new tournament rules, readiness rules or bracket algorithms.
- Color must never be the only status signal.
- Installer must be CRLF/LF-safe, make an automatic backup, and rollback on failure.
- Deliver one ZIP with check/install/rollback/verify, templates, manifest, README and visual QA.
- Acceptance gate: typecheck PASS, full tournament-manager tests PASS, build PASS, Stable smoke checks PASS, Experimental route-containment PASS.

## Review Focus

- Stable route rendered after Pack 03: no Experimental class/token should alter Stable visuals; pin this in Task 1 and Task 8.
- Unknown/new status value: primitives and cards must fall back to neutral instead of crashing or becoming unreadable; pin this in Task 1 and Task 2.
- 320px / 200% zoom: semantic accents must not create fixed-width overflow; pin this in Task 7.
- Reduced-motion user: hover/lift/transitions must be disabled or minimized; pin this in Task 7.
- High-density Host/Players views: semantic decoration must not reduce information density or hide text; pin this in Task 5 and Task 7.

---

## File Structure

### New package files
- `tournament-exp-pack-03-check.mjs` — baseline/worktree guard.
- `tournament-exp-pack-03-install.mjs` — transactional installer.
- `tournament-exp-pack-03-lib.mjs` — shared patch, backup, rollback and verification helpers.
- `tournament-exp-pack-03-rollback.mjs` — explicit rollback.
- `tournament-exp-pack-03-verify.mjs` — structure, typecheck, tests, build.
- `tournament-exp-pack-03-visual-audit.mjs` — static visual-contract assertions.
- `tournament-exp-pack-03-templates/` — replacement/patch payload.
- `README-pack-03.md`, `MANIFEST-pack-03.md`, `VISUAL-QA-pack-03.md`.

### Product files expected to change
- `artifacts/tournament-manager/src/experimental-tournaments.css` — semantic tokens/surfaces/status classes.
- `artifacts/tournament-manager/src/features/experimental-tournaments/experimental-ui.tsx` — typed tone props.
- `artifacts/tournament-manager/src/features/experimental-tournaments/experimental-tournament-overview.tsx` — metric/lifecycle/quick-link tones.
- `artifacts/tournament-manager/src/features/experimental-tournaments/experimental-host-command-center.tsx` — live/ready/completed/warning tones.
- `artifacts/tournament-manager/src/pages/dashboard.tsx` — status annotations/classes for Experimental only.
- `artifacts/tournament-manager/src/pages/experimental/tournaments/create-tournament-experimental.tsx` — semantic section/readiness classes.
- `artifacts/tournament-manager/src/pages/tournament-detail.tsx` — Experimental Players integration classes only.
- `artifacts/tournament-manager/src/pages/tournament-host.tsx` — Experimental match-state annotations only.
- `artifacts/tournament-manager/src/pages/tournament-audience.tsx` — Experimental broadcast semantic classes only.
- `artifacts/tournament-manager/src/pages/tournament-bracket.tsx` — Experimental bracket semantic classes only.
- `artifacts/tournament-manager/src/components/tournament-stages-panel.tsx` — status classes, no lifecycle logic change.
- `artifacts/tournament-manager/src/components/stage-baskets-panel.tsx` — flow/locked classes, no basket rule change.
- `artifacts/tournament-manager/src/features/experimental-tournaments/experimental-route-containment.test.ts` — Stable isolation / visual-contract regressions.

---

### Task 1: Semantic visual contract and shared primitives

**Files:**
- Modify: `artifacts/tournament-manager/src/experimental-tournaments.css`
- Modify: `artifacts/tournament-manager/src/features/experimental-tournaments/experimental-ui.tsx`
- Modify/Test: `artifacts/tournament-manager/src/features/experimental-tournaments/experimental-route-containment.test.ts`

**Interfaces:**
- Consumes: existing Pack 02 Experimental shell classes.
- Produces: `ExperimentalTone = "neutral" | "primary" | "info" | "success" | "warning" | "danger" | "live"` and optional `tone?: ExperimentalTone` props on metric/state/quick-link primitives.

- [ ] **Step 1: Write failing visual-contract tests**
  - Assert the CSS contains scoped semantic variables for info/success/warning/danger/live plus at least four surface levels.
  - Assert `experimental-ui.tsx` exports `ExperimentalTone`.
  - Assert unknown domain statuses are not mapped directly to CSS class names; call sites must choose a known tone.
  - Assert Stable selectors do not appear as unscoped semantic-token targets.

- [ ] **Step 2: Run focused test and confirm failure**
  - Run the existing Node test harness for `experimental-route-containment.test.ts`.
  - Expected: FAIL on missing semantic-token/tone markers.

- [ ] **Step 3: Implement the semantic token layer**
  - Add scoped custom properties under Experimental roots only.
  - Add reusable `.exp-tone-*`, `.exp-surface-*`, `.exp-status-*` helpers.
  - Add `@media (prefers-reduced-motion: reduce)` baseline for the new visual primitives.

- [ ] **Step 4: Extend shared primitive signatures**
  - Export `ExperimentalTone`.
  - Add `tone?: ExperimentalTone` to `ExperimentalMetricCard`, `ExperimentalStatePanel`, and `ExperimentalQuickLink`.
  - Keep default `neutral` so Pack 02 call sites stay source-compatible.
  - Extend `ExperimentalStatusPill` to support all seven tones.

- [ ] **Step 5: Run focused test and typecheck**
  - Expected: focused tests PASS and no TypeScript errors.

- [ ] **Step 6: Commit**
  - Commit message: `feat: add experimental visual hierarchy tokens`

### Task 2: Dashboard and Create semantic hierarchy

**Files:**
- Modify: `artifacts/tournament-manager/src/pages/dashboard.tsx`
- Modify: `artifacts/tournament-manager/src/pages/experimental/tournaments/create-tournament-experimental.tsx`
- Modify: `artifacts/tournament-manager/src/experimental-tournaments.css`
- Test: existing Dashboard/Create tests plus route-containment visual assertions.

**Interfaces:**
- Consumes: `ExperimentalTone` and `.exp-tone-*`/surface helpers from Task 1.
- Produces: stable status-to-tone mappings for draft/active/completed and create readiness/section classes.

- [ ] **Step 1: Write failing tests**
  - Dashboard: draft -> neutral/info, active -> live/primary, completed -> success; unknown -> neutral.
  - Create: summary/readiness states expose semantic class/tone markers while submit payload/validation markers remain unchanged.
  - Stable dashboard has no new Experimental-only classes unless guarded by `isExperimental`.

- [ ] **Step 2: Run tests and confirm failure**

- [ ] **Step 3: Implement Dashboard annotations**
  - Add an explicit `statusTone(status)` helper local to Dashboard or Experimental feature utility.
  - Add Experimental-only hero/filter/card status classes.
  - Keep Stable rendering path unchanged.

- [ ] **Step 4: Implement Create visual annotations**
  - Tag primary form sections by function: basics/info, format/violet, access/warning-neutral, summary/readiness.
  - Use semantic tone for API-ready/error and readiness summary.
  - Do not alter request construction, validation, draft persistence, or navigation.

- [ ] **Step 5: Run Dashboard/Create tests and typecheck**

- [ ] **Step 6: Commit**
  - Commit message: `feat: enrich experimental dashboard and create hierarchy`

### Task 3: Overview semantic metrics and lifecycle

**Files:**
- Modify: `artifacts/tournament-manager/src/features/experimental-tournaments/experimental-tournament-overview.tsx`
- Modify: `artifacts/tournament-manager/src/experimental-tournaments.css`
- Test: `experimental-route-containment.test.ts`

**Interfaces:**
- Consumes: Task 1 tones.
- Produces: deterministic tone assignment for metrics, lifecycle, next step and quick links.

- [ ] **Step 1: Write failing tests**
  - Participants -> info, matches -> primary, progress -> success when completed otherwise primary, format -> violet/info.
  - Lifecycle done -> success; pending -> neutral/warning.
  - Next-step panel -> warning/primary but retains text describing the step.
  - Status pill still contains textual status.

- [ ] **Step 2: Run focused tests and confirm failure**

- [ ] **Step 3: Add tone props/classes to Overview**
  - No new readiness computation.
  - Keep existing `setupSteps()` descriptive behavior.

- [ ] **Step 4: Add CSS for visual progress line / differentiated metric cards**
  - Must reflow at 320px and not depend on color alone.

- [ ] **Step 5: Run focused tests and typecheck**

- [ ] **Step 6: Commit**
  - Commit message: `feat: add semantic tournament overview styling`

### Task 4: Players, Stages and Baskets hierarchy

**Files:**
- Modify: `artifacts/tournament-manager/src/pages/tournament-detail.tsx`
- Modify: `artifacts/tournament-manager/src/components/tournament-stages-panel.tsx`
- Modify: `artifacts/tournament-manager/src/components/stage-baskets-panel.tsx`
- Modify: `artifacts/tournament-manager/src/experimental-tournaments.css`
- Test: existing tournament-detail/stages/baskets tests.

**Interfaces:**
- Consumes: semantic CSS/status contract from Task 1.
- Produces: presentation-only classes for player status, stage lifecycle and basket state.

- [ ] **Step 1: Write failing regression tests**
  - Experimental player rows include status/seed presentation classes; stable rows do not change.
  - Stage planned/active/completed produce different semantic classes while existing readiness text/actions remain identical.
  - Locked basket has a locked semantic class and text remains visible.
  - 128-player rendering markers do not introduce fixed height/width constraints.

- [ ] **Step 2: Run relevant tests and confirm failure**

- [ ] **Step 3: Add Experimental Players annotations**
  - Use existing player status/seed values only.

- [ ] **Step 4: Add Stage lifecycle annotations**
  - Map existing lifecycle state to known semantic tones.
  - Do not change stage transition handlers.

- [ ] **Step 5: Add Basket flow annotations**
  - Differentiate input/output/locked/read-only surfaces.
  - Do not alter participant routing.

- [ ] **Step 6: Run tests and typecheck**

- [ ] **Step 7: Commit**
  - Commit message: `feat: clarify experimental roster stage and basket states`

### Task 5: Host operational hierarchy

**Files:**
- Modify: `artifacts/tournament-manager/src/features/experimental-tournaments/experimental-host-command-center.tsx`
- Modify: `artifacts/tournament-manager/src/pages/tournament-host.tsx`
- Modify: `artifacts/tournament-manager/src/experimental-tournaments.css`
- Test: existing Host tests plus visual-contract assertions.

**Interfaces:**
- Consumes: existing Host-derived counts/state and Task 1 tones.
- Produces: semantic Host metrics/match-card classes; no new match state.

- [ ] **Step 1: Write failing tests**
  - Live -> live tone and textual LIVE/in-progress state.
  - Ready -> warning/primary tone.
  - Completed -> success tone.
  - Error/stale -> danger tone.
  - Focus Mode behavior and keyboard shortcut tests remain unchanged.
  - Dense match list retains all names/results in DOM.

- [ ] **Step 2: Run Host tests and confirm failure**

- [ ] **Step 3: Update Host Command Center tone assignments**

- [ ] **Step 4: Add Experimental-only match-card state classes in Host**
  - Use current match status/revision state only.

- [ ] **Step 5: Add CSS hierarchy**
  - Live may use stronger border/glow, but no continuous flashing/pulsing.
  - Respect reduced motion.

- [ ] **Step 6: Run full Host tests and typecheck**

- [ ] **Step 7: Commit**
  - Commit message: `feat: strengthen experimental host match hierarchy`

### Task 6: Audience and Bracket hierarchy

**Files:**
- Modify: `artifacts/tournament-manager/src/pages/tournament-audience.tsx`
- Modify: `artifacts/tournament-manager/src/pages/tournament-bracket.tsx`
- Modify: `artifacts/tournament-manager/src/experimental-tournaments.css`
- Test: existing Audience/Bracket tests plus visual-contract assertions.

**Interfaces:**
- Consumes: semantic CSS classes.
- Produces: presentation-only broadcast/bracket state annotations.

- [ ] **Step 1: Write failing tests**
  - Audience current/live section has explicit textual and semantic marker.
  - Completed/recent result uses success/neutral treatment.
  - Bracket match states expose semantic classes without changing bracket data/order.
  - Long names still wrap in Experimental.

- [ ] **Step 2: Run tests and confirm failure**

- [ ] **Step 3: Implement Audience broadcast classes**

- [ ] **Step 4: Implement Bracket round/match-state classes**

- [ ] **Step 5: Run Audience/Bracket tests and typecheck**

- [ ] **Step 6: Commit**
  - Commit message: `feat: improve experimental audience and bracket hierarchy`

### Task 7: Accessibility and responsive visual pass

**Files:**
- Modify: `artifacts/tournament-manager/src/experimental-tournaments.css`
- Modify/Test: `artifacts/tournament-manager/src/features/experimental-tournaments/experimental-route-containment.test.ts`
- Create package doc: `VISUAL-QA-pack-03.md`

**Interfaces:**
- Consumes: all semantic classes from Tasks 1–6.
- Produces: reduced-motion, focus, 320px and 200%-zoom safeguards.

- [ ] **Step 1: Write failing static assertions**
  - `prefers-reduced-motion` block exists.
  - Focus-visible styling remains visible for semantic cards/links.
  - No new `white-space: nowrap` on primary content labels.
  - No fixed pixel width added to player/host/card content containers.

- [ ] **Step 2: Run focused assertions and confirm failure where applicable**

- [ ] **Step 3: Implement responsive/reduced-motion CSS**

- [ ] **Step 4: Write `VISUAL-QA-pack-03.md`**
  - Include 320/768/1024/1366/1920, 200% zoom, reduced motion, long names, 0/8/32/128 players, draft/active/completed/error/live states.

- [ ] **Step 5: Run focused tests and typecheck**

- [ ] **Step 6: Commit**
  - Commit message: `fix: harden experimental visual accessibility`

### Task 8: Package installer and regression guard

**Files:**
- Create: `tournament-exp-pack-03-lib.mjs`
- Create: `tournament-exp-pack-03-check.mjs`
- Create: `tournament-exp-pack-03-install.mjs`
- Create: `tournament-exp-pack-03-rollback.mjs`
- Create: `tournament-exp-pack-03-verify.mjs`
- Create: `tournament-exp-pack-03-visual-audit.mjs`
- Create: `tournament-exp-pack-03-templates/**`
- Create: `README-pack-03.md`
- Create: `MANIFEST-pack-03.md`

**Interfaces:**
- Consumes: final product changes from Tasks 1–7.
- Produces: one transactional installable Pack 03 ZIP targeting baseline `b7b8bec`.

- [ ] **Step 1: Write failing installer self-checks**
  - Check exact baseline markers from `b7b8bec`.
  - Refuse if targeted tracked files have unrelated local modifications.
  - Verify CRLF and LF normalization path.
  - Verify automatic rollback restores byte-equivalent targeted files after forced marker failure.
  - Verify Stable create page/backend/migrations are absent from target manifest.

- [ ] **Step 2: Run self-checks and confirm failure before scripts exist**

- [ ] **Step 3: Implement shared transactional library**
  - Normalize EOL only in memory and restore original EOL style.
  - Back up every existing target and record created files.
  - Patch exact known markers or replace approved full templates.
  - Roll back automatically on any installation error.

- [ ] **Step 4: Implement check/install/rollback scripts**

- [ ] **Step 5: Implement `visual-audit`**
  - Assert semantic tokens/primitives and Experimental-only target markers.
  - Assert Stable forbidden targets are absent.

- [ ] **Step 6: Implement verify**
  - Structure/visual audit.
  - `pnpm --filter @workspace/tournament-manager run typecheck`
  - `pnpm --filter @workspace/tournament-manager run test`
  - `pnpm --filter @workspace/tournament-manager run build`
  - Restore/flag generated Animated Effects index instead of committing it.

- [ ] **Step 7: Run installer syntax checks**
  - `node --check` on every `.mjs`.
  - Expected: zero syntax errors.

- [ ] **Step 8: Run installer against a clean baseline copy/worktree**
  - Expected: CHECK PASS, INSTALL PASS, visual audit PASS.

- [ ] **Step 9: Run full verify**
  - Expected: typecheck PASS, at least baseline 406 tests PASS, build PASS, VERIFY PASS.

- [ ] **Step 10: Run rollback test on a second clean baseline copy**
  - Expected: targeted files byte-equivalent to baseline after rollback.

- [ ] **Step 11: Build one ZIP**
  - Filename: `tournament-experimental-frontend-pack-03-visual-hierarchy.zip`.
  - Include only Pack 03 scripts/templates/docs, not local backups or Pack 01/02 artifacts.

- [ ] **Step 12: Commit**
  - Commit message: `build: package experimental visual hierarchy update`

### Task 9: Final review and handoff

**Files:**
- Review all files listed above.
- No new product scope.

**Interfaces:**
- Consumes: Pack 03 ZIP from Task 8.
- Produces: reviewed downloadable package and exact install commands.

- [ ] **Step 1: Run complete verification one final time**
  - Expected: typecheck/test/build/visual audit all PASS.

- [ ] **Step 2: Review diff against spec**
  - Confirm no backend/API/DB/Stable create changes.
  - Confirm every semantic state retains textual/icon signal.

- [ ] **Step 3: Prepare install commands**
  - `node tournament-exp-pack-03-check.mjs`
  - `node tournament-exp-pack-03-install.mjs`
  - `node tournament-exp-pack-03-visual-audit.mjs`
  - `node tournament-exp-pack-03-verify.mjs`

- [ ] **Step 4: Deliver ZIP and visual QA checklist**

## Pack 03.2 execution addendum

The continued package expansion adds presentation hooks for role entry, Support/Fan entry, Projector, player statuses, checklist and toolbar/dialog states. The installer/audit target list is expanded accordingly; no backend/domain target is added.
