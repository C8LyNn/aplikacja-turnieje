# Tournament Experimental Frontend Pack 01 — manifest

## Bazowy stan

- branch: `codex/replit-visual-polish-handoff`
- reference commit: `b0c1042`

## Modyfikowane istniejące pliki

- `artifacts/tournament-manager/src/App.tsx`
- `artifacts/tournament-manager/src/components/layout.tsx`
- `artifacts/tournament-manager/src/pages/dashboard.tsx`

Zmiany w nich są ograniczone do routera i wejść na ekran tworzenia.

## Pliki, których Pack 01 nie modyfikuje

W szczególności:

- `artifacts/tournament-manager/src/pages/create-tournament.tsx`
- backend
- API endpoints
- schema
- migrations
- wygenerowane API contracts
- bracket/stage/result business logic

## Nowe pliki źródłowe

- `artifacts/tournament-manager/src/features/experimental-tournaments/experimental-organizer-guard.tsx`
- `artifacts/tournament-manager/src/features/experimental-tournaments/experimental-tournament-shell.tsx`
- `artifacts/tournament-manager/src/pages/tournament-create-choice.tsx`
- `artifacts/tournament-manager/src/pages/tournament-create-choice.test.tsx`
- `artifacts/tournament-manager/src/pages/experimental/tournaments/create-tournament-experimental.tsx`
- `artifacts/tournament-manager/src/pages/experimental/tournaments/create-tournament-experimental.test.tsx`

## Nowe trasy

- `/tournaments/create`
- `/experimental/tournaments/new`

## Zachowana stabilna trasa

- `/tournaments/new`

## Narzędzia paczki

- `tournament-exp-pack-01-check.mjs`
- `tournament-exp-pack-01-install.mjs`
- `tournament-exp-pack-01-verify.mjs`
- `tournament-exp-pack-01-rollback.mjs`
- `tournament-exp-pack-01-lib.mjs`
