# WEB-005 — R21 / zatwierdzenie właściciela: T055 Basket optimistic concurrency

**Data:** 2026-10-14, Europe/Warsaw  
**Zakres:** T055 / UX047 — full-graph stage basket GET/PUT, ochrona przed lost update; powiązanie z UX044 dirty draft.  
**Podstawa:** właściciel odpowiedział w wątku WEB-005/A00 „tak, może być” na bezpośrednio poprzedzający, szczegółowy kontrakt koordynatora obejmujący D1–D6. Jest to **bezpośrednia aprobata decyzji produktowej**, a nie wykonane testy, zgoda na migrację, code GO ani finalny handoff.  
**Źródła:** [R21 pakiet owner](./WEB-005_R21_OWNER_DECISION_PACKET.md) §1; [A110 R20 T055 owner decision](./agent-reports/A110/WEB-005_A110_R20_BASKET_DECISION.md).

## Zatwierdzony kontrakt D1–D6

| ID | Zatwierdzona opcja | Wymagane zachowanie i granice |
|---|---|---|
| **D1 = B** | **Trwały, monotoniczny `basketConfigRevision`** (lub równoważna nazwa schematu) | Rewizja rośnie atomowo razem z zapisem koszyków; nie wolno dopuszczać ABA ani dwóch identycznych nowych rewizji dla kolejnych zmian. **Wymaga osobnej oceny DB/Backup (A20/A90) i ewentualnej jawnie autoryzowanej migracji.** |
| **D2 = B** | **GET `ETag` / PUT `If-Match`** | Odpowiedź GET daje token tej samej spójnej wersji grafu; PUT wymaga tokenu, bez wyprowadzania go z przestarzałego cache. Nie ujawnia tokenów innych turniejów; porównanie tylko do właściwego tenant i grafu. |
| **D3 = B** | **HTTP 412 Precondition Failed** | Stary `If-Match` oznacza `STAGE_BASKET_CONFIGURATION_STALE`, brak zapisów częściowych i brak utraty zmian drugiego edytora. |
| **D4 = A** | **HTTP 428 Precondition Required** dla brakującego tokenu | Klient legacy bez `If-Match` nie może kontynuować niechronionego full-graph PUT. Niepoprawny token odrzucamy odpowiednim fail-closed 4xx; wybór 400 vs 422 dla *malformed* pozostaje detalem kontraktu implementacyjnego, nie zezwoleniem na zapis. |
| **D5 = B** | **Token koszyków + atomowa weryfikacja zmian etapów/rosteru pod blokadą** | Każda relewantna zmiana stanu etapów/uczestników wykryta po otwarciu draftu musi uniemożliwić cichy zapis starego grafu; porównanie precondition po locks, **przed** DELETE/INSERT/UPDATE grafu. |
| **D6 = B** | **Zachowanie lokalnego draftu + ręczne uzgodnienie i ponowny opt-in save** | Po 412 klient nie gubi edycji. Informuje o konflikcie, wymaga jawnego reload/porównania/uzgodnienia i ponownego zatwierdzenia; nie wykonuje automatycznego retry z przestarzałym tokenem. |

### Dodatkowe niezmienniki QA

- Edytor A i B czytają V0. Jeden prawidłowy PUT tworzy V1, drugi z V0 zwraca 412 i **zero mutacji**; dane zwycięzcy pozostają nienaruszone.
- Równoległa aktualizacja listy etapów/uczestników może również uczynić stary draft nieaktualnym; dokładna spójna rewizja/warunki walidacji są częścią testu.
- GET graph + ETag muszą odpowiadać jednemu stanowi transakcyjnemu; polityka organizatora i uprawnień pozostaje obowiązująca niezależnie od wersji.
- Brak `If-Match` 428/no writes; malformed fail-closed/no writes; prawidłowy i aktualny token -> zapis atomowy i nowa rewizja.
- UI zachowuje prywatny draft tylko w prawidłowym kontekście turnieju i nie pozwala na odtworzenie go w niepowiązanym turnieju.
- Historyczne klienty korzystające z bezwarunkowego PUT wymagają planu aktualizacji przed faktycznym włączeniem fail-closed. Jeśli potrzebna jest migracja, zaplanować rollback zgodny z Backup V3.

## Czego to nie zatwierdza

- **Nie** upoważnia A20/A90 do migracji/DDL, resetu produkcji/testowych baz bez osobnego GO, zmiany formatu Backup V3 ani włączenia wymagania `If-Match` na produkcji bez planu kompatybilności.
- **Nie** upoważnia agenta WEB-005 do rozpoczęcia kodowania w R21 (R21 = no code), merge, uruchomienia kosztowego CI, wdrożenia czy przekazania SWARM-006.
- **Nie** nadaje statusu `SOURCE_FIXED` istniejącemu kodowi, bo obecna implementacja T055 nie ma klientowskiego CAS. Osobny test-first scoped task wymagany, z A60 niezależnym QA po wykonaniu.
- Nadal otwarte: Backup B2 B1–B6, MP2B public CAS+Host, Steam/session, PR53 raw orphan, oryginalne 38-case historyczne decyzje, formalny final-only SWARM-006 GO.

**Decyzja:** `T055_OWNER_APPROVED_D1_B_D2_B_D3_B_D4_A_D5_B_D6_B`  
**Realizacja:** `IMPLEMENTATION_PENDING / MIGRATION_REVIEW_PENDING / NO_CODE_GO / NO_RELEASE_GO`.
