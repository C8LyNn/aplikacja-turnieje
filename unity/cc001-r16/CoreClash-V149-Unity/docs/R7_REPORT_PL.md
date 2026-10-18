# Core Clash V149 R7 — połączenia i przygotowanie publikacji

Kontynuacja R6: dopracowane komunikaty przy dołączaniu przez internet, rzeczywiste testy cyklu sesji i osobna paczka WebGL do hostingu. Wspólna fizyka, gameplay, UI/input, pełny roster, wszystkie decki kanoniczne i cztery dodatkowe CLASS DEMO są zachowane. R7 nie dodaje ani nie balansuje umiejętności.

## DONE

- Pełny pokój wyświetla informację o dwóch graczach. Niedozwolone znaki kodu dają instrukcję skopiowania aktualnego kodu. Przypięty SDK MPS 2.2.4 gubi typ tych błędów; poprawka rozpoznaje wyłącznie odtworzone szczegóły i zwraca stały tekst, zachowując bezpieczny komunikat dla innych problemów.
- **140/140 testów C#**, w tym dwie nowe regresje obserwowane najpierw jako błędne; **13/13 testów ramek sieciowych**.
- **14 kontroli prawdziwej sesji Cloud/Relay**: normalny link, pełny pokój, zwolnienie miejsca, ponowienie tym samym graczem, błędny/nieistniejący kod, anulowanie z późną odpowiedzią, ponowne dołączenie, utrata hosta i lokalny strzał po odzyskaniu sterowania. Test anulowania zatrzymuje rzeczywistą odpowiedź HTTP 200 usługi, anuluje w UI i dopiero ją dostarcza; sprawdza opuszczenie członkostwa oraz brak późnego startu Relay. Nie fabrykuje odpowiedzi sukcesu.
- Osobny test Relay potwierdza synchronizację, legalne komendy oraz odrzucenie podszycia pod P1 i duplikatu. LAN sprawdzony rzeczywistym UDP, klientem natywnym i zaproszeniem WebGL. Wszystkie te testy odbyły się na jednym PC.
- Nowy renderowany build Windows ukończył pełny mecz: **51 strzałów, 50 tur, zero motion guards**. Normalny pointer rozpoczyna mecz; fixture przyspiesza późniejszą symulację.
- **30 kontroli telefonu / 21 zrzutów** nowego WebGL: wybór decków, biblioteka, builder, multiplayer, prawdziwe zdarzenia dotykowe przeglądarki, anulowanie gestów, profile i safe area. Obejrzano arkusze zrzutów i nowe komunikaty. Pełna macierz ośmiu konfiguracji z R6 pozostaje wcześniejszym dowodem niezmienionego kodu UI; nie była ponownie uruchamiana w całości w R7.
- Windows, WebGL i Android zbudowane: **0 błędów / po 1 ostrzeżeniu ServicesCore Editor-link/login**. Runtime Project ID i prawdziwe usługi ponownie potwierdzone. APK ARM64/IL2CPP ma zweryfikowany podpis i siedem kontroli pakietu.
- Osobna paczka **CoreClash-V149-WebGL-R7-Hosting.zip**: siedem plików gotowego builda i manifest, bez dodatkowego katalogu nadrzędnego. Wszystkie osiem wpisów porównano SHA256 z plikami źródłowymi paczki.
- Weryfikator publikacji: **11/11 kontroli** obejmujących m.in. stary plik, błędny MIME, brak zasobu, HTML zamiast WASM i niedziałający adres katalogu. Ostatnią lukę wykrył niezależny przegląd; regresja najpierw zawiodła, a po poprawce przeszła. Końcowy weryfikator sprawdził też wszystkie siedem rzeczywistych plików pod lokalnym katalogiem wersji, bez błędów i ostrzeżeń.

## PARTIAL / NOT TESTED / NOT YET PORTED

Publikacja jest przygotowana, ale **strona nie została opublikowana**: nie podano jeszcze docelowego adresu ani dostępu do hostingu. Instrukcja: [R7_WEB_PUBLICATION_PL.md](R7_WEB_PUBLICATION_PL.md). Pole `browserGameUrl` pozostaje puste; host może udostępniać kod, a po poznaniu adresu użyć pola Advanced lub przebudowanej konfiguracji.

ADB nie wykryło podłączonego urządzenia Android. **Fizyczny Android/telefon/tablet, Safari/iOS, prawdziwy cross-NAT i opóźnienia/utrata pakietów pozostają NOT TESTED.** Wersja Android jest zbudowana i sprawdzona jako pakiet. Plan sprzętowy: [R7_DEVICE_ACCEPTANCE_PL.md](R7_DEVICE_ACCEPTANCE_PL.md). Test braku kodu nie potwierdza czasu automatycznego wygasania sesji po nagłym zamknięciu hosta.

Zakres umiejętności bez zmian: **32 UNITY_READY / 32 PARTIAL / 163 DATA_ONLY / 0 NOT_PORTED**. Host wybiera oba decki; brak migracji hosta i rezerwacji konta po zerwaniu sesji. R6 ZIP i wcześniejsze dowody pozostają zachowane.

## Dowody i odtworzenie

`Evidence/r7-internet-lifecycle.json`, `r7-internet-smoke.json`, `r7-lan/lan-runtime.json`, `r7-native/r6-native-runner.json`, `r6-webgl-r7-phone-smoke.json`, `r7-web-deploy-tests.json`, `r7-web-host-local.json`, `r7-web-archive.json`, `r7-cloud-status.json`, `r7-device-availability.json` oraz końcowy `delivery-manifest.json`. Manifest porównuje wszystkie źródła Assets/Packages/ProjectSettings do R6 i dopuszcza tylko adapter błędów oraz jego wpięcie w sesję.

```powershell
dotnet run --project Tests/CoreClash.Tests.csproj -- .
node Tests/web-release-test.cjs
node Tools/r7-internet-lifecycle.cjs
node Tools/r6-internet-smoke.cjs --tag=r7
node Tools/lan-runtime-smoke.cjs --output=Evidence/r7-lan
./Tools/r6-native-smoke.ps1 -VisiblePlayer -OutputDirectory Evidence/r7-native
node Tools/r6-webgl-smoke.cjs --only=phone-portrait --tag=r7-phone
node Tools/verify-android.cjs
node Tools/r7-seal-delivery.cjs
```
