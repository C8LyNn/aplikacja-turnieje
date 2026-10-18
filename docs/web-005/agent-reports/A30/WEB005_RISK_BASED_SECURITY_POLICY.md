# WEB-005 — RISK-BASED SECURITY POLICY — DEVELOPMENT FIRST

**Dokument:** `WEB005_RISK_BASED_SECURITY_POLICY.md`  
**Autor/rola:** A30 — Security Coordination V2  
**Data:** 2026-10-18 (Europe/Warsaw)  
**Tryb przygotowania:** SECURITY TRIAGE / READ-ONLY; bez Docker, SQL, testów, buildów, merge i deploymentu  
**Status polityki:** `POLICY_PROPOSED_FOR_A00_REVIEW` — model docelowy, **niezatwierdzona zmiana istniejących autoryzacji**.  
**Stan C01/R23H:** `SECURITY_BLOCKED / G0_NO_GO / G1–G5_HOLD / RELEASE_NO_GO` pozostaje obowiązującym stanem prac destrukcyjnych w istniejącym kontrakcie. **Ten dokument nie nadaje żadnego GO** ani nie zmienia istniejących podpisanych uprawnień.  
**Zakres:** proces developmentu WEB-005 i zależności od bezpieczeństwa PostgreSQL16, Docker, CI, frontend, migracji i publikacji; nie dotyczy automatycznego znoszenia innych gate'ów projektu.

## 1. Cel i źródła

Zachować rygor tam, gdzie potencjalne skutki obejmują cudze dane, nieodwracalne DDL, sekrety, środowisko współdzielone lub produkcję; usunąć **nieadekwatny obowiązek pełnego R23H** z prac bez możliwości kontaktu z bazą.

Historyczne ryzyka pozostają w rejestrze. **Severity** (potencjalny wpływ) i **applicability** (czy występuje w tej konkretnej zmianie) są dwiema oddzielnymi osiami. `P0 OPEN, NOT_APPLICABLE_TO_THIS_CHANGE` nie oznacza `P0 CLOSED` ani globalnego `SECURITY_PASS`.

**Podstawy źródłowe** (fakty zaobserwowane w dotychczasowych audytach, nie nowe runtime testy):
- [A30 R4 Final Security Consolidation](https://github.com/C8LyNn/aplikacja-turnieje/blob/10dbf29df7ec3608f1887c58ca2331547dc9ef02/docs/web-005/agent-reports/A30/R23H_R4_FINAL_SECURITY_CONSOLIDATION.md): operacyjnie **7 P0 OPEN, 7 P1 OPEN, 3 P2 OPEN**, brak wdrożonego launchera, brak zatwierdzenia G0.
- [A20 R4 Canonical Signable Runplan](https://github.com/C8LyNn/aplikacja-turnieje/blob/94f6942ebbf025488e746bce767d17f0c9f06839/docs/web-005/agent-reports/A20/R23H-R4/R23H_R4_CANONICAL_SIGNABLE_RUNPLAN.md): preferowany wariant B source-hardened; niezmienione C01 A domyślnie NO_GO.
- [A31 R4 Independent Destructive-Path Review](https://github.com/C8LyNn/aplikacja-turnieje/blob/6bbda1fe20b711404c03c2c8a6527d5852a923b0/docs/web-005/agent-reports/A31/R23H_R4_A31_PRIVILEGE_AND_DESTRUCTIVE_PATH_REVIEW.md): wspólny `TEST_DATABASE_URL` principal, cluster-wide `CREATEDB`, failed-CREATE → possible FORCE DROP.
- [A22 R4 SQL Execution Safety Contract](https://github.com/C8LyNn/aplikacja-turnieje/blob/da44df0f0786fe0552c91494fb168ff8f5e238d1/docs/web-005/R23H_R4_SQL_EXECUTION_SAFETY_CONTRACT.md): 1 S1 base + 4 dynamic S2, dwa Drizzle `push --force`, cztery G4 auto-DROP.
- [A50 R4 Fail-Closed Launcher Implementation Plan](https://drive.google.com/file/d/1wh2teW9hWO2NUOFkfeRnaYf4tO15VZDy/view): dokument/projekt, nie kod wykonawczy ani dowód testów.
- [A24 R4 G0 Preflight](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a24-r23h-r4-g0-preflight-20261018/docs/web-005/agent-reports/A24/R23H-R4/R23H_R4_G0_PREFLIGHT_ACCEPTANCE.md): plan kontroli; G0_NO_GO.
- [A60 R3 Independent QA](https://github.com/C8LyNn/aplikacja-turnieje/blob/1f529b80cdc9c0e3d8bf48812365be037e0a851f/docs/web-005/agent-reports/A60/R23H_R3_FINAL_QA_VERDICT.md): źródłowe poprawki ≠ runtime PASS.

**Nowa propozycja procesu** w sekcjach 2–8 jest rekomendacją A30. Nie występuje jako już zatwierdzony wymóg lub faktycznie zaimplementowana bramka we wskazanych raportach.

## 2. Klasy ryzyka i proporcjonalna ścieżka

**Klasa wynika z możliwych skutków ubocznych całego wykonania, test runnera, CI i zależności, nie z nazwy PR.** Jeśli zmiana dotyczy wielu kategorii, obowiązuje klasa najwyższa.

| Lane | Co obejmuje | Minimum kontroli (propozycja) | Czego NIE wymaga | Do jakiej operacji NIE daje GO |
|---|---|---|---|---|
| **D0 — docs/prototyp offline** | Dokumentacja, algorytm lokalny, statyczny prototyp bez backendu/sekretów/DB | Owner sprawdza diff, brak sekretów i niezamierzonych zmian, zwykły QA adekwatny do plików | Żadnego PG16, G0–G5, audytu SQL ani trzyosobowych podpisów | Merge lub publikacja bez odrębnych reguł repo |
| **D1 — frontend / DB-free** | React/UI/CSS, prezentacja, komponenty, mockowane API, build/testy bez połączeń z DB | 1 niezależny review funkcjonalności+security zakresu, UI/regresja QA, statyczne potwierdzenie braku DB/sekretów, bez live endpointów | R23H Docker/PG16, `CREATEDB`, G3/G4/G5, fizyczny cert klastra | Zmiany auth/endpointów live, deploy, merge |
| **D2 — backend bez DB lub read-only kontrolowany** | Logika pure/mocks; alternatywnie **wyraźnie autoryzowany** odczyt na nieprodukcyjnych danych | Review zależności, jawna mapa źródeł danych, odseparowane sekrety, nieprodukcyjne połączenia, QA dla wywołań; odczyt produkcyjny przechodzi dodatkowy privacy/data gate | Pełnego destrukcyjnego R23H, o ile potwierdzono brak efektów DB | DML/DDL, shared/production credentials i nieautoryzowane odczyty |
| **D3 — izolowana baza, ograniczone DML** | Jednorazowy test w nowym prywatnym DB, tylko z góry dopuszczone `SELECT/INSERT/UPDATE/DELETE` na owned fixture, **bez** DB/schema DROP/CREATE, CASCADE, force, migracji | Jedna podpisana zgoda właściciela izolowanego zasobu, niezależny review SQL/scope, pewna tożsamość testowej bazy i role bez szerokich grantów, realny stop przy złym DSN | Pełnego R23H C01 z 5 bazami; jego ślad nie pasuje do D3 | `DROP`, `CREATEDB`, `--force`, schemat public wspólny, produkcja |
| **D4 — destrukcyjny DB lab / R23H** | S1 `DROP SCHEMA CASCADE`, S2 `CREATEDB`, `DROP DATABASE WITH (FORCE)`, dwa Drizzle `push --force`, migracje destrukcyjne | Minimalny izolowany lab §5 i **jawna autoryzacja dokładnego zakresu**; dla oryginalnego C01 nadal obowiązują **G0_NO_GO** i dotychczasowy podpisowy kontrakt do formalnej decyzji A00 | Nie potrzeba uruchamiać R23H dla *równoległych* D0/D1/D2 | SQL przed zatwierdzeniem, automatyczne usuwanie, live |
| **D5 — shared/prod/release** | Baza współdzielona, native Windows PG, production SQL, migracje na danych użytkowników, backup/restore, merge do chronionej gałęzi, publiczny deploy | Oddzielny owner/operational approval, review skutków danych/rollback/release, backup+restore i odpowiednie testy, niezależna QA | Nie wolno traktować jednorazowego D4 jako dowodu bezpieczeństwa produkcji | Żadnego automatycznego GO na podstawie tej polityki |

**D2 read-only caveat:** SQL SELECT może wyciekać dane, użyć niebezpiecznej funkcji lub trafić do produkcji; prawdziwy read-only to **autoryzowane konto/endpoint, zakres danych i zakaz zapisu**, nie string `SELECT`. Jeśli nie można dowieść braku skutków ubocznych lub wpływu na cudze dane, eskalować do D3/D5.

**D1 DB-free falsification test (przed oznaczeniem R23H N/A):** przegląd zmienionych ścieżek i skryptów, CI/test komend, importów/endpointów, `.env`, sekretów oraz czy jakikolwiek krok uruchamia backend/serwis/API z realnym DB. E2E z prawdziwym backendem, dodanie migracji, aktualizacja connection config lub dotknięcie logowania/autoryzacji **eskaluje**. PR z komponentem frontendowym i migracją nie jest D1.

## 3. Statusy i uprawnienia — nie mylić priorytetu z blokadą

Każdy risk ticket posiada pola:
- `historical_severity` = P0/P1/P2 **niezmienne bez odrębnej udokumentowanej decyzji**.
- `operational_state` = OPEN / DESIGN_ONLY / IMPLEMENTED_NOT_VERIFIED / VERIFIED / CLOSED / DEFERRED_BY_SCOPE.
- `applicability` = APPLIES / NOT_APPLICABLE_TO_THIS_CHANGE / UNKNOWN; UNKNOWN w ścieżce DB/wspólnej ⇒ STOP do wyjaśnienia.
- `lane_trigger`, `asset`, `operation`, `owner`, `acceptance_evidence`, `return_trigger`, `expiry_or_review_date`, `exception_authority`.
- **DEFERRED_BY_SCOPE** = nadal OPEN globalnie i automatycznie wraca, gdy warunki zadania spełnią trigger.

**Bez zgód automatycznych:** Przypisanie lane lub review kodu **nie** jest zgodą na SQL, pull/build, G0–G5, merge, restart usług ani deployment. A00 zatwierdza nową politykę jako zmianę governance i osobno dopuszcza rzeczywiste działania z efektami. Historyczne procedury obowiązują dla rozpoczętego R23H, dopóki A00 nie wybierze konkretnej rewizji/wyjątku.

## 4. Historia P0-31-01..07 — zakres, wpływ, automatyczna aktywacja

| ID (historyczne P0) | Obecny status | Zdarzenie aktywujące; realny wpływ | D0/D1 DB-free | D4/D5 | Owner |
|---|---|---|---|---|---|
| **P0-31-01** | `OPEN_EXECUTION`; brak czwartej S2 w dokumentacji już `SOURCE_CORRECTED` | Pełny C01, `CREATEDB`, 1 BASE+4 scratch, two force push, brak podpisanego SQL footprint; cudza DB mogłaby zostać zmodyfikowana | N/A scoped; rejestr P0 zostaje | BLOCKER bez zakresu SQL, odrębnej zgody i dowodów | A20+A22+A24 |
| **P0-31-02** | `OPEN` | Połączenie z PG16; błędny klaster może trafić w native Windows/realne dane | N/A jeśli brak połączeń | BLOCKER bez fizycznej tożsamości | A20+A24+operator |
| **P0-31-03** | `OPEN` | `DROP SCHEMA CASCADE`, helper schemas i nierewersyjny reset S1 | N/A | BLOCKER przy resecie schematów bez fresh owned scope | A22+A50+A24 |
| **P0-31-04** | `OPEN` — source defect | `CREATEDB` global cluster + FORCE DROP po failed CREATE/name collision; utrata obcej bazy | N/A | **HARD BLOCK** bez source-hardened B lub formalnej osobnej decyzji wyjątku A, izolacji i ograniczeń | A20+A31+A50 |
| **P0-31-05** | `OPEN` | Inherited DSN/`PG*`/`DATABASE_URL`/`SCHEMA_COMPARE` albo loader może wybrać zły serwer; sekrety w runnerze | N/A przy weryfikowalnym braku DB/secret | BLOCKER dla runnerów z DB, zanim nawiążą połączenie | A50+A24 |
| **P0-31-06** | `OPEN`; kanoniczny Docker **SOURCE_DESIGNED** | Wybór host-published Compose, wolumen Windows, obcy kontekst/niezweryfikowany obraz | N/A bez Docker/PG/realnych DB | BLOCKER przy PG Docker; część supply-chain może osobno dotyczyć innych kontenerów | A21+A20+A24 |
| **P0-31-07** | `OPEN`; model faz zaprojektowany | Brak egzekwowalnej zgody na destrukcję, bypass wykonania i niezależności decyzji | Pełna procedura R23H N/A; normalny review i reguły repo nadal obowiązują | BLOCKER dla SQL/production operations bez autoryzacji | A00+A20+operator+A50 |

**Historyczny licznik:** **7 P0 OPEN / 7 P1 OPEN / 3 P2 OPEN**, brak operacyjnie zamkniętego P0. W ścieżce D1 poprawnie jest `R23H DB-P0 APPLICABILITY = N/A`, a **nie** "siedem P0 CLOSED" lub "cały projekt SECURITY_PASS". Globalne ryzyka release/auth/sekretów wymagają osobnych kontroli zależnych od zmian.

## 5. Minimalny bezpieczny jednorazowy lab PostgreSQL 16 (dla D4, nie stan GO)

**Cel:** najmniejszy racjonalny zestaw środków ograniczających skutki testu jednorazowego, *bez* udawania, że dowody już istnieją lub że jest to zatwierdzenie. Proponowana forma uproszczonego protokołu to **PREPARE → INDEPENDENT REVIEW → OWNER/AUTHORIZATION → ONE-RUN + OBSERVE → CLEANUP/REPORT**, ale dla aktualnego R23H obowiązuje nadal G0 NO_GO i podpisy historycznego planu, dopóki A00 ich nie zmieni.

### 5.1 Minimum twarde, nieodkładalne przed destrukcyjnym D4
1. **Fizycznie jednorazowy i ekskluzywny klaster:** nowy pusty PG16 Docker PGDATA/volume + unikalny run ID; żadnych współdzielonych/foreign DB i bind mountów; host/native Windows PostgreSQL poza zasięgiem. Kanoniczne Option A: `pg16.network_mode:none`, runner `service:pg16`, wewnętrzne `127.0.0.1:55432`, **zero publikowanych host portów**, brak docker.sock/PGDATA w runnerze. Operator sprawdza prawdziwy Docker context, tworzone zasoby i skuteczną konfigurację, nie tylko YAML.
2. **Twarde potwierdzenie celu:** operator odnotowuje nowe container/volume/PGDATA oraz PostgreSQL `system_identifier`, efektywny endpoint, role+DB w obrębie certyfikowanego klastra i niedotknięty native Windows PG. Przy odchyleniu STOP zanim jakikolwiek `DROP`/DDL.
3. **Tylko konta testowe:** odrębny test credential bez SUPERUSER/CREATEROLE/REPLICATION/BYPASSRLS i bez admin password/Docker socket; rzeczywisty `CREATEDB` w oryginalnym C01 jest **cluster-wide**, zatem dopuszczalny wyłącznie w całkowicie pustym disposable klastrze. Nie pozorować separacji S1/S2, której C01 nie implementuje.
4. **Kontrolowany DSN i polecenie:** brak odziedziczonych `DATABASE_URL`, `TEST_DATABASE_URL`, `PG*`, `SCHEMA_COMPARE_*`, dotenv i obcych loaderów. Generator celuje tylko w potwierdzony loopback Linux namespace; komand dokładnie z zatwierdzonej listy; żaden fallback na Windows host.
5. **Jawnie zdefiniowany footprint:** 1 preprovisioned S1 BASE, dokładnie 3 S2 catalog + 1 S2 Drizzle, S1 CASCADE/helper/migrations, 4 auto FORCE DROPs i 2 `push --force`; operator podpisuje konkretny zakres operacji i zasobów. Żaden test równoległy w shared klastrze.
6. **NIEBEZPIECZNE `after()` w starym C01:** domyślny wariant **B (source-hardened)** wymaga `CREATE_SUCCEEDED` + owner/OID/run/cluster cert i STOP *przed* DROP po failed CREATE, ekskluzywnego writer fencing oraz świeżego S1 guard. `Launcher-only` **nie naprawia** tego kodu. Wariant A/unchanged `fa3261...` może być co najwyżej **propozycją wyjątkowego jednorazowego eksperymentu z jawną akceptacją ryzyka** przez uprawnionych A00/HQ, A20 i operatora + A30/A31/A60 review; **nigdy zwykła lżejsza ścieżka ani P0 CLOSED**. Takiej zgody teraz **nie ma**.
7. **Zakres zapisu, STOP i dowód:** jeden run, osobny nieuprzywilejowany read-only runner filesystem z ograniczonym `tmpfs`/scratch, brak host/cloud mounts; full true stdout/stderr/exit, bez surowych sekretów w Drive. Każde niespodziewane SQL/DSN/DB ownership albo niepotwierdzony CREATE → STOP + `CLEANUP_HOLD`. Resztki usuwa wyłącznie operator na podstawie aktualnych dokładnych ID i osobnej zgody; bez wildcard/prune/automatycznego retry.

**Możliwe uproszczenia organizacyjne:** jeden wspólny krótki *run card* ze źródłem SHA, operacjami, host/cluster ID, odpowiedzialnością, zgodą, wynikiem i cleanup; jeden niezależny przegląd tej karty zamiast wielokrotnego pisania podobnych raportów. Nie wolno jednak skracać fizycznej izolacji, zapobiegania nieuprawnionemu DROP ani czynności rzeczywiście wymagających podpisu. R23H G0–G5 nadal formalnie HOLD, dopóki właściciel nie przyjmie innego kontraktu dla przyszłego, odrębnego działania.

### 5.2 Nie wymagamy dla jednego disposable testu, jeśli nie wpływa na bezpieczeństwo
- Wielokrotnego powtarzania identycznego źródłowego audytu po niezmienionym SHA; wystarczy odwołanie do jego immutable dowodu i **jedna** review delta.
- Produkcyjnego HA, migracji online na wspólnej bazie, retention latami, dry-run na live, multi-environment release plan czy pełnego UI regresji całej aplikacji niezależnie od testowanego modułu.
- Rozbudowanego monitoringu i wszystkich P2 system hardening jako domyślnych bramek; wyłącznie gdy ujawni się związany trigger lub warunek środowiskowy.

**Wyjątek od powyższego uproszczenia:** każdy sekret, obcy mount/port, shared DB, destrukcyjny SQL, migration lub produkcyjna integracja od razu eskaluje do odpowiedniej twardej kontroli.

## 6. Domyślny przepływ DEVELOPMENT FIRST: implementacja → 1 niezależny review → QA

| Etap | Wykonawca i minimalny wynik | Stop / eskalacja |
|---|---|---|
| **1. IMPLEMENTACJA + deklaracja lane** | Autor podaje zmienione pliki, realne komendy testowe, zależności i zasoby, dokładny commit SHA, lane D0–D5, dane/sekrety/DB effects, rodzaj testów. Zwykły build/static/lint na DB-free ścieżce pod osobnym uprawnieniem developmentowym. | Nieznany DB endpoint, migracja lub realny integration runner ⇒ popraw lane i preflight przed wykonaniem. |
| **2. JEDEN NIEZALEŻNY REVIEW** | Jedna osoba/agent inny niż implementer weryfikuje diff, klasę ryzyka, test coverage i security *tylko w kontekście zmian*. FE: UI/accessibility/auth boundary; DB: SQL/identity/drop-safety; release: odpowiedni owner. `APPROVE_SOURCE` ≠ `APPROVE_EXECUTION`. | Ustalenie P0 **applies** lub brak dowodu N/A blokuje jedynie dotkniętą ścieżkę, nie pozostałe równoległe prace. |
| **3. QA** | QA wykonuje właściwe testy (mock/DB-free dla D1; izolowane tylko po zgodzie dla D3/D4), zapisuje wynik i błędy. Jeden czytelny raport z linkami/exit/SHA. | QA FAIL nie oznacza blanket blokady niezależnych PR; nie wolno ukrywać realnego C01 exit 1. |
| **4. OSOBNA DECYZJA MERGE/DEPLOY/SQL** | Właściciele repo, środowiska, danych lub release weryfikują ścieżkę i dają osobne uprawnienia według zakresu. | Ani PASS QA, ani niniejsza polityka nie autoryzują merge, destrukcyjnego SQL, deploymentu czy G0. |

**Jedno review** oznacza *jedno zintegrowane niezależne rozstrzygnięcie dla danej zmiany*, nie rezygnację z właściwych kompetencji w środowiskach wysokiego ryzyka; specjalista A31/A22 może dostarczyć opinię w ramach review tylko gdy DB path rzeczywiście applies. QA może być niezależne od review, ale nie zastępuje podpisu operatora. Równoległa praca D0/D1 może być wykonywana na osobnych gałęziach bez oczekiwania na DB closure (z zachowaniem reguł repo).

### 6.1 Minimalny szablon deklaracji PR / task
```yaml
security_scope_version: web005-risk-based-v1-proposed
task_id: WEB-005-...
source_sha: <exact commit>
lane: D0|D1|D2|D3|D4|D5
database_connection: NONE|MOCK|ISOLATED_READ|ISOLATED_WRITE|DESTRUCTIVE|SHARED_OR_PROD
sql_destructive: false
secrets_or_prod_data: false
external_side_effects: []
test_commands: []
touched_paths: []
independent_reviewer: <identity or PENDING>
qa_receipt: <link or PENDING>
historical_p0_applicability:
  P0-31-01: NOT_APPLICABLE_TO_THIS_CHANGE
  P0-31-02: NOT_APPLICABLE_TO_THIS_CHANGE
  P0-31-03: NOT_APPLICABLE_TO_THIS_CHANGE
  P0-31-04: NOT_APPLICABLE_TO_THIS_CHANGE
  P0-31-05: NOT_APPLICABLE_TO_THIS_CHANGE
  P0-31-06: NOT_APPLICABLE_TO_THIS_CHANGE
  P0-31-07: NOT_APPLICABLE_TO_THIS_CHANGE
separate_sql_merge_deploy_authorization: NOT_GRANTED
```
**Szablon nie może nadawać deklaracji `NOT_APPLICABLE` z góry.** Implementer wypełnia pola na podstawie rzeczywistych zależności, a reviewer potwierdza; dokumentacyjny przykład pokazuje jedynie DB-free ścieżkę. Brak weryfikacji ⇒ applicability UNKNOWN.

## 7. Backlog SECURITY-DEFERRED — warunki powrotu

**Status `DEFERRED` w kolumnie poniżej znaczy:** ta kontrola jest odłożona **tylko dla działań bez jej triggera**; nie znaczy że ryzyko globalnie CLOSED. Nie odkładać któregokolwiek P0, który już **APPLIES** do SQL lab, shared DB lub produkcji.

| Ticket / historyczne ID | Zakres odroczenia | Właściciel | Co natychmiast przywraca do ACTIVE | Dowód wymagany przy powrocie |
|---|---|---|---|---|
| SD-P0-01 / P0-31-01 | Nie wymagać pełnego BASE+4 consent od DB-free PR | A20+A22 | C01 integration / S2 create / Drizzle push / destructive SQL | 5-context signed SQL envelope, 2 push, 4 force teardown |
| SD-P0-02 / P0-31-02 | Nie żądać system_identifier od czystego FE | A20+A24 | Jakiekolwiek prawdziwe połączenie DB w testach wykonujących mutację; shared/prod ⇒ natychmiast D5 | Zaufana tożsamość PG, właściwy endpoint i Windows no-touch |
| SD-P0-03 / P0-31-03 | Nie audytować S1 resetu przy pracy bez SQL | A22+A50 | Test z `DROP SCHEMA`, helper migrations lub `CASCADE` | Odrzucenie kolizji/unowned schema, signed scope i skutki |
| SD-P0-04 / P0-31-04 | Nie implementować guard FORCE DROP w PR bez fixture; sam problem nadal ACTIVE dla C01 | A20+A31+A50 | `CREATEDB`, `DROP DATABASE FORCE`, CI pełnej integracji | Implementowany B token successful CREATE+run/OID/owner+negative proof lub wyjątek A osobno zaakceptowany |
| SD-P0-05 / P0-31-05 | Nie wdrażać PG sealed runner do stylowania UI | A50 | DB URL, real backend E2E, child env, env/loader zmieniający target | Fail-closed env and target admission |
| SD-P0-06 / P0-31-06 | Nie certyfikować Docker PG dla builda FE bez DB | A21+A20+A24 | Tworzenie PG16 Docker, volume, namespace lub integracja usług | No host ports/mounts, attested disposable container+image+PG |
| SD-P0-07 / P0-31-07 | Nie żądać trzyosobowych G0–G5 podpisów od D0/D1 | A00+A20 | Rozpoczęcie destrukcyjnej operacji/PG G0–G5/shared/prod | Akceptacja dokładnego działania, właściciele i egzekwowalna granica |
| SD-P1-01 / P1-31-01 | Nie zajmować FE rotacją hasła PG bootstrap | A20+A21 | Start PG container / secret accessible beyond init | Brak admin secret w runnerze, ACL/rotacja lub świadoma ocena ryzyka |
| SD-P1-02 / P1-31-02 | Brak full transitive write census w PR FE bez Node PG runner | A50 | Budowa i użycie G4 runnera/Drizzle | Read-only FS, approved tmpfs/cache, negative write proof |
| SD-P1-03 / P1-31-03 | Nie testować SCRAM gdy nie ma DB | A20+A24 | Autentyczne PG połączenie D3/D4 | Effective authenticated connection+role proof |
| SD-P1-04 / P1-31-04 | Nie badać migracji 0029–0031 w pure CSS | A22 | Wykonanie migration/DDL/Drizzle | Updated scope/delta and real SQL effects |
| SD-P1-05 / P1-31-05 | Bez pełnej redakcji raw PG TAP w pure FE | A23 | Logi zawierają DSN/password/raw DB data/CI artifacts | Redaction canaries, restricted original, remote hash/ACL |
| SD-P1-06 / P1-31-06 | Volume/context freshness nie dotyczy FE bez kontenerów PG | A24 | Zakładanie/usuwać volume lub uruchomić PG | Reject pre-existing foreign resources |
| SD-P1-07 / A60 late R3 custody | Pełny osobny indeks R23H dla każdego DB-free PR niepotrzebny | A23 | A00/A60 formalnie rozpatrują R23H G0, nowy R4 evidence package | Append-only relevant source+SHA custody; nie pozorować pełnej R4 aktualizacji |
| SD-P2-01 / P2-31-01 | Opcjonalne Docker operator/daemon/socket hardening dla nieużywanego PG | A21+A20 | Udostępnienie docker.sock, privileged service, host bind lub produkcyjne zasoby | Least privilege/inventory |
| SD-P2-02 / P2-31-02 | Optymalizacja quota/seccomp/caps gdy brak środowiska PG | A21+A50 | Ryzyko resource exhaustion lub hardening exception w labie | Owner-accepted limits/compatibility |
| SD-P2-03 / A60 Windows G: mirror | Nie wymagać lokalnej synchronizacji G: dla dokumentów bazujących na zweryfikowanym remote SHA | A23 | Zadanie odczytuje/publikuje lokalną kopię G: jako authoritative | Exact local-vs-cloud hash, modified time and provenance |

**Przegląd backlogu:** co iterację/wydanie, przy zmianie klasy lane oraz przed D4/D5; brak terminu nie zamienia aktywnego P0 w CLOSED. Każde zgłoszenie trafia z `DEFERRED_BY_SCOPE` do `ACTIVE` natychmiast, gdy pojawi się wskazany trigger. Nowe komponenty security (auth, Steam credentials, secrets, access control) dostają własne ryzyka, nawet jeśli PG-specific P0 mają N/A.

## 8. Kontrakt niezależnego QA i roll-out nowej polityki

**Dla A60:** odbieraj deklarację lane, diff + komendę testową, skutki uboczne, tożsamość jednego review i QA receipt. Weryfikuj **adekwatność lane**, a nie globalne 7-P0 PASS. D1 bez DB może dostać `SECURITY_SCOPE_PASS_FOR_D1` przy 7 historycznych P0 nadal OPEN. D4 z nierozwiązanym P0-31-04 nie dostaje execution PASS. D5 pozostaje osobną decyzją.

**Proponowana matryca wyniku per-task:**
- `SCOPED_PASS` — zakres rzeczywiście ograniczony, niezależny review i odpowiedni QA PASS; **nie autoryzuje merge/deploy/SQL**.
- `SCOPED_HOLD` — wyciek poza deklarowany lane lub nieznany DB/sekret/side effect.
- `DESIGN_ONLY` — dokumentacja kontroluje przyszły zamiar, nie wykazuje implementacji.
- `RUNTIME_BLOCKED` — brakuje bezpiecznej zgody/izolacji/source guard właściwych danemu uruchomieniu.
- `SECURITY_DEFERRED_BY_SCOPE` — wyłącznie jawnie wskazane nieaktywne ryzyko, z triggerem powrotu.

**Zalecana ścieżka wdrożenia governance:** A30 publikuje tę propozycję i rejestr; A00 podejmuje odrębną decyzję czy ją przyjąć. A60 przegląda rozdzielenie lane, żeby nie tworzyć ślepej furtki do SQL/live. Po zatwierdzeniu A10/A40 mogą oznaczać zadania w registry, a tylko właściwe role DB/infra dostają rozszerzone kontrole. Nie zmienia to bezpośrednio już otwartych issue, praw repo ani historycznych wyników.

## 9. Podsumowanie decyzyjne dla A00

1. **Rekomendacja:** **DEVELOPMENT FIRST / SCOPED SECURITY** dla prac D0/D1/D2 bez skutków DB. Nie wstrzymywać niezależnego UI ani kodu pure z powodu R23H; wymagać jednego niezależnego review i QA danego zakresu.
2. **Nieodkładalne:** rzeczywiste ryzyko celowania w nieodpowiednią bazę, utraty danych, cudze sekrety i niebezpiecznego `DROP`. W pełnym C01 stan `SECURITY_BLOCKED/G0_NO_GO` pozostaje.
3. **Minimalny D4:** nowy ekskluzywny pusty klaster, no-host network, zaufany cel, test-only creds, ograniczony env, jawne BASE+4 SQL effects, zgoda na dokładny destructive footprint, source-hardened B pre-DROP refusal (lub naprawdę wyjątkowa osobna ocena A), jeden nadzorowany run, kontrolowany cleanup/logi.
4. **Procedura:** `IMPLEMENTACJA → 1 INDEPENDENT REVIEW → ADEQUATE QA → SEPARATE OPERATIONAL DECISION`; dokument nie stanowi GO na merge, SQL ani deploy.
5. **Rejestr:** historyczne **P0 7 OPEN / P1 7 OPEN / P2 3 OPEN**, przypisane triggery i dowody powrotu. Nie nazywać deferred/NA ryzykami CLOSED.

**Werdykt tego zadania:** `RISK_BASED_POLICY_DRAFT_PUBLISHED`; bezpieczeństwo pełnego R23H nadal `SECURITY_BLOCKED` i `G0_NO_GO`. Każdy pozytywny status dla lżejszego lane wymaga rzeczywistej klasyfikacji, review, QA i niezależnej decyzji dotyczącej merge/deploy.

**Deklaracja:** praca wyłącznie nad dokumentacją i koordynacją; bez wykonywania Docker, SQL, testów, buildów, migracji, merge, deploymentu lub przydzielenia zgód wykonawczych.
