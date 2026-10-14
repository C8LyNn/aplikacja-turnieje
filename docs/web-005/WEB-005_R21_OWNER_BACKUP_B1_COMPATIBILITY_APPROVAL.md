# WEB-005 — R21 / zatwierdzona decyzja właściciela: Backup B2 / B1 Modern vs Legacy

**Data:** 2026-10-14, Europe/Warsaw  
**Polityka:** T060 Backup V3 portable revision/history / B1 Modern strict vs legacy  
**Źródło autoryzacji:** bezpośrednia odpowiedź właściciela WEB-005/A00: „Zatwierdzam Backup B1-A: nowe kopie mają rygorystyczny format, ale prawidłowe starsze kopie pozostają obsługiwane przez bezpieczną ścieżkę zgodności.” To **explicit OWNER POLICY CHOICE**, nie kod, migracja, test PASS, udzielenie go-live/merge ani pełna zgoda na B2–B6.  
**Źródła kontraktu:** [R21 owner decision packet](./WEB-005_R21_OWNER_DECISION_PACKET.md) §3, [A90 R20 source/policy report](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a90-r20-backup-b2-decisions/docs/web-005/agent-reports/A90/WEB-005_A90_R20_BACKUP_B2_DECISIONS.md).

## 1. Zatwierdzenie B1-A

**B1 = A / OWNER_EXPLICIT:** nowy, zaostrzony profil Backup V3 ma być **jawnie rozróżnialny** przez capability/version marker lub równoważny bezpieczny znacznik producenta; rygorystyczne reguły stosuje się do nowego profilu. Istniejące prawidłowe historyczne V2/V3 nadal są obsługiwane przez **ograniczoną, bezpieczną i testowaną ścieżkę zgodności**, bez fałszywego odrzucania legalnych kopii.

- **Nowe kopie:** producent emituje zdefiniowany znacznik profilu i wymagane dane; walidator stosuje pełne nowe invariants, nie „cichy” tryb legacy.
- **Starsze, legalne kopie:** rozpoznaj bezpiecznie historyczny format według jawnych własności, nie tylko ślepo po brakującym polu; przeprowadź dotychczasowe wymagane kontrole autoryzacji, schematu, referencji, ograniczeń i bezpieczeństwa; wyłącz albo ogranicz **niebezpieczne Undo/Revert**, jeśli nie da się bezpiecznie odbudować danych historii lub tokenu rewizji — zakres degradacji wymaga decyzji B2–B5.
- **Uszkodzone / spreparowane dane:** nie wolno traktować brakującego nowego pola jako automatycznej przepustki do importu. Nieprawidłowe ID, rozjazdy pozycji QP/QPE/OP, niedozwolone obce referencje, niepoprawne kontrakty aktywnego Undo i inne potwierdzone niezmienniki pozostają fail-closed. Precyzyjne statusy błędów i zachowanie późnej transakcyjnej awarii doprecyzuje decyzja B6.
- **Kompatybilność danych:** w testach uwzględnić rzeczywiste legalne starsze V3 z pustymi tablicami `resultHistory:[]` i `actionLog:[]`, prawnie dopuszczonymi brakami opcjonalnych faz oraz `undoPayload:null`, przy rozróżnieniu brakującej wymaganej właściwości od pustej tablicy. Nie narzucamy nowych obowiązkowych pól starym producentom bez planu migracji.
- **Baza i transport:** import nie modyfikuje produkcji poza odrębnie autoryzowanym normalnym przepływem produktu; żadne destrukcyjne PG16 testy ani SQL/DDL bez osobnego GO.
- **T055 współzależność:** nowy trwały `basketConfigRevision` wymaga A20/A90 oceny sposobu odtwarzania rewizji dla backupów starszych niż wdrożenie CAS, bez fałszowania historycznych tokenów; B1 nie decyduje jeszcze B3 portable revision.

## 2. Przyszłe kryteria akceptacyjne (NIE WYKONANO)

1. Poprawna nowa kopia strict V3 — walidacja/import/restore działa przy zachowaniu semantyki rewizji i historii wymaganej przez podpisane B2–B6.
2. Reprezentatywne poprawne starsze V2/V3 — import legalny, stan turnieju zachowany, ograniczenia niebezpiecznych działań widoczne i spójne.
3. Uszkodzony stary lub nowy plik — fail-closed przed clone lub pełny rollback zgodnie z typem awarii; żadne częściowe rekordy.
4. Wsteczne i nowe kopie testowane na izolowanej fizycznej PG16 po odrębnym GO testowym i zgodzie na reset.
5. Dodatkowe szczegóły nowego strict capability marker, nieodtwarzalnej historii i degradacji Undo/Revert będą doprecyzowane po **B2–B6** i niezależnie odebrane przez A60.

## 3. Status i ograniczenia delegacji

| Element | Status |
|---|---|
| B1 Modern/Legacy | **OWNER_APPROVED_A** |
| B2 History parity | WAIT_OWNER |
| B3 Match state revision | WAIT_OWNER |
| B4 Action ordering | WAIT_OWNER |
| B5 Nested action ID remapping | WAIT_OWNER |
| B6 Import error / rollback | WAIT_OWNER |
| Code implementation / migration / destructive tests | **NO GO**; separate A00 file-scoped authorization required |
| A50 native app execution | NOT_EXECUTED on relevant PR |
| SWARM-006 | HOLD until formal final handoff GO; EXEC-B conditional future test debt with mandatory integrated QA |

**Zapis:** B1-A to wybór polityki przez właściciela w tej rozmowie, nie certyfikacja wszystkich starszych kopii ani twierdzenie, że istniejący importer już implementuje rozdzielne nowe i historyczne profile.
