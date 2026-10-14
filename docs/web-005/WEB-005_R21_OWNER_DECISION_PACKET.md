# WEB-005 — R21 / PAKIET DECYZJI WŁAŚCICIELA / HQ

**Data:** 2026-10-14, Europe/Warsaw  
**Stan:** PARTIALLY RESOLVED — decyzje sportowe S1–S4 i warunkowa strategia EXEC-B zostały bezpośrednio wybrane przez właściciela w aktualnym wątku; S5–S6 zostały rozstrzygnięte przez A00 na podstawie jego jawnej delegacji. T055 Basket CAS D1–D6 zostało dodatkowo zatwierdzone przez właściciela; **pozostałe nierozstrzygnięte wybory nadal WAIT_OWNER**. Brak implementacyjnego lub release GO. Dokument jest formularzem decyzji, NIE udziela automatycznie GO na kod, testy destrukcyjne, przekazanie SWARM-006, merge ani release.  
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

**ZATWIERDZONE PRZEZ WŁAŚCICIELA:** **D1=B**, **D2=B**, **D3=B**, **D4=A**, **D5=B**, **D6=B** zgodnie z [formalną kartą zatwierdzenia T055](./WEB-005_R21_OWNER_T055_BASKET_CAS_APPROVAL.md) (właściciel: „tak, może być”, odpowiedź na kompletną propozycję A00). Monotoniczny persisted revision; ETag/If-Match; stale 412/no-write; missing 428/no-write; pod-lock atomowa weryfikacja stage/roster; utrzymanie draftu + ręczne rozwiązanie konfliktu. Zatwierdzenie **nie jest** migracyjnym SQL/code GO, wymaga A20/A90 compatibility review i przyszłych testów A60.

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

**Rozstrzygnięte — źródło i dokładne reguły:** [WEB-005_R21_OWNER_DELEGATED_SPORT_DECISIONS.md](./WEB-005_R21_OWNER_DELEGATED_SPORT_DECISIONS.md). S1=TS-B (bezpośredni wybór właściciela), S2=S2-B MAX_GENERATED + actionableRound (właściciel), S3=S3-B SCORE_GROUP_FIRST (właściciel), S4=S4-A stage-local BYE + S4-H-A formal NC/walkover counted, cancelled not counted (właściciel), S5=decydujący GF/reset runner-up (A00 under owner delegation), S6=elimination wave shared ranks (A00 under delegation). **SPORT_POLICY_SELECTED**, lecz nowe zachowanie nadal wymaga osobnego implementacyjnego GO i niezależnych testów.

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

**Wybor właściciela w bieżącej rozmowie:** **EXEC=B**, warunkowe przejęcie niewykonanych testów przez SWARM-006 **dopiero po formalnym zamknięciu WEB-005** i przy utrzymaniu pełnych testów jako twardej blokady deploymentu. Zapis w [karcie decyzji](./WEB-005_R21_OWNER_DELEGATED_SPORT_DECISIONS.md). **NIE** jest to FINAL_HANDOFF_GO, niezależne A60 signoff, realny test PASS ani zgoda na DB reset; po source/policy/38-case closure koordynator ma wystawić oddzielny finalny wniosek z exact debt inventory i uzyskać jego formalne zatwierdzenie. TEST_RESET_GO osobno___; FINAL_HANDOFF_GO osobno dopiero po gate___.

## 8. Decyzje wciąż nierozstrzygnięte

Komórki S1–S6 i warunkowa preferencja EXEC-B są odnotowane w karcie delegacji; **pozostałe komórki nadal nie są zatwierdzone**. A00 po otrzymaniu rzeczywistych decyzji ma przenieść wybory do wersjonowanego DECISIONS.md, przypisać przyszłe zadania implementacyjne, zaktualizować podpisaną 38-case mapę, uzyskać A60 gate i dopiero potem przedłożyć jednorazowy formalny wniosek o przekazanie SWARM-006. Nie scalaj 21 PR-ów w WEB-005.

**OWNER/HQ:** podpis / rola / data / permalink do odpowiedzi: ______________________

**STATUS:** OWNER_SIGNOFF_REQUIRED / WEB005_IN_PROGRESS / SWARM006_HOLD / RELEASE_NO_GO.


## 9. Odnotowane później wybory właściciela i delegacja game designu (2026-10-14)

- [Formalna karta dotychczasowych decyzji sportowych i delegacji](./WEB-005_R21_OWNER_DELEGATED_SPORT_DECISIONS.md).
- **OWNER_EXPLICIT:** EXEC-B warunkowo; S1 TS-B; S2 S2-B; S3 SCORE_GROUP_FIRST; S4 stage-local BYE; S4-H-A NC/walkover counted, cancelled not counted.
- **A00_DECIDED_UNDER_OWNER_DELEGATION:** S5 runner-up from decisive GF/reset; S6 places 3–N by second-loss elimination wave with shared positions. To nie jest osobny imienny podpis na każdą opcję ani kod już wdrożony.
- **STILL WAIT_OWNER:** Backup B2 B1–B6, MP2B public CAS, Steam/session, raw cache residual policy, oryginalny CSV/9 missing IDs lub dokładna decyzja dotycząca pochodzenia, zaakceptowane 38-case dispositions i final handoff gate. **T055 D1–D6 = OWNER_APPROVED but CODE_NOT_STARTED.**


## 10. T055 — owner-approved 6-part CAS contract (2026-10-14)

[Direct owner approval and exact D1–D6 choices](./WEB-005_R21_OWNER_T055_BASKET_CAS_APPROVAL.md): `D1=B,D2=B,D3=B,D4=A,D5=B,D6=B`. Contrakt został zaakceptowany w tej samej rozmowie bezpośrednią odpowiedzią „tak, może być”. **A110 intake**: podpisać przyszłe acceptance tests i schema/Backup compatibility risk; **A00**: osobne precyzyjne GO kodowe po wyznaczeniu właścicieli plików. **No SQL migration, code implementation, release, merge or handoff authorized by this policy record.**
