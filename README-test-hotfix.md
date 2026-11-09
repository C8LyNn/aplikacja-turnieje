# Pack 01 — test runner hotfix

Naprawia dwa problemy wykryte po Stability Update:

1. `double submit in the same frame...` mógł zostawić sztucznie wstrzymaną odpowiedź nierozwiązaną po nieudanej asercji, przez co Node test runner nie kończył procesu.
2. Podsumowanie renderowało `NaN`, gdy użytkownik wpisał np. `2.5` w polu liczby graczy.

## Instalacja

```powershell
node tournament-exp-pack-01-test-hotfix-check.mjs
node tournament-exp-pack-01-test-hotfix-install.mjs
node tournament-exp-pack-01-test-hotfix-verify.mjs
```

Verify uruchamia tylko 14 testów Experimental z prawidłowym `TSX_TSCONFIG_PATH`.
