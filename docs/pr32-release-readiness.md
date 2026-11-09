# PR #32 — przygotowanie wydania (bez publikacji)

Źródło funkcji: `C8LyNn/aplikacja-turnieje`, `release/tournament-ops-20261013-01`,
commit `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.
Lokalny punkt powrotu: gałąź `backup/pre-pr32-20261013`; integracja:
`integration/pr32-20261013`. Importowany snapshot ma dokładnie zweryfikowane
drzewo plików wskazanego commitu, ale nie jest importem jego historii Git:
uwierzytelniony `git fetch` był niedostępny. Lokalny merge wykonano przez
wspólną bazę `c50cc48e6fa508592bda3f4838111e9cff5af80c`. Nie wypychać
syntetycznej gałęzi snapshot jako oryginalnej historii GitHub.

## Granice wydania

- Zachowano przyjęte lokalne strony landing/SF/Portfolio, ich zasoby i
  konfigurację produkcyjną artefaktów. Lokalny import Steam pozostaje
  insert-only; nie zastępuje go nadpisujący import z wydania GitHub.
- Nowe funkcje korekt wyników potrzebują **obu** migracji 0030 i 0031.
  Samo przełączenie kodu bez schematu powoduje błędy na trasach korekt.
- Baza produkcyjna Replit miała przy odczytowym audycie 46 tabel i 5502
  rekordów; nowej tabeli operacji korekt nie było. Te liczby są punktem
  odniesienia, nie oczekiwaną niezmienną w działającej aplikacji.
- Nie wykonywać równocześnie wydania kodu, migracji schematu i cutover do
  Neon. Stara rola transferowa Neon ma unieważnione hasło; testowa kopia
  nie jest potwierdzonym mechanizmem odzyskiwania aktualnej produkcji.

## Backup — brama przed jakąkolwiek zmianą produkcji

Nie wykonano nowego trwałego backupu produkcyjnego w ramach integracji.
Zrzutu zawierającego prywatne rekordy nie wolno zostawiać w repo,
workspace, publicznych artefaktach, czacie, logach CI ani w publikacji.
Przed wydaniem operator musi:

1. Wybrać autoryzowany **prywatny, trwały i szyfrowany** magazyn kopii,
   z ograniczonym dostępem oraz retencją; uzgodnić możliwość pobrania
   i odtworzenia kopii. Nie używać starego sekretu transferowego Neon.
2. Wykonać spójny odczytowy `pg_dump -Fc` rzeczywistego źródła produkcyjnego
   do prywatnego katalogu tymczasowego (0700, plik 0600), bez URI w argv,
   logach ani historii poleceń. Po bezpiecznym przeniesieniu do magazynu
   usunąć plik tymczasowy.
3. Udokumentować czas, sumę kontrolną, rozmiar i prywatną lokalizację kopii
   **bez** udostępniania jej treści lub podpisanego URL. Przetestować
   odtworzenie na osobnej bazie testowej, nie na produkcji.
4. Powtórzyć odczyt tabel, liczebności, uprawnień i stanów migracji tuż
   przed zmianą; uwzględnić transakcje zawarte między kopią a wydaniem.
   Bez sprawdzonego backupu, możliwości restore i zgody użytkownika:
   **STOP**.

## Migracje 0030 → 0031 (plan, nie wykonano na produkcji)

1. Potwierdzić identyfikator rzeczywistej bazy obsługującej publiczną
   aplikację i mechanizm wspieranej przez Replit zmiany schematu. Obecny
   `drizzle-kit push` projektu celowo nie zarządza tabelami aplikacji;
   **nie wolno zakładać**, że samo Publish wykona te SQL. Nie dodawać
   migracji do startu serwera ani kroku budowania/publikacji.
2. Potwierdzić stan zastany: tabela
   `public.tournament_correction_operations` nie istnieje, kolumny
   `matches.revision` i wcześniejsze migracje są obecne, a nowy schemat
   nie będzie w konflikcie z uprawnieniami, FK i istniejącymi rekordami.
3. Na izolowanej bazie testowej uruchomić po kolei 0030 i 0031; sprawdzić
   tabelę, indeks, dwie kolumny potwierdzenia, FK i trzy dozwolone statusy.
   SQL 0030 tworzy nową tabelę i indeks bez `BEGIN`; przy dopuszczonej
   później operacji produkcyjnej musi zostać wykonany atomowo, z
   przerwaniem przy pierwszym błędzie. SQL 0031 zawiera własne
   `BEGIN/COMMIT`, dodaje kolumny i zastępuje dwa ograniczenia CHECK w
   jednej transakcji. Nie stosować resetów, `--clean`, `TRUNCATE` ani
   kasowania istniejących rekordów.
4. Dopiero po zatwierdzeniu backupu, planu obsługi awarii i mechanizmu
   publikacji schematu osobno uzyskać zgodę na zmianę produkcji. Gdy
   migracja zakończy się błędem, zatrzymać wydanie; nie wykonywać
   destrukcyjnej „naprawy” ani nie publikować kodu wymagającego nowej
   tabeli. Przed uruchomieniem nowych tras korekt potwierdzić strukturę
   i testy organizatora na docelowym środowisku.

## Warunki dopuszczenia wydania

Weryfikacja lokalnej integracji: generowanie OpenAPI i pełna kontrola typów
przeszły; 890 testów jednostkowych backendu/powiązanego UI, 532 testy
integracyjne na nowym lokalnym PostgreSQL, 89 kontraktów źródłowych i 59
testów Animated Effects przeszły bez błędów. Build frontendu i wbudowanego
Animated Effects przeszedł; pozostały nieblokujące ostrzeżenia o wielkości
bundli, mapach źródeł i wcześniejszym odwołaniu do nieobecnej czcionki.
Landing sprawdzono w podglądzie, a API po rozgrzaniu połączenia zwróciło
`status: ok, database: ok`. Przegląd przeglądarkowy pełnej ścieżki korekty
zalogowanego organizatora nie został wykonany; nie zastępują go testy API.
Migracje i usuwanie fixture'ów wykonały się **wyłącznie** w nowej testowej
bazie lokalnej, bez sekretów produkcyjnych. Serwer testowy został zatrzymany.

- Kontrola typów, generowanie klienta OpenAPI, testy backendu, test
  prawdziwego PostgreSQL na wydzielonej bazie testowej, kontrakty i
  build przechodzą dla **tego samego** commitu integracji.
- Sprawdzić ręcznie zaakceptowane ekrany landing, SF i Portfolio oraz
  ścieżkę organizatora korekt wyników z uprawnieniami i ponownym
  odczytem po odświeżeniu.
- Po backupie i oddzielnej akceptacji migracji: potwierdzić gotowość
  produkcyjnej bazy, dopiero potem rozważyć publikację. Rozbieżne
  zmiany GitHub wymagają przeglądu integracji, nie `reset --hard`,
  nadpisania lokalnego interfejsu lub bezpośredniego `git pull` na
  obecnej gałęzi.
