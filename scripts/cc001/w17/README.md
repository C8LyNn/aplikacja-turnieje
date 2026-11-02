# CC-001 W17-01 — lokalny gate C# + danych (#283)

Jedna komenda, która uruchamia **istniejące** testy zarządzane Core Clash (`Tests/CoreClash.Tests.csproj`) i **istniejący** `Tools/verify-data.cjs`, bez modyfikowania worktree ani `Evidence/`.

To nie jest builder, CI ani pipeline wydania i nie zastępuje A72 (#188). Nie tworzy commitów, nie pushuje i nie zmienia katalogu.

## Wymagania
- .NET SDK 9 (`dotnet --version` → 9.x); na Windows: `winget install Microsoft.DotNet.SDK.9`
- Node 22+
- git (opcjonalnie, do odczytu HEAD i porównania `git status`)

## Użycie (Windows, z katalogu głównego repo)

```bat
rem GREEN: dwa przebiegi, wymagane identyczne wyniki; wynik poza repo
scripts\cc001\w17\run-managed-gate.cmd --runs 2 --expect-sha <SHA> --out C:\cc001-gate\green

rem RED probe: celowo psuje jedną asercję w kopii tymczasowej; oczekiwany exit 1
scripts\cc001\w17\run-managed-gate.cmd --red --out C:\cc001-gate\red
```

Linux/macOS: `node scripts/cc001/w17/managed-gate.cjs` z tymi samymi opcjami.

## Co robi
1. Zapisuje HEAD oraz odcisk stanu (`git status --porcelain` projektu Unity i hash drzewa `Evidence/`).
2. Kopiuje do nowego katalogu tymczasowego tylko wejścia testów: `Assets/CoreClash`, `Assets/Resources/Data`, `Tests` (bez `bin/obj`), `Tools/verify-data.cjs` i `Reference/V148_reference_original.html`. Historyczny driver testów zapisuje `Evidence/*.json` w katalogu podanym jako argument — teraz trafia to wyłącznie do kopii.
3. `dotnet run --project <kopia>/Tests/CoreClash.Tests.csproj -c Release -- <kopia>` (opcjonalnie N razy) oraz `node <kopia>/Tools/verify-data.cjs`.
4. Ponownie sprawdza odcisk źródła i zapisuje `summary.json` + `managed-run-N.log` w katalogu `--out` (musi być poza repo).

## Kody wyjścia
| Exit | Status | Znaczenie |
|---|---|---|
| 0 | `GREEN` | wszystkie przebiegi exit 0, `failed=0`, `passed>0`, verify-data exit 0, źródło bez zmian |
| 1 | `RED` / `RED_CONFIRMED` | testy lub dane nie przechodzą / sonda `--red` została poprawnie wykryta |
| 2 | `BLOCKED_OPERATOR` | brak `dotnet`, zły `--expect-sha`, brak wejść, `--out` w repo |
| 3 | `GATE_ERROR` | źródło zmienione w trakcie, różne wyniki między przebiegami, brak linii `RESULT`, brak kotwicy sondy RED |

`--red` modyfikuje w **kopii** pierwszą asercję (`Eq(20,…)` → `Eq(21,…)` w teście „new match has source bases and distinct owners”). Gate kończy się `RED_CONFIRMED` tylko wtedy, gdy `dotnet` zwróci kod ≠ 0 i padnie właśnie ten test.

## Test samego wrappera
```bash
node --test scripts/cc001/w17/managed-gate.test.cjs
```
Używa fałszywego `dotnet`, więc sprawdza izolację, kody wyjścia i powtarzalność wrappera, a nie rozgrywkę. Prawdziwy wynik testów C# wymaga prawdziwego SDK.

## Dla A70 / modelu wykonawczego
- Uruchamiaj na czystym checkoutcie dokładnego SHA z `--expect-sha`.
- Do raportu dołączaj `summary.json` (bez prywatnych ścieżek, jeśli raport jest publiczny) oraz exit code obu wywołań: GREEN i RED.
- Status `MANAGED_RUN` wolno ogłosić tylko na podstawie `summary.json` z prawdziwym `host.dotnet`, a nie na podstawie samej obecności testów.
