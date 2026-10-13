# Tournament Experimental Frontend — Pack 01 Expanded Update

Ta paczka **zastępuje wcześniejszy Functional Create Update**. Jeśli jeszcze go nie instalowałeś, nie musisz tego robić.

Wymaga tylko zainstalowanej podstawowej Tournament Experimental Pack 01.

## Nowe elementy

- prawdziwe tworzenie turnieju przez istniejący `useCreateTournament`,
- Single Elimination, Double Elimination, Swiss i Round Robin,
- limit graczy,
- BO1 / BO3 / BO5 / BO7,
- walidacja rund Swiss,
- widoczność public/private/offline,
- hasło organizatora, wsparcia i widza,
- seedowanie:
  - kolejność dodania,
  - alfabetyczne,
  - ręczne,
  - losowanie,
- tryb ujawniania losowania: sekwencyjny / natychmiastowy,
- stage plan dla niestandardowego seedowania przez istniejący helper,
- zapis niesensytywnego szkicu formularza po odświeżeniu,
- hasła nigdy nie trafiają do szkicu,
- przycisk `Wyczyść`,
- bogatszy panel podsumowania,
- prostsze, mniej techniczne teksty w UI,
- ten sam organizerToken i ten sam panel zarządzania po utworzeniu.

## Nadal bez zmian

- stabilny `create-tournament.tsx`,
- backend,
- baza danych,
- schema,
- migracje,
- endpointy,
- bracket/stage/result business logic.

## Instalacja

Rozpakuj ZIP do głównego katalogu repo.

```powershell
node tournament-exp-pack-01-expanded-check.mjs
```

Po PASS:

```powershell
node tournament-exp-pack-01-expanded-install.mjs
node tournament-exp-pack-01-expanded-verify.mjs
```

## Rollback

```powershell
node tournament-exp-pack-01-expanded-rollback.mjs
```

## Po verify

Build może ponownie zmienić wygenerowany plik Animated Effects:

```powershell
git restore artifacts/tournament-manager/public/stream/animated-effects/index.html
```
