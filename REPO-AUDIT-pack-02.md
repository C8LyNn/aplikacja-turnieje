# Pack 02 — repo audit before implementation

Branch inspected: `codex/replit-visual-polish-handoff`
Checkpoint: `39e6aef`

## Repository scan

The branch contains 959 tracked files in the recursive Git tree.

Largest areas:
- `artifacts/tournament-manager`: 267 files
- `lib/api-zod`: 244 files
- `artifacts/api-server`: 154 files
- `artifacts/animated-effects`: 82 files
- `lib/db`: 72 files
- `artifacts/mockup-sandbox`: 69 files

Tournament Manager frontend:
- 203 files under `artifacts/tournament-manager/src`
- 99 component files
- 43 page files
- 34 lib files
- 15 feature files
- 7 hooks
- shared auth context, global CSS and organizer CSS

## Important architecture findings

1. The critical tournament UI is not a set of small independent pages.
   `tournament-detail.tsx` is ~91 kB and `tournament-host.tsx` ~116 kB.
   Copying them into an Experimental fork would immediately duplicate business
   rules, auth, polling, revision/conflict handling and stage lifecycle logic.

2. The safest Experimental architecture is therefore:
   - parallel URL namespace,
   - shared domain/API logic,
   - route-aware presentation mode,
   - conditional UI chrome,
   - gradual extraction of large page sections later.

3. The first Full Surface draft missed several Stable-route leaks hidden in
   shared components. The audit found them in:
   - `tournament-organizer-navigation.tsx`
   - `organizer-next-step.tsx`
   - `organizer-recovery-notice.tsx`
   - `tournament-stages-panel.tsx`
   - `backup-restore-dialog.tsx`
   - `sharing-panel.tsx`
   - `support-entry.tsx`
   - `fan-view.tsx`
   - Host share URLs

4. `UX_UI_STANDARDS.md` explicitly requires one source of tournament rules.
   Pack 02 therefore does NOT reimplement readiness, ranking, qualification,
   legal transitions, match state or permissions in frontend-only code.

5. Existing reliability work is important and must remain shared:
   - match revision/conflict handling,
   - stage lifecycle/readiness,
   - qualification/routing,
   - support/organizer auth,
   - persisted tournament data and query invalidation.

## Revised Experimental surface

- `/experimental/tournaments` — role selection
- `/experimental/tournaments/dashboard`
- `/experimental/tournaments/support`
- `/experimental/tournaments/fan`
- `/experimental/tournaments/new`
- `/experimental/tournaments/:id`
- `/experimental/tournaments/:id/host`
- `/experimental/tournaments/:id/audience`
- `/experimental/tournaments/:id/bracket`
- `/experimental/tournaments/:id/projector`

Stable `/tournaments/*`, `/dashboard`, `/support` and `/fan` remain valid.

## New-standard work in this package

- separate Experimental visual layer
- mode badge and skip link in shared Layout
- route-preserving global navigation
- route-preserving organizer navigation
- route-preserving Next Step actions
- route-preserving recovery, stage and backup actions
- route-preserving sharing URLs
- role selector / support / fan Experimental aliases
- dashboard keyboard-accessible title link in Experimental mode
- focus-visible dashboard secondary actions
- redesigned create screen from the earlier Pack 02 draft
- Experimental-specific responsive shell
- projector logic intentionally remains visually clean for OBS

## Deliberately not duplicated

No fork of:
- backend/API
- database schema
- generated API clients
- tournament engine
- auth storage
- stage readiness
- standings/ranking
- qualification/routing
- match result revision logic

That keeps the new frontend a presentation/interaction branch instead of a
second tournament implementation.


## Post-audit installer validation

After the repository scan, patch anchors were checked against the exact
`39e6aef` source. Two installer hazards from the previous draft were corrected:

- `tournament-stages-panel.tsx` uses a multiline
  `seeding-ceremony-view` import; Pack 02 now anchors its routing import on the
  stable `deriveStageBasketFlowCounts` import instead.
- Host sharing contains both `/tournaments/:id` and
  `/tournaments/:id/host`; the installer now rewrites the more specific Host
  URL first so the generic replacement cannot consume its prefix.

The redundant second rewrite of the Host “Pokaż mecz” navigation was also
removed because the preceding replace-all already handles that occurrence.

- `App.tsx` route insertion was made less brittle after exact-source validation:
  Pack 02 now expands the single known Experimental route instead of depending
  on a multi-line block containing adjacent Stable routes.


## Expanded revision

After the initial repository audit, Pack 02 was expanded with:
- an Experimental UI primitive layer,
- a dedicated Tournament Overview,
- dashboard search/status filtering,
- explicit stats loading/error handling in the Experimental overview,
- a regression test for route containment,
- an additional restore-navigation leak fix in `tournament-detail.tsx`,
- a visual QA matrix covering responsive, empty/error and long-data states.

These additions remain frontend-only and continue to rely on the existing
backend-derived tournament state.


## Further expansion

Pack 02 now also contains a presentation-only density preference and a
descriptive lifecycle summary on the Experimental Overview. Both are
deliberately isolated from tournament rules: density only changes CSS and the
lifecycle summary only describes already-observed status/counts.


## Organizer information architecture expansion

The next iteration adds two presentation-only layers:
- a route-safe context bar for Detail and Host,
- a Host command center that reuses counts/state already derived by the existing
  Host page.

This continues the same architecture rule: Experimental may reorganize and
present state differently, but it must not become a second source of tournament
truth.


## Modal and checklist modernization
Pack 02 closes another UX gap from the repo audit: Experimental test-data and delete confirmations use the existing Radix Dialog primitive, while Stable remains untouched. The Experimental checklist also drops historical host-code wording.


## Organizer workflow expansion

The highest-frequency organizer surfaces now move further toward the new standard without forking domain logic: Players filtering is local presentation state; Stage readiness/lifecycle remains in `TournamentStagesPanel`; Basket validation/mutations remain in `StageBasketsPanel`; Host Focus only changes visibility/layout; and shared query states retain the same retry/cached-data behavior while gaining semantic style hooks.
