# Core Clash V149 R6 — urządzenia i crossplay

Wspólna gra C# z interfejsem dopasowanym do PC, telefonu i tabletu. WebGL rozpoznaje rodzaj urządzenia; przeglądarka nie oznacza osobnych zasad. Fizyka, kod umiejętności, pełny roster, 36 decków kanonicznych i cztery dodatkowe decki CLASS DEMO pozostają niezmienione względem R5.

| Obszar | Wynik i granice |
| --- | --- |
| PC | Mysz, klawiatura 1–9 / 0 / I, skalowane okno i zachowane inspekcje. Rzeczywisty renderowany mecz Windows przeszedł. |
| Telefon | Obsługa pierwszego palca, celowanie bez przejęcia przez drugi dotyk, duże przyciski, pozioma lista kul w pionie, panel boczny w poziomie. Krótsze panele przewijają się. |
| Tablet | Większa arena, siatka kul i panele w obu orientacjach. Wspólne dane i pole gry. |
| WebGL | Responsywne okno, safe area, wybór profilu Auto / PC / Phone / Tablet, pełny ekran z widocznym Exit. Zmiana okna, profilu lub użycie paska przeglądarki anuluje rozpoczęte celowanie. |
| Internet | Podany Project ID zapisany w buildach. Rzeczywiste Authentication + Sessions + Relay WSS: Windows host i WebGL klient wymieniają stan i komendy. Test wykonano na jednym komputerze. |
| LAN | Automatyczne pokoje dla natywnych klientów i zwykły link przeglądarkowy. IP/port tylko w Advanced. Testowane rzeczywistymi procesami i gniazdami na jednym komputerze. |
| Android | ARM64 / IL2CPP APK zbudowany i zweryfikowany; brak testu na fizycznym urządzeniu. |

Host rozstrzyga fizykę i sprawdza właściciela gracza, turę, sekwencję oraz poprawność komendy. Klient odbiera wynik. Nie uruchamiamy niezależnej deterministycznej fizyki na różnych urządzeniach. Zmiana profilu interfejsu nie zmienia siły strzału, danych kul ani protokołu rozgrywki.

## Dowody

- `Evidence/unity-tests.json`: **138/138** testów, w tym identyczna komenda strzału po przeliczeniu współrzędnych PC/telefon, gęstość pikseli, safe area, kolejność palców i małe ekrany poziome. Cztery pełne mecze z deployem wszystkich dziewięciu kul: `unity-featured-matches.json`.
- `network-codec-tests.json`: 13 kontroli ramek, kompresji i ograniczeń.
- `r6-native-runner.json` i `r6-native-runtime.json`: rzeczywisty render, celowanie, portale, inspekcja i pełny mecz Windows; sześć zrzutów.
- `r6-webgl-smoke.json`: końcowe wyniki ośmiu konfiguracji, zrzuty i hashe dokładnie testowanych plików. Myszy i dotyk używają zwykłego interfejsu; brak wstrzykiwania stanu gry przez harness.
- `r6-internet-smoke.json`: rzeczywista sesja Unity Cloud / Relay, strzały i synchronizacja; odrzucenie spoofingu właściciela i duplikatu.
- `lan-runtime.json`, `lan-plain-invitation.json`, `lan-rejoin.json`, `r6-lan-recovery.json`: wyszukiwanie, link bez flag debugowych, zmiana klienta P2, nieudane połączenie, ponowienie, utrata hosta, anulowanie i powrót do lokalnego meczu.
- `android-package.json`: siedem kontroli APK, w tym ABI, IL2CPP, uprawnienie INTERNET i podpis. Trzy `build-*.json`: sukces, zero błędów, po jednym jawnym ostrzeżeniu ServicesCore dotyczącym logowania/powiązania w Editorze. Runtime został sprawdzony rzeczywistym połączeniem.
- `r6-gameplay-reference.json`: kod Core/Physics i dane rosteru/decków bez zmian; certyfikowany V148 HTML ma ten sam SHA256.

Przegląd kodu wykrył ucinanie przycisków na małych telefonach w poziomie. Poprawka ma regresje dla 667×325, 568×270 i 844×340. Test rzeczywistego fullscreen wykrył możliwość zwolnienia starego celowania po użyciu paska HTML bez zmiany rozdzielczości; jawne anulowanie inputu naprawia tę ścieżkę.

## PARTIAL / NOT TESTED / NOT YET PORTED

Fizyczny Android, iPhone/iPad/Safari, dotyk sprzętowy, mecz między różnymi sieciami/NAT, opóźnienia/utrata pakietów i publiczna strona HTTPS wymagają osobnych testów. Pełny roster jest dostępny jako dane; statusy umiejętności pozostają **32 UNITY_READY / 32 PARTIAL / 163 DATA_ONLY**. R6 nie poszerza implementacji umiejętności ani nie zmienia balansu. Host wybiera oba decki; nie ma migracji hosta ani rezerwacji konta po utracie połączenia.

Windows host: **MULTIPLAYER → CREATE GAME → INTERNET**. Drugi gracz: **JOIN GAME → INTERNET**, kod od hosta. Dla wspólnej sieci obie strony wybierają **SAME WI-FI / LAN**. Publiczny adres WebGL trzeba wpisać w `network-settings.json`; konfiguracja nie zawiera wymyślonej domeny. Instrukcje Cloud: `R6_UNITY_CLOUD_SETUP_PL.md`.
