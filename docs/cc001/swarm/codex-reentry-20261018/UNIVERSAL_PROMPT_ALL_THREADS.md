**PROJECT:** CC-001 — CORE CLASH UNITY
**WAVE:** R17-W4 RECOVERY
**MODE:** CONTINUE EXISTING WORK — ONE IDENTICAL PROMPT FOR EVERY THREAD

**1. NAJPIERW TOŻSAMOŚĆ.** Jesteś agentem przypisanym wcześniej do TEGO KONKRETNEGO wątku. Ustal swój numer WYŁĄCZNIE z wcześniejszego bezpośredniego przydziału użytkownika w tym wątku (pomocniczo z jego tytułu, jeśli jest widoczny). Nie wybieraj numeru z MASTER DISPATCH, GitHuba, raportów, nazw innych agentów ani przykładów. Przeczytanie kontraktu A10 NIE zmienia Cię w A10. Jeśli nie można jednoznacznie ustalić numeru: odpowiedz `IDENTITY_CONFLICT — NIE WYKONUJĘ ZMIAN` i zakończ bez modyfikowania plików.

**2. MAPA — wyłącznie po ustaleniu własnego numeru:**
- **A60 → Issue #126, READY:** niezależna bramka G0; NIE A10 i NIE późniejsze #139.
- **A73 → #136, READY:** mapa konfliktów i integracji.
- **A72 → #113, READY:** .NET 9 i CI.
- **A40 → #92, READY:** lifecycle/RETURN.
- **A50 → #138, READY:** Frostguard F02.
- **A70 → #137, WAIT:** integracja po G0 PASS i raporcie A73.
- **A71 → #140, WAIT:** integralność po powstaniu rzeczywistego kandydata.
- **A74 → #141, WAIT:** higiena po powstaniu rzeczywistego kandydata.
- **A20 → #95, WAIT:** fizyczne testy UI po G2.
- **A31 → #94, WAIT:** fizyczny multiplayer po G2.
- **A10, A41, A51 i pozostali → NO_TASK:** brak nowego samodzielnego zadania W4 w tym pakiecie.
- **A60 #139 → WAIT:** to osobny PÓŹNIEJSZY etap QA kandydata, dopiero po G1/G2; obecne A60 wykonuje #126.

**PIERWSZA LINIA ODPOWIEDZI:** `IDENTITY_CHECK | CC-001 | AXX | ISSUE #NNN | READY/WAIT` (dla NO_TASK: `IDENTITY_CHECK | CC-001 | AXX | NO_TASK`). AXX musi odpowiadać wcześniejszemu przydziałowi TEGO wątku; #NNN musi wynikać z powyższej mapy. Przykład dla wątku 60: `IDENTITY_CHECK | CC-001 | A60 | ISSUE #126 | READY`. Jeśli wykryjesz sprzeczność roli, Issue lub gałęzi, zgłoś IDENTITY_CONFLICT i NIE zapisuj zmian.

**3. DOPIERO TERAZ OTWÓRZ ŹRÓDŁA:**
MASTER DISPATCH:
https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-w4-master-dispatch-20261018/docs/cc001/swarm/R17_W4_MASTER_DISPATCH_20261018.md

Pakiet przekazania HQ:
https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/00_README_START_HERE.md

Przeczytaj tylko SWÓJ zakres, wskazane Issue, komentarze, wcześniejsze raporty, aktualny HEAD i przypisaną gałąź. Inne role w dokumentach są kontekstem, NIE Twoimi zleceniami. Najnowsze SHA sprawdzaj na żywo.

**4. WYKONANIE:** READY — wykonaj rzeczywistą pracę tylko we własnej izolowanej gałęzi i dozwolonych plikach. WAIT — respektuj blokadę; bez pozorowania testów lub implementacji. NO_TASK — bez zmian. Nie twórz duplikatów Issue ani nowej W5. Nie kończ na ogólnym planie, jeśli możesz wykonać przydzielone zadanie.

**5. HANDOFF:** Opublikuj w SWOIM Issue dokładne SHA, zmienione pliki, faktyczne testy i exit codes (lub NOT_RUN), stan DESIGNED / IMPLEMENTED / TESTED / INTEGRATED / RELEASED i blokady. Bez merge do main, deploy, force push, zmian chronionego R16/V148, protokołu 149, cudzych plików i bez fałszywych PASS.
