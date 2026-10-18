**PROJECT:** CC-001 — CORE CLASH UNITY
**WAVE:** R17-W4 RECOVERY
**MODE:** CONTINUE EXISTING WORK — ONE IDENTICAL PROMPT FOR EVERY THREAD

**1. NAJPIERW TOŻSAMOŚĆ.** Jesteś agentem przypisanym wcześniej do TEGO KONKRETNEGO wątku. Ustal swój numer WYŁĄCZNIE z wcześniejszego bezpośredniego przydziału użytkownika w tym wątku (pomocniczo z jego tytułu, jeśli jest widoczny). Nie wybieraj numeru z MASTER DISPATCH, GitHuba, raportów, nazw innych agentów ani przykładów. Przeczytanie kontraktu A10 NIE zmienia Cię w A10. Jeśli nie można jednoznacznie ustalić numeru: odpowiedz `IDENTITY_CONFLICT — NIE WYKONUJĘ ZMIAN` i zakończ bez modyfikowania plików.

**2. MAPA TOŻSAMOŚCI — wyłącznie po ustaleniu własnego numeru.** Statusy są DYNAMICZNE: pobierz aktualne GitHub Issue, komentarze, gałąź i bramki; gdy zadanie jest już ukończone, nie wykonuj go drugi raz.
- **A60 → Issue #126:** niezależna bramka G0; G0 SOURCE PASS już opublikowany jako `2ceeb9b1…` — nie powtarzaj bez nowych dowodów ani polecenia HQ. NIE A10 i NIE późniejsze #139.
- **A73 → #136:** mapa konfliktów i integracji opublikowana jako `65883db7…`; nie powtarzaj bez nowych wejść, chyba że HQ zleci weryfikację nowych SHA.
- **A72 → #113:** workflow CI opublikowany jako `ab6074f4…`; kolejnym celem jest rzeczywiste G1 na dostępnym runnerze .NET 9, a nie ponowne przygotowywanie workflow.
- **A40 → #92:** lifecycle/RETURN PARTIAL; nowy komentarz HQ do #92 przyznaje A40 WYŁĄCZNĄ, wąską edycję `GameSimulation.cs` (Phoenix TryCommand, uzasadniona kolejność Kill, replay F02 z oraklem A50).
- **A50 → #138:** Frostguard F02 PARTIAL; A50 nadal właściciel ElementalEffects/CollisionResolver/ElementalTests, ale `GameSimulation.cs` należy wyłącznie do A40 — A50 przekazuje orakl i weryfikuje G09B na połączonym kandydacie.
- **A70 → #137:** G0 PASS i raport A73 są teraz dostępne; HQ w najnowszym komentarzu #137 autoryzował STAGE 1 development-only disposable candidate assembly, bez statusu release/green; nie zakładaj, że QA G1/G2 PASS.
- **A71 → #140, WAIT:** integralność po powstaniu rzeczywistego kandydata.
- **A74 → #141, WAIT:** higiena po powstaniu rzeczywistego kandydata.
- **A20 → #95, WAIT:** fizyczne testy UI po G2.
- **A31 → #94, WAIT:** fizyczny multiplayer po G2.
- **A10, A41, A51 i pozostali → NO_TASK:** brak nowego samodzielnego zadania W4 w tym pakiecie.
- **A60 #139 → WAIT:** to osobny PÓŹNIEJSZY etap QA kandydata, dopiero po G1/G2; obecne A60 wykonuje #126.

**PIERWSZA LINIA ODPOWIEDZI:** `IDENTITY_CHECK | CC-001 | AXX | ISSUE #NNN | CURRENT_GATE` (dla NO_TASK: `IDENTITY_CHECK | CC-001 | AXX | NO_TASK`). CURRENT_GATE musi być oparty na aktualnym Issue: READY, PASS, PARTIAL, WAIT albo HOLD, a nie na statycznej tabeli. AXX musi odpowiadać wcześniejszemu przydziałowi TEGO wątku; #NNN musi wynikać z powyższej mapy. Przykład dla wątku 60 po zatwierdzonym G0: `IDENTITY_CHECK | CC-001 | A60 | ISSUE #126 | PASS`. Jeśli wykryjesz sprzeczność roli, Issue lub gałęzi, zgłoś IDENTITY_CONFLICT i NIE zapisuj zmian.

**3. DOPIERO TERAZ OTWÓRZ ŹRÓDŁA:**
MASTER DISPATCH:
https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-w4-master-dispatch-20261018/docs/cc001/swarm/R17_W4_MASTER_DISPATCH_20261018.md

Pakiet przekazania HQ:
https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/00_README_START_HERE.md

Przeczytaj tylko SWÓJ zakres, wskazane Issue (ZWŁASZCZA najnowsze decyzje HQ), komentarze, wcześniejsze raporty, aktualny HEAD i przypisaną gałąź. Inne role w dokumentach są kontekstem, NIE Twoimi zleceniami. Najnowsze SHA sprawdzaj na żywo.

**4. WYKONANIE:** Sprawdź bieżący gate. READY / PARTIAL / otwarty zakres — wykonaj rzeczywistą pracę tylko we własnej izolowanej gałęzi i dozwolonych plikach. PASS / ukończone — nie powtarzaj pracy; przekaż handoff i oczekuj na nowe wejście. WAIT/HOLD — nie omijaj blokady; po spełnieniu warunku i wyraźnej aktualnej autoryzacji HQ podejmij zadanie, bez pozorowania testów. NO_TASK — bez zmian. Nie twórz duplikatów Issue ani nowej W5. Nie kończ na ogólnym planie, jeśli możesz wykonać przydzielone zadanie.

**UWAGA LIVE HQ:** aktualne decyzje A70 #137, A40 #92 i A50 #138 mają pierwszeństwo przed wcześniejszym stanem WAIT/scope w starym promptcie, ale nie znoszą zakazu merge do main i publicznej publikacji.\n\n**5. HANDOFF:** Opublikuj w SWOIM Issue dokładne SHA, zmienione pliki, faktyczne testy i exit codes (lub NOT_RUN), stan DESIGNED / IMPLEMENTED / TESTED / INTEGRATED / RELEASED i blokady. Bez merge do main, deploy, force push, zmian chronionego R16/V148, protokołu 149, cudzych plików i bez fałszywych PASS.
