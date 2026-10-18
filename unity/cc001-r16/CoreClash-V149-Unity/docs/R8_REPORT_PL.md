# Core Clash V149 R8 — kolejne mechaniki z HTML

Aktualizacja lokalna z 17.10.2026, zgodna z prośbą o rozwijanie Unity w kierunku prototypu HTML. Dodaje działanie trzech istniejących kul oraz ich czytelne efekty. Zachowuje pełny roster, dane/statystyki, 36 talii kanonicznych i cztery dokładne, wymienne presety CLASS DEMO. Nie synchronizuje ani nie publikuje strony Replit.

## DONE

| Kula | Działanie w Unity R8 | Jak znaleźć w istniejących taliach |
| --- | --- | --- |
| Pinballer | STOP tworzy bumper przy krawędzi: promień 20, pięć HP, odbicie 1,42. Przyjazne kule nie zużywają wytrzymałości. Bumper pozostaje po śmierci twórcy; globalny limit to 14 żywych konstrukcji. Widać obwódkę i licznik B5/B4… | Twierdza · Inżynieria lub Twierdza · Umocnienia |
| Slingshot | STOP zbiera pobliskich sojuszników i wyrzuca ich zgodnie z ostatnim kierunkiem ruchu, z niewielkim rozrzutem. Nie zużywa zapasu ani kolejnej komendy gracza. Unieruchomieni/zamrożeni sojusznicy nie są przemieszczani; nielegalne pozycje są pomijane. | Wiatr · Pęd, Wiatr · Rykoszet lub Wiatr · Natarcie |
| Ram | Pierwszy mocny HIT w przeciwnika w danej akcji daje dodatkowe obrażenia, odrzut celu i ćwiartkowy recoil. Historia użycia jest częścią stanu hosta i zeruje się przy zmianie typu. | Ziemia · Sejsmika |

Wszystkie trzy można wybrać także w normalnym builderze. Nie utworzono kolejnej talii produktowej ani nie zmieniono czterech pokazowych presetów. Echo i Mimic korzystają z tych samych nowych handlerów.

Zachowanie sprawdzono w rzeczywiście uruchomionym V148, nie tylko w opisach: trzy źródłowe próby przechodzą, a SHA256 HTML przed/po pozostaje zgodne z katalogiem. Wykryto m.in. faktyczne pięć HP bumpera, mimo mylącego surowego literału `hits:3`. Narzędzie wstrzykuje wyłącznie tymczasowe haki do odpowiedzi przeglądarki; nie zapisuje źródłowego HTML.

Natywna adaptacja zachowuje sens efektów, bez kopiowania kwantyzacji obrażeń i wymuszonego przestawiania zablokowanych kul z HTML. Nowy późny wyrzut Slingshota otrzymuje osiem sekund na wyhamowanie, najwyżej do 28 sekund całej akcji. Zwykły strzał nadal ma 14 sekund. Poprawkę poprzedził test wykazujący przedwczesne zatrzymanie ruchu. Nie zmieniono rekordów liczbowych kul.

## Weryfikacja

- **158/158 testów C#**, w tym 18 nowych kontroli: rozmieszczenie/przepełnienie/zajętość, własne i wrogie uderzenia, wybór celu, odporność na siłę, ROOT/freeze, zablokowane miejsce, historia Rama, późne wyrzuty, Echo/Mimic i serializacja.
- **Trzy pełne legalne mecze symulacyjne** z testową mieszaną talią obejmującą wszystkie trzy nowe kule: 38, 28 i 17 tur, zero motion guards. Ta talia istnieje wyłącznie w teście. Cztery pełne mecze pokazowych presetów również przechodzą, wszystkie wybrane typy zostały wystawione, zero motion guards.
- **Windows z prawdziwym renderowaniem D3D11**: pełny mecz 51 strzałów / 50 tur / zero motion guards, zakończony wynikiem baz 11–3. Pierwszy strzał przez normalną ścieżkę pointera, dalsza legalna symulacja przyspieszona przez fixture. Dwa dodatkowe obejrzane zrzuty prezentują bumper oraz Ram/Slingshot w ustawionej scenie. Te dwa zrzuty są testem renderera, nie deklaracją ręcznie rozegranego meczu od pustej planszy.
- **Rzeczywisty Unity Relay/WSS Windows → WebGL**: host wykonał strzał Pinballerem, klient otrzymał bumper w stanie gry i wykonał legalny strzał Slingshotem. Odrzucono podszycie pod P1 oraz duplikat komendy. Nie jest to dowód wszystkich wyników zdolności po stronie zdalnego gracza; pozostałe wyniki mają testy C#.
- **LAN**: prawdziwe UDP i klient natywny, następnie Windows WebRoot i klient WebGL z zaproszenia. Testy sieciowe używały osobnych procesów na jednym komputerze.
- **30 kontroli telefonu / 21 zrzutów WebGL**, bez błędów strony: biblioteka/builder/lobby, celowanie dotykiem, anulowanie i wykonanie strzału, zmiana rozmiaru/profilu/fullscreen i safe area. Obejrzano wszystkie cztery arkusze. Dotyk i urządzenia są emulowane. Cała ośmioprofilowa macierz R6 nie była powtarzana.
- **Windows, WebGL i Android: po 0 błędów / 1 ostrzeżeniu** ServicesCore Editor-link/login. Dostęp runtime do Cloud jest osobno potwierdzony rzeczywistą sesją. Android ARM64/IL2CPP: siedem kontroli pakietu i podpisu; APK nie był instalowany na urządzeniu.
- **13/13 kontroli kodeka sieciowego**, kontrola danych/źródłowego SHA256, kontrola shell oraz **11/11 kontroli narzędzi hostingu**. Ostatnie są testami lokalnych narzędzi, nie nowym audytem lub wdrożeniem strony.
- Niezależny przegląd wykrył brak importu LINQ w narzędziu testowym Unity. Poprawiono go przed końcowymi buildami; nie pozostały zgłoszone materialne uwagi w ocenionym zakresie.

## PARTIAL / NOT TESTED / NOT YET PORTED

**Ram pozostaje PARTIAL.** Opisywany bonus przeciw konstrukcjom jest wyłączony także w badanym źródle (`ramBreak=false`); nie dorobiono zdolności, której źródłowy runtime nie wykonuje. Pinballer i Slingshot mają UNITY_READY dla sprawdzonych głównych handlerów. To nie oznacza pełnej zgodności z każdym wyjątkiem HTML.

Cały roster: **34 UNITY_READY / 33 PARTIAL / 160 DATA_ONLY / 0 NOT_PORTED**. Featured: nadal **31 UNITY_READY / 5 PARTIAL**. Kopiowanie może trafić na dowolną istniejącą, jeszcze niezaimplementowaną zdolność. Limit konstrukcji, brak wolnego miejsca oraz 28-sekundowy bezpiecznik ograniczają rozbudowane łańcuchy; nie obiecuje się nieograniczonych kombinacji.

**Fizyczny Android/telefon/tablet, Safari/iOS, dwa fizyczne urządzenia LAN, osobne sieci/cross-NAT i długotrwałe testy obciążenia pozostają NOT TESTED.** Historyczne R6 testy odzyskiwania połączenia i R7 cyklu Cloud nie były powtarzane w całości w tym etapie.

**Strona publiczna nie została zmieniona.** Podany adres Replit działa ze starszym buildem; wcześniejszy osobny audyt wykazał problemy z przekazywaniem zaproszeń i ścieżkami statycznymi. Nie należy zakładać zgodności starszej strony z lokalnym R8. Publikacja i integracja adresu wymagają osobnego zatwierdzenia.

## Pliki i odtworzenie

Aktualna paczka lokalna: `C:/Users/kubap/Desktop/CoreClash-V149-ClassDemo-R8.zip`. Gra Windows: `Builds/Windows/CoreClash.exe`; WebGL: `Builds/WebGL`; Android: `Builds/Android/CoreClash.apk`. Windows wymaga całego sąsiedniego folderu danych i WebRoot.

Główne dowody: `Evidence/r8-source-mechanics.json`, `r8-momentum-matches.json`, `unity-tests.json`, `unity-featured-matches.json`, `r8-native/`, `r8-native-html/`, `r8-internet-smoke.json`, `r8-lan/lan-runtime.json`, `r6-webgl-r8-phone-smoke.json`, `android-package.json`, `r8-cloud-status.json`, `delivery-manifest.json`. `r8-motion-investigation.json` zachowuje historyczny ślad błędu z fazy diagnostyki; nie jest końcowym wynikiem regresji. Manifest R7 i raporty jego buildów zachowano osobno.

Polecenia końcowej weryfikacji są w BUILD_STATUS.md. `Tools/r8-seal-delivery.cjs` sprawdza dowody i hashe aktualnych plików, porównuje drzewo źródeł z R7, dopuszcza tylko opisane zmiany i potwierdza niezmieniony katalog/presety/konfigurację sieci. Archiwum sprawdza `Tools/verify-package.ps1`, porównując każdy wpis z workspace.
