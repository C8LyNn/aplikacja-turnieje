# WEB-005 — A90 R19 / Backup B1 QA i decyzja owner/HQ dla B2

**TASK:** \`WEB-005-T060-A90-R19\` · **WAVE:** R19.1 · **DATE:** 2026-10-14 (Europe/Warsaw)  
**AGENT:** A90 — Backup V3 Integrity & Restore  
**AUTHORIZATION:** SOURCE-ONLY; **PR41 CODE-FROZEN**, bez zmian kodu, SQL, migracji, nowych PR, rebase/merge, kompozytu, wdrożenia, uruchomienia SWARM-006 ani testu PG16 bez odrębnej zgody.  
**SOURCE:** \`C8LyNn/aplikacja-turnieje\`, release \`release/tournament-ops-20261013-01\` = \`1fdc401d87c6bffe6bf7312dfc9db681b689dcf7\`.  
**PUB:** \`docs/web-005/a90-r19-backup-owner-gate\`, tylko dokumentacja A90. Wybory owner/HQ **nie zostały dokonane przez A90**.

## 1. R19 dokładne HEAD, źródłowe QA i test debt

| Kandydat | Snapshot R18 → live R19 | Evidence / verdict |
|---|---|---|
| **P08 B1 / [PR #41](https://github.com/C8LyNn/aplikacja-turnieje/pull/41)** | \`f03cf3d09988a04ba9c2856e205d21f994ff67f1\` → **ten sam HEAD**, release base \`1fdc401...\` | OPEN DRAFT, unmerged. A60 R18 potwierdza **\`SOURCE_ACCEPTED_CONDITIONAL\`** na tym SHA; nie \`RUNTIME_VERIFIED\`. |
| **P15 B3A / [PR #48](https://github.com/C8LyNn/aplikacja-turnieje/pull/48)** | \`2a8a4c72cb4a3a37402a346fd0acc83b03b39be3\` → **ten sam HEAD** | OPEN DRAFT, unmerged; odrębny eksportowy MVCC \`REPEATABLE READ\` / \`READ ONLY\`, bez rzeczywistego PG16 proof. |
| **P01 CI / [PR #35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35)** | \`7cb283aa82273a1e22daf9051a82311eef53760c\` → **ten sam HEAD** | Separate OPEN DRAFT fix starego testu Pack19, nie dołączony do PR41/48. |

**Ścisła akceptacja A60:** [R18 niezależny raport](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_INDEPENDENT_QA.md) (blob \`656a8850a6358e5b4b2517220a5fc55f99dc014f\`) §2: exact PR41 HEAD, validator blob \`a8482fa7137f1d71817c8b4ec43da7d6292f8183\`, **source parity potwierdzona warunkowo**. Zawiera: pozycje QPE 1..N per basket w kolejności globalnego placement rank; OP↔QPE zachowuje player/basket/rank; **nie-null** route \`sourceBasketPosition\` równa QPE dla dokładnego source basket/player/rank; dozwolone aktualne \`sourceBasketPosition:null\`; brak pola / \`undefined\` nie jest null.

**A50 rzeczywiste wykonanie:** [A50 R18 receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R18_RECEIPT.md), blob \`a54e410eddf12ff9b909cb8a73cfd91d1d91acad\`: \`node --version\` i \`git --version\` exit 0, \`git -C /mnt/data rev-parse HEAD\` exit 128 (brak checkout); brak pnpm/psql/PG16, **0 natywnych testów API/RTL/PG16**. A90 R19 nie wykonywał komend testujących aplikację: **\`TESTS_NOT_EXECUTED\`, exit/TAP nie istnieje**. Brak dowodu OWNER/HQ na fizycznie izolowany runner/PG16.

**CI PR41:** [Actions run 38623319193](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38623319193), job \`116056098551\` = FAIL na upstream Pack19 (stary regex \`readOnly:true\` vs \`accessMode:"read only"\`). Etap \`Static and database release gates\` pominięty. To **nie jest funkcjonalny FAIL ani PASS Backup B1**. Bez kosztownego retry; osobny PR35 jest właścicielem korekty.

**Źródłowy diff PR41 do release:** tylko cztery pliki: dodany \`artifacts/api-server/src/application/backups/backup-v3-flow-integrity.ts\` (+209), zmieniony \`artifacts/api-server/src/application/backups/backup-v3.ts\` (+18/-5), \`artifacts/api-server/test/stage-basket-route-execution.integration.test.ts\` (+229) oraz historyczny \`docs/web-005/WEB-005_A90_R9_HANDOFF.md\` (+63). **R18→R19 brak nowych commitów/kodu A90**.

## 2. Minimalna macierz rzeczywistych testów B1 dla A50 — PG16 / exact SHA

**Tylko syntetyczne fixture** \`buildRouteFixture({qualifierCount:2})\`, poprawna zatwierdzona propozycja QP→QPE→materialized OP, wykonany route, V3 HTTP export; clone JSON dla każdego scenariusza. Nie używać rzeczywistego backupu ani danych użytkowników.

| ID | Fixture / operacja | Expected + wymagany dowód |
|---|---|---|
| **B1-P1 MODERN** | Poprawny eksporter-generated Phase3: approved QP/QPE/OP, executed receipt, pełna struktura nowej V3 | \`validateBackupV3\` przyjmuje; HTTP import 2xx, post-import re-export QP/OP/route i participant membership poprawne; ponowne wykonanie route idempotentne |
| **B1-P2 LEGACY-NULL** | Ta sama poprawna V3, rzeczywisty writer zapisuje \`sourceBasketPosition:null\`; stare legalne V3 bez opcjonalnych QP/route kolekcji osobno | \`null\` NIE podlega błędnemu reject; prawidłowe historyczne optional-absent V3 pozostają importowalne; odróżnić **null** od **brakującej wymaganej właściwości** |
| **B1-P3 EXPLICIT-POS** | Kopia P1, route entry \`sourceBasketPosition\` numerycznie zgodna z odpowiadającym QPE \`basketPosition\` per basket/player/global rank | HTTP import 2xx, odczyt \`stage_basket_route_entries.source_basket_position\` pokazuje te same liczby po ID mapping/restore |
| **B1-N01..N07** | Zamiana dwóch QPE pozycji, luka (np. 20), usunięte QPE position; zamiana receipt positions, wrong 99, 0, brak pola receipt zamiast null | Każdy wariant: \`BackupV3ValidationError\` before clone + HTTP \`400 INVALID_BACKUP_V3\`; bez nowych root ani zależnych rekordów |
| **B1-N08..N19** | 12 oryginalnych tabelarycznych negatywnych mutacji QP/OP/receipt: missing/wrong output/player/rank/basket, orphan/pending/stale proposal, incomplete/wrong/extra/duplicate route receipt | Typowany preclone 400, zero root/child clone. Dwanaście wariantów jest **wewnątrz jednego** \`node:test\`, nie 12 TAP PASS |
| **B1-RB1 POSTINSERT** | Syntetyczny legalny V3 z \`players[0].seed = 2147483648\` — dodatnia wartość przechodzi dotychczasową walidację źródłową, lecz przekracza PostgreSQL \`INTEGER\`. Import wystartował po insert root/stages, potem DB error | **Odróżnić prawdziwy późny wyjątek od preclone 400**; HTTP brak 2xx; transakcja wycofana. Porównanie przed/po count + FK orphan checks przez 13 clone-related tabel; żaden root/stage/player/history/action/QP/OP/route commit |

**Istotna precyzja test oracle:** R17 implementacja już **definiuje** obie test-nazwy w \`stage-basket-route-execution.integration.test.ts\`:
- \`Backup V3 B1: qualification and route corruption rejects before clone\` — 12 podprzypadków w jednym body;
- \`Backup V3 B1: per-basket order and route source positions are fail-closed\` — 7 podprzypadków, pozytywne import/readback, late INTEGER failure i census.

Obecne negatywne asercje badają **count root po nazwie**; autorowana 13-tabelowa census dotyczy **late rollback**. A50/A60 muszą potwierdzić **child-table zero-write** przy negatywnych scenariuszach niezależnie (np. z kontrolą FK/DB stanu), zamiast nieprawdziwie twierdzić, że taka asercja już istnieje dla każdego N01–N19. Docelowa zgodność historycznych V3 bez dodatkowych Phase2/3 pól wymaga osobnego pozytywnego fixture, nie wyłącznie \`null\` route case.

### Reprodukowalny runbook — WYŁĄCZNIE po pisemnym testowym GO

**STOP preflight:** A00/owner udostępnia fizycznie odseparowaną **jednorazową** bazę PostgreSQL16, faktyczne host+cluster/database identity oraz dedykowaną rolę, kompletny clean per-SHA checkout, Node22/pnpm10 i zgodę na reset. A20 niezależnie potwierdza izolację i uprawnienie do \`DROP SCHEMA IF EXISTS "tm_test_a90_r19" CASCADE\`. Sam test-looking URL lub nazwa \`tm_test_*\` **nie gwarantują** fizycznej izolacji. Nie ujawniać \`TEST_DATABASE_URL\`. Brak bezpiecznego hosta/reset GO → \`ENV_BLOCKED / NOT_EXECUTED\`, bez prób połączenia z shared/production i bez fallback do \`DATABASE_URL\`.

~~~sh
# Commands for A50 on the trusted dedicated runner; NOT executed by A90.
git fetch origin fix/web-005/t060-b1-backup-v3-integrity-r9
git switch --detach f03cf3d09988a04ba9c2856e205d21f994ff67f1
git rev-parse HEAD
node --version           # Node 22
pnpm --version           # pnpm 10
pnpm install --frozen-lockfile
pnpm --filter @workspace/api-server run typecheck
# TEST_DATABASE_URL provisioned privately, approved for THIS PG16 test database.
# ONLY after written consent to reset the exact tm_test_a90_r19 schema:
TEST_DATABASE_SCHEMA=tm_test_a90_r19 \
TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA \
pnpm --filter @workspace/api-server exec node --import tsx --test \
  --test-concurrency=1 ./test/stage-basket-route-execution.integration.test.ts
~~~

**A50 dowód dla A60:** \`git rev-parse HEAD\` full SHA, Node/pnpm/PostgreSQL version, redacted isolated DB attestation i osobna zgoda reset, commands + **actual exit codes**, TAP pass/fail/skip i test-name, API 2xx/400+JSON code, przed/po root+children count / rollback, legacy-null/numeric receipt parity. Pakiet PR48 B3A **osobno** na jego exact SHA: niezależny writer W commit po root SELECT, exporter E spójny OLD → następny E2 spójny NEW dla root/stage/match oraz QP/route receipt; \`REPEATABLE READ, READ ONLY\` jedna sesja \`tx\` — także \`NOT_EXECUTED\`. Nie tworzyć branchu kompozytowego.

## 3. B2 — krótkie alternatywy do podpisu named owner/HQ

**TICKET:** \`POLICY-BACKUP-B2-PORTABLE-HISTORY-R19\` · **STATUS:** \`POLICY_OPEN / SIGNATURE_MISSING\`. Nie ma w zweryfikowanych [DECISIONS.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/DECISIONS.md) ani [A60 R18 gate](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_FINAL_HANDOFF_READINESS.md) imiennie podpisanej decyzji B2. **A90 przedstawia opcje, nie wybiera ich.**

| Gate | Fakty ograniczające | Opcje do zatwierdzenia owner/HQ |
|---|---|---|
| **D1** strict vs legacy | \`schemaVersion:3\` nie oznacza, że wszystkie historyczne backupy mają pełną nową proweniencję. \`resultHistory\` i \`actionLog\` to obecnie wymagane tablice, lecz mogą być \`[]\`, a \`undoPayload\` może być \`null\`. V2 ma inny importer. | **A** jawny nowy strict capability-marker + legacy V3/V2 path; **B** wszystkie V3 strict dopiero po historycznym audycie/migracji; **C** diagnostyka bez nowego reject. |
| **D2** latest history | V3 waliduje kształt/rewizje pojedynczych history rows, nie wymaga uniwersalnego latest result-history == completed match. \`revertMatch\` wymaga parytetu tuple/date. | **A** strict wymaga najnowszego history i jego tuple; **B** mismatch przy istniejącym history reject, ale sparse history degraduje Revert; **C** tylko diagnostyka. Explicit BYE/walkover/NC/undo/date exceptions. |
| **D3** portable match revision | DB \`matches.revision\` (CAS/state) nie jest serializowana w V3. \`resultHistory.revision\` to **osobny** per-match licznik historii; **nie porównywać ich**. | **A** nowy jawny portable CAS field; **B** odtwarzać DB default/rebase z kontraktem; **C** brak state CAS portability, blokować niebezpieczny Revert do odzyskania. A20 potwierdza migrację 0028/trigger. |
| **D4** action log / LIFO | Brak przenośnego original action ID przy równym \`createdAt\`, a \`actionLog:[]\` oraz \`undoPayload:null\` mogą być historycznie legalne. | **A** strict typed completion+active action/order key; **B** legalne legacy importowane, niepewne Undo wyłączone; **C** tylko runtime A70 guard. Wskazać tie-break. |
| **D5** Undo nested IDs | \`remapUndoPayload\` rozpoznaje nested \`playerId/player1Id/player2Id/winnerId/matchId/prevFeaturedMatchId\` i w braku mapowania ma fallback \`?? oldId\` — nie jest dowodem poprawnego ID. | **A** strict preclone reject missing/foreign IDs; **B** legacy import + bezpiecznie zdegradowany Undo; **C** zachować fallback przy jawnie zaakceptowanym ryzyku. |
| **D6** error/rollback i UX | Walidacja B1 preclone i late tx rollback mają odrębne kontrakty. Ostrzejsza walidacja B2 może złamać starsze legalne V3. | **A** strict-profile \`400 INVALID_BACKUP_V3\` przed insert + pełny rollback przy late error, legacy pozytywy; **B** owner-approved restricted restore/warning i wyłączony niepewny Undo. |

**Wymagany imienny owner signature packet:**

- HQ/owner signer, timestamp, GitHub permalink decyzji: \`________________\`
- Wybrane D1–D6 + reguły wyjątków, przyjęty strict marker: \`________________\`
- Osobna legacy V2/V3 compatibility matrix i komunikaty użytkownika: \`________________\`
- A20 CAS/0028+history trigger acceptance: \`________________\`
- A70 completion-action/LIFO and Host/Direct Revert contract: \`________________\`
- A60 test/QA criteria acknowledgment: \`________________\`
- A00 local coordinator acceptance: \`________________\`
- Future B2 application code GO: **NOT_GRANTED**; odrębna fala/zgoda.

**Skutek:** bez podpisanej i spójnej decyzji A90 **nie implementuje** nowej polityki, nie odrzuca \`resultHistory:[]\`, nie utożsamia rewizji i nie resetuje/przerabia Undo. Źródłowa poprawka B1 nie jest B2.

## 4. Konflikty, formalny gate i przekazanie

- **P08/P15 collision:** PR41 i PR48 modyfikują wspólne \`artifacts/api-server/src/application/backups/backup-v3.ts\` oraz \`stage-basket-route-execution.integration.test.ts\`, bez wzajemnej integracji. A00/A10 zapisuje zależność; przyszły SWARM-006 rozwiązuje po **finalnym, wyraźnie zatwierdzonym handoffie**, nigdy teraz.
- **R18 A60 verdict:** [HANDOFF_NOT_READY](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_FINAL_HANDOFF_READINESS.md). R19 A90 nie ocenia PR53/54, sportu, sesji lub globalnych 38 historycznych WEB004 testów za innych agentów.
- **Niezależne owner gate:** fizycznie zaakceptowane PG16 i rzeczywiste A50 testy, następnie A60 runtime signoff; podpis B2 D1–D6 i ewentualne formalne owner disposition \`POLICY_OPEN/BLOCKED/WONT_FIX\`; A00/HQ dopiero po pełnym globalnym source+38-case closure może oddzielnie dopuścić \`HANDOFF_WITH_RUNTIME_TEST_DEBT\`. **Takie odstępstwo nie istnieje w zweryfikowanych źródłach** i nawet po nim composite tests są twardym \`RELEASE_STOP\`.
- **R19 result:** \`A90_SOURCE_ONLY_COMPLETE / P08_SOURCE_ACCEPTED_CONDITIONAL / P08_RUNTIME_NOT_EXECUTED / B2_POLICY_OPEN / B3A_SEPARATE / WEB005_HANDOFF_NOT_READY / RELEASE_NO_GO / SWARM006_HOLD\`.

**Nie było zmian aplikacyjnych, migracji, merge, rerun kosztownego CI, produkcyjnego importu ani uruchomienia SWARM-006.**
