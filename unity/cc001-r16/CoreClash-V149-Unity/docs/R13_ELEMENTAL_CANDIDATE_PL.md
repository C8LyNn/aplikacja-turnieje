# Core Clash V149 Unity — R13 Elemental Systems (źródłowy kandydat)

**Punkt wyjścia:** `CoreClash-V149-R12-Source-Candidate.zip` o SHA256 `12a0403a4b998c88a7555e7c2e08f6b1d102b9db61a47250d30490570af579d4`. Paczka R12 zawiera już przyrosty R10/R11, lecz żadnego z R10–R12 nie certyfikowano kompilacją Unity w tym środowisku. R13 jest kolejną warstwą zmian, nie autonomicznym wydaniem.

**Status:** kod źródłowy i testy napisane; walidator JSON przeszedł. `dotnet`/Unity nie są dostępne, dlatego kompilacja C#, testy i buildy pozostają **NOT RUN**. Brak deploy, brak zmian HTML, brak zmiany statystyk/talii.

## Zmiany w gameplayu

1. **Firebrand / STOP:** fala FIRE w SHORT=100 dla wrogich żywych kul; sojusznicy są ignorowani. Nakładanie przez istniejący `ApplyFire` zachowuje kontrę ICE→CLEAR. Powtórzenia STOP przez Echo korzystają z tego samego handlera.
2. **Chain Frost / STOP:** maksymalnie 4 unikalnych przeciwników; pierwszy skok MEDIUM=165 od źródła, kolejne SHORT=100 od ostatniego celu. Deterministyczny wybór najbliższego (ID jako tie-break), stan ICE wspólny z Frost i Blizzard Core.
3. **Ash Core / TURN:** +5 tarczy **raz na własną turę**, jeśli istnieje co najmniej jeden płonący przeciwnik. Maksymalna tarcza 15. Nie mnoży efektu przez liczbę przeciwników.
4. **Furnace / TURN:** tworzy / odnawia jedną strefę `furnaceFire` (promień 104, żywotność 3 końce tur) przypisaną do konkretnej kuli i właściciela. Status FIRE nakładany jest w `PeriodicZones`, bez dodatkowego „magicznego” obrażenia bezpośredniego. Jest to odwzorowanie efektywnego runtime V148 (karta używa też opisowego „5 dmg”). Strefa widoczna jak ogień w `BoardView`.
5. **Frostguard / STOP + HIT:** zatrzymanie ustanawia stan obronny/zakotwiczenie i daje +10 tarczy (cap 15); HIT wroga przeciwko zakotwiczonemu Frostguardowi nakłada ICE na uderzającą kulę. Dotknięcie bez HIT i kontakt sojusznika nie aktywują kontrzamrożenia. Rozpoczęcie nowego strzału wyłącza stan; zmiana typu resetuje go.

## Integracja

- Nowy `Assets/CoreClash/Core/ElementalEffects.cs` i `.meta`, podpięcie do `AbilityResolver` dla `STOP`, `TURN` i `HIT`.
- `BallRuntime.lastElementalTurn` i `frostguardAnchored` są serializowalne. `Transmute` oraz launch zerują specyficzne stany. `furnaceFire` jest obsługiwane w `PeriodicZones`.
- `BoardView` koloruje `furnaceFire` jak inne strefy ognia, `BallInspection` pokazuje znacznik `FRG`.
- `Tests/ElementalTests.cs`: 16 testów **przygotowanych, NIE uruchomionych**: targetowanie, kontra FIRE/ICE, Echo, skoki 165→100, cap tarczy, lock TURN, świeżość pola, odpowiedź na HIT, reset stanu i snapshot hosta.
- `Tools/r13-qa.ps1`: audyt lokalny Windows. Domyślnie kieruje logi do `G:\Mój dysk\ChatGPT\CoreClash\QA\R13` **tylko jeżeli folder główny G:\Mój dysk\ChatGPT istnieje**; w przeciwnym razie do `Evidence/R13-QA` lokalnie. Nie gwarantuje synchronizacji online. Parametr `-OutputRoot` ma pierwszeństwo; opcjonalne `-BuildWindows` uruchamia build.

## Bramy przed promocją statusu

1. `dotnet run --project Tests/CoreClash.Tests.csproj -- .` —  wszystkie historyczne i R10–R13, **nie wykonano**.
2. `node Tools/network-codec-test.cjs` — w tym środowisku poprawnie zwraca `BLOCKED: dotnet runner unavailable`, **to nie PASS**.
3. `Tools/r13-qa.ps1 -OutputRoot <docelowy-folder>` na Windows; zweryfikować logi i kody wyjścia; niezależne QA przy co najmniej jednym pełnym meczu rzeczywistego Unity oraz testach Echo/Mimic/fizycznego kontaktu.
4. Sieć host-authoritative: snapshot, pobranie klienta, ponowna synchronizacja podczas aktywnej strefy i statusów; test na osobnym urządzeniu.
5. Weryfikacja zakresu fizycznego zakotwiczenia Frostguarda względem HTML; obecnie wykorzystuje istniejący `anchorStacks=3` (większa masa/tarcie), nie gwarantuje pełnego fizycznego unieruchomienia. Nie awansować Frostguard bez zaakceptowania semantyki ruchu.
6. Zweryfikować, czy etykieta Furnace („5 dmg”) jest zgodna z rzeczywistym nakładaniem BURN w scenariuszu akceptacyjnym; nie dodawać osobnych obrażeń bez potwierdzenia.

**Oficjalny licznik UNITY_READY pozostaje bez zmian.** Brak zgody na publikację.
