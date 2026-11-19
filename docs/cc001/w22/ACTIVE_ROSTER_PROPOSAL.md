# CC-001 W22 — aktywna pula i zamrażarka (PROPOZYCJA DO DECYZJI)

Stan: **pula zatwierdzona przez właściciela; wdrożona w kolejnych commitach W22.** Źródło: katalog (227 typów), rejestr `AbilitySupport` i kod `Core` na `claude/cc001-w21-ball-identity`.

## Fakty, które ograniczają wybór

- 227 typów: **42 READY**, **51 PARTIAL**, **134 DATA_ONLY** (lecą i zderzają się, zdolność nie działa w Unity).
- Aktywna pula może więc pochodzić tylko z 93 zaimplementowanych typów. 134 typy trafiają do zamrażarki z powodu braku implementacji, nie oceny pomysłu.
- 2 typy (`shard`, `broodling`) to ukryte żetony tworzone przez inne kulki — osobna klasa INTERNAL.

## Proponowana aktywna pula: Standard + 30 kulek

30 kulek specjalnych: 25 READY, 5 PARTIAL. Ikonę ma już 23 z 31; brakuje Time Bomb, Furnace, Shatterer, Frost Trap, Venom, Pulse, Slingshot, Pinballer.

| ID | Nazwa | Mechanika | Rola | Dlaczego | Stan | Ikona |
|---|---|---|---|---|---|---|
| `normal` | Standard | Bez zdolności; ciężka, mocne zderzenia. Zawsze dostępna, bez limitu. | Baza | Punkt odniesienia dla wszystkich pozostałych i tani ruch w każdej turze. | READY | jest |
| `bomb` | Bomb | STOP: wybuch MEDIUM i znika; wybucha też przy śmierci. | Obrażenia obszarowe | Najprostsza do zrozumienia zdolność w grze; nagradza celne zatrzymanie. | READY | jest |
| `mine` | Mine | STOP: uzbraja się; wybucha (do 14 dmg + odrzut), gdy dotknie jej wróg. | Pułapka | Blokuje linie strzału; decyzja „gdzie postawić” zamiast „w co trafić”. | READY | jest |
| `timebomb` | Time Bomb | STOP: licznik; po 2 własnych turach wybuch MEDIUM. | Opóźnione zagrożenie | Zmusza przeciwnika do reakcji w czasie; inna oś niż Bomb i Mine. | READY | brak |
| `fire` | Fire | TOUCH: podpalenie (5 dmg przez 2 tury celu). | Status: ogień | Podstawowy nakładacz ognia; uczy statusów. | PARTIAL | jest |
| `furnace` | Furnace | TURN: aura SHORT zadaje 5 ognistych dmg wrogom i podpala. Duża kulka. | Aura / kontrola obszaru | Jedyna stała aura; nagradza ustawienie w środku. Chroniony kontrakt FIRE-only. | PARTIAL | brak |
| `bonfire` | Bonfire | DEATH: SHORT wybuch 10 dmg wrogom i +5 HP sojusznikom. | Śmierć jako zasób | Dobra także wtedy, gdy ginie; wzór dla efektów DEATH. | READY | jest |
| `ice` | Frost | TOUCH: zamrożenie + SHORT Frost Nova. | Status: lód | Kontrola ruchu przez status; paruje się z Shatterer. | PARTIAL | jest |
| `shatterer` | Shatterer | TOUCH: zamrożony cel dostaje +5 dmg, zamrożenie znika. | Wykończenie statusu | Czytelna dwukrokowa kombinacja z Frost i Frost Trap. | READY | brak |
| `frosttrap` | Frost Trap | STOP: lodowa pułapka; pierwszy wróg zostaje zamrożony. | Pułapka statusowa | Jedna pułapka statusowa zamiast trzech bliźniaczych; zamrożenie daje najwięcej decyzji. | READY | brak |
| `venom` | Venom | TOUCH: zatruwa czysty cel; zatrutemu zadaje +5 dmg i leczy się o 5. | Status: trucizna | Nakładacz i wykończenie w jednej kulce; zastępuje prostszą Plague. | READY | brak |
| `blightpool` | Tox Pool | STOP/TURN: strefa, która zatruwa stojących w niej wrogów. | Strefa | Trwała strefa zamiast jednorazowego efektu; zmusza do ruchu. | READY | jest |
| `plagueleech` | Plague Leech | TOUCH: zakaża i wiąże cel; co własną turę wysysa 5 HP i leczy się. | Wysysanie | Jedyne trwałe połączenie dwóch kulek; cel można ratować zabijając pijawkę. | READY | jest |
| `gravitymine` | Gravity Mine | STOP: pułapka przyciąga kulki i wybucha po wejściu wroga. | Pułapka + przyciąganie | Łączy kontrolę pozycji z obrażeniami; inna niż Mine. | READY | jest |
| `web` | Webber | STOP: 4 węzły sieci; pierwszy wróg zużywa węzeł i zostaje unieruchomiony. | Blokada terenu | Kilka małych przeszkód naraz; kształtuje planszę. | READY | jest |
| `harpoon` | Harpoon | STOP: LONG przyciąga najdalszego wroga w zasięgu. | Przyciąganie | Wyciąga cel z obrony; jedyny efekt dalekiego zasięgu. | READY | jest |
| `pulse` | Pulse | STOP: MEDIUM mocne odepchnięcie. | Odpychanie | Jedyne odpychanie w puli; ratuje strefę domową i wypycha z aur. | PARTIAL | brak |
| `timeshift` | Swap | STOP: zamienia się pozycją z najbliższym wrogiem w SHORT. | Zamiana pozycji | Zmienia geometrię planszy jednym ruchem. | READY | jest |
| `gatekeeper` | Portal | STOP: para połączonych portali, zachowują pęd kulki. | Portale | Nowe trasy strzału dla obu graczy; wysoki sufit umiejętności. | READY | jest |
| `slingshot` | Slingshot | STOP: zbiera sojuszników w MEDIUM i wystrzeliwuje ich jednocześnie. | Ruch drużynowy | Jedyna kulka poruszająca własne kulki; nagradza ustawianie formacji. | READY | brak |
| `pinballer` | Pinballer | STOP: zniszczalny Bumper przy najbliższej krawędzi. | Konstrukcja | Zmienia odbicia od band; pasuje do fizyki bilardowej gry. | READY | brak |
| `vortexmedic` | Vortex Medic | STOP: przyciąga wrogów w MEDIUM i leczy najbardziej rannego sojusznika o 5–10. | Leczenie | Leczenie z ryzykiem: im więcej wrogów wciągnie, tym mocniej leczy. | READY | jest |
| `ward` | Ward | STOP: czyści debuffy sojuszników i daje im 5 tarczy w MEDIUM. | Oczyszczanie + tarcza | Odpowiedź na trzy statusy; jedna kulka zamiast całej rodziny oczyszczaczy. | READY | jest |
| `halo` | Halo | Pierwsze obrażenia od uderzenia są anulowane. | Obrona własna | Prosta, widoczna obrona pasywna; dobra do wejścia w strefę wroga. | READY | jest |
| `cascade` | Cascade | DEATH: odradza się w miejscu śmierci jako 10 HP, potem 5 HP. | Wytrzymałość | Trzy życia; trudna do usunięcia przeszkoda. | READY | jest |
| `agony` | Deathcast | TOUCH sojusznika: odpala jego efekt DEATH bez zabijania go. | Kombinacje | Uruchamia Bomb, Bonfire, Cascade i Singularity na żądanie. | READY | jest |
| `singularity` | Singularity | DEATH: czarna dziura, rośnie co turę, aż pochłonie 10 kulek. | Zagrożenie globalne | Najbardziej widowiskowy efekt w grze; obaj gracze muszą na niego reagować. | READY | jest |
| `reclaimer` | Reviver | STOP: raz, za 10 HP, przywraca najstarszą poległą kulkę z 15 HP. | Wskrzeszanie | Daje wartość cmentarzowi; decyzja kosztem własnego HP. | READY | jest |
| `traitor` | Traitor | TOUCH: trafiony wróg przechodzi na twoją stronę, Traitor staje się wrogim Standardem. | Zmiana strony | Jedyna zmiana właściciela; pozostałe kulki kopiujące są do niej podobne. | READY | jest |
| `chronomancer` | Rewind | STOP: pierwsze użycie zapisuje pozycję i HP, kolejne do nich wraca. | Cofanie czasu | Planowanie na dwie tury; zastępuje podobny Paradox. | READY | jest |
| `echo` | Echo | STOP: powtarza zdolności STOP wszystkich kulek w MEDIUM, obu stron. | Wzmacniacz kombinacji | Każda nowa kulka STOP zwiększa jego wartość; działa też na wroga. | PARTIAL | jest |

### Jak pula się układa

- **Trzy statusy, każdy z nakładaczem, nagrodą i obszarem:** ogień (Fire, Furnace, Bonfire), lód (Frost, Shatterer, Frost Trap), trucizna (Venom, Plague Leech, Tox Pool). Odpowiedzią na wszystkie jest Ward.
- **Pozycja:** przyciąganie (Harpoon), odpychanie (Pulse), zamiana (Swap), portale (Portal), ruch własnych kulek (Slingshot), blokada terenu (Webber, Pinballer).
- **Wybuchy na trzy sposoby:** natychmiast (Bomb), przy kontakcie (Mine, Gravity Mine), z opóźnieniem (Time Bomb).
- **Śmierć jako zasób:** Bonfire, Cascade, Singularity, uruchamiane przez Deathcast i odzyskiwane przez Reviver.
- **Manipulacja:** Traitor, Rewind, Echo.

### Znane słabości tej propozycji

- **Brak archetypu Earth** i tylko jedna kulka Wind/Fortress/Vegetation: w tych archetypach nie ma typów READY poza wybranymi.
- **Brak stylu „rój/przywołania”:** wszystkie przywoływacze są PARTIAL (patrz REWORK: Hatchery, Mitosis).
- **5 kulek PARTIAL w puli** (Fire, Frost, Furnace, Pulse, Echo): działają „ze znanymi ograniczeniami”; każda wymaga sprawdzenia w Playerze przed udostępnieniem.
- **Żadna z 40 istniejących talii nie składa się wyłącznie z aktywnych kulek.** Potrzebne będą nowe gotowe talie (9 unikalnych typów każda) — proponuję 3–4 po zatwierdzeniu puli.
- Balansu nie oceniałem liczbowo; wybór opiera się na odmienności mechanik, nie na sile.

## REWORK CANDIDATE (16)

Ciekawe, ale nie do udostępnienia w obecnym stanie.

| ID | Nazwa | Stan | Co trzeba zrobić |
|---|---|---|---|
| `wallmaker` | Wallmaker | PARTIAL | Stawia rząd 3 filarów. Najczytelniejsza konstrukcja, ale częściowa; pierwsza w kolejce po Pinballerze. |
| `mitosis` | Mitosis | PARTIAL | Dzieli się przy pierwszym uderzeniu. Chroniony kontrakt V148; opis „unresolved legacy contact” wymaga wyjaśnienia przed udostępnieniem. |
| `hatchery` | Hatchery | PARTIAL | Przywoływacz Broodlingów. Jedyny dobry kandydat na styl „rój”; częściowy. |
| `wildcard` | Wildcard | PARTIAL | Losowa transformacja. Wymaga puli ograniczonej do aktywnych kulek, inaczej wprowadza zamrożone typy. |
| `genesis` | Genesis | PARTIAL | Biała dziura tworząca losowe kulki. Ten sam problem puli co Wildcard. |
| `mimic` | Mimic | PARTIAL | Kradnie typ celu. Ciekawy, ale częściowy i wymaga, by kopiowany typ był aktywny. |
| `collector` | Collector | PARTIAL | Zbiera typy zmarłych i odpala ich zdolności. Wysoka złożoność, częściowy. |
| `banish` | Banish | PARTIAL | Usuwa cel na 3 tury. Unikalna kontrola, częściowa; ryzyko frustracji. |
| `phase` | Phase | PARTIAL | Przenika przez kulki w ruchu. Unikalny ruch, częściowy. |
| `warp` | Warp | PARTIAL | Boczne ściany teleportują na drugą stronę. Unikalny ruch, częściowy. |
| `frostguard` | Frostguard | PARTIAL | Kotwiczy się, dostaje tarczę i zamraża atakujących. Dobra obrona aktywna, częściowa. |
| `martyr` | Martyr | PARTIAL | DEATH: leczy własną bazę o 3 HP. Jedyne leczenie bazy; ryzyko dla balansu długości meczu. |
| `phoenix` | Phoenix | DATA_ONLY | Wraca do ręki po śmierci. Kod ręki istnieje, ale status w rejestrze to „tylko dane”; wymaga domknięcia. |
| `mirage` | Mirage | DATA_ONLY | Tworzy widma. Zależy od decyzji o ukrytym HP (V148); w Unity brak widm. |
| `tesla` | Tesla | DATA_ONLY | Łańcuch błyskawic co turę. Mocna tożsamość wizualna, ale w Unity tylko dane. |
| `colossus` | Colossus | DATA_ONLY | 55 HP, bardzo ciężki. Dobry „czołg”, ale w Unity tylko dane. |

## FREEZER (178)

Pełna lista z uzasadnieniem dla każdego typu: [ROSTER_227.csv](ROSTER_227.csv). Podział:

- **128 typów DATA_ONLY** — zdolność niezaimplementowana w Unity.
- **50 typów zaimplementowanych**, zamrożonych, bo powielają aktywną mechanikę albo działają tylko w pakiecie:

| ID | Nazwa | Stan | Powód |
|---|---|---|---|
| `plague` | Plague | PARTIAL | Prostszy wariant Venom. |
| `medic` | Medic | PARTIAL | Leczenie pokrywa Vortex Medic; pierwszy do przywrócenia jako prosty lekarz. |
| `shield` | Shield | PARTIAL | Tarczę pokrywa Ward. |
| `magnet` | Magnet | PARTIAL | Przyciąganie pokrywają Harpoon i Gravity Mine. |
| `anchor` | Anchor | PARTIAL | Tylko trzyma pozycję; mało decyzji. |
| `ram` | Ram | PARTIAL | Zwykły mocny cios; bonus do konstrukcji bez znaczenia przy jednej konstrukcji w puli. |
| `cleanser` | Cleanser | PARTIAL | Oczyszczanie pokrywa Ward. |
| `splitter` | Splitter | PARTIAL | Rodzina podziału; patrz Mitosis. |
| `replicator` | Replicator | PARTIAL | Rodzina przywołań; patrz Hatchery. |
| `assimilator` | Assimilator | PARTIAL | Rozprzestrzeniająca się przemiana; ryzyko lawiny i balansu. |
| `engineer` | Engineer | PARTIAL | Wymaga puli konstrukcji. |
| `brood` | Brood Core | PARTIAL | Rodzina przywołań; patrz Hatchery. |
| `requiem` | Requiem | READY | Obszarowy wariant Deathcast. |
| `deathpulse` | Death Pulse | PARTIAL | Odepchnięcie po śmierci; pokrywa Pulse. |
| `frostgrave` | Frostgrave | PARTIAL | Zamrożenie po śmierci; pokrywają Frost i Frost Trap. |
| `plagueburst` | Plagueburst | PARTIAL | Trucizna po śmierci; pokrywają Venom i Tox Pool. |
| `chainfrost` | Chain Frost | PARTIAL | Kolejny nakładacz lodu. |
| `bastion` | Bastion | PARTIAL | Dawca tarczy; pokrywa Ward. |
| `swarmcore` | Swarm Core | PARTIAL | Rodzina podziału; patrz Mitosis. |
| `repairpulse` | Repair Pulse | PARTIAL | Wymaga puli konstrukcji. |
| `doppelganger` | Doppelgänger | PARTIAL | Kopiowanie typu; patrz Mimic. |
| `paradox` | Paradox | READY | Bardzo podobny do Rewind. |
| `commander` | Commander | PARTIAL | Pakiet armii Standardów; działa tylko z resztą pakietu. |
| `armorer` | Armorer | PARTIAL | Pakiet armii Standardów. |
| `quartermaster` | Quartermaster | PARTIAL | Pakiet armii Standardów. |
| `conscriptor` | Conscriptor | PARTIAL | Pakiet armii Standardów. |
| `wildfire` | Wildfire | READY | Ogień po śmierci; pokrywają Bonfire i Furnace. |
| `ashcore` | Ash Core | PARTIAL | Niszowe wykończenie ognia. |
| `soulburst` | Soulburst | READY | Obrażenia po śmierci; pokrywa Bonfire. |
| `resurrector` | Resurrector | PARTIAL | Wskrzeszanie pokrywa Reviver. |
| `necromancer` | Necromancer | PARTIAL | Wskrzeszanie pokrywa Reviver. |
| `embertrap` | Ember Trap | READY | Bliźniak Frost Trap (ogień). |
| `sporetrap` | Spore Trap | READY | Bliźniak Frost Trap (trucizna). |
| `pyrecore` | Pyre Core | PARTIAL | Strefa ognia; strefę pokrywa Tox Pool. |
| `blizzardcore` | Blizzard Core | PARTIAL | Strefa lodu; strefę pokrywa Tox Pool. |
| `barricade` | Barricade | PARTIAL | Konstrukcja; patrz Wallmaker. |
| `eggsac` | Egg Sac | PARTIAL | Rodzina przywołań. |
| `kindler` | Kindler | PARTIAL | Lżejszy wariant Fire. |
| `firebrand` | Firebrand | PARTIAL | Obszarowy wariant Fire. |
| `rimeburst` | Rimeburst | PARTIAL | Wariant Shatterer. |
| `packheart` | Packheart | READY | Wymaga pakietu powrotów (RETURN). |
| `gravehide` | Gravehide | READY | Wymaga pakietu powrotów (RETURN). |
| `vinehook` | Vinehook | READY | Przyciąganie pokrywa Harpoon. |
| `briarheart` | Briarheart | READY | Wykończenie dla Webber; pierwsza do przywrócenia, jeśli unieruchomienie potrzebuje nagrody. |
| `absolver` | Absolver | READY | Pakiet oczyszczania; pokrywa Ward. |
| `consecrator` | Consecrator | READY | Pakiet oczyszczania; pokrywa Ward. |
| `penitent` | Penitent | READY | Pakiet oczyszczania; niszowy. |
| `vector` | Vector | READY | Pakiet trucizny; działa tylko przy wielu zatrutych. |
| `septiccore` | Septic Core | READY | Pakiet trucizny; próg trudny do odczytania. |
| `horizonrelay` | Horizon Relay | READY | Zależy wyłącznie od Singularity. |

### Warunki przywrócenia z zamrażarki

Kulka wraca do puli aktywnej, gdy spełnia wszystkie:

1. Status `UNITY_READY` w rejestrze (zdolność działa i ma testy zarządzane).
2. Sprawdzona w Windows Playerze w zwykłym meczu.
3. Wnosi mechanikę lub rolę, której nie ma w puli, albo zastępuje konkretną aktywną kulkę.
4. Ma ikonę i nazwę wyświetlaną w języku W21.
5. Jeśli zależy od innych typów (pakiety: Standardy, RETURN, oczyszczanie, trucizna, konstrukcje) — wraca razem z nimi.
6. Decyzja właściciela.

## Projekt zamrażarki (najprostszy bezpieczny wariant)

**Zasada:** katalog pozostaje nietknięty. Dochodzi jedna lista dozwolonych ID i jedna polityka meczu.

1. **Dane:** nowy plik `Assets/Resources/Data/roster.json` z listą `active` (ID) i `rework`. Wszystko spoza listy = zamrożone; typy `hidden` = INTERNAL. `catalog.json`, ID, definicje i zdolności bez zmian.
2. **Odczyt:** `Catalog.IsActive(id)`. `Catalog.Ball(id)` nadal zwraca każdy typ, więc stare stany, powtórki i odwołania do zamrożonych ID dalej się rozwiązują.
3. **Polityka meczu:** `RosterPolicy { All, ActiveOnly }` jako parametr `GameSimulation`, domyślnie `All`. Istniejące testy, self-play i powtórki nie podają parametru, więc zachowują się bit w bit jak dziś. Nowy mecz z menu gry startuje z `ActiveOnly`.
4. **Miejsca, które muszą respektować pulę** (sprawdzone w kodzie):
   - wybór w kreatorze talii — `RosterReadiness.Visible` (Presentation);
   - lista gotowych talii — pokazywać tylko talie złożone w całości z aktywnych typów;
   - **losowa transformacja Wildcard** — `RealityEffects.cs:38`, dziś losuje ze wszystkich nieukrytych, także DATA_ONLY;
   - **losowy powrót Revenanta** — `LifecycleEffects.cs:124`, ta sama pula. (Poprawka po wdrożeniu: to losowanie należy do Revenanta. Genesis tworzy tylko strefę białej dziury i w Unity nie losuje jeszcze kulek.)
   To jedyne dwa losowania typu w `Core`. Mimic, Doppelgänger, Assimilator, Collector, Echo i wskrzeszenia biorą typy tylko z kulek obecnych w meczu, więc przy aktywnych taliach nie wprowadzą zamrożonych.
5. **Tryb deweloperski:** istniejący przełącznik deweloperski ustawia `All` i pokazuje zamrożone typy z plakietką FROZEN.
6. **Testy:** każde ID z listy istnieje w katalogu; każda gotowa talia w normalnym trybie jest legalna; przy `ActiveOnly` tysiące losowań Wildcard nie daje zamrożonego typu; przy `All` obecne 515 testów bez zmian.

### Szczególne przypadki i otwarte punkty

- **Ograniczenie puli losowań zmienia wynik symulacji.** Dlatego jest polityką meczu, a nie globalnym filtrem: powtórka nagrana przy `All` musi być odtwarzana przy `All`. Format powtórek trzeba sprawdzić przed wdrożeniem (czy da się zapisać politykę bez zmiany formatu).
- **Sieć / Protocol149:** polityka nie trafia do `GameState` ani do protokołu. Do potwierdzenia przy wdrożeniu: czy klient sam nie wykonuje losowań typu (jeśli tak — obie strony muszą mieć tę samą politykę i potrzebna jest decyzja kontraktowa).
- W proponowanej puli Wildcard i Genesis są zamrożone, więc filtr losowań jest na razie zabezpieczeniem, nie zmianą zachowania.
- **Deathcast** działa tylko na typy z listy efektów DEATH; aktywne z niej to Bomb, Bonfire, Cascade, Singularity.
- **Shatterer** wymaga źródła zamrożenia (Frost, Frost Trap) — oba aktywne.
- **Horizon Relay, Packheart, Gravehide** zależą od zamrożonych/pakietowych mechanik i wracają tylko razem z nimi.
- **Mitosis V148, Furnace FIRE-only, HP R16, Replay:** nietknięte; Furnace wchodzi do puli bez zmian zasad.
