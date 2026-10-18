# CC-001 / Core Clash V149 Unity — R10 candidate (17.10.2026)

**Status:** SOURCE IMPLEMENTATION CANDIDATE / NOT BUILT / NOT RUNTIME-VERIFIED / NOT PUBLISHED
**Punkt wyjścia:** handoff R9 SHA256 `dd063f9f05051acf5808c0ceafbca7a0b06fb48b6608c110841a78160a16afc0`.

## Przyrost kodu

1. `Assets/CoreClash/Core/StructureSystem.cs`: serwis stawiania, kontroli zajętości/no-build, limitu 14, atomowego stawiania rzędów, napraw, uszkodzenia i zniszczenia (serializowany `StructureRuntime` pozostaje jedynym źródłem prawdy).
2. `Assets/CoreClash/Core/ConstructionEffects.cs`: rzeczywiste handlery STOP dla `wallmaker` i `barricade`; własny TURN dla `repairpulse`, `engineer`, `bastion`. Wspólne wywołanie przez dotychczasowy `AbilityResolver`, także przy ponawianiu STOP przez Echo.
3. `MomentumEffects.cs`: istniejący Pinballer korzysta teraz ze wspólnego systemu tworzenia, zachowując parametry bumpera 20/5/1.42.
4. `BallPhysics.cs`: uszkodzenie konstrukcji przy mocnym wrogim trafieniu, dokładnie raz na odrębny epizod kontaktu, z osobnym stanem kontaktu (własne kule nadal nie zużywają wytrzymałości).
5. `BoardView.cs` i `FeedbackTimeline.cs`: `P1/P2`, rodzaj, `HP/maxHP`, wydarzenia uszkodzenia i naprawiania.
6. `Tests/ConstructionTests.cs`: 10 nowych przypadków logicznych, w tym transakcja 3 filarów, globalny limit, enemy/friendly ownership, naprawianie, tarcze, epizody zderzeń, serializacja snapshotów. `Program.cs` podłącza testy.
7. `Tools/network-codec-test.cjs`: brak dotnet nie przechodzi już jako PASS (wcześniej `result.status === null` skutkował kodem wyjścia 0).
8. `Tools/verify-data.cjs`: na przenośnym handoffie dopuszcza lokalny niemodyfikowany `../Reference/V148_reference_original.html` przy zachowanym wymaganiu SHA256; na maszynie autora nadal preferuje kanoniczny `sourcePath`.

## Decyzje semantyczne

- W HTML V148 `createStructure` ma dla wallOrb/engineerWall wartość `extra.hp ?? 5`, a engineerWall jawnie ustawia 5; `hits:2` nie steruje początkowym HP. W tej wersji Unity przyjęto 5 punktów konstrukcji jako **statycznie potwierdzone zachowanie kodu źródłowego HTML**. Do pełnej certyfikacji wymagana jest próba w uruchomionej referencji.
- `wallmaker`: rząd 3 średnich konstrukcji, transakcja bez osieroconych części przy nielegalnym układzie. `barricade`: do 4 małych struktur, relokacja osobno. `engineer`: naprawa 1 lub próba jednego segmentu na turę, do 8 żywych segmentów własnego budowniczego. `repairpulse`: naprawa do 2, w braku celu +5 osłony do maksymalnie 10. `bastion`: tarcza +5 do 10 najbliższemu sojusznikowi albo źródłu.
- Bumpers Pinballera, struktury Wallmakera, Barricade i Engineera liczą się do tego samego limitu 14.
- **Brak równoważności 1:1 z V148:** uproszczona geometria logiczna nie uwzględnia potencjalnych dodatkowych historycznych przeszkód. Eksplozje nie uszkadzają konstrukcji, zgodnie z odczytanym fragmentem źródłowego `explodeAt`; to osobna decyzja designerska, nie dodano jej po cichu.
- Nie zmieniono `AbilitySupport.cs` ani `Evidence/ability-support.json`: wszystkie pięć zdolności pozostaje `DATA_ONLY` do kompilacji, uruchomienia testów i niezależnej weryfikacji.

## Wykonane sprawdzenia w tej sesji

- ZIP R9: SHA256 zgodny z handoffem. Katalog, talie i referencyjny HTML zachowane.
- `node Tools/verify-data.cjs`: **PASS**, po dodaniu przenośnego fallbacku referencji; SHA V148 zgodne.
- `node Tools/network-codec-test.cjs`: **BLOCKED (dotnet ENOENT)**; skrypt po naprawie zwraca exit 1, a nie pozorny sukces. Nie było 13 testów runtime.
- Testy `Tests/ConstructionTests.cs` i 180 bazowych C#: **NOT RUN — brak .NET 9**.
- Kompilacja Unity oraz buildy Windows/WebGL/Android: **NOT RUN — brak Unity Editor**.
- Network host ↔ peer, mobile hardware i realne mecze: **NOT TESTED**.

## Brama do uruchomienia na Windows

W katalogu lokalnego projektu R9 (najpierw kopia/branch, zweryfikuj HEAD i clean checkout):

1. Przenieś tylko pliki zmienione w paczce overlay albo zastosuj `git apply --check` i następnie `git apply` do `.patch`. Nie podmieniaj projektu, jeśli baseline plików różni się od R9.
2. Uruchom `dotnet run --project Tests/CoreClash.Tests.csproj -- .` — musi przejść zarówno stary zestaw, jak i 10 nowych testów. Sprawdź ewentualne problemy z kątem, placement i regułami fair collision.
3. Uruchom `node Tools/verify-data.cjs` oraz `node Tools/network-codec-test.cjs` — drugi musi wykonać faktycznie 13 testów i zapisać liczbowy exitCode 0.
4. Włącz Unity 6000.4.0f1 i przeprowadź testy kompilacji/importu, natywnego meczu oraz wybranych interakcji: Wallmaker→Repair Pulse→Engineer, Echo→Wallmaker, Pinballer→kolizja, Barricade→Bastion i snapshot sieciowy.
5. Dopiero po pełnym QA podejmij osobną decyzję o zmianie statusów 5 kulek na `UNITY_READY`, odśwież `Evidence/ability-support.json`, manifest i raporty. **Nie aktualizuj klasyfikacji na podstawie samego tego pakietu.**

## Niedomknięte ryzyka / następne kroki

- Brak uruchomionego Unity/C#, więc ewentualne błędy kompilacji, kolizji lub testów wciąż mogą istnieć.
- Snapshot zawiera konstrukcje; efemeryczna pamięć epizodów kontaktu nie jest jeszcze serializowana, dlatego QA powinna zbadać wznowienie symulacji hosta po przywróceniu snapshotu (klient nie wykonuje fizyki).
- Zderzenia i relokacje przy bardzo gęstej planszy wymagają testów runtime. Uwaga na selekcję kandydatów z tą samą odległością i na memory growth listy martwych struktur.
- Nie dotykano produkcyjnej publikacji WebGL, Replit, Unity Cloud ani repozytorium lokalnego użytkownika.
