# Neoludologia — protokół niezależnego kodowania i adjudykacji (pilot v8)

## Cel i status

Procedura dotyczy **zgodności interpretacji jednostek fragment × mikrostanowisko × wersja codebooka**. Nie służy do automatycznego rozstrzygania, co dana osoba „naprawdę myśli”, ani do tworzenia rankingu osób lub jakości poglądów. To protokół pilotażowy wymagający walidacji na realnym korpusie.

## Przebieg badania

1. **Zamroź definicje przed próbą**: wybierz wersję codebooka, warunki włączenia i wyłączenia oraz wersję Sampling Plan. Przy modyfikacji definicji utwórz nową wersję codebooka.
2. **Zweryfikuj źródło**: zachowaj tytuł, URL, datę (gdy znana), kontekst oraz oryginalny fragment. Adjudykacji podlegają wyłącznie fragmenty oznaczone `verified`.
3. **Kodowanie A i B**: dwóch różnych koderów przypisuje oddzielne oceny tego samego fragmentu i mikrostanowiska. Zapisuj także N/A, jawność, poziom dowodu, pewność i uzasadnienie. Ocena `0` nie jest brakiem danych. Najpierw zakończ oba przebiegi.
4. **Zgodność przed dyskusją**: pokaż pokrycie wspólnych jednostek, zgodność surową (wliczając obustronne N/A), zgodność ocen liczbowych (bez N/A) i liniowo ważoną kappę Cohena dla skali −2…+2. Kappa jest niezdefiniowana dla niewystarczającej liczby wspólnych ocen lub zdegenerowanych rozkładów. Nie utożsamiaj zgodności z trafnością.
5. **Adjudykacja**: tylko trzeci, niezależny recenzent-człowiek sprawdza oryginalną wypowiedź i kontekst. Wybiera uzgodnioną ocenę −2…+2 / N/A **albo** odroczenie. Decyzja zawsze wymaga uzasadnienia.
6. **Historia i ponowny przegląd**: adjudykacja jest dopisywana jako nowy rekord; oryginalne kodowania i starsze decyzje pozostają zachowane. Każdy rekord zachowuje migawki obu kodowań i fragmentu. Edycja lub usunięcie tych źródeł generuje problem integralności i wymaga ponownego przeglądu.
7. **Raport**: podawaj liczbę źródeł niezależnych, fragmentów, wspólnych jednostek, liczbę ocen N/A, konfliktów, odroczeń, liczebności próby i wersję codebooka. Wyniki po adjudykacji nie mogą zastąpić wskaźnika pierwotnej zgodności.

## Ograniczenia wdrożenia

- „Ukryj poprzednie kodowania” w Coding Lab jest **osłoną interfejsu, nie kontrolą dostępu**. Badacze dysponujący pełnym zbiorem danych mogą zobaczyć inne oceny w innych częściach aplikacji. W badaniach wymagających ścisłego zaślepienia używaj oddzielnych pakietów danych dla koderów i połącz je po zamknięciu rundy.
- Funkcja nie tworzy automatycznie oceny konsensusowej używanej przez Evidence Profile / PositionAssessment. Adjudykacja pozostaje odrębną warstwą historii. Włączenie jej do syntez wymaga dodatkowego, jawnego kontraktu metodologicznego.
- Dwóch koderów i jeden recenzent nie zapewniają automatycznie reprezentatywności. Koncentrację źródeł sprawdzaj w Sampling Plan / Corpus Health.
- Brak oceny N/A oraz 0 są semantycznie różne. Żaden model wymiarów nie może traktować N/A jako zera.
- Dane są aktualnie zapisywane w `localStorage` przeglądarki; wykonuj eksporty JSON przed ważniejszymi operacjami. Mechanizm nie jest jeszcze wieloużytkownikowym systemem z uprawnieniami ani synchronicznym serwerowym obiegiem kodowań.

## Wersjonowanie

- ResearchProjectData: `schemaVersion: 8`.
- Importy `schemaVersion: 2–7` migrują do v8 z pustą historią adjudykacji bez kasowania istniejących kodowań.
- Rekordy adjudykacji są append-only: `codingAId`, `codingBId`, oryginalne migawki, `reviewerId`, `decision`, `direction`, `rationale`, `createdAt`.
- Pierwotne współczynniki zgodności obliczaj **tylko z `codings`**, a nie z `adjudications`.

## Potencjalny kolejny etap

Osobny panel „Adjudication Queue” z filtrowaniem otwartych sporów oraz eksportem raportów metodologicznych, a następnie wersjonowany, prawdziwie odseparowany wieloużytkownikowy workflow koderów.

## Raport audytowy korpusu — Research Audit Export

W panelu `Corpus Health` badacz może wybrać konkretną wersję codebooka i opcjonalnie plan próbkowania. Dostępne są dwa formaty eksportu:

- **Markdown (.md)** — czytelny raport dla recenzenta: jawny zakres i data zrzutu, liczebność korpusu, pokrycie danych, sygnały ostrzegawcze według osoby, zgodność koderów oraz statusy adjudykacji.
- **JSON (.json)** — strukturalna migawka tych samych wskaźników, z identyfikatorami kontekstu, bez modyfikowania źródłowego projektu.

Raport wykorzystuje istniejące funkcje Corpus Health, Adjudication Queue, Coder Agreement oraz kontroli integralności. **Nie tworzy automatycznego certyfikatu gotowości publikacyjnej**, nie sumuje jakości w jeden score i nie przypisuje stanowisk do wymiarów X/Y.

Interpretacja liczebności:

- `codingRecords` — liczba wpisów kodowania dla wybranej wersji codebooka;
- `codedUnits` — liczba par fragment × mikrostanowisko, niezależnie od liczby koderów; to nie jest liczba niezależnych argumentów ani źródeł;
- `review` — liczba **par koderów**, a nie liczba wypowiedzi;
- `integrityIssues` — uwzględnia **cały lokalny projekt**, nie tylko wybrany codebook;
- `samplingGaps` — nie jest oceniane bez jawnie wybranego planu;
- `N/A` — brak wystarczającej podstawy do oceny, odmienny od neutralności `0`.

Raport ma format `formatVersion: 1`, zawiera datę generowania i `schemaVersion` danych wejściowych. Nie zastępuje pełnego JSON backupu źródeł i historii ani nie podpisuje kryptograficznie danych. Eksportowane metadane mogą umożliwiać identyfikację badanych osób; przed udostępnieniem zewnętrznym badacz powinien przejrzeć raport i uprawnienia do materiału.

## Historia audytu — porównanie migawek (Research Audit Delta)

Ekran `/ludology/statement-classification/audit-compare` przyjmuje **tylko** wcześniejszy eksport raportu `Corpus Health → JSON` w formacie `formatVersion: 1`. Nie służy do importowania pełnych projektów ani zapisu cudzych danych do obecnego badania. Plik bazowy jest odczytywany lokalnie w przeglądarce (limit 2 MB), bez aktualizacji `localStorage` i bez jakiejkolwiek migracji.

Raport bieżący jest wyliczany na aktualnych danych dla świadomie wybranego codebooka oraz opcjonalnego planu próbkowania. Porównywanie **jest blokowane** i nie oblicza różnic, jeżeli:

- zmieni się identyfikator lub wersja codebooka;
- zmieni się identyfikator lub wersja planu próbkowania, także gdy jeden raport nie zawiera planu;
- raport bazowy będzie późniejszy niż bieżący;
- różnią się wersje formatu lub zakresy raportów.

Dla zgodnych raportów system pokazuje zmianę liczebności korpusu, metryk zdrowia i liczby sporów między koderami. Jednostką adjudykacji pozostaje **para kodowań**, nie samodzielny fragment źródła. Dla osób wyświetla dodane/usunięte profile na podstawie stabilnych ID, zmiany podstawowego pokrycia oraz nowe i nieobecne już flagi `severity + code`.

`samplingGaps: null` oznacza **nie oceniano**, a nie zero. Wartości nieobliczalne nie są zamieniane na `0`, a wynik nie jest rankingiem ani automatyczną oceną gotowości publikacyjnej. Zgodny identyfikator i wersja narzędzia **nie gwarantują** niezmienności treści definicji; eksporty nie są kryptograficznie podpisane. Badacz powinien zachować oryginalne pliki źródłowe i recenzować wyniki w ich kontekście.

Porównanie eksportuje czytelne `.md` i strukturalne `.json`. Nie zastępuje ono pełnego eksportu danych projektu.

## Porównywalność treści narzędzi (Audit Instrument Snapshot)

Nowsze eksporty audytu zachowują `formatVersion: 1` i dodają pole
`instrumentSnapshots`. Zawiera ono **kanoniczną, pełną treść** wybranego
codebooka i jego mikrostanowisk oraz opcjonalnego planu próbkowania.

Podczas porównania dwóch raportów kontrolowane są osobno:

1. identyfikator i wersja codebooka;
2. identyfikator i wersja planu próbkowania;
3. **rzeczywista zgodność treści** obu instrumentów, niezależnie od kolejności
   kluczy JSON i kolejności mikrostanowisk w tablicy;
4. kierunek chronologiczny zrzutów.

Zmiana definicji mikrostanowiska, reguł włączenia/wyłączenia, przykładów,
statusu, metadanych instrumentu lub progów samplingowych **blokuje wyliczanie
różnic**, nawet jeżeli autor nie zmienił numeru wersji. Przyjęto konserwatywne
podejście: także redakcyjna zmiana definicji wymaga świadomego przeglądu.

Raporty historyczne bez `instrumentSnapshots` można nadal zaimportować w
`Historii audytu`, ale **nie są porównywalne liczbowo** z nowymi raportami:
nie ma danych umożliwiających potwierdzenie niezmienności definicji. Taki
przypadek daje jawną blokadę i wskazówkę, żeby utworzyć nową migawkę bazową.

To porównanie dokładnych kanonicznych ciągów JSON, **nie kryptograficzny
podpis** ani proof of provenance. Import zaufanych raportów nadal wymaga
kontroli badacza. Migawka może zawierać niepublikowane szczegóły metodologii,
dlatego eksport należy przejrzeć przed udostępnieniem zewnętrznym.
