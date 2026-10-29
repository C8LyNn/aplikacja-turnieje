# SWARM-006 — Final Test Completion / przekazanie A60

Stan: **READY_FOR_INDEPENDENT_QA w zakresie bez DB; G2 HOLD; Production NO-GO.**

Testowany commit: [`c3f640470262064f890774d935c1388408051d5e`](https://github.com/C8LyNn/aplikacja-turnieje/commit/c3f640470262064f890774d935c1388408051d5e), rodzic zaakceptowanego zakresu: `6eb7bd6ac31a8851d08c3f50c7fed74d6b2c57f3`. Późniejszy commit raportu dodaje wyłącznie dokumentację i dowody. Kod aplikacji, G1, workflow, lockfile, SQL, gry i assety nie zostały zmienione. PR jest skierowany do osobnej gałęzi QA, której drzewo jest identyczne z G1, a nie do main/release.

## Wynik końcowy

**1533 wykonane przypadki PASS, 0 nierozwiązanych FAIL, 0 SKIP w zakończonym dozwolonym zakresie.** Osobno zachowano 60 ważnych wcześniejszych PASS (G1 Audience 11 oraz SE safety/readiness 23+26), bez ponownego wykonania tych plików. Łączny opisany zakres: **1593 PASS**. To liczby przypadków testowych; nie procent pokrycia kodu i nie akceptacja całej aplikacji.

| Grupa | PASS / FAIL / SKIP w końcowym zakresie | Dowody |
|---|---:|---|
| API unit, domena, kontrakty i syntetyczne HTTP — 55 plików | 775 / 0 / 0 | `api-unit-contracts-02.*` |
| Nowy kontrakt konfiguracja aplikacji → Drizzle, fałszywy transport | 1 / 0 / 0 | `driver-contract-final-03.*` |
| Frontend React/jsdom — 39 plików bez zaakceptowanego Audience | 511 / 0 / 0 | 491 PASS w `frontend-regressions-01.*`, 20 PASS w dwóch ponowionych plikach `frontend-streaming-retry-02.*` |
| Pack17–26 + validator ledger, statyczne/syntetyczne | 126 / 0 / 0 | 80 niezmienionych PASS z `native-source-contracts-01.*` + 46 PASS z `corrected-source-contracts-02.*` |
| Klasyfikatory, konfiguracje, instalatory na sztucznych fixture i preflight | 48 / 0 / 0 | 41 PASS `pure-native-regressions-01.*`, 3 PASS `schema-config-unit-02.*`, 4 PASS `routing-preflight-unit-01.*` |
| Animated Effects — 10 plików | 59 / 0 / 0 | `animated-effects-unit-01.*` |
| Syntetyczny HTTP probe tras na lokalnym fixture | 13 / 0 / 0 | `static-http-probe-02.*` — nie live QA |
| API źródła i API testy: TypeScript | 2 kontrole PASS; przypadki N/A | `api-typecheck-source-02.*`, `api-typecheck-tests-01.*` |
| Animated Effects, mockup-sandbox, scripts: TypeScript | 3 kontrole PASS; przypadki N/A | odpowiednie `*-typecheck-01.*` |
| Deklaracje referencji potrzebne do typecheck API | 1 krok PASS, 3 biblioteki; przypadki N/A | `typecheck-declarations-prerequisite-01.*` |
| Frontend typecheck i wcześniejsze deklaracje G1 | REUSED PASS | `prior/07-frontend-typecheck.log`, `prior/05-declarations.log`, receipt G1 |

Każdy `*.json` uruchomienia podaje **pełną komendę i argumenty, cwd, executable, Node, daty UTC, SHA commita, hash roboczego diffu, wyjście/exit, PASS/FAIL/SKIP/cancelled, hash logu i guardu**. `evidence-index.json` agreguje te receipty; `test-inventory.json` wymienia każdy aktywny plik oraz kopie szablonowe. `SHA256SUMS.txt` obejmuje każdy dostarczony plik poza samym manifestem. Liczniki N/A pozostają N/A dla kompilatora i niewykonanych grup.

## Poprawki i historia błędów

1. Pięć testów Pack19/20/21/25/26 oczekiwało nieobsługiwanego przez Drizzle `readOnly:true`, podczas gdy aplikacja używa poprawnego `accessMode:"read only"`. Szósty błąd był w asercji Pack25, która nie dopuszczała później dodanego `impactRiskReport`. Zmieniono wyłącznie asercje; zachowano zakazy insert/update/delete/execute, uprawnienia organizatora i advisory-only. Pierwsze wykonanie: **120 PASS / 6 FAIL**; zmienione pliki po naprawie: **46/46 PASS**.
2. Dodany test czyta literalne opcje z rzeczywistego wywołania `db.transaction` przez AST TypeScript i przekazuje je do zainstalowanego sterownika Drizzle. Fałszywy klient przechwytuje `begin isolation level repeatable read read only` i `commit`. Brak połączenia, Pool i wykonywania SQL. Kontrolowana zmiana `read only` → `read write` dała oczekiwany FAIL; odtworzono identyczne bajty (`mutation-restoration.json`), a test na czystym zapisanym commicie przeszedł 1/1.
3. Frontend początkowo miał **491 PASS / 2 błędy ładowania plików**, oba z powodu brakującego jszip. Znaleziono istniejący jszip 3.10.2 zgodny z lockfile i skopiowano jego zainstalowane pliki/zależności do nowej kopii; ponowiono wyłącznie te dwa pliki: 20/20 PASS. Nie wykonywano pnpm install.
4. Pierwszy API typecheck miał brakujące deklaracje referencji (`TS6305` i wtórne błędy typów). W nowym checkoutcie wygenerowano wyłącznie deklaracje trzech bibliotek, potem obie konfiguracje API przeszły bez diagnostyk. Nie zmieniano typów, nie dodawano wyciszeń i nie wykonywano bundlerów ani skryptu Build G2.
5. Pierwsza próba syntetycznego HTTP była zablokowana przez sandbox (`EACCES` dla loopback). W kolejnej dozwolonej próbie z guardem sieci lokalny probe przeszedł 13/13. Pierwsza nakładka wymuszająca jawny host listen(0) zaburzała synchroniczne `server.address()` w supertest; częściowy log API i przerwane wyjście zachowano. Poprawiona nakładka zachowuje zachowanie listen(0), odrzuca zaakceptowane połączenia spoza loopback i nadal blokuje DB/sieć zewnętrzną. Końcowe API: 775/775. Nakładka jest częścią dowodów operatora, nie kodem aplikacji.
6. `pure-native-regressions-01` zawierał 41 PASS i jeden błąd ładowania pg przed ukończeniem kopii zależności. Ten plik po dostępności istniejącego pg: 3/3 PASS. Nie uruchomiono zapytań DB.

Pierwsze nieudane/przerwane próby i kontrola negatywna pozostają w pakiecie; nie są przepisywane na PASS ani doliczane ponownie. Wczesne wykonania zachowują rzeczywisty bazowy SHA G1 i hash roboczego diffu. Normalizacja końców linii przy zapisie commita nie zmieniła logiki; końcowy patch źródła jest w `fix-c3f6404.patch`, a nowy test ma dodatkowo czysty receipt z c3f6404. Kod produktu od c3f6404 do commita raportu jest identyczny.

## Środowisko i zachowane granice

Windows x64, Node **24.18.0**, TypeScript **5.9.3**, tsx **4.21.0**. Nowy checkout na Pulpicie, osobna gałąź. Kopiowano istniejące zainstalowane zależności z lokalnych checkoutów; nie wywołano pnpm i nie przechodzono przez źródłowy magazyn pnpm. Końcowe **164/164** wersji bezpośrednich zależności importerów zgadza się z kanonicznym lockfile (`7f241968e0f57e11f5c1cbfba80efe79c48971d8ddd95c7454cb7b87fe932fc3` po normalizacji LF). To nie jest nowa instalacja frozen ani twierdzenie o odtworzeniu całego grafu pnpm. Guard usuwa odziedziczone zmienne DB/PG/sekretów, blokuje zewnętrzne sockety/TLS/DNS i porty DB. Testy HTTP używały wyłącznie krótkotrwałych fixture; nie uruchamiano serwera aplikacji.

G1 Audience 11/11, jego frontend typecheck i deklaracje są ponownie użyte na niezmienionych blobach. Historyczne 23+26 SE PASS mają pobrany wyłącznie do odczytu, zdekodowany istniejący log `prior/ci-job-119773762107.log`; zdalny compare potwierdza, że od historycznego SHA do G1 zmieniły się tylko dwa pliki aplikacji frontendowej, test Audience i dokument dyspozycji. Nie uruchamiano ani nie ponawiano żadnego workflow. G1/V7 oryginały zachowały bajty; patrz `immutability.json`.

**Korekta pinu do A00/A60:** komentarze A00 6397849194 i 6398026292 podają 65-znakowy literal hasha markera, kończący się `…e536b`. To nieprawidłowy format SHA-256. Rzeczywisty hash oryginalnego markera i kopii zachowanej na początku tej sesji to **`189498740f2d436262a153e118e5a96db49e8885eb6da6095ac855c1e215e536`**. Receipt (`1e09c749…98f37e`) i log instalacji (`dccf7530…fac92`) zgadzają się z pinami A00. Potrzebna korekta zapisu dowodowego przez A00/A60, bez ponawiania instalacji lub samodzielnej zmiany zaakceptowanej bramki.

## PENDING / BLOCKED i propozycja A00

- **Build G2: PENDING.** Brak potwierdzonego raportu wykonania; marker pozostaje `INSTALLED_OFFLINE`, katalog evidence zawiera receipt i log Install. Nie uruchomiono Install, Precheck ani jednorazowej próby Build. A00: ustalić stan wcześniejszej autoryzowanej próby i uzyskać istniejący raport/operator receipt. Nie traktować tego raportu jako zgody na ponowienie Build.
- **39 plików integracji DB: BLOCKED**, plus osobny katalogowy test SQL w mieszanym pliku routing-preflight. Lista i przyczyny w `test-inventory.json`. Komendy niewykonane: w API `node --import tsx ./test/run-tests.ts integration`; w lib/db odpowiednie `node --test --test-concurrency=1 ...integration.test.mjs`. Mieszany plik wykonano wyłącznie z `--test-name-pattern=Tournament routing persistence v2 preflight`; jego suite katalogowa z DROP/CREATE nie weszła do wykonania. Liczba przypadków DB PASS/FAIL/SKIP: **N/A, NOT_RUN**, nie fikcyjne zera ani „PASS przez skip”.
- Rzeczywiste transakcje, trwałość po reload, wyścigi dwóch zapisów, pełny przepływ turnieju z DB oraz browser/live smoke: **BLOCKED** wymaganiami usług i odrębnej autoryzacji. Mocki i jsdom nie dowodzą tych własności.
- A00: jeśli integracje mają zostać odblokowane, najpierw osobno zatwierdzić dokładne pliki/komendy, tożsamość w pełni jednorazowej lokalnej bazy i usługi, granice resetów oraz plan sprzątania. W tej sesji nie utworzono takiej bazy ani środowiska.
- G2 health 503, pochodzenie live artefaktu i rollback pozostają wcześniejszym HOLD; nie kontaktowano Neon/Replit/stagingu/produkcji.

## A60 — zakres niezależnego odbioru

1. Sprawdzić manifest i logi/receipty oraz zgodność finalnego PR z testowanymi blobami c3f6404. Nie ma potrzeby powtarzać 775+511 ani zamkniętego G1.
2. Zweryfikować 1–3 krytyczne granice: produkcyjne opcje transakcji i skuteczność kontroli negatywnej; wykluczenie realnych integracji z dozwolonej selekcji; korektę 65-znakowego pinu przy zachowaniu oryginalnych bajtów.
3. Wydać własny odbiór wyłącznie tego zakresu; integracje/Build/live pozostają osobnymi bramkami.

Przegląd źródłowy pomocniczego reviewera: brak Critical/Important/Minor, ograniczenia opisane w `internal-source-review.md`. Nie jest to niezależny odbiór A60.

Publikacja źródeł używa `[skip ci]` zgodnie z [oficjalną dokumentacją GitHub](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/skip-workflow-runs). Jedyny workflow na G1 obsługuje push/pull_request/workflow_dispatch; brak workflow na main. Nie zmieniono polityki CI. Osobna baza QA ma identyczne drzewo jak G1 i również commit `[skip ci]`. Brak merge, deploymentu oraz samodzielnego G2 PASS / Production GO.
