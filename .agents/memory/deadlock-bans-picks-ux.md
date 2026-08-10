---
name: Deadlock bans/picks UX
description: UI and API patterns for Deadlock ban/pick flows — icon conventions, ban mode config, hero sorting, api-client-react dist rebuild.
---

# Deadlock bans/picks UX

## Icon conventions
- BanIcon = red rounded-rect ring
- PickIcon = cyan circle; returns `null` for falsy heroId (null/undefined/""), `?` only for non-empty string failing hero lookup

## Ban mode config
- `banMode?: 'shared_pool' | 'opponent_only'` — default `'shared_pool'`
- `bansPerPlayer?: number` — default 5, range 0–20
- Both stored in `tournament_game_configs.config` JSONB; locked once tournament starts
- UI hides ban section entirely when `bansPerPlayer === 0`

## shared_pool vs opponent_only
- `shared_pool`: `forbidden = union(p1Bans, p2Bans)` — neither player can pick any banned hero (including own bans)
- `opponent_only`: `forbidden(P1) = p2Bans`, `forbidden(P2) = p1Bans` — own bans don't block self

## Hero sorting
- `sortHeroesByName<T extends { displayName: string }>(heroes: readonly T[]): T[]` — must accept `readonly` arrays
- Applied at render time to all hero grids/dropdowns; NOT applied to game number sequences or match lists

## matchPicksMap threading
- Host panel: `focusedMatchPicks` used to show `PickIcon size={64}` above player name for active match
- Audience view: last game pick shown at `size={56}`

## api-client-react dist rebuild
- **Why:** tournament-manager tsconfig uses project references (`composite: true`), so TS resolves `@workspace/api-client-react` from `lib/api-client-react/dist/*.d.ts`, NOT src directly
- **When:** after running `orval` to regenerate `lib/api-client-react/src/generated/`, must run `cd lib/api-client-react && npx tsc -p tsconfig.json` to update dist
- **Otherwise:** TS consumers see stale declarations (missing new fields like `banMode`, `bansPerPlayer`)

## Server 422 ban validation
- `PUT /players/:id/bans`: loads game config, calls `getDeadlockBansPerPlayer(config)`, rejects if `body.bannedHeroIds.length > configuredLimit`
- `PUT /matches/:id/game-picks/:gameNumber`: loads game config, applies mode-appropriate forbidden set, 422 with mode-agnostic error message
