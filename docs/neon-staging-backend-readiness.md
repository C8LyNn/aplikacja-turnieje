# Neon — test backendu na oddzielnej gałęzi (bez produkcji)

**Stan 12.10.2026:** zabezpieczenia i testy offline są przygotowane. Rzeczywisty backend NIE został jeszcze połączony z Neon. Nie zmieniono produkcyjnego DATABASE_URL.

## Środowiska

- Produkcja: Replit C8LyNn.replit.app i dotychczasowa baza PostgreSQL. Nie zmieniamy połączenia.
- Neon Free: projekt dawn-union-59334166, PostgreSQL 16 (Frankfurt).
- Neon main: br-shy-cloud-b98t46bi, zweryfikowana kopia 46 tabel i 5502 rekordów.
- Neon QA: br-empty-water-b9ug71tx (qa-owner-handoff-20261012), izolowany klon testowy. Compute może być uśpiony.
- Repozytorium: PR #22 zawiera migrację, ten PR dodaje zabezpieczenia testów stagingowych.

## Dlaczego timeout healthchecku wymaga uwagi

Obecny endpoint /api/healthz przerywa zapytanie po 1000 ms. Pierwszy SELECT 1 po wzbudzeniu uśpionej kopii Neon zajął około 3,2 sekundy, łącznie z narzutem narzędzia pośredniczącego. Nie jest to dokładny czas SQL ani gwarancja wydajności. Może jednak powodować fałszywe 503 po okresie bezczynności.

Nowa zmienna DB_HEALTH_TIMEOUT_MS umożliwia wartości 1000–15000 ms. Niepoprawna lub nieobecna wartość daje dotychczasowe 1000 ms. Dla dedykowanego stagingu Neon sugerowane jest 10000 ms. Jest to ustawienie testowe, nie zmiana obecnej produkcji.

## Bezpieczny test API

Skrypt: artifacts/api-server/src/scripts/neon-staging-api-smoke.ts

- Czyta prywatny NEON_STAGING_DATABASE_URL, odmawia pracy bez tego sekretu.
- Zezwala wyłącznie na bezpośredni host istniejącej gałęzi QA Neon, bazę tournament_manager i rolę tournament_manager_owner. Odrzuca Replit, Neon main, pooler i brak TLS.
- Odrzuca uruchomienie, jeżeli istnieje INNY DATABASE_URL albo zadanie DEPLOYMENT_TASK.
- Dodaje na starcie KAŻDEGO połączenia pg Pool opcję default_transaction_read_only=on oraz sprawdza ją przez SHOW.
- Tworzy Express wewnątrz procesu bez publikowania portu. Wysyła tylko GET: /api/healthz, /api/tournaments i, jeśli istnieje turniej public_online, odczyty szczegółów, etapów, meczów, graczy, tabeli i drabinki.
- Nie pobiera danych prywatnych turniejów i nie wykonuje POST, PUT, PATCH ani DELETE.
- Kontroluje liczby turniejów, meczów i graczy przed i po, raportuje wyłącznie agregaty i wynik. Nie drukuje rekordów, tokenów ani treści sekretów.

Komenda w **osobnym zaufanym środowisku stagingowym** posiadającym sekret i zależności pnpm:

    pnpm --filter @workspace/api-server exec tsx src/scripts/neon-staging-api-smoke.ts

Connection string należy podać wyłącznie przez prywatny menedżer sekretów stagingu. Nie kopiować go do GitHuba, czatu lub logów i nie uruchamiać testu w produkcyjnym procesie Replit.

## Wykonane weryfikacje

- GitHub Actions: typowanie bibliotek i backendu, testy jednostkowe healthchecku oraz polityki połączenia stagingowego.
- Neon SQL: 46 tabel, 5502 rekordy, 314 constraints, 125 indeksów, 28 sekwencji, 17 triggerów. Bez uszkodzonych indeksów, niewalidowanych constraints i wyłączonych triggerów.
- Read-only SQL na kopii nie zastępuje pełnego uruchomienia Express i weryfikacji konfiguracji konkretnego hostingu.

## Bramki przed produkcją

1. Rzeczywiste uruchomienie skryptu smoke na odizolowanym stagingu, przez sekret do QA child branch.
2. Testy auth i mutacji wyłącznie na dodatkowej disposable bazie QA, nigdy na produkcji.
3. Sprawdzenie warm i cold healthchecku w rzeczywistym hostingu.
4. Weryfikacja migracji, synchronizacji przy cutover, backupu i rollbacku.
5. Usunięcie starego nieaktywnego NEON_MIGRATION_DATABASE_URL z Replit Secrets.
6. Odrębna decyzja o przełączeniu produkcyjnego DATABASE_URL po wszystkich testach.

Uwaga: gałąź main nie zawiera jeszcze funkcjonalności katalogu rozwijanych w PR #15–#17. Ten smoke test nie dowodzi działania jeszcze niewdrożonych tras.
