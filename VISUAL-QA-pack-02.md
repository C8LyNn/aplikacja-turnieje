# Pack 02 — Visual QA matrix

Use after automated VERIFY PASS.

## Viewports
- 1920 px
- 1366 px
- 1024 px
- 768 px
- 320 CSS px reflow
- 200% text zoom

## Dashboard states
- 0 tournaments
- 1 tournament
- many tournaments
- long tournament name
- search with result
- search without result
- Draft filter
- Active filter
- Completed filter
- API list failure + retry
- keyboard focus on tournament title / backup / delete actions

## Tournament Overview
- draft, 0 players
- draft, 8 players
- active
- completed
- stats loading
- stats failure + retry
- no matches
- many matches
- very long player names
- next-step readiness feedback present / absent

## Organizer
- Players: 0 / 1 / 8 / 32+
- Stages: planned / active / completed
- Baskets: editable / locked
- Host results count: 0 / 1 / 2 / 3+
- stale result conflict flow
- long names
- support role vs organizer role

## Public
- Audience: live / completed / no matches / standings
- Bracket: SE / DE / Swiss / RR where applicable
- Projector with existing presets/options

## Route containment
While starting at an Experimental URL, verify internal tournament navigation
never unexpectedly switches to `/tournaments/...`.

Explicitly test:
- role home
- create -> detail
- dashboard -> detail
- Next Step
- organizer tabs
- stage readiness links
- backup restore
- recovery password link
- sharing URLs
- fan -> audience
- support -> host


## Density
- Comfortable mode
- Compact mode
- reload preserves preference
- leaving Experimental removes compact styling from Stable
- return to Experimental restores saved preference
- 32+ player list in Compact
- 24+ Host matches in Compact


## Context / command center
- Detail shows `Turnieje → tournament → Panel turnieju`
- Host shows `Turnieje → tournament → Prowadzenie`
- breadcrumb tournament name wraps/scrolls sensibly on mobile
- Host: 0 matches
- Host: 1 live + pending queue
- Host: 3+ completed results
- Host: completed tournament with champion
- Host: data loading
- Host: data error
- Host command-center links stay inside `/experimental/tournaments/*`

## Audience names
- short tournament name
- 80+ character tournament name
- 320 CSS px width
- 200% text zoom


## Dialog accessibility
- Test Data: Tab/Shift+Tab trapped correctly
- Escape closes and focus returns to trigger
- delete dialog announces title/description
- password error has role=alert
- delete cannot close while pending

## Experimental checklist
- checked state persists
- reset clears Experimental checklist only
- links preserve Experimental namespace
- current organizer-password wording


## Players / Stages / Baskets / Host Focus
- Players: 0 / 1 / 8 / 32 / 128; search nick/team/rank/country; status filters; seed/name/status sort; zero-results filter; long names; Compact mode; inline edit after filtering.
- Stages: 1 / 2 / 5+; planned/active/completed; keyboard focus; horizontal scroll; readiness loading/error/ready; 320 CSS px and 200% zoom.
- Baskets: 1 / 2 / 5+ stages; default/explicit; advanced editing; locked mode; route source/target focus; horizontal scroll.
- Host Focus: F toggles outside inputs, F while typing does nothing, Escape exits, queue/results hidden only in Focus, Stable Host unchanged.
- Unified states: Detail/Audience/Bracket ReadQueryState; Stage loading/error; Basket empty/error.
