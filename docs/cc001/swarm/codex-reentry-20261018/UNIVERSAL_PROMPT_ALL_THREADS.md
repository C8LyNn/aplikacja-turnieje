# CC-001 — ONE UNIVERSAL PROMPT FOR ALL EXISTING AGENT THREADS
## R17-W4 / CONTINUE EXISTING WORK — do not start a new wave

This document is the **same, unmodified instruction for every existing CC-001 agent thread**. It deliberately does NOT assign the recipient a universal agent number.

**KROK 0 — USTAL WŁASNĄ ROLĘ, ZANIM OTWORZYSZ JAKIKOLWIEK LINK.**
Odczytaj numer swojej dotychczasowej roli WYŁĄCZNIE z wcześniejszych bezpośrednich przydziałów użytkownika w TYM KONKRETNYM WĄTKU (pomocniczo z jego tytułu, jeśli jest dostępny). Nie zmieniaj numeru agenta po przeczytaniu jakiegokolwiek dokumentu, historii GitHub, raportu A10, cudzej gałęzi ani przykładów. Obecność nazwy A10 w kontrakcie gry nie oznacza, że jesteś A10. Nie używaj pierwszej napotkanej roli ani roli z sąsiednich rozmów. Jeśli wcześniejsze przydziały wątku są niewidoczne, sprzeczne lub niejednoznaczne, napisz `IDENTITY_CONFLICT — NIE WYKONUJĘ ZMIAN` i zakończ. Nie zgaduj.

**DOPIERO TERAZ** powiąż odczytany numer ze ściśle ustaloną mapą R17-W4:

| Twój dotychczasowy numer | Jedyny bieżący przydział | Gałąź | Status |
|---|---|---|---|
| A60 | #126 — G0/source QA | `feat/cc001-r17-w3-a60-baseline-qa` | READY |
| A73 | #136 — W4 conflict map | `feat/cc001-r17-w4-a73-merge-preview` | READY |
| A72 | #113 — managed .NET9/CI | `feat/cc001-r17-w4-a72-managed-ci` | READY |
| A40 | #92 — lifecycle/RETURN | `feat/cc001-r17-w4-a40-lifecycle-return` | READY |
| A50 | #138 — Frostguard F02 | `feat/cc001-r17-w4-a50-f02-physics` | READY |
| A70 | #137 — integration candidate | `integration/cc001-r17-w4-disposable-candidate-20261018` | WAIT G0 PASS + A73 map |
| A71 | #140 — candidate integrity | `feat/cc001-r17-w4-a71-candidate-integrity` | WAIT actual candidate |
| A74 | #141 — candidate hygiene | `feat/cc001-r17-w4-a74-candidate-hygiene` | WAIT actual candidate |
| A20 | #95 — phone/tablet physical QA | dotychczasowa własna gałąź / branch QA po G2 | WAIT G2 build |
| A31 | #94 — physical multiplayer QA | dotychczasowa własna gałąź / branch QA po G2 | WAIT G2 build + devices |
| A10, A41, A51 i inni | Brak nowego samodzielnego zlecenia W4 w tej paczce | nie zmieniaj gałęzi | NO_TASK |

**Wyjątek ważny:** A60 jest teraz wyłącznie A60/G0 w Issue #126. Późniejsze A60 candidate QA #139 to ODRĘBNY etap i nie wolno go rozpoczynać przed kandydatem oraz bramkami G1/G2. A60 nigdy nie przejmuje roli A10.

**PIERWSZA LINIA TWOJEJ ODPOWIEDZI:**
`IDENTITY_CHECK | CC-001 | A<twój numer z historii tego wątku> | ISSUE #<numer z mapy> | READY/WAIT/NO_TASK`.
Jeśli zidentyfikowany numer, Issue lub gałąź są sprzeczne z jednoznacznym przydziałem wątku, ZATRZYMAJ SIĘ PRZED ZAPISEM i zgłoś `IDENTITY_CONFLICT`. Nie drukuj fikcyjnego potwierdzenia.

**ŹRÓDŁA — CZYTAJ DOPIERO PO KROKU 0:**
1. W4 MASTER DISPATCH: https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-w4-master-dispatch-20261018/docs/cc001/swarm/R17_W4_MASTER_DISPATCH_20261018.md
2. HQ CODEX RE-ENTRY PACK: https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/00_README_START_HERE.md
3. Twoje WŁASNE GitHub Issue (numer z mapy), jego najnowsze komentarze, obecny HEAD własnej gałęzi, wcześniejsze raporty i kontrakty. Inne role w dokumentach są wyłącznie kontekstem.

**WYKONANIE:** Jeżeli status READY — wykonaj realne przydzielone zadanie na własnej istniejącej, izolowanej gałęzi/worktree i tylko w plikach dozwolonych przez W4 dispatch. Nie twórz duplikatów Issue ani nowego W5. Jeżeli WAIT — sprawdź bramkę; jeśli zamknięta, raportuj konkretne WAIT bez pozorowania pracy. Jeżeli NO_TASK — bez modyfikacji. Jeśli aktualny GitHub pokazuje nowe, jawne polecenie HQ dla Twojej roli, zweryfikuj je przed wykonaniem; przy sprzeczności zatrzymaj się i przedstaw konflikt, nie przełączaj samowolnie roli.

**HANDOFF:** Wynik opublikuj na własnej gałęzi i w swoim Issue: exact commit SHA, changed paths, realne komendy/testy/exit codes lub NOT_RUN, DESIGNED/IMPLEMENTED/TESTED/INTEGRATED/RELEASED, blokady i URL raportu. Nie deklaruj PASS na podstawie samego pliku testów lub raportu. **Nie wykonuj merge do main, release/deploy, force push, destrukcyjnych działań, zmian chronionego R16/V148, protokołu 149 ani plików innego agenta.**
