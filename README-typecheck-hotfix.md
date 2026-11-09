# Pack 02 — Typecheck Hotfix

Naprawia 10 błędów TypeScript wykrytych po poprawnej instalacji Pack 02:

- `experimental-tournament-routing.ts`: typ parametrów `id`
- `create-tournament-experimental.tsx`: brakujące `formatInfo`
- `tournament-audience.tsx`: duplikat `id` i stare `params`
- `tournament-detail.tsx`: brak `statsQuery`
- `experimental-tournament-overview.tsx`: `topPlayers[].id` jest opcjonalne w typie API

## Instalacja

Rozpakuj pliki do głównego katalogu repo:

`C:\Users\kubap\Documents\GitHub\aplikacja-turnieje-live`

Uruchom:

```powershell
node tournament-exp-pack-02-typecheck-hotfix.mjs
node tournament-exp-pack-02-verify.mjs
```

Nie rób rollbacku całego Pack 02 przed tym hotfixem.
