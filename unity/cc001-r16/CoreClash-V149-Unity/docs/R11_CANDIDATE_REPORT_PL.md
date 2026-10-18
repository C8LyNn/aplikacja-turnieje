# CC-001 / Core Clash V149 Unity — R11 Living Reinforcements

**Data:** 17.10.2026
**Stan:** SOURCE CANDIDATE / NOT COMPILED / NOT UNITY-RUNTIME TESTED / NOT PUBLISHED
**Wymagany baseline:** `CoreClash-V149-R10-Source-Candidate.zip` SHA256 `b339d1b21a2d36aafd403d0f96eb8e036cf02c46b0e5fbf3d05add9a101199fb`. R10 sam jest kandydatem: nie ma certyfikacji C# ani Unity.

## Implementacja R11

- `ReinforcementEffects.cs`: Quartermaster tworzy **własnego Standard-tokena 10/10 HP co drugą własną turę**. Spawn jest autorytatywny, bez kosztu zasobów talii, ma ograniczenie ponownego strzału i legalną pozycję. Brak wolnego miejsca zatrzymuje postęp na 1/2 — próba ponawiana przy następnym TURN.
- `ReinforcementEffects.cs`: Commander daje +5 Shield (maks. 10) wszystkim żywym sojuszniczym **Standardom**, niezależnie od dystansu, raz na własną turę. Broodling/shard nie są Standardami.
- `ReinforcementEffects.cs`: Armorer na STOP wzmacnia żywe sojusznicze **Standardy** w MEDIUM=165: +5 Shield (maks. 15). Działa także przez istniejące odtworzenie STOP przez Echo.
- `ReinforcementEffects.cs`: Splitter na STOP zamienia się na 1–2 ukryte tokeny Shard. Przy ≥11 żywych własnych kulach próbuje tylko jeden; nie zabija rodzica przez `GameSimulation.Kill`, zatem podział nie jest DEATH/RETURN. Przy braku legalnego miejsca rodzic zostaje i może spróbować przy kolejnym STOP.
- `LifecycleEffects.cs`: Egg Sac tworzy 4 Broodlingi po 5 HP wokół miejsca śmierci, korzystając z bezpiecznej, radialnej geometrii; powtórzone wywołanie DEATH przez istniejący mechanizm jest nadal dopuszczalne.
- `LifecycleEffects.cs`: Brood Core zachowuje 30 HP katalogowe i koszt 5 HP za udany spawn. Piąty udany spawn wymusza 0 HP + śmierć (opis V149), nawet gdy po czterech spawnach zostało więcej niż 5 HP. Zablokowana próba nie kosztuje HP ani licznika.
- `GameState.cs`: serializowane `quartermasterTurnCounter` i `lastReinforcementTurn`; dodatkowe sprawdzenie powtórzonych wywołań TURN. `RealityEffects.cs`: reset licznika i flagi podziału przy transmutacji.
- `BallInspection.cs`/`FeedbackTimeline.cs`: oznaczenia tokenu `GEN`, postępu `Qx/2`, `Bx/5` oraz sygnały `REINFORCEMENT` i `SPLIT`.
- `Tests/ReinforcementTests.cs`: 14 testów źródłowych gotowych do uruchomienia — nie deklaruje się PASS bez .NET.

## Zasady i ryzyka

1. V148 HTML jest referencją *intencji i sposobów wyzwalania*, nie identycznych trajektorii. Stats/stock katalogu V149 nie były zmieniane.
2. `GenerateAt` używa istniejącej kolizyjnej walidacji `FindPlacement` i limitu 256 aktywnych kulek. Kandydat nie zakłada nieskończonego spawnowania w ciasnej arenie.
3. Ujednolicenie statusu `generated` dla Standard-tokenów wyklucza je z graveyard i RETURN. To naprawia różnicę względem dawnych wywołań `Generate`, ale wymaga testów scenariuszy kopiowania i pasywów w silniku.
4. Oznaczenia `UNITY_READY`, `PARTIAL`, `DATA_ONLY` w `AbilitySupport.cs` i `Evidence/ability-support.json` pozostawiono bez zmian. Cztery nowe handlery nie są certyfikowane; Brood/EggSac nadal PARTIAL do niezależnego QA.
5. Testy R10 także nie były uruchamiane w tej sesji. R11 musi najpierw przejść bramę R10 (Construction) i starsze regresje.

## Wykonane kontrole (ta sesja)

- `node Tools/verify-data.cjs` → **PASS** (227 rekordów, 224 specjalne, 12 archetypów, 36 + 4 talie, nienaruszona referencja HTML).
- `node Tools/network-codec-test.cjs` → **BLOCKED** (exit code 1, `dotnet ENOENT`). Brak pozornego PASS.
- Testy C# i pełne mecze → **NOT RUN** (brak .NET/Unity w środowisku).
- Windows/WebGL/Android builds / sieć / fizyczne urządzenia → **NOT RUN**.
- GitHub/Replit/Unity Cloud/live → **NOT TOUCHED**.

## Bramy akceptacyjne

1. Na Windows, na kopii R10, zweryfikować dokładny baseline, zastosować R11 patch/overlay i sprawdzić czysty zakres różnic.
2. Uruchomić `dotnet run --project Tests/CoreClash.Tests.csproj -- .` oraz wszystkie przypadki `ReinforcementTests` i `ConstructionTests`; nie uznać R11, jeżeli R10 nadal ma FAIL.
3. Uruchomić `node Tools/verify-data.cjs` i `node Tools/network-codec-test.cjs`; drugi musi wykonać rzeczywiste 13/13 testów, a nie tylko zakończyć się bez binariów.
4. Przeprowadzić testy Unity dla TURN/STOP/DEATH, zapełnienia planszy, telemetrii, 50-turn limit, transformacji Mimic/Doppelganger/Wildcard, Echo→Armorer, zniszczeń Brood/EggSac i host snapshot.
5. Rozegrać co najmniej 3 legalne symulowane mecze „Bestie · Stado” / „Bestie · Rozmnażanie” i jeden Windows rendered smoke. Sprawdzić brak softlocków, liczność tokenów i wyważenie ochrony Standardów.
6. Dopiero po PASS zmienić statusy zdolności, odświeżyć `Evidence/ability-support.json`, manifest oraz — osobną decyzją — buildy. Bez deploymentu na stronę.
