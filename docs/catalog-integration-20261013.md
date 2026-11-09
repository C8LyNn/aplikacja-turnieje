# Lokalna integracja katalogu — 2026-10-13

Użytkownik zatwierdził lokalną integrację scalonych zmian katalogu, bez
zmian produkcji. Nie wykonano push, force push, publikacji, migracji
skonfigurowanej bazy aplikacji ani importu danych do niej.

## Pochodzenie i punkt powrotu

- Źródło: `C8LyNn/aplikacja-turnieje`,
  `codex/game-catalog-editor-reliability`,
  `28da3ef94f3b30f90c1b3b70a88ab7f61462d99c`.
- Gałąź źródłowa nie jest `main` ani wydaniem PR #32.
- Lokalny punkt wyjścia:
  `6864a15d9de9d69345e70d7363c205dd077bb6c9`.
- Kopia: `backup/pre-catalog-integration-20261013`.
- Pobrano 62 pliki do przeglądu; ich bajty zweryfikowano według Git blob SHA.
  Selektywnie dołączono 59 plików z tego zakresu, następnie lokalne adaptacje
  i dodatkowy test wspólnego schematu.
- Import zawartości przez lokalny commit syntetyczny nie jest importem
  historii oryginalnego upstream. Nie wypychać go jako historii upstream.

## Zakres funkcjonalny

Paginacja i kursory, wyszukiwanie, dokładne liczniki statusów, szczegóły
gier, kolejka klasyfikacji, walidacja gotowości i optimistic concurrency,
ochrona zmian kluczem administratora, discovery Steam/SteamSpy,
insert-only import batch, trwałe import jobs, pause/resume, retry/backoff,
limitowanie źródeł między replikami, UI administracyjne, preflight,
odczytowy audyt staging, dane przykładowe CSV, testy i CI.

Zachowano lokalne landing/SF/Portfolio, czat z poprzedniego przyrostu,
trasy korekt organizatora, eksport schematu korekt, konfigurację
produkcyjną i niezarządzający tabelami filtr Drizzle push.

### Adaptacje bezpieczeństwa

- Pojedynczy import korzysta z lokalnego, ścisłego parsera Steam:
  API musi potwierdzić typ `game` i zgodny AppID. Nie ma fallbacku
  fabrykującego nazwę gry ani nadpisującego upsertu.
- Powtórny import zwraca istniejącą grę (200, `outcome=existing`),
  bez zmiany metadanych źródła, dat, klasyfikacji i revision.
  Nowa gra: 201, `outcome=inserted`.
- Akceptowane są upstream `x-steam-catalog-admin-token` i dotychczasowy
  `Authorization: Bearer`; brak konfiguracji/klucza blokuje zapis.
- Worker wymaga jawnego `STEAM_CATALOG_IMPORT_WORKER_ENABLED=true`.
  Domyślnie nie uruchamia timerów ani zapisu do bazy. Utworzenie/wznowienie
  job poza testami zwraca 503, jeśli worker jest wyłączony. Pauza nadal
  pozwala zatrzymać istniejące zadanie.
- Brak wymaganych tabel/kolumn daje jawne 503
  `STEAM_CATALOG_SCHEMA_NOT_READY`, bez wykonywania DDL przy starcie.

## Kolejność migracji

Migracje korekt 0030/0031 pozostają identyczne. Katalogowe numery
upstream przesunięto o dwa; zaktualizowano odniesienia w testach,
preflight, kodzie, komentarzach i dokumentacji.

| Upstream katalogu | Lokalnie |
| --- | --- |
| 0030 abstract world | 0032 abstract world |
| 0031 pagination indexes | 0033 pagination indexes |
| 0032 classification revision | 0034 classification revision |
| 0033 trigram search | 0035 trigram search |
| 0034 exact status counters | 0036 exact status counters |
| 0035 import jobs | 0037 import jobs |
| 0036 import job sources | 0038 import job sources |
| 0037 import retry backoff | 0039 import retry backoff |
| 0038 global source throttle | 0040 global source throttle |

Dla pełnej aplikacji: istniejące 0001–0029, korekty 0030 → 0031,
następnie katalog 0032 → 0040. Izolowany test samego katalogu potrzebuje
0029 oraz 0032–0040; nie wymaga tabel turniejowych korekt.
Nie ma zduplikowanych prefiksów migracji.

## Weryfikacja

- Pełny workspace typecheck oraz build frontendu i API: PASS.
- Frontend: 577 testów, PASS.
- Backend/powiązane testy jednostkowe UI: 866 + 25 + 32 = 923, PASS.
- Pełna integracja API: 561 testów na świeżym PostgreSQL 16, PASS.
- Dodatkowy test współistnienia korekt 0030/0031 i katalogu 0032–0040
  w jednym schemacie po wcześniejszych migracjach: PASS.
- Preflight jednostkowy: 5 testów; audyt staging: 4; API preflight: 4;
  rzeczywisty PostgreSQL preflight: 1 — PASS.
- Test integracyjny potwierdza brak zmiany całego rekordu/klasyfikacji
  po ponownym imporcie Steam oraz blokadę tworzenia/wznowienia job
  bez workera; rozszerzoną blokadę wznowienia potwierdzono osobnym testem.
- Jeden test przeglądarkowy na rzeczywistym, izolowanym API: PASS.
  Lista/wyszukiwanie/kolejka, zapis gatunku i odczyt po odświeżeniu,
  odmowa zapisu ze starej revision (409) z zachowaniem draftu i akcją
  wczytania aktualnej wersji oraz odmowa edycji bez klucza (403).
  Dane pozostały syntetyczne; nie użyto rzeczywistego Steam ani import jobs.
- SQL wykonywano tylko na świeżej, lokalnej bazie z danymi syntetycznymi,
  bez użycia sekretów produkcyjnych.

## Stan uruchomienia i blokady

Domyślna baza aplikacji nie została zmigrowana w tej operacji. Integracja
kodu nie oznacza działającego katalogu na tej bazie: wymagane SQL muszą
zostać zastosowane na niezależnie potwierdzonym, dozwolonym celu.
Testy funkcjonalne korzystają z oddzielnej lokalnej bazy.
Po restarcie API i podglądu potwierdzono rzeczywiste 503
`STEAM_CATALOG_SCHEMA_NOT_READY` w zwykłym podglądzie; UI pokazuje
komunikat o brakujących migracjach. Procesy testowego API i PostgreSQL
zostały zatrzymane po weryfikacji.

Nie przeniesiono CSV ani fixture'ów do bazy aplikacji. Worker pozostaje
wyłączony. Wydanie nadal wymaga prywatnego backupu z testem restore,
potwierdzenia docelowego schematu, testu zalogowanego organizatora
i dokładnego SHA dopuszczonego do publikacji. Poprzedni test korekt
w przeglądarce pozostaje niezweryfikowany; test katalogu go nie zastępuje.
