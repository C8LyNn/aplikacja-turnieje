# WEB-005 — R21 / PAKIET DECYZJI WŁAŚCICIELA / HQ

**Data:** 2026-10-14, Europe/Warsaw  
**Stan:** DRAFT FOR OWNER SIGNOFF, **ZERO podpisanych decyzji** w dostępnych raportach R20. Dokument jest formularzem decyzji, NIE udziela automatycznie GO na kod, testy destrukcyjne, przekazanie SWARM-006, merge ani release.  
**Koordynator:** WEB-005/A00, podlega jednej globalnej Queen/HQ.  
**Źródła referencyjne:** R20 A80 sport, R20 A110 Basket CAS, R20 A90 Backup B2, R20 A70 public Revert CAS oraz R20 A60 independent QA; szczegółowe kontrakty w ich dokumentach. Rozstrzygnięcie wydaje rzeczywisty owner/HQ, nie agent.

## 0. Jak podpisać decyzję

Przy każdej pozycji wpisz: *ID → wybrany wariant albo wyraźne OWNER_APPROVED_DEFER / OWNER_APPROVED_WONT_FIX / OWNER_APPROVED_BLOCKED, osoba/rola, datowany link decyzji, przyjęte ryzyko, warunek release, termin ponownego przeglądu (jeśli dotyczy)*. Użytkownik może odpowiedzieć w rozmowie i wskazać wybrane warianty; A00 odnotuje je w DECISIONS.md dopiero po otrzymaniu rzeczywistej dyspozycji. **Brak odpowiedzi = POLICY_OPEN**. Sam wybór kierunku produktu nie daje implementacyjnego code GO.

## 1. T055 — koszyki etapów / pełne PUT i optimistic CAS

Źródło: [A110 R20 owner signoff](./agent-reports/A110/WEB-005_A110_R20_BASKET_DECISION.md); obecny source nie posiada precondition dla starego full-graph PUT. Każde D1–D6 jest niezależnym podpisem.

| ID | Wariant A | Wariant B / inny |
|---|---|---|
| D1 Revision source | atomowy, kompletny wektor stage ID/version obejmujący wszystkich writerów i ABA | monotoniczny trwały basketConfigRevision wraz z review migracji/Backup |
| D2 Wire precondition | JSON expectedRevision / expectedStageVersions | GET ETag i wymagany PUT If-Match |
| D3 Conflict | 409 z STAGE_BASKET_CONFIGURATION_STALE | 412 z tym samym błędem |
| D4 Legacy / missing | 428 Precondition Required; malformed fail-closed | inny jawny 4xx + plan aktualizacji klientów, nigdy silent last-writer-wins |
| D5 Roster/stage changes | każda relewantna zmiana unieważnia stary draft | dedykowany token + osobna atomowa walidacja stage/roster |
| D6 UX losing editor | zachowaj draft, pokaż diff i wyraźny rebase/discard | zachowaj draft, wymuś reload/manual reconcile i ponowny opt-in save |

**Do podpisu:** D1=___ D2=___ D3=___ D4=___ D5=___ D6=___; zaakceptowane konsekwencje migracji/kompatybilności=___.

## 2. T050/T051 — sześć decyzji sportowych

Źródło: [A80 R20 sport decisions](./agent-reports/A80/WEB-005_A80_R20_SPORT_DECISIONS.md).

| ID | Dopuszczalne warianty / otwarte ustalenia |
|---|---|
| S1 Swiss terminal match correction | TS-A 409 i zero writes; TS-B atomowo reopen match+stage+tournament+winner+roster i historia |
| S2 SE currentRound | earliest actionable pending feeder; max generated z osobnym actionableRound |
| S3 Swiss5/6 pairs | MIN_REMATCH_FIRST; SCORE_GROUP_FIRST; KEEP_GREEDY z jawną akceptacją możliwych do uniknięcia rematches |
| S4 Swiss BYE/NC | fairness ordering, priorytet bez wcześniejszego BYE, completed no_contest / cancelled / walkover i wpływ na standings |
| S5 DE GF runner-up | przegrany decydującego rozegranego GF/reset wraz z zasadami walkover/BYE; lub opisany wariant alternatywny |
| S6 DE places 3–N | wspólne miejsca wg elimination wave; wave+stageSeed tie-break; global seed; jawny kontrakt niestandardowy |

**Do podpisu:** S1=___ S2=___ S3=___ S4=___ S5=___ S6=___; test fixtures/rollback=___.

## 3. T060 B2 — portable Backup V3 / history / Undo

Źródło: [A90 R20 backup](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a90-r20-backup-b2-decisions/docs/web-005/agent-reports/A90/WEB-005_A90_R20_BACKUP_B2_DECISIONS.md). Nie myl resultHistory.revision z match state revision. Prawidłowe legalne stare backupy nie mogą zostać odrzucone przypadkowo.

| ID | Jawne alternatywy owner/HQ |
|---|---|
| B1 modern vs legacy | nowy strict capability/version z legalnym legacy; strict wszędzie dopiero po audycie historycznych producerów; tylko diagnostyka |
| B2 latest history tuple parity | strict latest history vs completed match z wyjątkami BYE/NC; reject present mismatch i degradacja direct Revert dla braku history; diagnostyka |
| B3 portable match state revision | explicit serialized match revision; bezpieczny DB default/rebase i konsekwencje CAS; nieportable i ograniczony Undo/Revert |
| B4 action provenance | typed completion action + deterministic total order; legacy degraded undo; tylko runtime guard |
| B5 nested IDs | strict modern rejection unknown/foreign IDs; legacy restricted import + warning/disable unsafe Undo; świadomie zaakceptowany fallback |
| B6 error / rollback | strict modern 400 INVALID_BACKUP_V3 before clone + late atomic rollback; lub ograniczony owner-approved import z disabled unsafe Undo |

**Do podpisu:** B1=___ B2=___ B3=___ B4=___ B5=___ B6=___; legacy positive compatibility matrix=___.

## 4. T040 MP2B — public Direct Revert CAS + Host

Źródło: [A70 R20 policy](./WEB-005_A70_R20_MP2B_OWNER_SIGNOFF.md).

- **RA — synchronized strict**: wymagane expectedMatchRevision i expectedCompletionActionId na publicznym POST, autoryzowany match-specific read, OpenAPI/Zod/React/Host wspólny cutover, stare karty odświeżają tokeny; missing/malformed 422, stale 409 no-write.
- **RB — krótkotrwała zgodność starych kart**: docelowo RA, osobna wersjonowana/gated legacy surface z actor allowlist, pomiarem, podpisanym hard end date, planem usunięcia i rollback.
- **RC — explicit defer**: bez wdrażania MP2B teraz, właściciel dokumentuje ryzyko wyścigu korekt, wyzwalacz i datę ponownej oceny; żadna fikcyjna ochrona CAS.

**Do podpisu:** MP2B=___, wire field name=___, legacy sunset (RB)=___, review/defer (RC)=___.

## 5. Bezpieczeństwo pozostałe

- **Steam absent secret**: autoryzowany HTTP status 403 vs 503, jednolity fail-closed contract na write routes; wybierz tylko po rozważeniu polityki API, brak podpisu obecnie.
- **Session semantics**: TTL / rotacja / digest/token storage / compatibility. Zażądaj od A30/A100 kontraktu źródłowego dla proponowanej zmiany, bez narzucania nowej semantyki w locie.
- **PR53 legacy unknown-owner raw query cache**: (A) zaakceptuj wyraźnie utrzymanie niewidocznych, niewiązanych raw wpisów do końca sesji przy niezależnym QA source-only i wymaganych testach runtime; (B) wymagaj pełnego erasure z najpierw uzgodnioną bezpieczną identyfikacją tenant, a dopiero później osobny code GO. Niezależna A60 R20 przyjęła *scoped* bezpieczeństwo rebind, NIE pełne usuwanie raw cache.

**Do podpisu:** STEAM=___ SESSION=___ LEGACY_CACHE=A/B/approved defer___.

## 6. Pochodzenie 38 historycznych przypadków WEB-004

A10 R20 posiada mapowanie tylko **29 nazwanych ID** na podstawie pochodnej ewidencji. **9 autentycznych historycznych ID jest niedostępnych** bez oryginalnego pliku WEB-004_A60_FINAL_ACCEPTANCE_MATRIX_R2.csv. Historyczna suma: 0 PASS / 3 external CI FAIL / 33 BLOCKED / 2 NOT_RUN. To nie jest 21-package QA.

Właściciel: (O1) dostarcza istniejący oryginalny CSV, bez prośby o nowe audyty WEB-004; albo (O2) podpisuje wprost wyjątek od odtwarzania nieosiągalnych dziewięciu identyfikatorów wraz z pozostawieniem nierozstrzygniętych ryzyk historycznych i obowiązkiem pełnego testowania w SWARM-006. **O2 nie jest równoważne uznaniu dziewięciu przypadków za PASS/WONT_FIX**. O1 jest lepsze dla kompletnej identyfikowalności. Osobne podpisy/dispositions konkretnych rzeczywistych findings nadal są potrzebne.

**Do podpisu:** ORIGINAL_38_SOURCE=O1/O2/DEFER___; signed per-finding disposition references=___.

## 7. Testy aplikacyjne i końcowy handoff

A50 R20 wykazał **0** natywnych React/API/PG16 testów — brak podłączonego zaufanego executora, pełnego checkoutu, pnpm/dependencies i odizolowanej PG16.

- **EXEC-A (preferowane):** właściciel zapewnia zaufany PC/VM z pełnymi per-SHA checkoutami, Node22/pnpm10; osobno fizycznie izolowaną test-only PG16, TEST_DATABASE_URL i **oddzielną jawną zgodę na zakres destrukcyjnego resetu**. A50 wykonuje testy; A60 weryfikuje receipts.
- **EXEC-B (dług testowy do SWARM-006):** dopiero **po** zamknięciu source/policy/oryginalnych przypadków owner podpisuje HANDOFF_WITH_RUNTIME_TEST_DEBT i FINAL_HANDOFF_GO. SWARM-006 przejmuje każdy niewykonany test z dokładnym SHA, pełne composite QA/CI, 403/409/backup/Undo/React regresje i hard RELEASE NO-GO aż do rzeczywistych PASS. EXEC-B nie pozwala na natychmiastowe wdrożenie.

**Do podpisu:** EXEC=A/B/DEFER___; TEST_RESET_GO osobno___; FINAL_HANDOFF_GO osobno dopiero po gate___.

## 8. Decyzje wciąż nierozstrzygnięte

ŻADNA komórka powyżej nie jest automatycznie zatwierdzona. A00 po otrzymaniu rzeczywistych decyzji ma przenieść wybory do wersjonowanego DECISIONS.md, przypisać przyszłe zadania implementacyjne, zaktualizować podpisaną 38-case mapę, uzyskać A60 gate i dopiero potem przedłożyć jednorazowy formalny wniosek o przekazanie SWARM-006. Nie scalaj 21 PR-ów w WEB-005.

**OWNER/HQ:** podpis / rola / data / permalink do odpowiedzi: ______________________

**STATUS:** OWNER_SIGNOFF_REQUIRED / WEB005_IN_PROGRESS / SWARM006_HOLD / RELEASE_NO_GO.
