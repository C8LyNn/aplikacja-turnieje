# Tournament Experimental Pack 01 — Stability Update

Ta aktualizacja nakłada się na **Expanded Pack 01**.

## Co poprawia

- sprawdza `/api/healthz` przed tworzeniem turnieju,
- pokazuje w UI stan API/bazy: sprawdzanie / gotowe / niedostępne,
- blokuje submit, gdy backend jest niedostępny,
- dodaje `Sprawdź ponownie`,
- w dev przy HTTP 5xx podpowiada sprawdzenie API na porcie 8080,
- waliduje opcjonalne hasło wsparcia (min. 8 znaków),
- waliduje hasło widza (min. 8 znaków),
- nie obcina wartości `2.5` do `2` dla liczby graczy,
- poprawia walidację rund Swiss,
- naprawia uruchamianie `pnpm` z `verify.mjs` na Windows/Node 24,
- dodaje pomocniczy `tournament-exp-pack-01-start-local.ps1`.

## Dlaczego widziałeś HTTP 500

Frontend Vite działa na porcie 3000, ale jego `/api` jest proxy do:

`http://127.0.0.1:8080`

Jeśli lokalny serwer API nie działa na 8080, żądanie tworzenia nie może dojść do właściwego backendu.

## Instalacja

```powershell
node tournament-exp-pack-01-stability-check.mjs
node tournament-exp-pack-01-stability-install.mjs
node tournament-exp-pack-01-stability-verify.mjs
```

## Lokalny start obu części

Jeżeli Twoje środowisko ma poprawnie ustawione `DATABASE_URL`, możesz użyć:

```powershell
.\tournament-exp-pack-01-start-local.ps1
```

Skrypt otworzy API na 8080 w drugim PowerShellu, a frontend uruchomi na 3000.

Jeśli PowerShell blokuje lokalny skrypt, możesz uruchomić go jednorazowo:

```powershell
powershell -ExecutionPolicy Bypass -File .\tournament-exp-pack-01-start-local.ps1
```

## Rollback

```powershell
node tournament-exp-pack-01-stability-rollback.mjs
```
