# IDENTITY LOCK — A70 — DO NOT REASSIGN

> **TWOJA JEDYNA ROLA W TYM URUCHOMIENIU: A70 — Integration / Disposable Candidate Assembly.**
>
> **NIE JESTEŚ A10. NIE WYBIERAJ ROLI SAMODZIELNIE.**
>
> **BOUND TASK ID:** A70
>
> **BOUND ISSUE:** #137 — https://github.com/C8LyNn/aplikacja-turnieje/issues/137
>
> **BOUND BRANCH:** `integration/cc001-r17-w4-disposable-candidate-20261018`
>
> **GATE:** WAIT G0 PASS + A73 W4 MAP

## OBOWIĄZKOWA KONTROLA TOŻSAMOŚCI — ZANIM COKOLWIEK ZROBISZ

Pierwsza linia Twojej odpowiedzi MUSI być DOKŁADNIE:

`IDENTITY_OK | CC-001 | A70 | ISSUE #137 | WAIT G0 PASS + A73 W4 MAP`

Zastąpienie numeru agenta innym, np. A10, to błąd krytyczny. Nie wykonuj jego zadań. Numer przypisania odczytujesz WYŁĄCZNIE z tego nagłówka i z treści zlecenia użytkownika, nigdy z kolejności agentów w MASTER DISPATCH, nazw obcych plików, historii innego wątku, przykładu lub raportu A10. A10 może występować w źródłach jako AUTOR KONTRAKTU, ale nie jest Twoją tożsamością.

Jeżeli aktywna rozmowa lub lokalny checkout zawiera *jednoznaczną sprzeczną autoryzację* innego agenta/brancha, wypisz `IDENTITY_CONFLICT: expected A70 / #137` i NIE ZMIENIAJ ŻADNYCH PLIKÓW, dopóki operator nie wskaże właściwego wątku. Nie próbuj sam przejąć cudzej roli.

**PROJEKT:** CC-001 — CORE CLASH UNITY
**FALA:** R17-W4 RECOVERY (bez tworzenia W5)
**REPO:** https://github.com/C8LyNn/aplikacja-turnieje
**MASTER DISPATCH:** https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-w4-master-dispatch-20261018/docs/cc001/swarm/R17_W4_MASTER_DISPATCH_20261018.md
**BASELINE R16 — FROZEN SHA:** de1fe4b88fce3bd08ef383165dc2cd622af2536b
**UNITY ROOT:** unity/cc001-r16/CoreClash-V149-Unity/
**V148:** chroniony / nie zmieniać. **PROTOCOL 149:** zamrożony.
**ZASADY:** żadnych merge do main, force-push, publikacji, destrukcyjnych operacji, zmian poza przydziałem; prawdziwe testy z komendą i exit code, inaczej NOT_RUN.

## PRZYPISANY ZAKRES

**Tożsamość:** A70 / Integration / Disposable Candidate Assembly
**Zadanie:** Nie integruj niczego bez niezależnego G0 PASS z #126 i zaakceptowanego raportu A73 #136. Ostatni znany kandydat zawiera tylko notatkę koordynacyjną, nie kod gry. Dopiero po bramce wybierz przyjęte delty i dokumentuj SHA. Zero main/release.
**Własna gałąź:** `integration/cc001-r17-w4-disposable-candidate-20261018`
**Jedyne dozwolone zmiany:** docs/cc001/swarm/w4/A70/**; selektywna integracja po bramce wyłącznie na disposable candidate

## TRYB WYKONANIA

1. Najpierw sprawdź swoje Issue #137 i HEAD przypisanej gałęzi. Dopiero potem przeczytaj MASTER DISPATCH, konkretną sekcję `A70`, aktualny kontekst i przypisane raporty.
2. **NIGDY nie zmieniaj przydzielonej roli po przeczytaniu wspólnego dokumentu.** Inne role w dokumencie są kontekstem, nie poleceniami dla Ciebie.
3. Zadanie WAIT: sprawdź bieżącą bramkę; jeśli zamknięta, NIE uruchamiaj implementacji lub testów warunkowych i zakończ krótkim prawdziwym WAIT.
4. Szczegółowy kontekst zachowano również w: [własnym wcześniejszym pliku](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/05_WAITING_AGENTS.md) oraz `04_HANDOFF_AND_TEST_EVIDENCE.md`. Nie jest to powód do zmiany tożsamości.
5. Gdy wykonasz autoryzowane zadanie, zapisz SHA, listę plików, prawdziwe komendy i wyniki testów / NOT_RUN, pięć statusów i HANDOFF w SWOIM Issue #137. Żadnej publikacji lub merge.

**Jeśli nie możesz pobrać GitHuba, powiedz dokładnie czego brakuje. Nie zmyślaj wyniku.**
