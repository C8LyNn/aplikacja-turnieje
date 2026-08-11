---
name: Deadlock theme architecture
description: How the Deadlock visual theme is applied, where the toggle lives, and the localStorage→API migration plan.
---

# Deadlock Theme Architecture

## Theme activation path
`useDeadlockTheme(tournamentId)` → localStorage key `tm:deadlock-theme:{id}` → returns `[enabled, setEnabled]`.
When `enabled === true` AND `isDeadlock === true`:
- `Layout` receives `deadlockTheme={true}` → adds `data-theme="deadlock"` to root div.
- `tournament-audience.tsx` and `tournament-bracket.tsx` apply `data-theme="deadlock"` directly to their own root divs (they don't use Layout).

## CSS structure
`src/index.css`:
- `:root` — base navy theme + `--deadlock-*` brand colors + `--app-font-deadlock-display: var(--app-font-sans)` (transparent in base theme).
- `.dark` — same tokens repeated for dark mode class.
- `[data-theme="deadlock"]` (after `.dark` — wins same-specificity cascade) — full warm brown/cream palette + `--app-font-deadlock-display: 'Valve Pulp Bold', Georgia, serif`.
- `.font-deadlock` class — `font-family: var(--app-font-deadlock-display)` — transparent in base, switches to Valve Pulp Bold in deadlock mode.

## Where .font-deadlock is applied
- tournament-detail.tsx: tournament name h1
- tournament-host.tsx: "Panel prowadzącego: {name}" h1
- tournament-audience.tsx: player name divs in hero match section

## Font file
`public/fonts/README.md` documents `valvepulp-bold.ttf` placement. Missing file → serif fallback, no error.

## Navigation structure
"Więcej" menu: Historia → Reguły gry → Wizualia → Korekta → Udostępnianie → Backup → Bezpieczeństwo.
All three gated by `canManageOrganizerSettings`.
Tab values: `"game-rules"`, `"visuals"`, `"security"`.
OrganizerArea and OrganizerDetailTab types both include these new values.

## Toggle location
`TournamentPresentationPanel` in the "Wizualia" TabsContent inside `tournament-detail.tsx`.
Accepts `tournamentId` and `isDeadlock` props.
Only shows the Switch for Deadlock tournaments; non-Deadlock tournaments see a "not available" message.

## Migration plan when Task #15 merges
Replace `useDeadlockTheme` hook body:
- Read: `tournament.presentationSettings?.deadlockTheme ?? false`
- Write: `useUpdateTournament` PATCH with `{ presentationSettings: { deadlockTheme: value } }`
The hook signature `[enabled, setEnabled] = useDeadlockTheme(tournamentId)` stays the same — no call-site changes needed.

**Why:**
- Keeps the pre-merge dev experience working (localStorage preview)
- Single file to update when API is ready
- No risk of stale data across browsers once API is used
