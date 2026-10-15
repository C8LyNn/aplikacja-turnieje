# Visual QA — Pack 03 Complete Experience

## Viewports

Check all key screens at:

- 320 px
- 768 px
- 1024 px
- 1366 px
- 1920 px
- browser zoom 200%
- `prefers-reduced-motion: reduce`

## Entry / roles

- `/experimental/tournaments`
- Organizer, Support and Fan cards must be visually distinct but still readable without color.
- Keyboard focus must remain obvious.
- Last-used badge must not overlap long labels.

## Dashboard

Check:

- no tournaments,
- draft only,
- active only,
- completed only,
- mixed list,
- API error,
- search with no matches,
- filter states `all/draft/active/completed`,
- test-data dialog,
- delete dialog.

## Create

Check:

- empty form,
- invalid name/password,
- server unavailable,
- ready state,
- each tournament format,
- public/private visibility,
- optional password disclosure,
- sticky summary on desktop and non-sticky on mobile.

## Tournament Detail / Players

Check:

- 0 players,
- 8 players,
- 32 players,
- 128 players,
- active player,
- eliminated player,
- winner,
- search/filter with zero results,
- filter `active/eliminated/winner`,
- sort `seed/name/status`,
- inline edit,
- CSV panel,
- long nick/team/rank/country.

## Stages / Baskets

Check:

- planned stage,
- active stage,
- completed stage,
- readiness ready/not-ready/error,
- basket inputs vs outputs,
- locked basket state after tournament start,
- explicit basket authority,
- route list and long stage/basket names.

## Host

Check:

- pending match,
- in-progress match,
- completed match,
- postponed match,
- cancelled match,
- conflict/revision warning,
- Focus Mode,
- dense result list.

## Support / Fan

Support:
- no active tournaments,
- tournament selection,
- login panel,
- wrong password error,
- long tournament name.

Fan:
- no visible tournaments,
- active and completed cards together,
- live indicator,
- long tournament name.

## Audience

Check:

- live hero,
- featured pending match,
- completed hero,
- break state,
- next matches,
- recent results,
- standings,
- players,
- bracket,
- long names,
- private viewer gate.

## Bracket / Projector

Bracket:
- Single Elimination,
- Double Elimination,
- Swiss,
- Round Robin,
- Marvel group stage,
- zoom controls,
- full screen,
- long tournament/stage names.

Projector:
- Stable projector should remain visually unchanged,
- Experimental projector should expose Pack 03 hierarchy,
- presets `classic`, `dark-minimal`, `deadlock`, `neon`,
- `transparent=1` must remain transparent,
- `compact=1`,
- `aspect=169`,
- custom zoom/padding,
- hide-header,
- active/completed tournament,
- all supported stage formats.

## Checklist / context

- context breadcrumb at long tournament names,
- current page marker,
- checklist 0/8, partial and 8/8,
- completed checklist rows remain readable and not color-only.
