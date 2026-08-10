---
name: Deadlock bans/picks UX decisions
description: Visual style, data threading, and server validation decisions for the Deadlock hero ban/pick system.
---

## Visual language (committed design)

**Bans** → rounded-rect (`rounded-[4px]`) wrapper + `ring-2 ring-destructive`
- Portrait fully visible — **no diagonal slash**
- Shape (square-ish) + colour (red) combined = instant recognition at small sizes
- HeroPickerGrid selected state uses the same rounded-rect + red ring

**Picks** → `rounded-full` wrapper + `ring-1 ring-cyan-500/70`
- Circular shape + cyan distinguishes from bans

**Why:** User explicitly rejected diagonal slash overlay (obscures portrait, reduces recognisability). Shape difference (square vs circle) works even when colour-blind.

## Icon sizes

| Context | Size |
|---|---|
| Bracket (match pick icon) | 16 |
| PlayerBansRow in player lists | 20 |
| GamePicksRow in history | 20 |
| PlayerBansRow in host match panel | 18 |
| Audience "Na żywo" hero card | 20 |
| HeroSelectorButton trigger | 20–24 |

## matchPicksMap data threading

`Map<number, { p1HeroId?: string|null; p2HeroId?: string|null }>` — matchId → last game's hero.

**Built from:**
- Completed matches: `history` results-history data (each entry has `(r as any).gamePicks`)
- Active match: `focusedMatchPicks` sorted by gameNumber desc → take first

**Threading path:**
```
tournament-detail.tsx  →  StageProgressView  →  BracketView
tournament-host.tsx    →  BracketView (direct)
tournament-bracket.tsx →  BracketView (direct, loads history separately)
```

**Why:** Bracket previously showed 4–5 ban icons per player row (too cluttered for stream). Now shows 0–1 pick icon — the hero played in that specific match. Bans removed from bracket entirely.

## HeroSelectorButton banned hero enforcement

Props: `bannedByOpponent: string[]` + `opponentName?: string | null`

- Banned heroes are **disabled** in dropdown (opacity-35, cursor-not-allowed, red rounded-rect ring)
- Current pick that matches ban list shows `BAN!` badge + red trigger border
- Tooltip names the opponent when provided

**In tournament-host.tsx:**
- P1 selector: `bannedByOpponent = playerBansMap.get(focusedMatch.player2Id) ?? []`
- P2 selector: `bannedByOpponent = playerBansMap.get(focusedMatch.player1Id) ?? []`

## Server-side ban validation

In `PUT /matches/:id/game-picks/:gameNumber` (api-server):

1. Match select extended to include `player1Id`, `player2Id`
2. After auth: loads `playerDeadlockBansTable` for both player IDs via `inArray`
3. Validates: p1's pick must not be in p2's bans (and vice versa)
4. Returns HTTP 422 with Polish error message if violation detected

**Why:** Client-side block alone can be bypassed (direct API call). Server must be the authority.

## No auto-default pick

`HeroSelectorButton` placeholder: "Wybierz postać" — never auto-selects Abrams or any hero.
`heroId` null/undefined → shows placeholder text only.
