# WEB-005 — A80 R14 / OWNER SPORTING DECISIONS

**DO PODPISU — NIEZATWIERDZONE / POLICY_OPEN**  
**TASK:** WEB-005-T050-T051-A80-R7 · **Tryb:** SOURCE-ONLY · **Data:** 2026-10-14 (Europe/Warsaw)  
**Instrukcja R14 blob:** e3fc34cee212e23c7516a2271af1080c96eff9a0  
**Baza release:** 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7 · **PR45 HEAD:** a7a87bc019731191dbfa44bee6939e3fa25e27f4.

## 1. P0 — POLICY-TERMINAL-SWISS / wybór właściciela

**Stan źródła (SOURCE_CONFIRMED):** ścieżka Revert przy zamkniętym turnieju wznawia terminalne SE/RR, ale nie terminalny Swiss. Skutek: ostatni wymagany mecz Swiss może wrócić do pending przy nadal completed etapie i turnieju (STATIC_INFERRED, bez testu PostgreSQL16). `completeMatch` wymaga aktywnego etapu.

**Niezależny od wariantu invariant:** żadna zatwierdzona operacja nie pozostawia wymaganego meczu pending przy completed terminal Swiss. Statusy meczu/etapu/turnieju, winnerId, activeStageId, completedAt, memberships, historia, wersje i audyt muszą pozostać atomowo spójne.

| Wariant do podpisu | Kontrakt operacji | UX, historia, rollback |
|---|---|---|
| **TS-A — DENY_409** | Revert finalnego completed Swiss → kontrolowane HTTP 409, brak *jakichkolwiek zapisów*, bez zmian winnerId, statusów, wersji, historii, action_log i rankingu | Organizator otrzymuje informację „Turniej zakończony — korekta wymaga osobnej zatwierdzonej procedury”; bez pozornego Undo |
| **TS-B — ATOMIC_REOPEN** | Jedna transakcja: docelowy mecz pending; etap i turniej active; oba winnerId NULL; completedAt etapu NULL; activeStageId=terminal etap; aktywni wyłącznie uczestnicy tego etapu | Organizator może skorygować wynik i ponownie zakończyć etap. Zachować niezmienną result_history, jawnie skompensować stage_completed oraz ukończenie meczu; pełny rollback wszystkich tabel przy dowolnym błędzie |

**Obowiązkowe przypadki negatywne:** played, walkover, completed no_contest (match.winnerId może być NULL), system BYE (chroniony/409 w obu opcjach), 8→4→Swiss4 bez reaktywacji niezakwalifikowanych, zmiana latest-action podczas blokady, niedozwolony aktor, rozpoczęty kolejny etap/approved qualification, błąd po pierwszym zapisie. Bez nowej decyzji nie wolno wybierać kodu błędu ani zmieniać ścieżki Direct Revert / Undo-last.

**WYPEŁNIA OWNER/HQ:** Wariant: [ ] TS-A DENY_409  [ ] TS-B ATOMIC_REOPEN; publiczny error code + tekst UX: ______; polityka stage_completed i latest-action/Direct Revert CAS: ______; właściciel: ______; podpis/data: ______; decyzja DECISIONS ID: ______.

**Dopóki pola nie są podpisane: POLICY_OPEN, CODE STOP.** Podpis nie oznacza sam w sobie GO na branch, testy destrukcyjne, merge lub deployment.

## 2. Niezależne decyzje sportowe (każda wymaga osobnego podpisu)

| Identyfikator | Rozstrzygnięcie do zapisania przez owner/HQ |
|---|---|
| POLICY-SE-ROUND | `currentRound` = **EARLIEST_ACTIONABLE** (SE4 po cofnięciu R1: 1) **lub MAX_GENERATED** (2; odrębne `actionableRound=1` dla UI/API) |
| POLICY-SWISS-PAIRING | Swiss5 i Swiss6: zachłanny algorytm daje **1 powtórkę**, choć istnieje kojarzenie z **0**; ustalić priorytet minimalnej liczby rewanżów względem score bands, deterministyczne rozstrzyganie remisów i limit solvera |
| POLICY-SWISS-BYE-NC | BYE: najsłabszy bez wcześniejszego BYE, przy wyczerpaniu można powtórzyć; zatwierdzić zakres fairness. Completed no_contest = historyczne spotkanie, lecz bez win/Buchholz; cancelled ≠ rozegrane; ewentualna zmiana wymaga decyzji |
| POLICY-DE-GF-RUNNERUP | Zdecydować czy wicemistrz = przegrany decydującego **played GF albo GF Reset**; reset system BYE nie jest drugim wynikiem meczu |
| POLICY-DE-RANK-3-N | Druga porażka / fala eliminacji, równe miejsca lub tie-break stageSeed; sprawdzić 3–N i BYE, nie korzystać automatycznie z globalnego seeda |

**WITHDRAWN pozostają WITHDRAWN:** WEB-004 A52-F001/F002, BIZ-21-09/12. BIZ-21-18 (RR stageSeed) ma poprawkę w release — wyłącznie regresja. Jednostkowe wyniki Swiss5/6 i DE są MODEL_CHECKED, nie RUNTIME_VERIFIED.

**Źródła/załączniki:** [R13 matrix (18 przypadków)](./WEB-005_A80_R13_CONDITIONAL_ACCEPTANCE_FIXTURES.json), [R13 decision queue](./WEB-005_A80_R13_POLICY_SIGNOFF_QUEUE.md); [PR45](https://github.com/C8LyNn/aplikacja-turnieje/pull/45).

**STOP R14:** brak kodu, nowego PR, kompozytu, płatnego CI rerun, SQL, staging, SWARM-006. **Status:** OWNER_SIGNATURE_REQUIRED / RELEASE_NO_GO.
