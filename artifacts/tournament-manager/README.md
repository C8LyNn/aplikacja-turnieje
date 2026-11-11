# Tournament Manager

Frontend aplikacji do organizowania turniejów: konfiguracji rozgrywek, pracy z
uczestnikami i wynikami oraz udostępniania widoku turnieju. To część istniejącego
monorepo, nie osobny projekt do instalowania niezależnie od jego bibliotek.

Ten plik opisuje moduł `artifacts/tournament-manager`. Główne README repozytorium
opisuje paczkę Core Clash i nie jest zastępowane przez tę instrukcję. Zasoby gier,
portfolio i Animated Effects pozostają częścią istniejącej aplikacji.

## Najpierw lokalny projekt — L00

Przed uruchomieniem wykonaj L00 ze [zlecenia #320](https://github.com/C8LyNn/aplikacja-turnieje/issues/320):
potwierdź właściwe repo, zachowaj lokalne zmiany i prywatną konfigurację, przypnij
bazę oraz przygotuj odizolowane środowisko. Nie zastępuj plików nowszymi lub
starszymi kopiami bez porównania.

Punktem odniesienia dla tej instrukcji jest `8e3f9cad489a24dc26dbd7d8068379861eeffc01`.
Sprawdzony workflow tej wersji używa **Node.js 22** i **pnpm 10**. Instalację zależności
całego monorepo wykonuj z istniejącym lockfile i opcją `--frozen-lockfile`, po przeglądzie
skryptów instalacyjnych. Nie regeneruj lockfile tylko po to, by ominąć błąd środowiska.

## Podgląd frontendowy w PowerShell

Poniższy przykład zakłada gotowe zależności i uruchomiony wcześniej **lokalny API** na
porcie 8080. Polecenia wykonuj z głównego katalogu istniejącego repozytorium:

```powershell
$env:PORT = "5173"
$env:BASE_PATH = "/"
$env:API_PROXY_TARGET = "http://127.0.0.1:8080"
pnpm --filter @workspace/tournament-manager run dev
```

Otwórz adres podany przez Vite. `PORT` wskazuje port frontendu, `BASE_PATH` prefiks
adresu aplikacji, a `API_PROXY_TARGET` adres lokalnego API. Ten skrypt nie uruchamia
backendu ani bazy danych. Nie kieruj lokalnego API/proxy do produkcyjnej bazy lub
usługi tylko po to, żeby uzyskać działający podgląd.

**Dostęp z sieci:** obecny skrypt i konfiguracja Vite wiążą serwer z `0.0.0.0`.
Adres `localhost` w przeglądarce nie oznacza sam w sobie izolacji serwera. Przed
uruchomieniem sprawdź zaporę i zasady dostępu lokalnego; nie wystawiaj sesji organizatora
ani lokalnych usług do nieautoryzowanej sieci. Ta paczka nie zmienia konfiguracji serwera.

## Kontrole istniejącego modułu

Z głównego katalogu repozytorium, w przygotowanym środowisku lokalnym:

```powershell
pnpm --filter @workspace/tournament-manager run typecheck
pnpm --filter @workspace/tournament-manager run test
pnpm --filter @workspace/tournament-manager run test:http-routing
pnpm --filter @workspace/tournament-manager run build
```

Skrypt `build` przygotowuje także istniejące zasoby Animated Effects i zapisuje
wynik w `artifacts/tournament-manager/dist/public`. Nie jest to publikacja na Replit.
Testy jednostkowe i lokalny test HTTP nie zastępują odbioru prawdziwego hostingu.
Polecenia z tej sekcji opisują skrypty repozytorium — ich obecność w README nie jest
dowodem aktualnego wyniku PASS. Pełną regresję backendu/DB wykonuje osobno lokalny
wykonawca, wyłącznie na potwierdzonej jednorazowej bazie testowej.

## Szybkie rozpoznanie problemu

| Objaw | Co sprawdzić bez zmieniania danych |
| --- | --- |
| Brak zmiennej PORT | Ustaw `PORT` w tym samym terminalu, z którego uruchamiasz Vite. |
| Żądania `/api` nie działają | Sprawdź działanie lokalnego backendu i `API_PROXY_TARGET`; sam frontend go nie uruchamia. |
| Komunikat o JavaScript | Włącz JavaScript i odśwież stronę. Komunikat noscript nie diagnozuje błędów pobierania skryptów ani runtime. |
| Pusta strona przy włączonym JavaScript | Sprawdź konsolę przeglądarki i żądania sieciowe; nie resetuj bazy ani nie podmieniaj routera w ciemno. |
| Podgląd lokalny działa, ale DEV zwraca inne odpowiedzi | Sprawdź konfigurację rzeczywistego hostingu; nie traktuj wyniku Vite jako testu produkcji. |

## Granice funkcji i publikacji

Import **Backup V3 pozostaje wyłączony**. Nie należy go włączać dla uzyskania zielonego
raportu ani pomijać nowych testów w celu ukrycia błędu. Ta dokumentacja nie aktywuje
Basket CAS, nowych migracji, funkcji gier ani uprawnień użytkowników.

Ścieżka przyjęcia zmian to **LOCAL → DEV → PROD**. DEV ma być konkretnym, odizolowanym
środowiskiem, a nie tylko nazwą gałęzi. Każda publikacja wymaga osobnej zgody i dowodów
odnoszących się do zatwierdzonego kandydata. Lokalny build nie jest zgodą na deploy;
zamknięcie terminala nie cofa zmian danych. Wymagania odbioru i rollback pozostają w #320.
