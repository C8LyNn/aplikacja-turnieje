# Core Clash V149 Unity — R16

Stan: natywny projekt rozwijany z prawdziwej paczki R15. Wersja gameplay/spec nadal V149. Źródła i lokalne buildy, bez publikacji gry.

## Naprawy

- R15 przyjmował wadliwe zagnieżdżone snapshoty: null zdarzeń/statusów, nieprawidłową geometrię i duplikaty ID. R16 odrzuca je atomowo bez zamiany poprawnego stanu klienta i bez zmiany protokołu.
- Dwa czerwone testy baseline naprawiono zgodnie z rzeczywistym zachowaniem, bez strojenia fizyki. Commander widzi token Quartermastera już w turze jego narodzin, gdy wykonuje się później według ID (tarcza5, następna tura10). Długa kombinacja Slingshotów może poprawnie użyć jednego awaryjnego zakończenia akcji; test wymaga teraz zakończenia meczu i ograniczonych guardów zamiast nierealnego zera.
- R16 QA działa na kopii, zapisuje każdą próbę osobno i wskazuje najnowszą przez latest.json; brak SDK nie może odziedziczyć PASS. BuildTools zapisuje nowe raporty w Evidence/R16/Unity. Historyczne raporty są zachowane bajtowo.

## Dodane mechaniki

| Kulka | Rzeczywiste zachowanie |
|---|---|
| Ember Trap | STOP stawia trwałą pułapkę FIRE, promień14, jeden ładunek na pierwszy dotyk wroga |
| Frost Trap | analogiczna pułapka ICE, korzysta ze wspólnych reguł ICE/FIRE |
| Spore Trap | analogiczna pułapka TOXIN, przygotowuje m.in. payoff Venoma |
| Venom | TOUCH infekuje czysty cel; na zatrutym zadaje5 i leczy siebie o5; clean infection respektuje odporność Plague |
| Shatterer | TOUCH na celu z dwoma ICE lub pełnym freeze zadaje5 i zużywa ICE; pojedynczy ICE nie wystarcza |

Pułapki ignorują sojuszników, phase, banish i martwe cele, zużywają ładunek przed efektem, pozostają po śmierci twórcy, używają bezpiecznego placement i limitu256 żywych stref. Echo może ponowić STOP, Jammer blokuje aktywację. Nie kosztują dodatkowego stocku. Nie zmieniono statystyk katalogu ani członkostwa talii.

Prezentacja: kolor i znaki F1/I1/T1 oznaczają prawdziwy pojedynczy ładunek. Dodatkowe komunikaty pokazują faktyczne statusy, pułapki, przywołania i payoff; brak VFX dla niezrealizowanych mocy.

## Gotowość

42 UNITY_READY / 51 PARTIAL / 134 DATA_ONLY / 0 NOT_PORTED; razem227 rekordów. UNITY_READY awansowały: embertrap, frosttrap, sporetrap, venom, shatterer. Dowody: uruchomiony HTML, testy C#, realny player Unity/kolizje/JsonUtility; nie jest to certyfikat wszystkich możliwych interakcji i platform.

19 wcześniejszych kandydatów ma teraz uczciwe PARTIAL: wallmaker, barricade, repairpulse, engineer, bastion, commander, quartermaster, armorer, splitter, hatchery, replicator, mitosis, swarmcore, conscriptor, firebrand, chainfrost, ashcore, furnace, frostguard. Kompilacja i testy przechodzą, lecz nie wykonano pełnej natywnej macierzy akceptacyjnej każdej z tych mocy. Mitosis ma nadal obsłużony kontakt kulka–kulka; inne cele fizyczne pozostają do decyzji. Frostguard używa masy/tarcia kotwicy, a Furnace zachowuje pole ze wspólnym statusem FIRE zamiast dopisywać dodatkowe obrażenia z opisu karty.

Aktualny rejestr: Evidence/R16/ability-support.json. Główny Evidence/ability-support.json jest niezmienionym historycznym raportem R9; nie używać go jako wyniku R16.

## Testy i platformy

269/269 testów C#; kodek13/13; HTML5/5. Pełny Windows: 51 strzałów, 50 tur, 0 motion guards. R16 testowe mecze: 40 strzałów oraz 24 strzałów, oba bez guardów.
StandaloneWindows64: Succeeded / WebGL: Succeeded / Android: Succeeded. Szczegóły i jawne ograniczenia: R16_QA_PL.md, Evidence/R16/qa-summary.json.

## R17

1. Dwa fizyczne urządzenia: Windows ↔ Android i Windows ↔ WebGL przez różne sieci; latency/jitter, reconnect i długi mecz.
2. Macierz akceptacyjna 19 PARTIAL z R10–R13: konstrukcje i naprawy, Mitosis na różnych colliderach, oddziały generowane przy capach i po zmianie właściciela, Frostguard/Furnace.
3. Następny wąski przyrost według V148: tożsamość/RETURN lub obszarowe statusy; test-first. Nie rozszerzać wszystkich134 DATA_ONLY jednocześnie.
4. Fizyczny phone/tablet UX i testy natywnego APK. Osobna zgoda przed synchronizacją/publikacją strony.
