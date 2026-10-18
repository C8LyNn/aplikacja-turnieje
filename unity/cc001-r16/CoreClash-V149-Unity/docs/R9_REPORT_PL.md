# Core Clash V149 R9 — pułapki i trzy różne wyzwalacze

Lokalna kontynuacja z 17.10.2026, zbliżająca Unity do działającego HTML. Mine, Time Bomb i Bomb zachowują różne sposoby aktywacji. Pełny roster, rekordy liczbowe, 36 talii kanonicznych i cztery dodatkowe CLASS DEMO pozostają bez zmian. Nie wykonano synchronizacji ani publikacji Replit.

## DONE — gameplay i dane

| Kula | Zachowanie | Ważne ograniczenie |
| --- | --- | --- |
| Mine | STOP uzbraja; późniejszy kontakt wrogiej kuli, także słaby TOUCH, powoduje krótki wybuch i zużycie Mine. Fioletowy pierścień i ARM pokazują stan. | Własne kule nie uruchamiają pułapki, ale wybuch trafia obie drużyny. Frost rozbraja przed kontaktem, również przy szybkim wejściu między krokami fizyki. Replay rozbraja do następnego STOP. |
| Time Bomb | STOP uzbraja licznik FUSE2 → FUSE1; drugi początek własnej tury powoduje wybuch MEDIUM i zużycie kuli. | Kontakt nie uruchamia wybuchu. Każdy kolejny STOP zeruje odliczanie. Zniszczenie przed końcem licznika zapobiega wybuchowi. Powtórzenie callbacku w tej samej turze nie skraca licznika; zakłócenie może pominąć jego aktywację. |
| Bomb | Wybucha przy STOP, a jeśli wcześniej zginie — przez DEATH. Rzeczywista detonacja zużywa kulę dokładnie raz. | Friendly fire: obrażenia i odrzut dotyczą obu drużyn. Agony/Requiem mogą powtarzać DEATH żywej Bomb bez jej zużycia; faktyczny STOP nie dokłada drugiego wybuchu DEATH. |

Wszystkie trzy występują w zachowanej talii **Polowanie · Ładunki**, dostępnej przez **ALL DECKS / DECK BUILDER**. Można je też wybierać osobno w builderze. Nie dodano nowego presetu produktowego.

Kontakt Mine jest rozstrzygany dla obu uczestników przed kopiowaniem i zamianą ownership. Dzięki temu starszy identyfikator Mimica/Traitora nie pozwala ominąć uzbrojonej pułapki, a dwie wrogie uzbrojone miny mogą uruchomić oba wybuchy. Wyzwalacze są zużywane przed obrażeniami obszarowymi, co zabezpiecza przed podwójną detonacją. Transformacja czyści historię wybuchu i licznik; nowa skopiowana Time Bomb wymaga własnego uzbrojenia.

Sześć prób w rzeczywistym V148 potwierdza uzbrojenie/kontakt Mine, ignorowanie własnych kul, rozbrojenie Frost, dwie własne tury Time Bomb oraz oba wyzwalacze Bomb i friendly fire. HTML nie został zapisany ani zmieniony — narzędzie dodaje haki tylko do odpowiedzi przeglądarki i sprawdza SHA256 przed/po. Unity zachowuje sens zdolności i natywną architekturę obrażeń/fizyki; nie deklaruje zgodności klatka po klatce.

## Weryfikacja gameplayu

- **180/180 testów C#**, czyli 22 nowe kontrole względem R8. Obejmują arming, rozdzielenie triggerów, friendly fire, szybki Frost, oba porządki Mimic/Traitor, dwie miny, replay, zniszczenie przed czasem, jam, powtórzony tick, Echo/Agony/Mimic, snapshoty i zamknięcie długiej akcji.
- **Trzy pełne legalne mecze symulacyjne** nowej mieszanej talii testowej: 50, 25 i 43 tury. Wszystkie trzy nowe kule wystawiono w każdym meczu; zarejestrowano rzeczywiste wybuchy. Liczba guardów: **1 / 0 / 0**. Talie testowe nie są presetami gry.
- Jeden długi łańcuch Echo–Slingshot osiąga istniejący limit 28 sekund. Limit zachowano. Nowa regresja, najpierw błędna, potwierdza pojedyncze zdarzenie guard i natychmiastowe zakończenie tej akcji zamiast powielania komunikatu przez wiele klatek.
- Cztery pełne mecze featured oraz trzy mecze regresji momentum R8 również przechodzą, z zerem guardów w tych siedmiu scenariuszach. Nie jest to certyfikacja wszystkich możliwych kombinacji.
- **13/13 testów kodeka**, kontrola importu i źródłowego SHA256 oraz kontrola shell. Nie powtarzano niezmienionego zestawu narzędzi publikacji ani całego R7 cyklu Cloud.
- Niezależny przegląd wykrył zależność miny od kolejności callbacków. Po naprawie i dodaniu regresji przegląd nie zgłosił dalszych materialnych uwag w ocenionym zakresie.

## Buildy i wykonanie

- **Windows, WebGL i Android zbudowane:** po 0 błędów / 1 ostrzeżeniu ServicesCore Editor-link/login. Runtime Cloud potwierdzono oddzielnie. Finalne buildy zawierają krótsze, mieszczące się podpisy kart; mechanika nie zmieniła się przy tej korekcie.
- **Renderowany Windows D3D11:** pełny mecz 51 strzałów / 50 tur, wynik baz 11–3, zero guardów. Pierwszy strzał przez normalną ścieżkę pointera, potem legalne komendy i przyspieszona symulacja. Trzy dodatkowe obejrzane obrazy pokazują Mine ARM, FUSE2 → FUSE1 i wybuchy; to ustawiona scena testowa, nie ręczny mecz od pustej planszy.
- **Rzeczywisty Relay/WSS:** host wykonał legalny strzał Mine, WebGL legalny Time Bomb. Oba procesy potwierdziły żywą uzbrojoną Mine i fuse=2, odrzucając podszycie pod P1 oraz duplikat. To test stanu uzbrojenia, nie pełnej zdalnej sekwencji odliczania/detonacji.
- **LAN:** prawdziwe UDP z klientem natywnym oraz Windows WebRoot z zaproszeniem do WebGL. Wszystkie testy sieciowe wykonały się na jednym komputerze.
- **Telefon WebGL:** 30 kontroli / 21 zrzutów, zero błędów strony. Obejrzano cztery arkusze: setup, builder, lobby, dotykowe celowanie/anulowanie/strzał, profile, resize/fullscreen i safe area. To emulacja; pełnej ośmioprofilowej macierzy nie powtarzano.
- **APK ARM64/IL2CPP:** siedem kontroli zawartości i poprawny podpis. Brak instalacji/uruchomienia na urządzeniu.

Źródła i aktualne bajty buildów są powiązane z tymi raportami w Evidence/delivery-manifest.json. Manifest zachowuje jedną obserwowaną interwencję bezpiecznika jako jawne ograniczenie, nie ukrywa jej w zbiorczym wyniku testów.

## PARTIAL / NOT TESTED / NOT YET PORTED

Roster: **37 UNITY_READY / 32 PARTIAL / 158 DATA_ONLY / 0 NOT_PORTED**; featured nadal **31 / 5**. UNITY_READY oznacza sprawdzony główny handler, nie wszystkie historyczne wyjątki i pasywy. Kopiowanie z pełnego rosteru nadal może dać niezaimplementowaną moc. Ram pozostaje PARTIAL; źródłowy wyłączony bonus na konstrukcje nie został dorobiony.

Długie samonapędzające się kombinacje mogą zostać przerwane bezpiecznikiem 28 sekund; nie obiecuje się nieskończonych łańcuchów. Rozbrojenie Mine przez Frost jest zaimplementowane, ale nie ma deklaracji pełnego pokrycia każdego historycznego narzędzia usuwającego pułapki.

**Fizyczne telefony/tablety, Android runtime, Safari/iOS, dwa fizyczne urządzenia LAN, osobne sieci/cross-NAT i długie obciążenie pozostają NOT TESTED.** Test przeglądarkowy na jednym PC nie potwierdza tych konfiguracji.

Publiczna strona nadal zawiera starszy build. R9 nie jest opublikowane, a problemy przekazywania zaproszeń/ścieżek wykryte we wcześniejszym osobnym audycie nie zostały poprawione na hostingu. Nie należy zakładać zgodności lokalnego R9 ze starszą stroną.

## Artefakty

Projekt: `C:/Users/kubap/Desktop/CoreClash-V149-Unity`. Lokalna paczka końcowa: `C:/Users/kubap/Desktop/CoreClash-V149-ClassDemo-R9.zip`. Windows: `Builds/Windows/CoreClash.exe` z całym katalogiem obok; WebGL: `Builds/WebGL`; Android: `Builds/Android/CoreClash.apk`.

Dowody: `r9-source-explosives.json`, `r9-explosive-matches.json`, `r9-momentum-regression.json`, `unity-tests.json`, `unity-featured-matches.json`, `r9-native/`, `r9-native-html/`, `r9-internet-smoke.json`, `r9-lan/lan-runtime.json`, `r6-webgl-r9-phone-smoke.json`, `android-package.json`, `r9-cloud-status.json` i końcowy `delivery-manifest.json` w Evidence. R8 manifest i raporty buildów zachowano osobno. `Tools/r9-seal-delivery.cjs` sprawdza aktualne hashe oraz dozwolony zakres zmian względem R8. `Tools/verify-package.ps1` porównuje każdy wpis archiwum z workspace.
