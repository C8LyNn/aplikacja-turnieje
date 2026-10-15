# WEB-005 / R23B / A20 — A00_DECISION_PACKET (D01–D04)

**Zadanie:** `WEB-005-T020-A20-R23B-D01-D04-OWNER-GATE`  
**Rola:** A20 — PostgreSQL Migration Reconciliation  
**Data:** 2026-10-15 (Europe/Warsaw)  
**Tryb:** ARCHITECTURE DECISION PREPARATION / DOCS ONLY  
**Wynik opracowania:** **`D01_D04_DECISION_PACKET_READY`**  
**Status rozstrzygnięć D01–D04:** **`PENDING_OWNER_APPROVAL`** — nie znaleziono wiążącego podpisu A00/HQ dla tych czterech decyzji w sprawdzonych raportach, pakiecie R21 i dyskusji PR #38. **Nie podpisano ich w imieniu A00.**

## Zweryfikowane referencje — delta, bez ponawiania R23A

- [PR #38](https://github.com/C8LyNn/aplikacja-turnieje/pull/38): **aktualny HEAD `2d36864f4d2f1c838073f387fd3c8efb3378c43b`** (OPEN / DRAFT / UNMERGED). **SHA podany w zadaniu `2d36864f4d2f1c838073d84750e5237d3de4649` jest niezgodny z HEAD**; do decyzji stosować rzeczywisty HEAD z GitHub.
- Release: `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`; editor: `codex/game-catalog-editor-reliability@28da3ef94f3b30f90c1b3b70a88ab7f61462d99c`. Obie gałęzie nadal `identical` z bazami R23A (0 ahead / 0 behind).
- P05 `lib/db/migration-ledger-validator/manifest.proposal.json`, Git blob `28f493263a2cbfb919db1f99b220058175b46ba0`: **`PROPOSAL_ONLY_NOT_APPROVED`**; niezależny audyt R23A potwierdził **14/14 Git blob SHA-1 i 14/14 UTF-8 SHA-256** oryginalnych źródeł, NIE historię wykonania SQL.
- [R23A kanoniczny graf z pełnymi 14 SHA-1 / SHA-256 i DAG](https://github.com/C8LyNn/aplikacja-turnieje/blob/74abd89158dacb2eb6d2e92fd48deb4405ee7a30/docs/web-005/agent-reports/A20/WEB-005_A20_R23A_CANONICAL_MIGRATION_GRAPH_PROPOSAL.md); [R23A writer/conflict matrix i wniosek T055](https://github.com/C8LyNn/aplikacja-turnieje/blob/1ce5a0e9eb11b6a926357d9acfd59f597df4d7a2/docs/web-005/agent-reports/A20/WEB-005_A20_R23A_T055_RESERVATION_WRITER_CONFLICT_MATRIX.md); [R23A owner handoff](https://github.com/C8LyNn/aplikacja-turnieje/blob/21bca71de16463f4a8f1586a719f80ab75e986c8/docs/web-005/agent-reports/A20/WEB-005_A20_R23A_MIGRATION_LEDGER_OWNER_DECISION_HANDOFF.md).

---

## D01 — Kanoniczny graf tożsamości

**Rekomendowana opcja:** **APPROVE_SOURCE_GRAPH_ONLY**: zaakceptować dokumentacyjnie 14 odrębnych, niezmiennych tożsamości SQL z P05 jako **proponowany kanoniczny graf źródłowy**, z rozdzieleniem historycznych kolizji. Nie aprobować tym samym grafu zastosowanego do żadnej fizycznej bazy.

**Zakres skutków:** zatwierdzenie słownika `logical_id + source_lineage + source_commit + original_filename + Git blob SHA-1 + UTF-8 SHA-256 + deps` dla 0027–0040. Nie przepisuje oryginalnych SQL, nie scala dwóch źródeł pod jednym ordinalem, nie tworzy ledgera `APPLIED` i nie akceptuje bezwarunkowo numeracji do wykonania.

**Potwierdzone dowody — kluczowe kolizje:**

| Oryginalny numer | Release (oryginał) | Editor (oryginał) |
|---|---|---|
| `0030` | `controlled_correction_operations` — Git SHA-1 `50aa71ae0199806de3aaf3c57700d2739f2c42bc`, SHA-256 `04b6d10b6f3861585884406a93661948c491836dd1e4a7dde54aabe3a17c06ca` | `steam_catalog_abstract_world` — Git SHA-1 `a6d4ce679136b016dc6eed0e490e3e54060ada22`, SHA-256 `1d5ba3e810ce80077e6991d64132042ea0265b1aa1073248dbb389f68a916fdb` |
| `0031` | `atomic_correction_receipts` — Git SHA-1 `d44601f4b6477dc9366fc7a65475a0eede1c34c1`, SHA-256 `a048b907778af4c417b0faaca70def32540bd8c36caa2e0a6696bc40d5d0214a` | `steam_catalog_pagination_indexes` — Git SHA-1 `b813547b834febe8e7398d1b2cfe204b84dd1ed5`, SHA-256 `cd36853fa3809868c10fddf8fa763048ff8c56766fcd33c18549af61c136fd77` |

P05 proponuje dla editor oryginalnego `0030/0031` odpowiednio **kanoniczne `0032/0033`**, a dla editor oryginalnego `0032–0038` **kanoniczne `0034–0040`**. Wszystkie 14 pełnych checksum: podlinkowany graf R23A.

**Pozostałe ryzyko:** checksum w Git dowodzi bajtów źródła, nie tego, co wykonał runner; editor może mieć już lokalne, oryginalnie numerowane migracje. Nie wolno ich automatycznie uznać za adoptowane.

**Czy A00 może zatwierdzić dokumentacyjnie teraz?** **TAK**, jako `SOURCE_GRAPH_APPROVED_FOR_RECONCILIATION` (warunkowo, po własnym podpisie). **Następny krok:** D02 oraz D03/odczyt fizycznej historii i osobna akceptacja mapowania zastosowanego do konkretnego środowiska.

**Decyzja rzeczywista:** `PENDING_OWNER_APPROVAL`.

## D02 — Jednoznaczny całkowity porządek

**Rekomendowana opcja:** **RELEASE_FIRST_EDITOR_SECOND** — pojedynczy porządek proponowanego przyszłego runnera:

```text
0026 basket_authority_trigger_bypass (zewnętrzny wcześniejszy warunek)
 -> 0027 preserve_started_stage_memberships
 -> 0028 match_revision
 -> 0029 steam_game_catalog_v1
 -> release 0030 controlled_correction_operations
 -> release 0031 atomic_correction_receipts
 -> proposed editor canonical 0032 steam_catalog_abstract_world
 -> 0033 steam_catalog_pagination_indexes
 -> 0034 steam_catalog_classification_revision
 -> 0035 steam_catalog_trigram_search
 -> 0036 steam_catalog_exact_status_counters
 -> 0037 steam_catalog_import_jobs
 -> 0038 steam_catalog_import_job_sources
 -> 0039 steam_catalog_import_retry_backoff
 -> 0040 steam_catalog_global_source_throttle
```

**Zakres skutków:** jednoznaczna propozycja *polityki* kolejności w jednym przyszłym strumieniu migracji, **bez uruchomienia**.

**Potwierdzone zależności SQL:** `0027` wymaga `basket_authority_trigger_bypass` (0026); release `0030` wymaga `match_revision` (0028); release `0031` wymaga release `controlled_correction_operations` (0030); editor `abstract_world` i `pagination_indexes` mają SQL-hard dependency `steam_game_catalog_v1` (0029); późniejsze editor jobs/sources/backoff mają własne hard-dependencies wyszczególnione w grafie. Manifest ma oddzielne `hard_sql_dependencies` i `canonical_order_dependencies`, których nie wolno utożsamiać.

**Wybór polityki, NIE dowiedziona twarda zależność SQL:** `0029 -> release 0030` oraz zwłaszcza **`release 0031 -> editor proposed 0032`**. Editor `0032` wymienia 0029 jako predecessor, NIE release 0031; proponowana kolejność 0031→0032 jest *decyzją polityczną* dla spójnego strumienia. Kolejne kroki editor są uporządkowane w manifeście; nie każde takie sąsiedztwo ma hard dependency w SQL.

**Pozostałe ryzyko:** fizyczna baza może zawierać inną historię/gałąź, a release `0031_atomic_correction_receipts.sql` zawiera osadzone `BEGIN; COMMIT;`. Nie wiadomo, czy stary runner usuwał wrappery i jakie bajty naprawdę wykonał.

**Czy A00 może zatwierdzić dokumentacyjnie teraz?** **TAK**, wyłącznie jako `TOTAL_ORDER_POLICY_PROPOSED_ACCEPTED`, nie `RUNNER_ORDER_EXECUTED`. **Następny krok:** D03 źródło rzeczywistych receipts; odrębny przegląd runnera, jego transformacji i historii już zastosowanych numerów.

**Decyzja rzeczywista:** `PENDING_OWNER_APPROVAL`.

## D03 — Wymagany pakiet dowodów wykonania w PostgreSQL

**Rekomendowana opcja:** **SOURCE_AND_RUNTIME_RECEIPT_REQUIRED / UNKNOWN_FAIL_CLOSED** — zabronić automatycznej adopcji na podstawie numeru pliku, wpisu `app_schema_migrations` lub istnienia tabel.

**Zakres skutków:** zdefiniować odrębną kontrolę wykonywaną tylko po **osobnym, podpisanym GO na odczyt**, na dokładnie zidentyfikowanym środowisku. A20 w R23B nie nawiązywał żadnego połączenia SQL.

**Minimum przyszłych, autoryzowanych odczytów/receipts:**

1. **Fizyczna tożsamość bazy:** niezależny certyfikat host/port lub socket, instancja/klaster, PG major i DB, właściciel/rola, `current_database()`, `current_user`, `current_schema()`, `SHOW server_version`, `SHOW search_path`, parametry zabezpieczeń, kontekst test/production; jeżeli dostępne bez nadmiernych uprawnień, niezależne ID klastra/systemu. Nie ujawniać tajnych DSN w raporcie.
2. **Rzeczywisty ledger:** transakcyjny, read-only SELECT z `app_schema_migrations` (`migration_key, applied_at, app_commit, target_schema, deployment_environment`), inspekcja definicji tabeli, unikalności, kolejności, luk/duplikatów, nieznanych kluczy i wszystkich równoległych rejestrów runnera. Legacy ledger **nie zawiera kolumny checksum SQL** w przypiętym ORM.
3. **PG katalog / sygnatura skutków:** `pg_namespace`, `pg_class`, `pg_attribute`, `pg_constraint`, `pg_index`, `pg_trigger`, `pg_proc`, `pg_depend`, funkcje i typy; weryfikacja charakterystycznych postconditions/triggerów dla 0027–0040 i ich konfliktów, z rozróżnieniem obiektów, które mogły istnieć wcześniej. Obecność obiektu = **zgodność stanu**, a NIE samodzielny dowód wykonania historycznych bajtów.
4. **Zewnętrzne receipts runnera:** niezmienne archiwalne logi wykonania/CI/deploy, runner commit/SHA, dokładne źródło SQL i przekształcone **executed-input SHA-256**, wrapper `BEGIN/COMMIT` dla 0031, podany porządek i commit transakcji, target/schema/pg-major, timestamp i owner aprobaty. Tam, gdzie logs nie istnieją, oznaczyć `EXECUTION_NOT_ATTESTABLE` i wymagać osobnej decyzji — nie fabrykować `APPLIED`.
5. **Rekonsyliacja:** dla każdej logicznej migracji zestawić `source SHA-1 + source SHA-256 + source commit + runner executed-input checksum + actual ledger key + catalog postconditions + actual target instance`. Dla unknown/duplicate/orphan/partial/mixed release+editor, sprzecznego checksum lub niejawnej transformacji => `STOP / MANUAL_REVIEW` bez DDL/adoption/backfill.

**Potwierdzone dowody teraz:** Git 14/14 źródłowych SHA-1 i 14/14 SHA-256, deklarowany format `app_schema_migrations`, manifest `PROPOSAL_ONLY_NOT_APPROVED`; **brak PostgreSQL execution receipts** w R23A/R23B.

**Pozostałe ryzyko:** stare migracje mogły być wykonywane poza repo, w różnym runnerze lub schemacie; SELECT-y same w sobie nie odtworzą jednoznacznie braku logów. Osobne uprawnienia do kontroli prawdziwego środowiska są niezbędne, nawet jeśli operacja będzie tylko do odczytu.

**Czy A00 może zatwierdzić dokumentacyjnie teraz?** **TAK** — wymaganą *politykę dowodową*. **Następny krok:** wskazać administratora, bazę/środowisko, uprawnienia tylko do odczytu, zakres ujawniania metadanych i odpowiedzialnego A50/A60 za niezależną weryfikację. Reset/DDL wymagają jeszcze innego GO.

**Decyzja rzeczywista:** `PENDING_OWNER_APPROVAL`.

## D04 — Wyłączny alokator i logiczny wniosek T055

**Rekomendowana opcja:** **A00-CONTROLLED_SERIALIZED_ALLOCATOR**: pojedyncze źródło prawdy, właściciel **A00/HQ**, zmiany przez repo/PR z kontrolą wersji, atomiczną kontrolą expected HEAD/lease, unikalnymi logicznymi ID i numerycznymi prefixami, audytem decyzji i konfliktem -> `STOP`.

**Zakres skutków:** teraz dokumentacyjnie zarejestrować wniosek, **bez zajmowania** żadnego numeru/fizycznego slotu:

```yaml
request_id: WEB-005-T055-BASKET-CAS-PERSISTENCE-V1
status: REQUESTED_NOT_ALLOCATED
numeric_migration_id: null
canonical_sql_filename: null
db_ledger_receipt: null
owner_to_approve: WEB-005/A00
runner_authorization: false
physical_pg16_test_authorization: false
```

**Potwierdzone dowody:** obecna propozycja P05 wykorzystuje tylko hipotetyczne canonical 0027–0040; oryginalne numery release/editor kolidują 0030/0031. Macierz A20 R23A zawiera powyższy klucz w stanie `REQUESTED_NOT_ALLOCATED`; przed tym raportem nie wyznaczono globalnego alokatora ani nie zatwierdzono konkretnego następnego numeru.

**Pozostałe ryzyko:** równoległe PR-y i niezrekoncyliowane historyczne ledgery mogą już wykorzystać dowolny pozornie wolny numer; status `REQUESTED_NOT_ALLOCATED` sam nie zapewnia wyłącznego locka. Nie wyliczać następnego numeru z `MAX(prefix)` ani zakładać, że `0041` jest wolne.

**Czy A00 może zatwierdzić dokumentacyjnie teraz?** **TAK** — wyłącznego właściciela i reguły alokacji; **nie** aktualną rezerwację numeryczną. **Następny krok:** po D01–D03 i zbadaniu konkurencyjnych PR-ów A00 zatwierdza aktualizację dedykowanego rejestru z podpisaną zmianą/lease, wtedy dopiero może przydzielić numer i osobno autoryzować minimalny PR migracyjny. Nie wolno dopisywać historii do produkcyjnego `app_schema_migrations` w celu rezerwacji.

**Decyzja rzeczywista:** `PENDING_OWNER_APPROVAL`.

---

## Podsumowanie GO / STOP dla koordynatora

| ID | Rekomendacja A20 | Decyzja właściciela | Dokumentacyjne zatwierdzenie teraz? | SQL / numer / wdrożenie |
|---|---|---|---|---|
| D01 | APPROVE_SOURCE_GRAPH_ONLY | `PENDING_OWNER_APPROVAL` | **TAK**, tylko graf źródeł | STOP |
| D02 | RELEASE_FIRST_EDITOR_SECOND | `PENDING_OWNER_APPROVAL` | **TAK**, jako polityka | STOP |
| D03 | SOURCE_AND_RUNTIME_RECEIPT_REQUIRED | `PENDING_OWNER_APPROVAL` | **TAK**, jako standard dowodowy | STOP |
| D04 | A00-CONTROLLED_SERIALIZED_ALLOCATOR | `PENDING_OWNER_APPROVAL` | **TAK**, bez nadania numeru | STOP |

**Jedna dyspozycja wymagana teraz:** A00/HQ może opublikować *osobny, podpisany* `D01–D04 ARCHITECTURE POLICY DECISION` z wybranymi odpowiedziami, datą, owner identity i bezpośrednim linkiem. Jeśli nie zatwierdzi, **`PENDING_OWNER_APPROVAL` pozostaje aktywny**. Dopiero po dalszej walidacji historii DB i nowych osobnych autoryzacjach powstaje możliwość implementacyjnego GO.

**STOP:** `NO_SQL / NO_DDL / NO_PG_RESET / NO_MIGRATION_NUMBER / NO_HISTORICAL_SQL_EDIT / NO_PROD_LEDGER_WRITE / NO_MERGE / NO_DEPLOY / NO_SWARM006`.

**Werdykt A20 R23B:** **`D01_D04_DECISION_PACKET_READY`** · decyzje niezatwierdzone `PENDING_OWNER_APPROVAL` · `REQUESTED_NOT_ALLOCATED`.
