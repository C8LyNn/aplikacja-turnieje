# R16 — wykonane QA / 18 października 2026

Baseline to rzeczywiście pobrane R15: SHA256 f70497f8be326e34e2f87bbe54c0716294e35887ef5ab9d993a5ae5cade3e21e. Nie lokalne R9. Osobny checkout i gałąź dev/cc-v149-r16.

| Kontrola | Wynik i dowód |
|---|---|
| Integralność wejścia | 435 plików ZIP; 132 chronionych plików bez zmian; Evidence/R16/input-integrity.json |
| Baseline R15 .NET | 243 PASS / 2 FAIL; pełny log próby pod Evidence/R16/Baseline |
| Baseline R15 Unity | import i kompilacja Unity 6000.4.0f1, exit 0 |
| R16 C# | 269 PASS / 0 FAIL; Evidence/R16/Managed/2026-10-18T09-29-21-321Z/unity-tests.json |
| Kodek sieciowy | 13/13; Evidence/R16/Managed/2026-10-18T09-29-21-321Z/network-codec-tests.json |
| HTML V148 | 5/5; niezmieniony oryginał, tymczasowy probe w pamięci przeglądarki |
| Windows renderer | PASS; 3 różne PNG z kontrolą kolorów; realne słabe kolizje Venom/Shatterer i JsonUtility |
| Pełny mecz Windows | PASS; 51 strzałów / 50 tur / 0 limitów ruchu; bazy 11 : 3 |
| Dwa mecze R16 .NET | 40 strzałów, 0 guard; 24 strzałów, 0 guard; wszystkie 9 testowych tożsamości zagrane |
| Cztery CLASS DEMO | pełne symulowane mecze C#; Evidence/R16/Managed/2026-10-18T09-29-21-321Z/unity-featured-matches.json |
| Windows ↔ WebGL | PASS; NGO/UTP WebSocket loopback, snapshoty obu pułapek, odrzucenie owner spoof i duplikatu; Evidence/R16/Network |
| Relay / UGS / WSS | PASS na jednym PC; Evidence/r16-internet-smoke.json, osobne sieci nadal NOT TESTED |
| Web PC / phone / tablet | PASS: 82 kontroli, 94 obrazów, 8 powierzchni; emulacja przeglądarkowa, nie urządzenia fizyczne |
| Android APK | PASS statycznej inspekcji i podpisu; fizyczne uruchomienie NOT TESTED |
| QA negative control | PASS; bez dotnet runner zwraca błąd i nie kopiuje dawnych PASS do nowego katalogu próby |

Buildy: StandaloneWindows64: Succeeded, errors=0, warnings=1; WebGL: Succeeded, errors=0, warnings=1; Android: Succeeded, errors=0, warnings=1.

Każdy build ma jedno ostrzeżenie ServicesCore o powiązaniu projektu w edytorze. Nie ukryto go ani nie zmieniano konfiguracji konta. Istniejąca konfiguracja runtime z publicznym Project ID przeszła osobny test Authentication/MPS/Relay. Mały ekran w orientacji poziomej nadal oznacza małą planszę i przewijanie panelu; kontrola wizualna była próbkowaniem arkuszy01/04/08/14/16, nie ręcznym przeglądem wszystkich94 obrazów. Fizyczna wygoda obsługi wymaga R17.

Pierwszy ukryty renderer zapisał czarne obrazy. Nie są dowodem renderowania. Poprawiony fixture wymaga GUI Repaint, usuwa poprzedni znany PNG przed asynchronicznym capture, dekoduje zawartość i wymaga trzech różnych obrazów. Końcowe dowody są w Evidence/R16/Native. Sam test mechanik bez renderowania nie został przedstawiony jako udane QA wizualne.

Snapshoty: odrzucanie null w zagnieżdżonych zdarzeniach/statusach/listach, NaN/Infinity w geometrii, duplikatów ID i błędnego nextId; odrzucona rewizja nie blokuje poprawnego pakietu o tej samej rewizji. Protokół149 i serializowany RNG pozostają wspólne. To nie jest pełny deterministyczny save/resume całej sesji.

NOT TESTED: fizyczny Android/iOS/tablet, dwaj gracze na niezależnych urządzeniach/sieciach internetowych, WebGL jako host, zdalny WAN i jitter/długotrwały soak, pełna macierz wszystkich 224 specjalnych zdolności, manualne UX użytkownika, produkcyjna witryna. Brak publikacji i brak zmian Replit/backendu.

Manifesty R9–R12 są historyczne, nie są pełnym aktualnym hashem R15. R13–R15 nadpisywały niektóre wskazane tam źródła. Audyt rozróżnia zgodne wpisy i różnice w późniejszym kandydacie; nie udaje pełnego łańcucha kryptograficznego, którego archiwum nie zawierało.
