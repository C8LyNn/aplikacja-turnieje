# WEB-005 A50 R15 — jednorazowy pakiet wykonania na zaufanym Windows PC

**Task** `WEB-005-T133-A50-R10`; release `NO-GO`; SWARM-006 `HOLD`. Ten dokument i `Run-R15-Frontend.ps1` są **nieuruchomionym w tej sesji przepisem**, a nie dowodem PASS. Runbook czyta się razem z test matrix JSON.

## A. Co musi zrobić właściciel/A00

1. Udostępnić agentowi A50 **rzeczywisty dostęp do shella na zaufanym PC lub zatwierdzonej VM** z pełnym klonem `C8LyNn/aplikacja-turnieje`; samo połączenie GitHub Connector nie udostępnia plików w tym środowisku ChatGPT.
2. Potwierdzić Git, **Node 22**, **pnpm 10**, każde odrębne HEAD SHA, czysty worktree, oryginalny `pnpm-lock.yaml`, `pnpm-workspace.yaml`; zezwolić oddzielnie na `pnpm install --frozen-lockfile`, bez osłabiania supply-chain `minimumReleaseAge`. Uruchamianie GitHub Actions/CI nie jest domyślnie zatwierdzone.
3. Wystawić prawdziwe, potwierdzone poza plikiem przez A00 upoważnienie frontendowe **na konkretny PR/SHA**. Dokument JSON sam nie jest kryptograficznym podpisem. Logi umieścić **poza repo**, usunąć sekrety przed udostępnieniem A60.
4. PostgreSQL jest osobną decyzją: izolowana disposable instancja **PG16**, osobna test-only baza i login **bez superuser/CREATEDB/CREATEROLE/REPLICATION/BYPASSRLS**, `TEST_DATABASE_SCHEMA=tm_test_*`, `TEST_DATABASE_URL` bez `DATABASE_URL` fallback, fizycznie potwierdzona tożsamość hosta i zakres resetu, osobny reset consent od owner i A20. Dopóki to nie jest udokumentowane: **nie uruchamiać testów PG**.

## B. Przygotowanie osobnego checkoutu, przykład PR53

Wykonawca uruchamia w PowerShell 7 na **zatwierdzonym** PC (polecenia tworzą tylko odrębny lokalny klon; wymagają prawidłowej autoryzacji do repo):

```powershell
$pr = 53
$sha = '6a8f0c3e5775eb056df75ebdd7b33df7cbc78979'
$repo = 'C:\WEB005-R15\PR53'
git clone https://github.com/C8LyNn/aplikacja-turnieje.git $repo
if ($LASTEXITCODE -ne 0) { throw 'Git clone failed' }
git -C $repo fetch origin "refs/pull/$pr/head"
if ($LASTEXITCODE -ne 0) { throw 'PR fetch failed' }
git -C $repo checkout --detach $sha
if ($LASTEXITCODE -ne 0) { throw 'Checkout failed' }
if ((git -C $repo rev-parse HEAD).Trim() -ne $sha) { throw 'WRONG SHA — STOP' }
if ((git -C $repo status --porcelain --untracked-files=all)) { throw 'DIRTY — STOP' }
node --version
pnpm --version
# After separate owner authorization to install dependencies:
pnpm --dir $repo install --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Dependency install failed — STOP' }
```

Każdy inny PR wymaga oddzielnego katalogu i własnego dokładnego SHA z [R15 TEST MATRIX](./WEB-005_A50_R15_TEST_MATRIX.json); **nie** cherry-pick, rebase, merge, composite branch ani wspólnego checkoutu mieszającego commity.

## C. Pierwszy test P0 na PR53: stary AuthProvider bez QueryClientProvider

`AuthProvider` z PR53 wywołuje `useQueryClient()` w `src/context/auth-context.tsx`, a `src/hooks/use-tournament-auth.test.tsx` nadal montuje tylko `AuthProvider`, bez `QueryClientProvider`. To **SOURCE_CONFIRMED/POTENTIAL_RUNTIME_FAIL** i musi zostać wykonane **przed** nowym plikiem testowym. Nie poprawiać testu na ślepo ani nie zaliczać przez pominięcie.

Na zaufanym PC pobrać z gałęzi dokumentacyjnej `Run-R15-Frontend.ps1`, potwierdzić SHA pliku i prawdziwe zatwierdzenie A00. Najpierw plan:

```powershell
.\Run-R15-Frontend.ps1 -PR 53 -Suite existing-auth
.\Run-R15-Frontend.ps1 -PR 53 -Suite target
```

Wykonanie dopiero po wpisaniu prawdziwych ścieżek i otrzymaniu zgody:

```powershell
.\Run-R15-Frontend.ps1 -PR 53 -Suite existing-auth -Execute -Repo 'C:\WEB005-R15\PR53' -OutDir 'C:\WEB005-R15-EVIDENCE\PR53' -ApprovalFile 'C:\WEB005-APPROVALS\PR53.json'
if ($LASTEXITCODE -ne 0) { throw 'Existing auth test failed — STOP for PR53' }
.\Run-R15-Frontend.ps1 -PR 53 -Suite target -Execute -Repo 'C:\WEB005-R15\PR53' -OutDir 'C:\WEB005-R15-EVIDENCE\PR53' -ApprovalFile 'C:\WEB005-APPROVALS\PR53.json'
if ($LASTEXITCODE -ne 0) { throw 'New cache tests failed — STOP for PR53' }
```

`PR53.json`: `{"approved":false,"authority":"WEB-005-A00","scope":"FRONTEND_TEST_ONLY","pr":53,"head_sha":"6a8f0c3e5775eb056df75ebdd7b33df7cbc78979","approval_reference":"PENDING_A00_REAL_AUTHORIZATION","expires_at_utc":"2026-10-15T00:00:00Z"}`. **Przykład jest celowo `approved:false`**. Nie wolno go odblokować samowolnie.

**Osobne czerwone testy do zaprojektowania/uruchomienia w zatwierdzonym zakresie:** R14-R01 klucz `["tournaments", id, "player-bans"]` oraz R14-R02 `["matches", matchId, "game-picks"]`. Dzisiejszy URL-prefix matcher PR53 pomija je; R02 wymaga poprawnego mapowania meczu na turniej, **nie** globalnego wyczyszczenia cache. Ich runtime status teraz **NOT_EXECUTED**; bez testu i źródłowej decyzji A60/A00 nie ma GO na nowy kod S2B.

## D. Pozostałe frontendowe PR (każde osobno)

```powershell
# Po przygotowaniu dedykowanych checkoutów, zgód i zależności:
.\Run-R15-Frontend.ps1 -PR 43 -Suite target -Execute -Repo 'C:\WEB005-R15\PR43' -OutDir 'C:\WEB005-R15-EVIDENCE\PR43' -ApprovalFile 'C:\WEB005-APPROVALS\PR43.json'
.\Run-R15-Frontend.ps1 -PR 47 -Suite target -Execute -Repo 'C:\WEB005-R15\PR47' -OutDir 'C:\WEB005-R15-EVIDENCE\PR47' -ApprovalFile 'C:\WEB005-APPROVALS\PR47.json'
.\Run-R15-Frontend.ps1 -PR 50 -Suite target -Execute -Repo 'C:\WEB005-R15\PR50' -OutDir 'C:\WEB005-R15-EVIDENCE\PR50' -ApprovalFile 'C:\WEB005-APPROVALS\PR50.json'
.\Run-R15-Frontend.ps1 -PR 52 -Suite target -Execute -Repo 'C:\WEB005-R15\PR52' -OutDir 'C:\WEB005-R15-EVIDENCE\PR52' -ApprovalFile 'C:\WEB005-APPROVALS\PR52.json'
.\Run-R15-Frontend.ps1 -PR 54 -Suite target -Execute -Repo 'C:\WEB005-R15\PR54' -OutDir 'C:\WEB005-R15-EVIDENCE\PR54' -ApprovalFile 'C:\WEB005-APPROVALS\PR54.json'
# Repeat on each exact SHA with -Suite typecheck, and -Suite build after test validation.
```

**Do not assume pass:** skrypt nie został uruchomiony jako PowerShell w sesji A50 (brak pwsh). Operator musi zweryfikować skrypt i wymienione wywołania na zatwierdzonym stanowisku; rezultaty muszą zawierać exit, TAP, skip, wersje, SHA i oczyszczone logi. Pełna regresja frontendowa jest dodatkową bramką, nie zastępowaną pojedynczym zielonym testem.

## E. PostgreSQL16 (na razie STOP) — dopiero po A20 + owner reset GO

Preflight nie może opierać się jedynie na nazwie `test`, adresie localhost ani zmiennej `TEST_DATABASE_URL`. Wykonawca potwierdza fizyczną instancję, DNS/host, wolumen i konto, że żaden współdzielony system nie ma do niej dostępu; wymaga dowodu tylko-do-testu i zakresu `tm_test_*`. Proponowana **read-only** kontrola uprawnień:

```sql
SELECT current_database() AS db, current_user AS role_name,
       current_setting('server_version_num')::int AS pg_version,
       r.rolsuper, r.rolcreatedb, r.rolcreaterole, r.rolreplication, r.rolbypassrls
FROM pg_roles r WHERE r.rolname = current_user;
```

Wszystkie flagi uprawnień muszą być false, PG major 16. W dalszym kroku testy (każda oddzielna gałąź i baza testowa) przy zatwierdzonym fizycznym PG:

| PR | Targeted test file |
|---|---|
| #39 | `test/match-revision.integration.test.ts` |
| #41 | `test/stage-basket-route-execution.integration.test.ts` |
| #42 | `test/revert-match.integration.test.ts` |
| #44 | `test/session-revocation-race.integration.test.ts` |
| #45 | `test/round-robin-terminal-reopen.integration.test.ts` |
| #46 | `test/tournament-delete-revocation.integration.test.ts` |
| #48 | `test/stage-basket-route-execution.integration.test.ts` |
| #49 | `test/auth-organizer-revocation-r12.integration.test.ts` |
| #51 | `test/revert-match.integration.test.ts` |

Źródłowy API `artifacts/api-server/package.json` definiuje `test:integration` przez `node --import tsx ./test/run-tests.ts integration`, a ten runner uruchamia testy sekwencyjnie. Targetowany odpowiednik do doprecyzowania i sprawdzenia na pełnym checkout: `pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/FILE.integration.test.ts`. Bez poprawnego `TEST_DATABASE_URL` oraz reset GO **NIE uruchamiać**. Każdy wynik ma objąć dodatnie przypadki, oczekiwane konflikty/403, zero-write DB snapshots i rollback.

## F. CI & odbiór

Pack19 matcher starego release na PR52–54 jest wcześniejszym czerwonym gate; PR35 ma oddzielną proponowaną poprawkę. Nie omijamy obowiązkowego CI ani nie tworzymy tu composite SHA. PR40 Pack17 `--full` wymaga tej samej bezpiecznej bazy/GO. Manualne ponowienie płatnego CI wymaga owner GO.

**Następne działanie:** A00 udostępnia zatwierdzony PC/VM i per-SHA zgody; A50 uruchamia natywne testy tylko z tym dostępem; A60 dokonuje niezależnego review na identycznym HEAD, A10 gromadzi potwierdzone sumy i linki. Obecna fala `APPLICATION_NOT_EXECUTED / RELEASE_NO_GO`. 
