# Pack 03 — Visual Hierarchy & Identity

Date: 2026-10-01
Baseline: `b7b8bec feat: expand experimental tournament frontend`
Branch: `codex/replit-visual-polish-handoff`

## Goal

Pack 03 changes the visual language of the Experimental tournament frontend
without changing tournament rules, backend behavior, API contracts, database
schema, or Stable `/tournaments/*` behavior.

The primary problem to solve is visual monotony: too many surfaces currently
share nearly the same navy background, border treatment, and cyan accent.
The result is weak hierarchy between page background, sections, cards,
interactive controls, statuses, and critical operational states.

Success means that a user can scan Experimental screens and immediately
distinguish navigation vs content, primary vs secondary action, live/active vs
ready/pending vs completed, success vs warning vs error, and informational vs
actionable panels.

## Scope

- Experimental semantic color families: primary/nav cyan-blue, info violet,
  success green, warning amber, danger red, live high-contrast cyan-green,
  neutral slate/navy.
- Distinct page, hero, section, nested-card and interactive surface levels.
- Semantic tone support in shared Experimental UI primitives.
- Dashboard status hierarchy and stronger CTA/filter/card differentiation.
- Create flow section hierarchy and clearer readiness/summary states.
- Overview metric/lifecycle/next-step differentiation.
- Players, Stages and Baskets status/function differentiation.
- Host live/ready/completed/error differentiation.
- Audience broadcast hierarchy and Bracket round/match-state hierarchy.
- Accessibility: visible focus, reduced motion, 200% zoom, 320px reflow, color
  never as the only status signal.

## Constraints

- Stable `/tournaments/*` must remain visually and behaviorally unchanged.
- Backend/API/database/migrations are untouched.
- No new tournament rules, readiness rules or bracket algorithms.
- No animation-heavy decorative system.
- Pack 03 must be one installable ZIP with check/install/rollback/verify,
  templates, manifest and visual QA.
- Baseline-aware, CRLF/LF-safe installer with automatic backup and rollback.
- Acceptance gate: typecheck PASS, full frontend tests PASS, build PASS, Stable
  smoke checks PASS, Experimental route-containment PASS.

## Out of scope

- Full Stable redesign.
- Backend or schema changes.
- New tournament formats.
- Full layout rewrite.
- Domain-logic refactor.

## Pack 03.2 addendum — continued expansion

User-requested continuation extends the same visual-system package to role selector, Support, Fan, Projector, player status rows, checklist, dashboard dialogs and filter toolbars. These changes remain presentation-only and preserve Stable behavior through Experimental route/root scoping.
