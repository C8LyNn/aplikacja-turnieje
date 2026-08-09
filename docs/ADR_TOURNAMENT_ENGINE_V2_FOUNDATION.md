# ADR: fundament silnika turniejowego v2

## Status

Przyjęty jako model równoległy. Ten etap nie przełącza runtime, bazy danych,
OpenAPI ani interfejsu z istniejącego systemu etapów v1.

## Cel

Obecny model v1 opisuje linię 1–3 etapów i łączy w konfiguracji etapu format,
kwalifikację oraz sposób przekazania seedów. Jest wystarczający dla wdrożonych
scenariuszy, ale nie może bezpiecznie reprezentować między innymi:

- kilku wejść do jednego etapu;
- kilku wyjść z etapu;
- koszyków zaczynających turniej w różnych miejscach;
- Last Chance Qualifier i innych ścieżek drugiej szansy;
- etapu klasyfikującego wszystkich bez eliminacji;
- oddzielnego wyliczania klasyfikacji, nowych seedów i pozycji w drabince;
- docelowych formatów, takich jak double elimination, GSL, repechage czy
  drabinki klasyfikacyjne.

Pierwsza paczka v2 tworzy neutralny kontrakt domenowy i adapter z poprawnego
planu v1. Nie implementuje jeszcze wykonywania grafu.

## Decyzje

### 1. Plan turnieju jest grafem acyklicznym

`TournamentBlueprintV2` składa się z:

- koszyków wejściowych;
- definicji etapów;
- przejść między rejestracją, wynikami etapów i następnymi etapami.

Graf na poziomie etapów pozostaje acykliczny. Wewnętrzne ścieżki formatów,
na przykład górna i dolna drabinka double elimination, należą do handlera
formatu i nie tworzą cyklu między etapami.

### 2. Format nie steruje przepływem całego turnieju

`TournamentStageDefinitionV2` określa:

- pojemność etapu;
- referencję formatu i wersję jego reguł;
- reguły meczu;
- sposób tworzenia klasyfikacji.

Format nie wybiera samodzielnie etapu docelowego i nie zapisuje nowych seedów.

### 3. Klasyfikacja, kwalifikacja, seed i placement są rozdzielone

`StageResultV2` zawiera wyłącznie klasyfikację wygenerowaną przez format.

`StageTransitionV2` określa niezależnie:

1. źródło uczestników;
2. etap i opcjonalny punkt wejścia;
3. regułę wyboru uczestników;
4. regułę nadania nowych seedów;
5. regułę umieszczenia seedów w grupach albo drabince;
6. opcjonalną rezerwację slotów.

Wynik oceny przejść jest zapisywany jako `StageRoutingResultV2`, dzięki czemu
kwalifikacja nie mutuje klasyfikacji etapu.

### 4. Dokładna pozycja nie zawsze istnieje

`StageStandingV2.rankBand` przechowuje przedział pozycji. Pozwala to poprawnie
reprezentować na przykład miejsca 3–4 albo 5–8 w drabince bez meczów
klasyfikacyjnych. Dodatkowe reguły mogą później rozstrzygnąć kolejność wewnątrz
pasma na potrzeby seedowania.

### 5. Pojemność może być dokładna albo elastyczna

Etap może mieć:

- dokładną liczbę uczestników;
- zakres minimum–maksimum z wartością preferowaną.

V1 jest mapowane wyłącznie na pojemności dokładne. Zakresy zostaną wykorzystane
przez przyszły planer i formaty obsługujące dowolną liczbę uczestników.

### 6. Rozszerzalność przez referencje polityk

Model zawiera podstawowe reguły typowane, ale pozwala wskazać wersjonowaną
politykę przez `policy_ref`. Dzięki temu nowe kryterium lub historyczna logika
kompatybilności nie wymagają natychmiastowego rozszerzania wszystkich tabel i
kontraktów publicznych.

Każda referencja polityki będzie musiała zostać obsłużona przez jawny rejestr
handlerów przed uruchomieniem turnieju.

## Walidacja fundamentu

`validateTournamentBlueprintV2` obecnie sprawdza:

- wersję modelu;
- dodatnią liczbę uczestników;
- obecność co najmniej jednego koszyka i etapu;
- unikalne klucze;
- pojemności etapów od dwóch uczestników, BO i wersje reguł;
- istnienie źródeł i celów przejść;
- dodatnie limity i rezerwacje;
- brak przejść etapu do samego siebie;
- brak przekroczenia maksymalnej pojemności przez zarezerwowane sloty;
- wejście do każdego etapu;
- osiągalność każdego etapu od rejestracji;
- brak cyklu między etapami.

Walidator celowo nie ocenia jeszcze semantyki konkretnych handlerów formatów,
metryk rankingowych ani pełnego bilansu liczby uczestników dla reguł
warunkowych. Będzie to osobna warstwa walidacji wykonawczej.

## Kompatybilność z v1

`adaptV1StagePlanToV2`:

1. uruchamia istniejący walidator v1;
2. tworzy domyślny koszyk wszystkich uczestników;
3. mapuje etapy v1 na węzły v2;
4. mapuje liniowy przepływ v1 na przejścia v2;
5. oddziela wybór kwalifikantów, seedowanie i placement;
6. waliduje wynikowy blueprint v2.

Historyczne cross-seeding grup v1 pozostaje jawną referencją polityki
`legacy_group_cross_seed_v1` oraz placementu `legacy_group_playoff_slots_v1`.
Adapter nie próbuje zmieniać istniejącego zachowania.

## Brak zmian runtime w tej paczce

Ta paczka nie zmienia:

- schematu ani migracji bazy danych;
- endpointów i OpenAPI;
- istniejącego lifecycle etapów;
- generatorów meczów;
- obecnego kreatora turnieju;
- backupów;
- danych już zapisanych w systemie.

Nowy model jest używany wyłącznie przez testy domenowe i adapter. Następna
paczka może rozpocząć implementację elastycznej fazy grupowej dopiero po
zatwierdzeniu tego kontraktu.

## Kryteria akceptacji

- istniejące testy v1 nadal przechodzą bez zmian zachowania;
- nowy model reprezentuje prosty turniej: jeden koszyk i jeden etap;
- model reprezentuje kilka wejść do jednego etapu z rezerwacją slotów;
- wynik etapu jest oddzielony od routingu, seedowania i placementu;
- poprawne plany v1 mogą zostać bezstratnie opisane jako blueprint v2;
- błędne grafy są odrzucane przez czysty walidator domenowy.
