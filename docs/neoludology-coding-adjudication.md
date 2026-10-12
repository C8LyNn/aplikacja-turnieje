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
