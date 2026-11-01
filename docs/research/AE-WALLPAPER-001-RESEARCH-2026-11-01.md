# AE-WALLPAPER-001 — Research techniczny: Animated Effects jako animowane tapety (Windows / Android)

Status: **RESEARCH / DECISION INPUT — nie jest zgodą na wdrożenie**  
Data przeglądu źródeł: 2026-11-01  
Zakres: Windows 10/11, Android telefony/tablety, istniejący eksport StreamElements/OBS. **Apple poza zakresem na starcie.**  
Repo: C8LyNn/aplikacja-turnieje; HQ synchronizacji: https://github.com/C8LyNn/aplikacja-turnieje/issues/152

## 0. Executive decision

**Rekomendacja (do zatwierdzenia przez właściciela):** utrzymać jeden model sceny Animated Effects, oddzielić renderer/runtime od hosta StreamElements i wdrożyć kolejno:
1. **P0: samodzielny offline HTML ZIP** dla Windows; pierwsza weryfikacja w Lively, potem Wallpaper Engine (ten sam rdzeń, odrębne opcjonalne metadane hosta).
2. **P1: eksport wideo WebM i MP4** ze współdzielonego renderingu klatek; WebM w przeglądarce jako prototyp, MP4/H.264 dopiero po sprawdzeniu wspieranych kodeków, muxera i jakości, ewentualnie na kontrolowanym serwerze.
3. **P2: Android** najpierw eksport wideo do zgodnych aplikacji zewnętrznych (brak gwarancji natywnego ustawienia MP4 przez sam Android); docelowo własna aplikacja z natywną usługą WallpaperService i silnikiem odtwarzania lub native rendererem.
4. **P3: interakcje platformowe**, np. ustawienia koloru/szybkości, ograniczanie FPS, wejścia myszy, sygnał audio; dla Androida dopiero po bezpiecznym MVP.

Nie kopiować logiki edytora, nie przerabiać eksportu StreamElements na jedyną ścieżkę startową, nie wykonywać produkcyjnych zmian na niezsynchronizowanym źródle. Ten dokument jest materiałem dla roju i **nie oznacza, że tapety już działają**.

## 1. Evidence: co faktycznie jest w repo

Badane źródła na gałęzi **codex/animated-effects-scene-portability-export-kit**:
- artifacts/animated-effects/src/core/types.ts — EditorState, resolution, background, palette, efekty, timeline, event trigger.
- artifacts/animated-effects/src/scenes/scenes.ts — format animated-effects-scene / version 1, eksport/import .aescene.json, walidacja i ograniczanie danych.
- artifacts/animated-effects/src/export/streamElements.ts — generuje HTML/CSS/JS, DOM renderery, konfigurację efektów i obsługę onWidgetLoad / onEventReceived.
- artifacts/animated-effects/src/editor/exportPanel.ts — ZIP: widget.html, widget.css, widget.js, scene.aescene.json i README.
- artifacts/animated-effects/src/media/mediaExport.ts — faktyczny kod eksportu PNG/GIF przez html-to-image i gifenc, klatki w izolowanym iframe.
- artifacts/animated-effects/test/*.test.mjs — deklarowane testy scen, timeline, eventów i renderera. Ich obecność NIE jest dowodem aktualnego PASS.

Integracja w aplikacji na gałęzi **codex/replit-visual-polish-handoff**:
- artifacts/tournament-manager/src/pages/stream.tsx / features/streaming/obs-lab/ObsLab.tsx — OBS Lab i odnośnik do /stream/animated-effects/index.html.
- artifacts/tournament-manager/public/stream/animated-effects/ — zbudowane statyczne zasoby edytora.
- artifacts/tournament-manager/vite.config.ts — przepisywanie URL dla samodzielnego edytora w dev.
- PR #9 był scalony do gałęzi integracyjnej; historyczny PR #8 zamknięto jako wchłonięty przez PR #14. To **nie jest potwierdzenie integracji do main ani aktualnej produkcji**.

Ograniczenia istniejącego eksportu, potwierdzone z kodu:
- Eksportowana funkcja startuje po zdarzeniu **onWidgetLoad** (host StreamElements), więc samodzielny HTML bez adaptera może niczego nie uruchomić.
- Efekty z trigger.source == "event" nie startują samoczynnie; wymagają odrębnej, jawnej polityki dla tapet.
- Eksportowane html/body mają **background: transparent**; pełna tapeta powinna renderować tło/paletę sceny lub umożliwić świadome zastąpienie kolorem/obrazem.
- Kontener i warstwy używają **pointer-events: none**; nie można obiecać interakcji kursorem, zanim nie powstanie kontrolowany moduł wejścia.
- MediaExport używa generateStreamElementsExport jako źródła klatek i html-to-image do rasteryzacji; do stałego video w 30/60 FPS nie wolno zakładać, że obecny pipeline będzie wystarczająco szybki.
- Typy przewidują opcje rozdzielczości i FPS, ale samo istnienie typu nie potwierdza funkcjonalnego eksportu wideo.

**Ważna blokada integracyjna:** wg issue #152 stan GitHub main c50cc48e6fa508592bda3f4838111e9cff5af80c jest 86 lokalnych commitów za źródłem Replit R1. Najpierw bezpieczna synchronizacja i pochodzenie źródła. Badane gałęzie mogą nie być kanonicznym stanem R1. Dokumentacji wolno użyć do planowania już teraz, lecz nie traktować jako potwierdzenia stanu produkcyjnego.

## 2. Windows: opcje i warunki

### 2.1 Lively Wallpaper — rekomendowany pierwszy target

Lively obsługuje tapety webowe HTML/CSS/JS, lokalne pliki, personalizację przez LivelyProperties.json, zdarzenie livelyPropertyListener i opcjonalne dane systemowe/audio. Format dystrybucji Lively .zip używa LivelyInfo.json. **Nie utożsamiać dowolnego ZIP z gotowym plikiem .lively-zip**: poprawne metadane i import trzeba potwierdzić na aktualnej wersji Lively. Na start wystarczy izolowany katalog z index.html i zasobami, następnie opcjonalny adapter Lively.

P0 prototyp:
- index.html, style.css, app.js (lub samodzielny bundle), assets/*, scene.aescene.json, README.md, opcjonalny poster/thumbnail.
- Bez logowania, tokenu, CDN, zewnętrznych skryptów i zależności od domeny serwisu. Wszystkie assety lokalne.
- Dla interakcji wejściowych oddzielny rejestr zdarzeń i przełącznik enableInteraction; większość efektów może pozostać nieinteraktywna.
- Dla ustawień hosta dopiero adapter LivelyProperties.json / livelyPropertyListener; tryb bez hosta działa sam.

**Ograniczenie:** Lively jest osobnym programem instalowanym przez użytkownika, a samo pobranie ZIP nie ustawia tapety w Windows. Nie sugerować w UI, że pobranie instalowało cokolwiek.

### 2.2 Wallpaper Engine — drugi target tego samego HTML

Wallpaper Engine oficjalnie importuje web wallpapers przez przeciągnięcie głównego HTML do edytora i kopiuje folder zasobów. Zaleca pełny bundling offline i skalowanie do różnorodnych proporcji (w tym 21:9). Projekt tworzy własny project.json w narzędziu. Runtime udostępnia window.wallpaperPropertyListener (applyUserProperties, applyGeneralProperties, setPaused).

**Nie wytwarzać na ślepo project.json wymagającego ręcznego podszywania się pod wewnętrzny format Wallpaper Engine.** W MVP dostarczyć folder HTML + instrukcję importu, rozszerzyć o host-specific parametry dopiero po realnym teście.

Rozdzielić: zgodność zwykłego HTML != potwierdzenie poprawnej reakcji na audio i wskaźnik. Wymagane testy w obu aplikacjach.

### 2.3 Wymagania wydajnościowe Windows

- Ustawić cele 30 FPS (domyślnie) i 60 FPS (opcjonalnie), lecz nie deklarować osiągów bez pomiaru.
- Ograniczać liczbę cząsteczek, animacji DOM, kosztownych filtrów/blur, zwłaszcza 4K i dwa monitory; ścieżka Canvas/WebGL dopiero gdy profilowanie wykaże potrzebę.
- Obsłużyć zmianę rozdzielczości, 16:9, 21:9, 4:3, portrait, multi-monitor; przewidzieć safe zone ikon, crop/contain i politykę responsywności.
- Zatrzymywanie i wznowienie animacji; logika hosta jest pierwszym mechanizmem, ale kod nie powinien sam wymuszać intensywnej pracy w tle.
- Offline po restarcie Windows i odpięciu sieci; kontrola błędów zasobów.
- Wrażliwe sygnały systemowe/audio domyślnie OFF i wymagają wyraźnego opt-in.

## 3. Wideo (telefony/tablety, także komputer)

Obecny pipeline potrafi wyrenderować izolowany iframe i klatkę na Canvas, ale nie ma dowiedzionego eksportu MP4 ani WebM. Rozpatrywane są trzy drogi:

| Technologia | Plus | Ryzyko/ograniczenie | Decyzja |
|---|---|---|---|
| Canvas.captureStream() + MediaRecorder | mały prototyp w przeglądarce; WebM przy wspieranym MIME | czas rzeczywisty, utracone klatki gdy rasteryzacja DOM nie nadąża, różne MIME/kodeki; canvas musi być origin-clean | Spike P1A |
| WebCodecs VideoEncoder + muxer (np. Mediabunny) | kontrola timestamps klatek i jakości; potencjalnie lepsze do renderu offline | wsparcie/secure context/codec zależne od przeglądarki i urządzenia; WebCodecs sam **nie tworzy** MP4/WebM | Spike P1B |
| Render klatek + natywny FFmpeg po stronie serwera | powtarzalne MP4/H.264; przewidywalne kodeki, QA | koszty, upload prywatnych projektów, kolejka, retencja, timeout, limit zasobów | Alternatywa za zgodą właściciela |

FFmpeg.wasm może transkodować w przeglądarce, ale benchmark projektu wskazuje znaczną utratę wydajności względem natywnego FFmpeg; nie brać jako bezdyskusyjnego domyślnego rozwiązania dla wysokich rozdzielczości.

**Krytyczna zasada:** trzeba przechwycić każdą klatkę ze spójnym czasem sceny, nie tylko robić zrzuty z działającego na żywo okna. Warto dodać renderSceneAt(tMs, width, height, seed), jawnie zdefiniować timing, animacje CSS i cząsteczki (deterministyczne seedy), a potem porównać powtarzalność frame hashes lub różnice obrazowe. Alternatywnie udowodnić kontrolowaną pauzę/scrubbing istniejącego pipeline, w tym efektów CSS/JS. Wykrywać CORS/tainted canvas, brak fontów, animacje nieskończone, przesunięcie czasu i brak zasobów.

Rekomendowane formaty wyjścia:
- Windows: żywy HTML jako preferowany rezultat; wideo WebM/MP4 opcjonalnie.
- Android P1: MP4/H.264 (najbardziej praktyczny target kompatybilności, **po QA na urządzeniach**), WebM tylko jeśli wybrany odbiorca to potwierdza.
- Profile: 1920×1080, 2560×1440, 3840×2160, 1080×1920, 1080×2400, 1600×2560, custom w dozwolonych granicach.
- Ustawienia: czas 5/10/15/30 s (propozycja), pętla, FPS 24/30/60 zależnie od kodeka, obraz poster, opcja tła, estimated file size. Ujawnić plik nieobsługiwany przez daną aplikację.

MediaRecorder.isTypeSupported() i VideoEncoder.isConfigSupported() muszą decydować o realnej dostępności formatów; brak wsparcia => wyraźny komunikat i alternatywa. Nie nazywać WebM plikiem MP4 ani nie zmieniać tylko rozszerzenia.

## 4. Android: dwie niezależne ścieżki

**Ścieżka A — eksport wideo (wcześniej).** Użytkownik pobiera MP4 i może wczytać je do zgodnej aplikacji do video wallpapers na Androidzie. Samo istnienie MP4 NIE oznacza, że każdy Android/OEM ustawi go natywnie jako animowaną tapetę. Dodać sprawdzoną instrukcję lub kompatybilną aplikację dopiero po testach rzeczywistych urządzeń.

**Ścieżka B — własna aplikacja Android (później).**
- Kotlin + Android WallpaperService / WallpaperService.Engine; deklaracja intent android.service.wallpaper.WallpaperService, permission BIND_WALLPAPER, meta-data android.service.wallpaper XML.
- P0 aplikacji: import lokalnego MP4, weryfikacja typu/rozmiaru, renderer do Surface z bezpiecznym lifecycle, pętla, pause onVisibilityChanged(false), obsługa surface destruction, zmiany orientacji i preview.
- Interaktywność: Engine.setTouchEventsEnabled(true) + onTouchEvent, jeśli host/launcher dostarcza zdarzenia. Nie gwarantować jednolitego działania na wszystkich launcherach.
- Real-time render sceny w HTML WebView jako WallpaperService nie jest prostym ani gwarantowanym drop-in: osobny spike architektury Surface/texture/native renderera i lifecycle, bez zobowiązania w MVP.
- Prywatność: bez domyślnego uploadu, brak uprawnień mikrofonu/kamery bez odrębnej zgody, brak zbędnej telemetrii. Weryfikacja Play Store/polityk dystrybucji dopiero przed publikacją aplikacji.
- Natywny renderer/Kotlin/Media3 lub OpenGL rozważyć po dokonaniu pomiarów na telefonach.

## 5. Proponowana architektura programistyczna

Jeden model sceny, wiele środowisk wykonawczych. Planowane interfejsy (nie istniejący kod):

- SceneDocumentV1/EditorState -> validate/normalize -> PortableSceneSnapshot.
- SceneRenderer: mount(container, snapshot), render/seek(timeMs), resize(size, fitMode), pause/resume, dispose.
- HostAdapter: onStart, onStop, onVisibility, onResize, onInput, onSettingsChange, onExternalEvent.
- Adaptery: StreamElementsHost (onWidgetLoad/onEventReceived), StandaloneHtmlHost (DOMContentLoaded), LivelyHost, WallpaperEngineHost, VideoFrameHost (synthetic deterministic time).
- Eksportery: StreamElementsExport (zachować API/kontrakty), WebWallpaperExport (samowystarczalny ZIP offline), VideoExport (WebM/MP4), AndroidProjectExport **nie teraz**.

Praktyczna strategia migracji: ekstrakcja części wspólnych z generatora streamElements.ts do shared runtime bez zmiany generowanych bajtów aktualnego SE, następnie osobny wrapper HTML. Zmieniane testy muszą wykazać brak regresji StreamElements.

Polityka zdarzeń: dla tapet warstwy zawsze aktywne mogą działać stale; warstwy wyłącznie event-triggered mają domyślnie **SKIP + ostrzeżenie** (np. "Alert SUB nie ma zdarzeń w tapecie"). Ewentualne emulowanie losowych alertów tylko jako jawny opt-in i bez udawania prawdziwych follow/sub/donacji. Nigdy nie przenosić tokenów lub prywatnych payloadów SE do tapety.

Polityka tła: eksport streamowy zachowuje przezroczystość, tapeta ma wyraźnie wybrane tło pełnoekranowe/obraz/kolor, a wideo jest domyślnie nieprzezroczyste. Zapisać cel eksportu i fit mode w ustawieniach eksportu, nie wymuszać migracji starego .aescene.json bez potrzeby.

## 6. Zagrożenia i scenariusze awarii

| ID | Zagrożenie | Łagodzenie |
|---|---|---|
| R1 | GitHub main nie odpowiada źródłu R1 | oddzielny docs-only PR; implementacja dopiero po W23 i pinie SHA źródła |
| R2 | Puste HTML przy braku onWidgetLoad | samodzielny startup przez StandaloneHost, E2E offline |
| R3 | Czarny/przezroczysty pulpit | background policy + poster + test scen |
| R4 | Brak alertów/zdarzeń SE poza streamem | jawny SKIP/mapowanie i ostrzeżenia w UI |
| R5 | Dropped frames/zużycie pamięci podczas MP4 | izolowany spike, limit pamięci/czasu, anulowanie i cleanup |
| R6 | Różnice WebView2/CEF/Chromium/hosts | automatyczny browser smoke + manualne Lively i WE |
| R7 | Nieprzenośne URL, CDN i czcionki | kopia assetów, offline, manifest, test bez sieci |
| R8 | Brak interakcji myszy | odrębny input adapter, test hostów; interaktywność jako feature-gated |
| R9 | Niedziałająca tapeta na Androidzie | jasna granica MP4 vs WallpaperService; test OEM |
| R10 | Niezaufane pliki i runtime | limity rozmiaru/typów, bez arbitralnego JS/importu URL, escapowanie, żadnych tokenów |
| R11 | Wzrost obciążenia CPU/GPU i baterii | limit FPS, pause, efekty adaptive, profilowanie fizycznego sprzętu |
| R12 | Prawa do obrazów/audio/fontów i logo marek | weryfikacja licencji zawartości eksportu, ostrzeżenie dla użytkowników |

## 7. Źródła pierwotne / official docs (sprawdzone 2026-11-01)

1. Wallpaper Engine — Web Wallpaper Getting Started: https://docs.wallpaperengine.io/en/web/first/gettingstarted.html
2. Wallpaper Engine — Web Wallpaper overview: https://docs.wallpaperengine.io/web/overview.html
3. Wallpaper Engine — property listener i pauza/FPS: https://docs.wallpaperengine.io/en/web/api/propertylistener.html
4. Wallpaper Engine — user properties: https://docs.wallpaperengine.io/en/web/customization/properties.html
5. Lively — FAQ i tworzenie HTML wallpapers: https://www.livelywallpaper.io/faq/index.html
6. Lively — wallpaper ZIP i LivelyInfo: https://github.com/rocksdanister/lively/wiki/Lively-Wallpaper-File
7. Lively — Web Guide IV (interaction): https://github.com/rocksdanister/lively/wiki/Web-Guide-IV-%3A-Interaction
8. Lively — Web Guide V (system data/audio): https://github.com/rocksdanister/lively/wiki/Web-Guide-V-%3A-System-Data
9. Lively — performance/pause: https://github.com/rocksdanister/lively/wiki/Performance
10. Android — WallpaperService.Engine: https://developer.android.com/reference/android/service/wallpaper/WallpaperService.Engine
11. Android — WallpaperService declaration: https://developer.android.com/reference/android/service/wallpaper/WallpaperService
12. MDN — Canvas.captureStream: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream
13. MDN — MediaRecorder.isTypeSupported: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static
14. MDN — WebCodecs API oraz muxing: https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API
15. MDN — VideoEncoder: https://developer.mozilla.org/en-US/docs/Web/API/VideoEncoder
16. ffmpeg.wasm — performance benchmark (konkretne warunki, nie ogólna gwarancja): https://github.com/ffmpegwasm/ffmpeg.wasm/blob/main/apps/website/docs/performance.md

Źródła są podstawą oceny wykonalności, **nie zastępują QA** na aktualnym Lively, Wallpaper Engine i urządzeniach Android. Weryfikować wersje oraz warunki licencyjne przed implementacją.

## 8. Powiązane decyzje i execution contract

Patrz: [AE-WALLPAPER-002 — Decyzje i plan fal](./AE-WALLPAPER-002-DECISION-GATES-2026-11-01.md).

Właściciel/relevant rój powinien potraktować ten dokument jako read-only research, nadać właścicieli i akceptować kolejne gates. Żadnego merge do main, publish, deploy, automatycznego transferu z Replit czy modyfikacji istniejących produktów w ramach samego researchu.
