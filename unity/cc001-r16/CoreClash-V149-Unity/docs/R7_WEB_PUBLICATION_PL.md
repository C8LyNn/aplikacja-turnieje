# WebGL — pliki do publikacji

Gotowy build jest w `Builds/WebGL`. Osobna paczka `CoreClash-V149-WebGL-R7-Hosting.zip` zawiera jego pliki bez dodatkowego katalogu nadrzędnego i manifest SHA256. Nie zawiera projektu Unity ani wersji Windows/Android. To paczka do wgrania, a nie dowód opublikowania strony.

1. Na swoim hostingu utwórz katalog gry, najlepiej z wersją w nazwie, np. `/core-clash/v149-r7/`.
2. Rozpakuj tam zawartość paczki. `index.html`, `Build/`, `StreamingAssets/` i `TemplateData/` mają leżeć obok siebie. Zachowaj wielkość liter i całą strukturę.
3. Włącz HTTPS. Serwer ma zwracać rzeczywiste pliki, bez przekierowywania brakujących zasobów na stronę logowania lub główną stronę witryny.
4. Sprawdź typy odpowiedzi: `.wasm` → `application/wasm`, `.js` → `application/javascript` lub `text/javascript`, `.data` → `application/octet-stream`, `.json` → `application/json`. Obecny build ma wyłączoną kompresję Unity. Serwer może kompresować transfer poprawnymi nagłówkami HTTP; nie dopisuj `Content-Encoding: br/gzip` do nieprzetworzonych plików. Wymagania MIME i kompresji opisuje [dokumentacja Unity 6.4](https://docs.unity3d.com/6000.4/Documentation/Manual/webgl-deploying.html).
5. Dla niezmiennego katalogu wersji można ustawić długi cache. Jeśli nadpisujesz pliki pod tym samym adresem, użyj rewalidacji (`Cache-Control: no-cache`); nazwy plików Unity w tym buildzie nie zawierają hasha wersji.

Po wgraniu, z katalogu projektu:

```powershell
node Tools/verify-web-host.cjs --url https://TWOJA-STRONA/KATALOG-GRY/
```

Zastąp przykład prawdziwym adresem. Weryfikator pobiera pliki i porównuje ich SHA256 z lokalnym manifestem, kontroluje HTTP/MIME, wykrywa brakujące/stare pliki i ostrzega o cache. Wynik trafia do `Evidence/r7-web-host.json`. Ta kontrola nie zastępuje otwarcia gry i meczu na dwóch urządzeniach.

Następnie otwórz adres na telefonie i komputerze. Host uruchamia wersję Windows → MULTIPLAYER → CREATE GAME → INTERNET. Drugi gracz otwiera stronę → JOIN GAME → INTERNET i wpisuje kod. Do testu różnych sieci telefon może korzystać z danych komórkowych, a PC z Wi-Fi. Windows rozstrzyga ten sam mecz/fizykę; strona jest klientem P2.

Zapisz prawdziwy adres w `Assets/Resources/Data/network-settings.json`, w polu `browserGameUrl`, i przebuduj wersje, aby host mógł kopiować pełny link. Bez przebudowy można już użyć pola Advanced → Published Browser Game URL w panelu tworzenia gry na Windows. Udostępniony link otrzyma `?joinCode=...` i automatycznie rozpocznie dołączanie. Sam statyczny hosting nie potrzebuje hasła ani klucza Unity Cloud.

Na razie adres publiczny nie został podany i pole pozostaje puste. Nic nie zostało opublikowane na wymyślonej domenie. Fizyczny Android, Safari/iOS i crossplay między różnymi sieciami nadal wymagają rzeczywistego testu.

Powtórzenie pakowania, bez nadpisania istniejącej paczki:

```powershell
./Tools/package-webgl.ps1 -Output C:/Users/kubap/Desktop/NOWA-NAZWA.zip
```
