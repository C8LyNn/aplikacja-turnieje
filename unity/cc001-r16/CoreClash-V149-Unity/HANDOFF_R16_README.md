# R16 — zacznij tutaj

Otwórz ten katalog w Unity **6000.4.0f1**. Menu Core Clash → Setup and validate project, potem Play. Scena Assets/Scenes/CoreClash.unity. Źródłowa paczka nie zawiera Library/Builds ani SDK.

Wymagane: .NET9, Node22+ dla QA, Unity Windows/WebGL/Android modules, Android SDK/NDK/OpenJDK przy buildzie Android. Testy przeglądarkowe używają Playwright i Edge; ścieżka lokalnego Playwright w Tools pochodzi ze środowiska autora i może wymagać dopasowania na innym komputerze. Testy C# nie wymagają Playwright.

~~~powershell
node Tools/verify-data.cjs
node Tools/r16-qa.cjs --output=C:/CoreClash-QA/R16
pwsh -NoProfile -File Tools/r16-build-smoke.ps1 -All
node Tools/r16-network-smoke.cjs
~~~

Tools/r16-qa.cjs tworzy kopię i osobne wyniki. Nie uruchamiaj dawnego Tests/Program bezpośrednio w kanonicznym katalogu: historyczny driver zapisuje stare nazwy Evidence. Do ponownej weryfikacji oryginalnego ZIP użyj Tools/r16-integrity.ps1 -InputArchive <R15.zip>.

Przeczytaj docs/R16_REPORT_PL.md, docs/R16_QA_PL.md i Evidence/R16/ability-support.json. starsze raporty R9–R15 to historia. Zachowano wszystkie227 rekordów,36 kanonicznych i4 dodatkowe CLASS DEMO oraz niezmieniony Reference/V148_reference_original.html.

Multiplayer: CREATE GAME / JOIN GAME, LAN discovery na Windows, link dla przeglądarki; internet przez istniejące NGO/UTP/MPS/Relay. Host rozstrzyga symulację, klient przesyła intencje. Protokół149 nie został zmieniony. Nie zakładaj, że zakończono fizyczne testy crossplay.

Patch: stosuj tylko do dokładnego oryginału R15 (SHA256 f70497f8be326e34e2f87bbe54c0716294e35887ef5ab9d993a5ae5cade3e21e), z katalogu zawierającego CoreClash-V149-Unity i Reference. Najpierw git apply --check, potem git apply. Nie nakładaj na lokalne R9. Pełna paczka źródłowa R16 zawiera już patch.

Nie publikowano gry. Replit/aplikacja turniejowa/backend nie zostały zmienione. Kompilacje znajdują się wyłącznie lokalnie w Builds.
