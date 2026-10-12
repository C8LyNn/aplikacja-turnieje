# Neon: bezpieczna kopia testowa całej produkcyjnej bazy

**Status:** instrukcja i narzędzie migracji; nie oznacza wykonanej kopii.
**Źródło:** produkcyjna baza PostgreSQL 16 aplikacji Replit.
**Cel:** Neon project \`dawn-union-59334166\`, database \`tournament_manager\`,
region Frankfurt, plan Free. Nie przełączać produkcyjnej aplikacji podczas testu.

## Ochrona danych

Źródło ma około 46 tabel (stan kontroli 12.10.2026), w tym dane turniejowe,
graczy, wyniki, dzienniki autoryzacji, sesje i metadane Replit. Pełna kopia
**zawiera dane prywatne**. Nigdy nie przesyłaj jej do GitHub, folderu
publicznego, publicznego endpointu HTTP, czatu ani do logów CI. Nie wykonuj
kopii produkcyjnej na koncie lub w projekcie dostępnym publicznie.

Nie kopiuj sekretu \`PRODUCTION_DATABASE_URL\` do innego systemu. Źródło
odczytuje go wyłącznie proces uruchomiony w zaufanym środowisku Replit,
w którym ten sekret już istnieje.

## Warunki uruchomienia

1. Neon musi pozostać **osobną, pustą bazą testową**.
2. Utwórz w Neon *tymczasową* rolę \`transfer_...\`, nadaj jej uprawnienia
   CONNECT/CREATE do bazy oraz CREATE/USAGE do schematu public.
3. Administrator ustawia **tylko w prywatnym menedżerze Secrets Replit**
   \`NEON_MIGRATION_DATABASE_URL\` na szyfrowane SSL URI tej roli.
   **Nigdy nie wklejaj connection stringa do rozmowy, repo ani commita.**
4. W Replit wykonuj zadanie z prywatnego terminala projektu posiadającego
   \`PRODUCTION_DATABASE_URL\`, \`pg_dump\`, \`pg_restore\`, \`psql\`
   w wersji 16 i plik \`scripts/neon-private-test-migration.py\`.
   Nie używaj GitHub Actions do kopiowania produkcyjnych rekordów.
5. Po zweryfikowaniu źródła i celu najpierw uruchom bez \`--apply\`;
   ta operacja jest wyłącznie odczytowym preflightem.
6. Uruchom \`python3 scripts/neon-private-test-migration.py --apply\`
   tylko dla pustej testowej bazy. Jeśli narzędzie zgłosi błąd,
   **nie uruchamiaj ponownie w ciemno**. Sprawdź stan celu i przyczynę.
7. Zweryfikuj liczbę tabel, sumy rekordów, strukturę kolumn, indeksy,
   ograniczenia i sekwencje. Sprawdź również istotne procedury, triggery,
   typy enum i funkcje przed jakimkolwiek przyszłym przełączeniem.
8. Usuń \`NEON_MIGRATION_DATABASE_URL\` z Replit Secrets, cofnij granty i
   usuń rolę transferową w Neon. Upewnij się, że żadna kopia zrzutu
   nie została w workspace, logach, artefaktach ani backupach publicznych.

## Dlaczego skrypt stosuje pg_dump/pg_restore

- \`pg_dump -Fc\` wykonuje spójny, odczytowy snapshot PostgreSQL.
- Zrzut trafia tylko do prywatnego tymczasowego katalogu, tryb 0700/0600.
- \`pg_restore --no-owner --no-acl --single-transaction --exit-on-error\`
  nie przenosi obcych ról i cofa nieudane odtworzenie w tej transakcji.
- Domyślny schemat \`public\` w Neon pozostaje nienaruszony;
  pozostałe źródłowe tabele, w tym \`_system\`, podlegają odtworzeniu.
- Skrypt blokuje cel z istniejącymi tabelami, niewłaściwą bazę i host
  niebędący Neon. Nie wykonuje DROP, DELETE ani TRUNCATE.
- Sekrety przekazywane są dzieciom wyłącznie przez zmienne środowiskowe,
  a nie jako argumenty uruchomienia czy wydrukowane logi.
- Raport nie zawiera wartości rekordów; tylko liczebność i nazwy
  ewentualnych tabel z rozbieżnościami.

## Brama weryfikacji

**Nie przełączać backendu** tylko na podstawie zgodności liczby tabel.
Przed cutover trzeba niezależnie sprawdzić:

- 46 źródłowych tabel i odpowiadające im tabele w kopii (lub aktualną liczbę,
  jeśli zmieniła się od czasu inwentaryzacji);
- liczebność per tabela ze spójnego punktu w czasie oraz referencje FK;
- enumy, triggery, funkcje, sekwencje/identity, indeksy, constrainty;
- smoke test turniejów, meczów, uwierzytelniania i katalogu;
- wersje aplikacji, migracji, uprawnienia SQL oraz izolację dostępu;
- koszt i limity Neon Free, restore/rollback, plan przerwy technicznej;
- bezpieczną politykę retencji kopii danych osobowych.

Aktualna aplikacja nadal używa Replit i wspólnego \`DATABASE_URL\`.
Nie zastępować tej zmiennej wartością Neon w produkcji przed ukończeniem
całej bramy. Próba kopiowania danych nie jest migracją produkcyjną.
