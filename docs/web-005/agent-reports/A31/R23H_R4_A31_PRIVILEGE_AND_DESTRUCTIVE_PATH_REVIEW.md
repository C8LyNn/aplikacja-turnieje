# WEB-005 — R23H-R4 / A31 — PRIVILEGE AND DESTRUCTIVE-PATH REVIEW

**Zadanie:** WEB-005-T031-R23H-R4-PRIVILEGE-DESTRUCTIVE-REVIEW; GitHub Issue #87  
**Przełożony:** A30 Security Coordination V2; odbiorcy: A30, A20, A22, A50, A60, A00  
**Źródło wykonawcze:** C8LyNn/aplikacja-turnieje, exact C01 SHA fa3261b2c9510e110ac9eba21726812d3401a525  
**Data:** 2026-10-18 (Europe/Warsaw)  
**Tryb:** INDEPENDENT SOURCE AUDIT / READ-ONLY; żadnych operacji na PostgreSQL, Docker, host Windows, SQL, migracjach, testach integracyjnych, cleanup, aplikacji, grach czy wdrożeniach. Dopuszczony jedynie zapis dokumentu i handoff do GitHub Issue.  
**WERDYKT:** SECURITY_BLOCKED; G0_NO_GO; G1–G5_HOLD; wszystkie P0-31-01..07 pozostają OPEN w wymiarze operacyjnym.

## 1. Niezależne ustalenie: faktyczne uprawnienia niezmienionego C01

Wspólny TestDatabaseConfig.connectionString pochodzi z TEST_DATABASE_URL. S1 używa tej tożsamości dla resetów i migracji, a obydwa S2 tworzą adminPool na tej samej bazowej konfiguracji, usuwając jedynie parametr search_path; dla baz pomocniczych zmieniają pathname w URL. Nie ma rozdzielenia tożsamości S1 i S2, nawet jeżeli przyszły projekt ról taką separację proponuje.

| Mechanizm PG16 | Wymóg dla oryginalnego C01 | Warunek bezpiecznego projektu |
|---|---|---|
| LOGIN, CONNECT do operator-provisioned BASE | TAK | Osobna krótkotrwała rola testowa, SCRAM i G2 dowód effective role/ACL |
| CREATEDB | TAK dla tej samej roli S1/S2 | Atrybut klastrowy, NIE ogranicza się do prefiksu baz. Wyłącznie nowy pusty disposable cluster |
| CREATE w BASE, własność schematów S1, USAGE i DDL | TAK | BASE wyłącznie testowy, świeży tm_test_nonce i jawne schematy pomocnicze |
| Własność czterech baz S2 i DDL w public | TAK | Sprawdzać datname, OID, owner OID, PG system_identifier; template1 i public ACL; pg_database_owner |
| DROP DATABASE WITH FORCE | Tylko owner/superuser lub uprawnienia właścicielskie wynikające z członkostwa | CREATEDB sam nie oznacza prawa do DROP cudzych DB; FORCE może nie zabić wszystkich sesji |
| SUPERUSER, CREATEROLE, REPLICATION, BYPASSRLS | NIE | Wartości false i brak drogi przez INHERIT/SET ROLE do admina i ról pg_signal_backend, file/server execute/write |
| CONNECT do postgres/template1/obcych DB, szerokie PUBLIC | Niepotrzebne według fixture | Sprawdzić rzeczywiste domyślne CONNECT/TEMP i pg_hba: PostgreSQL często nadaje CONNECT PUBLIC. Nie przypisywać brakujących ACL na podstawie nazwy DB |

Własność obiektu umożliwia jego zmianę/usunięcie i nie zostaje odebrana przez samo REVOKE CREATEDB. Role members z SET/INHERIT mogą rozszerzyć realne uprawnienia. CREATE DATABASE klonuje standardowo template1; public może być kontrolowany przez implicit pg_database_owner, ale zależy to od rzeczywistego wzorca/ACL. To wymagania do późniejszego pomiaru G2, nie wyniki wykonanych zapytań.

## 2. Precyzyjne źródłowe ścieżki nieuprawnionego DROP

**S2 katalog — 3 bazy.** W replit-schema-catalog-reconciliation.integration.test.ts linie 468–525 przypisywane są nazwy tm_catalog_test_<16hex>_dev, _prod, _fresh, jeszcze przed pętlą trzech CREATE DATABASE. Handler after() iteruje wszystkie trzy przypisane nazwy i wykonuje DROP DATABASE IF EXISTS ... WITH (FORCE) bez per-baza flagi CREATE_SUCCEEDED, OID, owner czy certyfikatu fizycznego klastra. Nieudane CREATE bazy dev/prod/fresh może pozostawić nazwę kwalifikującą się do DROP. Błąd podczas kolejnego FORCE DROP może zakończyć sprzątanie, pozostawiając następne obiekty.

**S2 Drizzle — 1 baza.** W drizzle-schema-diff.integration.test.ts linie 177–279 zmienna databaseName jest ustawiana przed awaited CREATE DATABASE. Handler after() na podstawie samego istnienia databaseName dopuszcza DROP DATABASE WITH (FORCE), niezależnie od potwierdzonego CREATE. Dwa wywołania Drizzle Kit push --force --verbose następują w tym samym module (linie 177–199, 350–379); deklarowany filtr schemaFilter information_schema i tablesFilter __replit_push_manages_no_tables__ ma intencję NOOP, lecz nie jest obserwacją serwerowych efektów SQL. Dokumentacyjne oczekiwanie No changes detected nie dowodzi braku skutków ubocznych.

**Scenariusz ryzyka:** stara baza o zgodnej nazwie, należąca do tej samej roli testowej, już istnieje w błędnie ponownie użytym klastrze. CREATE trafia w kolizję i nie tworzy bazy; after() może następnie usunąć bazę z poprzedniego uruchomienia. Jeśli obca baza jest własnością innej, niezależnej roli, DROP normalnie zakończy się odmową, co ogranicza ryzyko, ale tego stanu fixture nie sprawdza. Odpowiedź sieciowa może zaginąć po udanym CREATE: wynik staje się AMBIGUOUS, nie CREATE_CONFIRMED. Nie wolno kasować jedynie na podstawie dopasowania nazwy.

**S1:** Jeden BASE preprovisioned przez operatora, wewnątrz niego główny schemat tm_test_<nonce> i pomocnicze schematy _rollback oraz _marker_drift. test-database.ts wykonuje DROP SCHEMA IF EXISTS ... CASCADE przed migracjami, poza późniejszą transakcją, a następnie transakcje i COMMIT przed 0019. Dodatkowe ręczne fixture wykonują reset. Rollback transakcyjny nie cofa już dokonanego pierwszego CASCADE.

**PostgreSQL 16 FORCE:** DROP DATABASE jest nieodwracalny, może zakończyć sesje tylko w granicach pg_terminate_backend; przygotowane transakcje, aktywne sloty logicznej replikacji, subskrypcje oraz sesje bez uprawnienia do ich zakończenia mogą spowodować błąd. Nie przyznawać SUPERUSER ani pg_signal_backend tylko dla udanego cleanup. Przy niekompletnym sprzątaniu obowiązuje CLEANUP_HOLD i odrębna zgoda G5.

## 3. Launcher bez zmian fixture: granice gwarancji

Launcher A50 może skutecznie: odmówić startu przy niezatwierdzonym env/obrazie/źródle, zapewnić pusty dedykowany PGDATA, sprawdzić fizyczny system_identifier, wymusić wyłączny namespace i brak portów do hosta, uruchomić suite raz, podać wyłącznie podpisane dane uwierzytelnienia oraz zbierać logi serwera. **Nie może jednak sam sprawić, by już uruchomiony oryginalny after() sprawdził CREATE_SUCCEEDED i ownership przed wysłaniem DROP.** Logowanie po fakcie nie jest blokadą.

Zewnętrzny przymusowy SQL-admission proxy byłby inną architekturą: każde połączenie S1, katalog, Drizzle i administracyjne musiałoby przejść przez zaufany, nieomijalny gateway z filtrowaniem protokołu SQL i transakcyjną polityką ledger, bez alternatywnych socketów, admin creds i direct connections. Potrzebne nowe źródło, SHA, threat model i niezależne próby bypassu; nie wolno nazywać tego wyłącznie launcherem. PostgreSQL event triggers **nie obejmują CREATE/DROP DATABASE**, gdyż są to obiekty współdzielone między bazami. Sam SQL logging nie zapewnia deny-before-DROP.

## 4. Wariant A vs B

| Wymiar | A — niezmieniony C01 + izolacja i launcher | B — modyfikacja fixture + izolacja i launcher |
|---|---|---|
| Exact C01 fa3261... | Zachowany | NIE: wymagany nowy exact SHA i nowy QA |
| Skala ewentualnej szkody | Ograniczona do naprawdę pustego disposable cluster, jeżeli to udowodniono | Tak samo wymaga izolacji |
| CREATE fail / name collision / old owned DB | Niezabezpieczony kod after(), resztkowe P0 | Możliwa obowiązkowa blokada przed DROP |
| Rejestr success/OID/owner/run | Zewnętrzny audit, bez gwarancji zatrzymania | Kontrola bezpośrednio w fixture przed teardown |
| TOCTOU lub ponowne użycie OID | Nie rozwiązane | Wymaga sole-writer i aktualnej rewalidacji |
| Decyzja A31 | **NO_GO domyślnie**; jedynie jawny wyjątek A00/HQ+A20+operator, A30/A60 audyt i brak gwarancji pre-DROP | **PREFEROWANY** po zatwierdzeniu zmian, nowym SHA, testach negatywnych i runtime evidence |

**Kontrakt B, tylko jako projekt:** NAME_ALLOCATED -> PREFLIGHT_ABSENT -> CREATE_ATTEMPTED -> CREATE_SUCCEEDED -> OID_OWNER_CLUSTER_ATTESTED -> ACTIVE -> PRE_DROP_REVALIDATED -> DROP_ATTEMPTED -> DROP_CONFIRMED. Na każdym błędzie lub niepewności: CLEANUP_HOLD i zero DROP. Potrzebne osobne tokeny dla 3 katalogowych slotów i 1 Drizzle, zapis CREATE_SUCCEEDED dopiero po sukcesie, a następnie serwerowo potwierdzony datname/OID/owner/cluster/run. Jeśli CREATE dało niejednoznaczny wynik, mimo istnienia bazy nie przyjmować automatycznie autorstwa bieżącego testu. OID samodzielnie nie gwarantuje własności; zapobiegać współbieżnemu rename/recreate poprzez wykluczenie wszystkich innych piszących sesji i niezależną kontrolę uprawnień.

## 5. Dziedziczenie DSN/środowiska

Source paths: test-database.ts czyta TEST_DATABASE_URL, TEST_DATABASE_SCHEMA i TEST_DATABASE_RESET, ustawia search_path; lib/db/src/index.ts korzysta z DATABASE_URL; migration.integration.test.ts przypisuje DATABASE_URL z wcześniej wyprowadzonego TEST_DATABASE_URL przed importem. S2 katalogowy child wykonuje spread process.env i nadpisuje wygenerowane SCHEMA_COMPARE_DEVELOPMENT_DATABASE_URL i SCHEMA_COMPARE_PRODUCTION_DATABASE_URL, ich expected names oraz schema. S2 Drizzle child spreaduje process.env i nadpisuje DATABASE_URL na własny scratch DB. drizzle.config.ts korzysta z tego env, nie gwarantując samodzielnie serwerowej tożsamości.

**Polityka A50:** brak bezpośredniego dziedziczenia parent process.env. Deny przed fork/connection dla DATABASE_URL, TEST_DATABASE_URL, PGHOST, PGHOSTADDR, PGPORT, PGDATABASE, PGUSER, PGPASSWORD, PGPASSFILE, PGSERVICE, PGSERVICEFILE, PGSYSCONFDIR, PGOPTIONS, PGCONNECT_TIMEOUT, TLS/SSL oraz innych PG*, SCHEMA_COMPARE_*, NODE_OPTIONS, NODE_PATH, DOTENV_CONFIG_*, loader/preload, --env-file, obcych .env/.pgpass/.pg_service.conf i modyfikacji cwd/binary argv. Launcher konstruuje od zera dozwolone zmienne, kompletny DSN do tylko wewnętrznego 127.0.0.1:55432, i wiąże go z G2 system_identifier. Dynamiczny S1 DATABASE_URL i wewnętrznie wygenerowane S2a SCHEMA_COMPARE_*/S2b DATABASE_URL są **wyjątkami dozwolonymi wyłącznie dla własnych certyfikowanych celów**.

Dokumentacja libpq definiuje PG* env, ale dokładna obsługa każdej zmiennej przez Node pg i Drizzle musi być sprawdzona na przypiętej zależności: nie twierdzimy, że każde libpq zachowanie dotyczy node-postgres. Również nie ma tutaj dowodu, że obecny loader automatycznie czyta dotenv: jest to zagrożenie do negatywnego testu. Deny dla niewiarygodnego input następuje bez *jakiegokolwiek* połączenia; późniejszy autoryzowany G2 read-only check fizycznej tożsamości będzie połączeniem, choć bez mutacji.

## 6. Przypadki negatywne — SPEC ONLY / NOT EXECUTED

| ID | Scenariusz | Wymagana reakcja |
|---|---|---|
| N01 | Brak/wygaśnięcie/fałszerstwo podpisu G3/G4 | STOP przed fork i kontaktem z PG |
| N02 | Zmieniony C01 SHA, runner, lock, Drizzle binary/config | STOP i brak uruchomienia |
| N03 | Podmieniony cluster system_identifier, PGDATA, netns, Docker context | STOP, recertyfikacja G2 |
| N04 | DSN przekierowany do Windows native PG16 lub obcego test-named DB | STOP przed połączeniem, no-touch Windows |
| N05 | Rola ma SUPERUSER, CREATEROLE, REPLICATION lub BYPASSRLS | STOP na G2 |
| N06 | Członkostwo SET ROLE do admin/foreign owner lub pg_signal_backend | STOP na G2 |
| N07 | Istniejący main S1 schema tm_test_* z cudzą zależnością | STOP przed CASCADE |
| N08 | Istniejący _rollback lub _marker_drift schema | STOP przed helper DDL |
| N09 | Katalog dev/prod/fresh: CREATE duplicate name owned by this same test principal | Brak FORCE DROP; CLEANUP_HOLD |
| N10 | Drizzle: CREATE duplicate name owned by this same test principal | Brak FORCE DROP; CLEANUP_HOLD |
| N11 | CREATE zwraca SQL error, after() nadal ma zapisaną nazwę | Żadnego DROP, STOP i ledger |
| N12 | CREATE wykonane, ale odpowiedź stracona po timeout | AMBIGUOUS_CREATE; operator reconciliation, bez DROP |
| N13 | Owner OID, DB OID, run ID lub physical cert niezgodne | STOP przed DROP |
| N14 | Concurrent DROP/RENAME/CREATE, OID reuse między precheck a DROP | Naruszenie sole-writer; STOP/HOLD |
| N15 | FORCE nie może zakończyć sesji, prepared transaction, slot, subscription | Log DROP failed, CLEANUP_HOLD, bez privilege escalation |
| N16 | Wstrzyknięty odziedziczony DATABASE_URL lub TEST_DATABASE_URL | STOP przed każdą koneksją |
| N17 | Poison PGHOSTADDR/PGSERVICEFILE/PGPASSFILE/PGOPTIONS/SSL env | Reject parent+child env, brak wycieku sekretu |
| N18 | Obcy odziedziczony SCHEMA_COMPARE_* | Reject parent; akceptuj wyłącznie generated child targets |
| N19 | NODE_OPTIONS preload/dotenv/.env/--env-file ustawia obcy URL | STOP pre-fork |
| N20 | Drizzle push --force proponuje public DDL, zmieniony filter lub binary | STOP/CLEANUP_HOLD, nie zakładać NOOP na bazie stdout |
| N21 | Piąta dynamiczna baza, dodatkowy CLI lub niepodpisana druga próba | STOP; zakres tylko 3+1 i jeden G4 |
| N22 | Restart PostgreSQL po G2, stale certificate | STOP, recertyfikacja |
| N23 | Katalogowy after() przerywa się po pierwszym FORCE błędzie | Orphan ledger i osobny G5, bez broad cleanup |
| N24 | G5 celuje w BASE, maintenance DB lub zgadywaną nazwę/volume | STOP, podpisane exact ID i CREATE receipt |

Przyszłe negatywne testy mają dowodzić, że nieuprawniona akcja została odrzucona **przed wykonaniem**, a nie tylko że PostgreSQL zgłosił błąd po wysłaniu złego SQL. Dowód musi podać actual exit, system-ID/owner/OID/DB ledger, child argv/binary, redacted env, per-event source provenance i przyczynę STOP. Żaden przypadek N01–N24 nie był wykonany w R4.

## 7. P0-31-01..07 — dowód wymagany do zamknięcia

| Ryzyko | Dokładny warunek / dowód | Najwcześniejsza faza skutecznej weryfikacji | Status |
|---|---|---|---|
| P0-31-01 | Exact S1 BASE+4 baza, G3 S1/catalog/drizzle consents, cztery CREATE i DROP OID/owner receipts, dwa przypięte Drizzle child argv + real SQL effect trace | Source inventory przed G0, runtime G2/G3/G4 | OPEN (inventory corrected only) |
| P0-31-02 | G1 inspect HostConfig/netns/volume/image/Windows no-touch; G2 SCRAM auth, PG system_identifier i owner/OID; świeży cert tuż przed G4 | G1/G2/G4 | OPEN |
| P0-31-03 | BASE owner, brak main/aux S1 schema, brak foreign dependency, podpis G3-S1, zakres 0001–0028 + 0030/0031 i rzeczywiste CASCADE effects | G2/G3-S1/G4 | OPEN |
| P0-31-04 | Effective role/SET+INHERIT grants i brak escalation, każdorazowy CREATE_SUCCEEDED+OID/owner/run/cluster oraz **pre-DROP enforceable denial** dla collision/error; N05–N15 | Source implementation, G2, G4 negatywne | OPEN |
| P0-31-05 | Zaimplementowany A50 launcher z no-inheritance/deny-before-connect, podpisy, DNS/DSN/loader canaries i children allowlists | Source review, G4 | OPEN |
| P0-31-06 | Jedyny SHA-frozen Option A, obsolete host port variant wycofany, OCI PG/Node/runner attestation, Compose normalized, faktyczne G1 no ports, G2 verified namespace/Windows | G0/G1/G2 | OPEN |
| P0-31-07 | Verifiable triple signatures A00/HQ+A20+operator dla każdej fazy, expiry/scope/source/context/OIDs, no override/retry, G4 teardown + osobne G5, negatywne denial receipts, A60 QA | Source implementation przed G0, odpowiednie runtime gates | OPEN |

Nie wolno uznać CLOSED po samym napisaniu planu. Rozróżniać SOURCE_DESIGNED, SOURCE_IMPLEMENTED, STATIC_VERIFIED, AUTHORIZED, RUNTIME_VERIFIED, QA_ACCEPTED, CLOSED. A31 nie udziela GO.

## 8. P1 — otwarte obszary wtórne

| ID | Ryzyko i kryterium dowodu |
|---|---|
| P1-31-01 | Bootstrap superuser secret zamontowany po inicjalizacji; rotacja/unmount albo formalny risk acceptance, admin secret nigdy w runnerze. |
| P1-31-02 | Runner read_only / tmpfs 256 MiB, niepotwierdzone pnpm/tsx/Drizzle/log writes; A50 pełny writable-path census, bez odblokowania /workspace. |
| P1-31-03 | pg_isready to readiness, nie dowód SCRAM/roli/instance identity; G2 negative/positive auth. |
| P1-31-04 | Migracje 0029–0031/special test paths i dynamic DDL/trigger oraz forced pushes: source ledger i real serwerowy SQL trace. |
| P1-31-05 | Raw TAP/env/Drive secrets i DSN leakage: redacted cloud readback SHA, ACL, negatywne canaries. |
| P1-31-06 | Nonce nie dowodzi nowego Docker volume/project, a operator Docker może ominąć policy; G1 explicit absence+exact IDs. |
| P1-R3-CUSTODY | Repozytorium dowodów A23 wymaga uzupełnienia o nowe raporty R3/R4 i niezależnego SHA readback A60. |

## 9. Statyczne potwierdzenie vs przyszłe runtime

**STATYCZNIE POTWIERDZONE:** wspólna rola wynikająca z tego samego C01 TEST_DATABASE_URL; 3+1 dynamiczne nazwy przypisywane przed CREATE; after() bez create-success/OID/owner; 2 push --force; S1 CASCADE; process.env spread; dokumentacyjne PG16 zasady właściciela/CREATEDB/FORCE; A22 R4 i A30 R4 oznaczają zabezpieczenia jako projekt.

**NIE POTWIERDZONO:** aktualnej roli i jej membership/ACL w PG16, realnych OID, fizycznego cluster ID, przejścia Compose parsera, izolacji od Windows, prawdziwych Drizzle SQL effects, obecności dotenv w runtime, żadnego CREATE/DROP testu, żadnej odmowy, żadnego backup/cleanup. Wszystkie wymagają osobno autoryzowanych etapów.

**A30:** utrzymać P0-31-01..07 OPEN, przekazać do A00 decyzję A (wyjątek z ryzykiem) vs B (NOWY SHA, preferowany).  
**A20:** nie projektować fikcyjnie split ról dla unchanged C01; doprecyzować minimalny jeden LOGIN+CREATEDB, effective membership/ACL i BASE+4 owner/OID ledger, bez użycia natywnego Windows PG.  
**A22:** zachować pełne S1 CASCADE/helper paths, catalog/Drizzle/2 push i nieudane CREATE→after DROP w destrukcyjnym kontrakcie.  
**A50:** implementować signed sealed env, deny-before-connect i future fixture-guard lub rzeczywistą non-bypass SQL admission.  
**A60:** niezależny verdict per P0 dopiero na podstawie wykonanych pozytywnych i negatywnych dowodów; A00/HQ decyduje o autoryzacji faz.

**FINAL:** R23H-R4_A31_SOURCE_REVIEW_COMPLETE / PG16_DESTRUCTIVE_EXECUTION_BLOCKED / G0_NO_GO / G1–G5_HOLD / RELEASE_NO_GO.

## 10. Evidence references

- Issue #87: https://github.com/C8LyNn/aplikacja-turnieje/issues/87
- A22 R4: https://github.com/C8LyNn/aplikacja-turnieje/blob/da44df0f0786fe0552c91494fb168ff8f5e238d1/docs/web-005/R23H_R4_SQL_EXECUTION_SAFETY_CONTRACT.md
- A30 R4: https://github.com/C8LyNn/aplikacja-turnieje/blob/16ec9af0e907c4316d57b568c5a747c8353e14b9/docs/web-005/agent-reports/A30/R23H_R4_SECURITY_P0_CLOSURE_PLAN.md
- C01 S1 test database helper, blob 31a24e5d65ddbdf4f07b4e2ce7fa086674e2ecf6: https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/test/test-database.ts#L140-L205
- C01 S1 manual migration test, blob 5f84cbb783219bbaf55c788f0e9d508cf78e3d13: https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/test/migration.integration.test.ts#L92-L115
- C01 S2 catalog fixture, blob 6c6bd054e0f6affd5d07e63ee396f5a14b423fc4: https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/test/replit-schema-catalog-reconciliation.integration.test.ts#L468-L525
- C01 S2 catalog child env: https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/test/replit-schema-catalog-reconciliation.integration.test.ts#L676-L687
- C01 S2 Drizzle, blob e008dbd9fe287632252d3fcfda246f60e4cc35d3: https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/artifacts/api-server/test/drizzle-schema-diff.integration.test.ts#L177-L279
- C01 Drizzle config, blob 952a37a5ea123a0948cdaea68be0ee4986828fa9: https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/lib/db/drizzle.config.ts
- C01 DB module: https://github.com/C8LyNn/aplikacja-turnieje/blob/fa3261b2c9510e110ac9eba21726812d3401a525/lib/db/src/index.ts
- PostgreSQL 16 CREATE DATABASE: https://www.postgresql.org/docs/16/sql-createdatabase.html
- PostgreSQL 16 DROP DATABASE: https://www.postgresql.org/docs/16/sql-dropdatabase.html
- PG16 privileges/membership: https://www.postgresql.org/docs/16/ddl-priv.html , https://www.postgresql.org/docs/16/role-membership.html , https://www.postgresql.org/docs/16/predefined-roles.html
- PG16 libpq environment: https://www.postgresql.org/docs/16/libpq-envars.html
- PG16 event trigger limitation: https://www.postgresql.org/docs/16/event-trigger-definition.html
