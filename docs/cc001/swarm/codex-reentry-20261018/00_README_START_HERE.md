# CC-001 — START HERE / IDENTITY-LOCKED CODEX RE-ENTRY v2
## Krytyczna poprawka: agent A60 NIE jest agentem A10.

**ZASTĘPUJE wcześniejsze instrukcje użycia `01_CODEX_GLOBAL_PROMPT.md` i `06_SHORT_PROMPT_FOR_THREADS.md` we wątkach specjalistycznych.** Te dwa pliki NIE służą już do wklejania do Axx. Nie zlecaj agentowi samodzielnego wyszukiwania własnego numeru w MASTER DISPATCH. Wszystkie role są przypisane jednoznacznymi plikami.

**PAKIET:** https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/00_README_START_HERE.md
**MASTER DISPATCH:** https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-w4-master-dispatch-20261018/docs/cc001/swarm/R17_W4_MASTER_DISPATCH_20261018.md
**PROJEKT:** CC-001 — Core Clash Unity, R17-W4. Zachowaj wcześniejsze decyzje. Nie twórz W5 ani nowych Issue.

## 1. Dokładna procedura (najbezpieczniejsza)

1. Otwórz oddzielną sesję Codexa dla każdej roli READY.
2. **Wklej do sesji TYLKO link do jej dedykowanego `ROLE_LOCK_Axx.md` z tabeli poniżej** wraz z jednym poleceniem: „Przeczytaj cały dokument pod podanym URL, zachowaj zapisane w nim IDENTITY i wykonaj jego instrukcje. Najpierw wypisz dokładnie wymaganą linię IDENTITY_OK.”
3. Sprawdź PIERWSZĄ linię odpowiedzi. Musi zawierać EXACT numer oraz Issue wskazane w tabeli. Dla A60-G0 musi być: `IDENTITY_OK | CC-001 | A60-G0 | ISSUE #126 | READY NOW`. **Jeżeli agent napisze A10, A60-CANDIDATE lub inne Issue — PRZERWIJ i nie pozwól na zapis żadnych plików.**
4. Każdy agent przed modyfikacją pobiera własne aktualne Issue, branch HEAD i sekcję MASTER DISPATCH. Nie wolno zmieniać roli po przeczytaniu wspólnego dispatchu.
5. Każdy agent pracuje w osobnym worktree i własnej istniejącej gałęzi (bez nadpisywania cudzych zmian); oddaje commit SHA, diff, faktyczne testy i HANDOFF na swoim Issue. Gdy brak uprawnień do GitHuba, zwraca patch + NOT_PUBLISHED.

**Nie używaj jednej, ogólnej wiadomości dla wszystkich.** Nie dopisuj w danym wątku przypadkowego numeru z innej roli. Używaj dokładnie własnego pliku.

## 2. Role-locked launch files

| ID sesji | Rola | Issue | PUNKT WEJŚCIA (wyłącznie ten dla danej roli) | Gate |
| --- | --- | --- | --- | --- |
| **A60-G0** | Independent QA G0 | [Issue #126](https://github.com/C8LyNn/aplikacja-turnieje/issues/126) | [ROLE_LOCK_A60-G0.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/ROLE_LOCK_A60-G0.md) | READY |
| **A73** | Git Integration | [Issue #136](https://github.com/C8LyNn/aplikacja-turnieje/issues/136) | [ROLE_LOCK_A73.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/ROLE_LOCK_A73.md) | READY |
| **A72** | Build & CI | [Issue #113](https://github.com/C8LyNn/aplikacja-turnieje/issues/113) | [ROLE_LOCK_A72.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/ROLE_LOCK_A72.md) | READY |
| **A40** | Unity Gameplay | [Issue #92](https://github.com/C8LyNn/aplikacja-turnieje/issues/92) | [ROLE_LOCK_A40.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/ROLE_LOCK_A40.md) | READY |
| **A50** | Simulation / F02 | [Issue #138](https://github.com/C8LyNn/aplikacja-turnieje/issues/138) | [ROLE_LOCK_A50.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/ROLE_LOCK_A50.md) | READY |
| **A70** | Integration / Release | [Issue #137](https://github.com/C8LyNn/aplikacja-turnieje/issues/137) | [ROLE_LOCK_A70.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/ROLE_LOCK_A70.md) | WAIT |
| **A71** | Source Integrity | [Issue #140](https://github.com/C8LyNn/aplikacja-turnieje/issues/140) | [ROLE_LOCK_A71.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/ROLE_LOCK_A71.md) | WAIT |
| **A74** | Repository Hygiene | [Issue #141](https://github.com/C8LyNn/aplikacja-turnieje/issues/141) | [ROLE_LOCK_A74.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/ROLE_LOCK_A74.md) | WAIT |
| **A20** | UX/UI & Game Feel | [Issue #95](https://github.com/C8LyNn/aplikacja-turnieje/issues/95) | [ROLE_LOCK_A20.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/ROLE_LOCK_A20.md) | WAIT |
| **A31** | Networking | [Issue #94](https://github.com/C8LyNn/aplikacja-turnieje/issues/94) | [ROLE_LOCK_A31.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/ROLE_LOCK_A31.md) | WAIT |
| **A60-CANDIDATE** | Independent Candidate QA | [Issue #139](https://github.com/C8LyNn/aplikacja-turnieje/issues/139) | [ROLE_LOCK_A60-CANDIDATE.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/ROLE_LOCK_A60-CANDIDATE.md) | WAIT |

A60 jest przydzielony DWA RAZY, ale do dwóch różnych faz: **A60-G0 #126 READY** i **A60-CANDIDATE #139 WAIT**. Nie wolno ich mieszać. A10 posiada odrębną rolę Lead Game Design i jest źródłem semantycznego kontraktu, lecz **nie ma nowego aktywnego zadania W4 w tej paczce**; A10 nie wolno przypisać prac A60.

## 3. Zawartość pomocnicza

- `02_VERIFIED_STATE_AND_GATES.md`: zweryfikowany stan GitHuba na moment sporządzenia pakietu (może się zestarzeć).
- `03_AGENT_ROUTING.md`: mapa numer→Issue→branch, poprawiona, ale **nie zastępuje dokumentu ROLE_LOCK**.
- `04_HANDOFF_AND_TEST_EVIDENCE.md`: wymagane dane reportingu.
- `05_WAITING_AGENTS.md`: warunki wyjścia z WAIT.
- `STATUS_SNAPSHOT.json`: dane machine-readable z identyfikatorami i punktami wejścia.
- `agents/Axx_*.md`: szczegóły techniczne dopiero PO odczytaniu ROLE_LOCK.
- `01_CODEX_GLOBAL_PROMPT.md`: tylko dla operatora HQ i narzędzi z rzeczywistą izolacją agentów, **NIE PASTUJ DO SESJI Axx**.
- `06_SHORT_PROMPT_FOR_THREADS.md`: ostrzeżenie i instrukcja wyboru własnego ROLE_LOCK, **nie wspólny prompt wykonawczy**.

## 4. Bezpieczeństwo

Nie wolno scalać zmian do `main`, publikować gier, zmieniać chronionego R16/V148, modyfikować protokołu 149, wywoływać force-push ani rozszerzać zakresów plików. G0 wymaga osobnego A60 source-only PASS, A70 integruje dopiero po G0 i A73; A71/A74/A60 candidate/A20/A31 są gated WAIT. Nie twierdź, że agent został uruchomiony, jeżeli tylko opublikowano prompt.

**Jeżeli wątek wcześniej pomylił A60 z A10, rozpocznij nową sesję Codexa i wklej WYŁĄCZNIE link `ROLE_LOCK_A60-G0.md`.** Nie kontynuuj pracy w pomylonej roli.
