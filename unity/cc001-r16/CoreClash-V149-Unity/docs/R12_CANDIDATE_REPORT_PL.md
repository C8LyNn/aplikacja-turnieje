# CC-001 / Core Clash V149 Unity — R12 Evolution & Replication

**Data:** 17.10.2026
**Stan:** SOURCE CANDIDATE / NOT COMPILED / NOT UNITY TESTED / NOT PUBLISHED
**Baseline:** dokładna paczka `CoreClash-V149-R11-Source-Candidate.zip` (SHA256 `c59e075956d0f8d14cea1919d85b9498b19e71c6a295a7930103ad668cf32792`), już zawierająca kandydackie R10 i R11. Nie wolno nakładać patcha bezpośrednio na lokalne R9.

## Co dodano

1. **Hatchery** (`TURN`, co druga własna tura): maksymalnie 3 ukryte Broodlingi o 5/5 HP. Gdy brakuje bezpiecznej pozycji, licznik pozostaje na 1/2, a próba jest ponawiana w następnej własnej turze.
2. **Replicator** (`TURN`, co druga własna tura): klon tego samego typu z bieżącymi HP rodzica ograniczonymi do bazowego Max HP klona. Maksymalnie 3 żywe Replicatory jednego właściciela, licząc klony. Przy nieudanej próbie licznik zeruje się zgodnie z implementacją referencyjną.
3. **Mitosis** (`TOUCH` pary kulek): pierwsze zakwalifikowane zetknięcie rozdziela kulkę na dwie 15/15 HP. Oryginał i potomka oznaczono jako już podzielone. Obie strony kolizji rozpatrywane są **przed** manipulacjami tożsamości (Mimic/Traitor); Jammer może odroczyć podział. Jeśli brak miejsca, nie niszczy ani nie degraduje rodzica.
4. **Swarm Core** (`DEATH`): do 3 ukrytych Shardów, każdy 5/5 HP; poprawna obsługa ponawianych zdolności DEATH przez Agony/Requiem bez uśmiercania źródła. Przy pełnej arenie tworzy tyle, ile legalnie się mieści.
5. **Conscriptor** (`DEATH`): najbliższy własny Standard w promieniu LONG=230 otrzymuje +10 Max HP, +10 HP, +0,10 masy (maks. 1,5) oraz +40 Max Speed (maks. 860). Kolejne uprawnione aktywacje mogą stosować ulepszenie ponownie. Standard-token jest legalnym celem.

**Integracja:** `Assets/CoreClash/Core/EvolutionEffects.cs` + `.meta`, podłączenie do TURN/TOUCH/DEATH i efektów tożsamości, nowe serializowane pola w `BallRuntime`, oznaczenia `H`, `C`, `DIV`, `VET` w inspekcji. Rozdział fizyki i sieci pozostaje host-authoritative. Nie dodano kosztu stock dla generowanych dzieci.

## Kontrola regresji i brakujące bramy

- [x] Walidator danych `node Tools/verify-data.cjs` — PASS (227/224/12/36+4; niezmieniony SHA256 HTML).
- [x] Zakres zmian ograniczony do kodu/QA/dokumentacji; nie zmieniono JSON katalogu, pozycji w talii, statystyk ani referencyjnego HTML.
- [ ] `dotnet run --project Tests/CoreClash.Tests.csproj -- .` — **NOT RUN**, brak .NET w środowisku.
- [ ] `node Tools/network-codec-test.cjs` — **BLOCKED**, `dotnet ENOENT`, prawidłowo zwraca exit 1.
- [ ] Buildy Unity Windows/WebGL/Android, rzeczywiste mecze, LAN, Relay, sprzęt mobilny — **NOT RUN**.
- [ ] R10 Construction Tests i R11 Reinforcement Tests — nadal niezweryfikowane kompilacją; R12 nie może być certyfikowane niezależnie od nich.

`Tests/EvolutionTests.cs` zawiera 17 nowych przypadków źródłowych, obejmujących timery, capy, blokady, pojedynczy kontakt, Jammer, Mimic, Agony, DEATH, Veteran, serializację i inspekcję. Testy **nie są oznaczone PASS** bez rzeczywistego wykonania.

## Znane ograniczenia i otwarte kwestie

- `Mitosis` obsługuje w tym przyroście **kontakt kulka–kulka**. W V148 mechanika jest opisana jako pierwszy fizyczny kontakt, ale metadata miała `LEGACY_CONTACT_COMPAT/UNRESOLVED`: kontakt z bazami/konstrukcjami i wszystkie historyczne szczegóły pozostają do oddzielnej walidacji. Nie awansować jej automatycznie do `UNITY_READY`.
- `Replicator` kopiuje bieżące HP, ale nie dziedziczy czasowych statusów/osiągnięć źródła; tożsamość i aktywny licznik nowej kopii zaczynają się od zera, tak jak w V148. Przy takiej mechanice konieczne są testy wielu własnych tur i połączenia host-klient.
- Przywołania mają realne ograniczenia kolizyjne i globalny cap 256 żywych kulek, więc nie gwarantują pełnej liczby potomków, jeśli plansza jest zatłoczona. Brak spawnu nie jest automatycznym softlockiem.
- Zdolności z R10/R11 oraz nowe z R12 nadal pozostają w oficjalnym rejestrze `DATA_ONLY/PARTIAL`, aż do niezależnego QA i potwierdzonych buildów. Pliki `Evidence/ability-support.json` oraz historyczne manifesty pozostawiono bez falsyfikacji.

## Nakazany przebieg QA na Windows

1. Rozpakować **nowy**, odizolowany katalog z paczki R11 i sprawdzić jej SHA256. Nie nadpisywać aktywnego workspace autora.
2. Nałożyć `CoreClash-V149-R12-Changes.patch` przez `git apply --check`, potem `git apply` (lub użyć całej paczki źródłowej R12). Pracować na osobnej gałęzi.
3. Uruchomić wszystkie testy C# (w tym R10/R11/R12); naprawić FAIL przed zmianą statusów. Uruchomić walidator danych i 13/13 testów kodeka.
4. Wykonać scenariusze Unity: prawdziwa kolizja Mitosis, zderzenia z konstrukcjami, piętrowe spawny przy 256, wpływ statusów Jammer, `Agony/Requiem → Swarm Core/Conscriptor`, host snapshot+replay oraz pełne mecze w talii `Bestie` bez ustawionych fixture.
5. Sprawdzić rozmiary i opisy kulek na PC/telefonie, legalne wystawienie z talii, brak osieroconych tokenów i prawidłowy wynik końca 50 tur. Dopiero później podjąć decyzję o promocji statusów i budowaniu kolejnego etapu.

**Nie wykonano:** Git push, merge, deploy Replit, publikacja, testy runtime Unity, ingerencja w oryginalny HTML.
