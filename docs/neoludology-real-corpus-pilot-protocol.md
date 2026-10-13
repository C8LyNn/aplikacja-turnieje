# Neoludologia — plan walidacji na rzeczywistym korpusie (pilot R1)

Status: **PROTOCOL DRAFT — NOT EXECUTED**. Dokument operacyjny dla istniejącego ResearchProjectData schema v8 i pilota codebooka `0.2.0` (Q01–Q05). Nie zmienia implementacji ani nie poświadcza wiarygodności wyników.

## Pytanie badawcze

Czy dwaj niezależni koderzy potrafią odtwarzalnie zaklasyfikować ten sam, zweryfikowany fragment wypowiedzi do jednego z pięciu mikrostanowisk, rozróżniając kierunek −2…+2, neutralne 0 i N/A? Które definicje prowadzą do sporów, a które przypadki są niedostatecznie udokumentowane?

To **badanie metody**, a nie ranking badanych osób. Nie interpretować zgodności koderów jako trafności przypisanych poglądów.

## Rejestracja przed zbieraniem danych

- Zapisz datę, nazwisko prowadzącego, identyfikatory koderów A/B i niezależnego recenzenta C, `codebook.id`, `codebook.version`, identyfikator i wersję planu próbkowania, języki i dopuszczone typy źródeł.
- Zarchiwizuj pełny eksport JSON projektu i migawkę Corpus Health. Nie zmieniaj w trakcie próby zasad Q01–Q05 ani progów doboru źródeł. Zmiany po pilotażu wymagają nowej wersji codebooka i nowej rundy.
- Wykonaj osobny, nieprodukcyjny projekt badawczy. Nie publikuj wrażliwych cytatów ani danych identyfikacyjnych bez przeglądu prawnego/etycznego.

## Schemat doboru materiału (propozycja wykonalności, nie próba reprezentatywna)

1. Wybierz 4 osoby w sposób jawny i udokumentowany; dla każdej 3 niezależne źródła (łącznie **12 źródeł**). Staraj się uzyskać różne formaty, daty i konteksty. Nie traktuj kilku fragmentów tego samego wywiadu jako osobnych źródeł.
2. Z każdego źródła wybierz po 2 fragmenty na podstawie ustalonej, zapisanej reguły doboru (łącznie **24 fragmenty**). Uwzględnij przypadki graniczne i potencjalne N/A; nie dobieraj wyłącznie klarownych deklaracji.
3. Każdy fragment otrzymuje 5 ocen względem Q01–Q05 u obu koderów: **120 jednostek fragment × mikrostanowisko i do 240 rekordów kodowania**. To obciążenie pracy, nie 240 niezależnych obserwacji.
4. Każde źródło zapisuje: URL/identyfikator, tytuł, osobę, datę publikacji lub jawne „nieznana”, typ, język, kontekst, metodę transkrypcji. Każdy fragment zachowuje dokładny cytat, lokalizator (np. timestamp), kontekst przed/po i status weryfikacji.
5. Jeśli źródło jest niedostępne, cytat niezweryfikowany albo autor wypowiedzi nieustalony — wyklucz z **adjudykacji** do czasu weryfikacji; zachowaj wpis i przyczynę wyłączenia w dzienniku braków. Nie zamieniaj wyłączenia na ocenę 0.

Wielkości powyżej to **robocza próba pilotażowa**. Nie wyciągaj z niej wniosków o populacji ani o zmianach poglądów w czasie.

## Procedura

1. Prowadzący przygotowuje 24 fragmenty bez gotowych ocen i zapewnia niezależne pakiety dla A i B. Przełącznik „ukryj kodowania” w UI **nie zapewnia prawdziwego zaślepienia**.
2. A i B niezależnie przypisują `direction` (−2,−1,0,+1,+2 lub `null` = N/A), `explicitness` (0–3), `evidenceLevel`, `confidence` i krótkie uzasadnienie. Brak wypowiedzi o Qxx to N/A, nie neutralność.
3. Po zamknięciu obu rund połącz dane, skontroluj unikalność rekordu według (fragment, mikrostanowisko, codebook, koder) i uruchom Coder Agreement. Duplikaty nie mogą zostać po cichu nadpisane.
4. Raportuj **licznik/denominator** wspólnych ocen, dokładną zgodność, zgodność wśród ocen liczbowych, odsetek N/A oraz liniowo ważoną kappę Cohena tylko tam, gdzie zdefiniowana. N/A-vs-ocena raportuj osobno. Wyniki zagregowane oznacz jako opisowe; jednostki z jednego źródła są zależne.
5. Spory przekaż recenzentowi C (nie A ani B). C widzi oryginalny kontekst i zapisuje niezależną decyzję z uzasadnieniem lub `deferred`. Zgodność przed adjudykacją pozostaje niezmieniona.
6. Po adjudykacji wykonaj ponowny Corpus Health, Audit JSON i porównaj z punktem bazowym. Jeśli instrument się zmienił, blokada porównania liczbowego jest oczekiwanym poprawnym wynikiem.
7. Zgłoś słabe reguły Qxx, typy niejednoznaczności i luki w źródłach; rozdziel poprawki definicji od poprawek UI/technicznych.

## Macierz przypadków kontrolnych

| Przypadek | Oczekiwane zachowanie |
| --- | --- |
| Wyraźna deklaracja tezy Q01–Q05 | Ocena z uzasadnieniem, oparta o zweryfikowany fragment |
| Preferencja dotycząca pojedynczej gry bez uogólnienia | N/A dla ogólnej tezy, o ile brak wystarczających przesłanek |
| Jawne „nie mam stanowiska” | Rozważ 0 tylko przy rzeczywistej wypowiedzi neutralnej wobec tezy; uzasadnij |
| Cytat bez kontekstu / autor niepewny | Nie adjudykuj przed weryfikacją |
| A: N/A, B: 0 | Konflikt N/A-vs-ocena, nie pełna zgodność |
| A: −2, B: +2 | Spór kierunku o wysokim priorytecie; nie rozstrzygaj automatycznie |
| Dwukrotny wpis tego samego kodera na jednostkę | Flaga integralności / wyłączenie z prawidłowej estymacji |
| Zmiana cytatu po rozstrzygnięciu | Historyczny przegląd staje się stale; wymaga nowego przeglądu |
| Zmiana definicji Qxx bez zmiany numeru wersji | Audit Delta pokazuje field-level diff i blokuje różnice liczbowe |

## Kryteria zakończenia i raport

**Zakończenie operacyjne**: pełne 12 źródeł i 24 zweryfikowane fragmenty albo jawne zestawienie powodów braków; zakończone niezależne rundy A/B; policzone denominatory; wszystkie konflikty mają decyzję C albo jawne odroczenie; brak nierozpoznanych duplikatów; zapisane dwa eksporty projektu i raport audytu.

**Ocenę jakości** podejmuje badacz na podstawie rozkładu rozbieżności i przeglądu konkretnych przykładów. Nie stosuj nieuzasadnionego progu kappa jako automatycznego „PASS”, nie twórz zbiorczego score jakości ani współrzędnych ideologicznych.

Raport końcowy powinien zawierać: wersję protokołu i codebooka, tabelę źródeł i wyłączeń, strukturę próby, rozkłady kodowań Q01–Q05, osobne liczniki N/A oraz 0, zgodność z denominatorami, listę najczęstszych przyczyn sporów, przypadki adjudykacji/defer, luki źródłowe, ograniczenia doboru i rekomendacje dla kolejnej wersji instrumentu.

## Status i ograniczenia techniczne

- Dane badawcze są obecnie przechowywane w `localStorage` — potrzebne kopie JSON. Nie ma izolacji koderów, autentykacji źródeł ani potwierdzonego wieloużytkownikowego workflow.
- `schemaVersion: 8` pozostaje bez zmian.
- Ten protokół jest dokumentacją. Nie wykonano naboru osób, kodowania realnych wypowiedzi, testu Windows ani przeglądarkowego QA.
