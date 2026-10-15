# Tournament Experimental Frontend — Pack 02 Expanded + Audited

Base:
- branch `codex/replit-visual-polish-handoff`
- checkpoint `39e6aef`

This ZIP supersedes every earlier Pack 02 draft, including the previous Expanded + Audited build.

## Main goal

Experimental is no longer only a redesigned create screen or a CSS skin.
This package prepares a parallel tournament frontend surface while preserving
the existing backend, API, database and tournament engine.

## Added in this expanded revision

### 1. Experimental mini design system
New frontend primitives:
- `ExperimentalSectionHeader`
- `ExperimentalMetricCard`
- `ExperimentalStatusPill`
- `ExperimentalStatePanel`
- `ExperimentalQuickLink`
- `ExperimentalActionBar`

They use the existing theme tokens instead of introducing a second hard-coded
color palette.

### 2. Real Experimental Tournament Overview
`/experimental/tournaments/:id` gets its own overview presentation:
- participants,
- completed/total matches,
- progress,
- format/stage/BO context,
- current stage and round,
- a read-only summary of the next step,
- route-safe shortcuts to Players, Stages, Baskets, Host, Audience and Bracket,
- leader list without hover-only full-name access,
- separate loading/error handling for tournament statistics.

The overview does not recalculate readiness or legal actions. It presents data
already produced by the existing tournament logic.

### 3. Stronger Experimental dashboard
Only in Experimental mode:
- text search,
- status filter,
- counts for All / Draft / Active / Completed,
- filtered empty state,
- keyboard-accessible tournament title link,
- secondary actions visible on focus as well as hover.

Stable Dashboard keeps its current behaviour and presentation.

### 4. More route containment
The expanded audit also fixes tournament restore performed inside
`tournament-detail.tsx`, so a restored tournament does not force the user out of
Experimental.

### 5. Regression checks
New test:
- `experimental-route-containment.test.ts`

It checks the Experimental route surface, route-aware shared components,
overview wiring, dashboard filtering and the restored-tournament navigation.

Additional command:
```powershell
node tournament-exp-pack-02-route-audit.mjs
```

## Experimental URL surface

- `/experimental/tournaments`
- `/experimental/tournaments/dashboard`
- `/experimental/tournaments/support`
- `/experimental/tournaments/fan`
- `/experimental/tournaments/new`
- `/experimental/tournaments/:id`
- `/experimental/tournaments/:id/host`
- `/experimental/tournaments/:id/audience`
- `/experimental/tournaments/:id/bracket`
- `/experimental/tournaments/:id/projector`

## Install tomorrow

From the repository root:

```powershell
node tournament-exp-pack-02-check.mjs
node tournament-exp-pack-02-install.mjs
node tournament-exp-pack-02-route-audit.mjs
node tournament-exp-pack-02-verify.mjs
```

`check` refuses to overwrite local changes in files targeted by the pack.

After build, if the generated Animated Effects index becomes modified:

```powershell
git restore artifacts/tournament-manager/public/stream/animated-effects/index.html
```

## Manual QA after VERIFY PASS

1. Open `/experimental/tournaments`.
2. Check Organizer / Support / Fan role transitions.
3. Open Experimental dashboard.
4. Test search and status filters.
5. Create a tournament.
6. Confirm redirect to `/experimental/tournaments/<id>`.
7. Inspect the new Overview.
8. Open Players, Stages and Baskets through its shortcuts.
9. Start the tournament and inspect Host, Audience and Bracket.
10. Use Next Step links.
11. Restore a backup while inside Experimental.
12. Open Sharing and copy organizer/support/projector URLs.
13. Confirm all tournament URLs still start with `/experimental/tournaments`.
14. Open Stable `/dashboard` and `/tournaments/<id>` and confirm they are unchanged.

## Rollback

```powershell
node tournament-exp-pack-02-rollback.mjs
```

## Still deliberately shared

This pack does not fork:
- backend/API,
- DB/migrations,
- auth/session model,
- match revision/conflict handling,
- stage readiness/lifecycle,
- standings/ranking,
- qualification/routing,
- tournament engine.

Large files such as `tournament-host.tsx` and `tournament-detail.tsx` continue to
share domain logic. Experimental changes their presentation and navigation
conditionally instead of maintaining a second tournament implementation.


## Added in the latest expansion

### Density preference
Experimental gets a persistent `Comfortable / Compact` switch in the shared
header. It is presentation-only, stored in localStorage and automatically
removed from the document when the user leaves Experimental.

Compact mode is intended for:
- 24+ match Host views,
- large player lists,
- dense stages/baskets work,
- smaller laptop displays.

It does not change any domain or API behaviour.

### Draft lifecycle summary
The Experimental Overview now includes a small three-step descriptive flow:
- tournament configured,
- participants present,
- competition started / matches present.

This is intentionally not a second readiness calculation. The UI explicitly
states that legal start/transition decisions still come from the existing
tournament logic.


### Organizer context bar
Experimental Detail and Host now show a compact breadcrumb/context bar:
`Turnieje → tournament → current surface`. It gives keyboard-accessible,
route-safe context without changing the Stable header.

### Host command center
The Experimental Host replaces the old top stage summary with a denser command
center built entirely from state that `tournament-host.tsx` already derives:
- live matches,
- ready matches,
- completed matches,
- other/unresolved matches,
- current stage / round,
- next-step label,
- winner after completion,
- direct Experimental links to results, stages and audience.

No tournament rule is reimplemented in the component.

### Audience long-name polish
The Experimental public header no longer relies on truncation for the tournament
name. Long names wrap naturally while Stable keeps its existing behaviour.


### Accessible Experimental dialogs
Experimental Dashboard now uses the existing Radix Dialog primitives for QA/test-data creation and destructive tournament deletion. Stable keeps its current overlays.

### Updated Experimental checklist
Experimental Detail now uses current organizer-password / stage-readiness wording and explicitly remains a local operational aid rather than a second rules engine.


## Organizer workflow expansion

Experimental Players now has local search, status filters and seed/name/status sorting, with a scrollable large-list workspace. Stages use a timeline-style navigator while retaining the existing lifecycle/readiness engine. Baskets receive a clearer flow-canvas presentation without changing validation or mutations. Host adds a presentation-only Focus mode (`F`, `Escape`) that hides secondary panels and emphasizes the active match. Shared read states now expose consistent Experimental loading/error/background-refresh styling hooks.


## Windows CRLF hotfix

If installation previously failed with:

`Nie znaleziono markera: layout: route mode`

the checkout uses Windows CRLF line endings while the installer markers use LF.
This build normalizes line endings only in memory while patching and then writes
the original line-ending style back, so it does not create whole-file EOL diffs.

For an already extracted older build you can run:

```powershell
node tournament-exp-pack-02-windows-eol-hotfix.mjs
node tournament-exp-pack-02-install.mjs
```


## Installer runtime hotfix 02

A Windows installation could proceed past the CRLF fix and then fail with:

`isExperimental is not defined`

Cause: one generated TSX replacement string contained an unescaped JavaScript
template interpolation inside the installer itself. This build escapes that
interpolation so it is written into the target TSX file instead of being
evaluated by Node while the installer runs.
