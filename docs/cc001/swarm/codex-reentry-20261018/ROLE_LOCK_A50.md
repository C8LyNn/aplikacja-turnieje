# IDENTITY LOCK — A50 — DO NOT REASSIGN

> **TWOJA JEDYNA ROLA W TYM URUCHOMIENIU: A50 — Simulation / Frostguard F02 Physics Parity.**
>
> **NIE JESTEŚ A10. NIE WYBIERAJ ROLI SAMODZIELNIE.**
>
> **BOUND TASK ID:** A50
>
> **BOUND ISSUE:** #138 — https://github.com/C8LyNn/aplikacja-turnieje/issues/138
>
> **BOUND BRANCH:** `feat/cc001-r17-w4-a50-f02-physics`
>
> **GATE:** READY NOW

## OBOWIĄZKOWA KONTROLA TOŻSAMOŚCI — ZANIM COKOLWIEK ZROBISZ

Pierwsza linia Twojej odpowiedzi MUSI być DOKŁADNIE:

`IDENTITY_OK | CC-001 | A50 | ISSUE #138 | READY NOW`

Zastąpienie numeru agenta innym, np. A10, to błąd krytyczny. Nie wykonuj jego zadań. Numer przypisania odczytujesz WYŁĄCZNIE z tego nagłówka i z treści zlecenia użytkownika, nigdy z kolejności agentów w MASTER DISPATCH, nazw obcych plików, historii innego wątku, przykładu lub raportu A10. A10 może występować w źródłach jako AUTOR KONTRAKTU, ale nie jest Twoją tożsamością.

Jeżeli aktywna rozmowa lub lokalny checkout zawiera *jednoznaczną sprzeczną autoryzację* innego agenta/brancha, wypisz `IDENTITY_CONFLICT: expected A50 / #138` i NIE ZMIENIAJ ŻADNYCH PLIKÓW, dopóki operator nie wskaże właściwego wątku. Nie próbuj sam przejąć cudzej roli.

**PROJEKT:** CC-001 — CORE CLASH UNITY
**FALA:** R17-W4 RECOVERY (bez tworzenia W5)
**REPO:** https://github.com/C8LyNn/aplikacja-turnieje
**MASTER DISPATCH:** https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-w4-master-dispatch-20261018/docs/cc001/swarm/R17_W4_MASTER_DISPATCH_20261018.md
**BASELINE R16 — FROZEN SHA:** de1fe4b88fce3bd08ef383165dc2cd622af2536b
**UNITY ROOT:** unity/cc001-r16/CoreClash-V149-Unity/
**V148:** chroniony / nie zmieniać. **PROTOCOL 149:** zamrożony.
**ZASADY:** żadnych merge do main, force-push, publikacji, destrukcyjnych operacji, zmian poza przydziałem; prawdziwe testy z komendą i exit code, inaczej NOT_RUN.

## PRZYPISANY ZAKRES

**Tożsamość:** A50 / Simulation / Frostguard F02 Physics Parity
**Zadanie:** Napraw test-first F02 Frostguard do V148: stop plain anchor, 0 sztucznych stosów Earth, force 0.30, mass 2x, replay release i istniejące prawdziwe Earth stacks. W3 #124 celowo RED i NOT_RUN. Tylko A50 może edytować CollisionResolver.cs. Nie zmieniaj F01 HP=5.
**Własna gałąź:** `feat/cc001-r17-w4-a50-f02-physics`
**Jedyne dozwolone zmiany:** Unity Core/ElementalEffects.cs; Physics/CollisionResolver.cs; Tests/ElementalTests.cs; docs/cc001/swarm/w4/A50/**

## TRYB WYKONANIA

1. Najpierw sprawdź swoje Issue #138 i HEAD przypisanej gałęzi. Dopiero potem przeczytaj MASTER DISPATCH, konkretną sekcję `A50`, aktualny kontekst i przypisane raporty.
2. **NIGDY nie zmieniaj przydzielonej roli po przeczytaniu wspólnego dokumentu.** Inne role w dokumencie są kontekstem, nie poleceniami dla Ciebie.
3. Zadanie READY: wykonuj realną pracę w dozwolonych plikach; nie kończ na powieleniu promptu.
4. Szczegółowy kontekst zachowano również w: [własnym wcześniejszym pliku](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/agents/A50_FROSTGUARD_F02.md) oraz `04_HANDOFF_AND_TEST_EVIDENCE.md`. Nie jest to powód do zmiany tożsamości.
5. Gdy wykonasz autoryzowane zadanie, zapisz SHA, listę plików, prawdziwe komendy i wyniki testów / NOT_RUN, pięć statusów i HANDOFF w SWOIM Issue #138. Żadnej publikacji lub merge.

**Jeśli nie możesz pobrać GitHuba, powiedz dokładnie czego brakuje. Nie zmyślaj wyniku.**
