# AE-WALLPAPER-002 — Decision record, roadmap i kontrakt dla roju

Status: **PROPOSED / AWAITING OWNER APPROVAL**  
Data: 2026-11-01  
Powiązane: [Research AE-WALLPAPER-001](./AE-WALLPAPER-001-RESEARCH-2026-11-01.md); HQ sync: https://github.com/C8LyNn/aplikacja-turnieje/issues/152

## Cel i wynik produktu

Użytkownik tworzy **jedną** scenę Animated Effects i wybiera:
- StreamElements / OBS — obecny widget HTML/CSS/JS i zdarzenia transmisji.
- Windows — gotowy do importu folder/ZIP samodzielnego HTML dla Lively, później Wallpaper Engine (własne uruchamianie i offline).
- Android — zapętlone wideo (po potwierdzonej kompatybilności MP4); docelowo odrębna aplikacja Live Wallpaper.

**Apple jest wyłączone z zakresu i gate'ów.** W badanym zakresie nie zakładać publikacji na Steam Workshop ani Google Play — wymaga odrębnej decyzji.

## Decyzje wymagające zatwierdzenia (nie przypisywać statusu APPROVED bez odpowiedzi właściciela)

| ID | Pytanie do decydenta | Rekomendacja | Status |
|---|---|---|---|
| D0 | Czy R1/GitHub source-only jest zsynchronizowany i jakie HEAD SHA jest kanoniczne? | HOLD implementacji do potwierdzenia przez właściciela synchronizacji SWARM-006 | BLOCKED |
| D1 | Pierwszy cel platformowy Windows? | Lively HTML offline, następnie Wallpaper Engine na tym samym runtime | PROPOSED |
| D2 | Czy odłączamy silnik scen od StreamElements? | Tak: renderer + adaptery hosta, stary eksport bez regresji | PROPOSED |
| D3 | Co zrobić z warstwami zależnymi od follow/sub/chat? | SKIP + widoczne ostrzeżenie, opcjonalny odrębny loop tylko za zgodą | PROPOSED |
| D4 | Pierwszy format wideo? | WebM spike + ocena MP4/H.264 za pomocą WebCodecs/muxera; bez udawania obsługi | PROPOSED |
| D5 | Gdzie renderować MP4? | Preferuj lokalny browser pipeline, serwer tylko po analizie kosztów i prywatności | PROPOSED |
| D6 | Pierwszy etap Androida? | Video export, aplikacja WallpaperService dopiero w osobnym zadaniu | PROPOSED |
| D7 | Czy dodajemy od razu audio reactive, touch i profile GPU? | Nie: wyłącznie osobne, mierzone opt-in feature flags | PROPOSED |
| D8 | Polityka tła i skalowania? | Windows/Android wymaga jawnego tła i wyboru cover/contain; SE transparent bez zmian | PROPOSED |

**Nieodwracalne/ryzykowne**: publikacja na live, Google Play/Steam, kosztowny rendering serwerowy, integracja do niezsynchronizowanego źródła i import niezaufanych skryptów wymagają osobnego, jawnego OWNER GO.

## Plan fal (agent-first, izolowane prace)

### W0 — Source freeze & audit [P0, HOLD do D0]
Wejście: issue #152 oraz branch/version aktualnego kodu w Replit R1.  
Działania: ustalić canonical source SHA i tree attestation, porównać zawartość Animated Effects, zmapować faktyczne źródła vs skopiowany built public/stream/animated-effects. Zidentyfikować aktywny frontend routing. Nie kontaktować Replit bez konieczności; przez wyznaczonego operatora A00 zgodnie z HQ.  
Deliverable: source manifest, diff i ryzyka utraty funkcji, raport PASS/FAIL/UNKNOWN, wybór bezpiecznej gałęzi bazowej.  
Gate G0: właściciel potwierdza bazę, kopię bezpieczeństwa, brak konfliktu z W23.

### W1 — Web wallpaper proof of concept [P0, po G0]
Zakres: wyodrębnić StandaloneHost i wspólny runtime; wygenerować index.html + lokalne css/js/assets + README + .aescene.json w ZIP; bez network request. Działać bez SE onWidgetLoad. Presety i świadoma polityka event-only (SKIP + warning), nieprzezroczyste tło. Minimalna dokumentacja importu w Lively; test w Wallpaper Engine folder import.  
Testy: automatyczny DOM/Chromium render, nieprzerwany loop, init raz, cleanup, brak wycieku sieci, offline po restarcie, bez starych zależności.  
Deliverable: izolowany Draft PR, ZIP sample, README, before/after screenshots, evidence SHA.  
Gate G1: ręczny test w Lively i Wallpaper Engine + regresja eksportu SE; brak regressions i fałszywych claims.

### W2 — Layout, wydajność i host adapters [P1]
Zakres: fit cover/contain, portrait, 21:9, 4K i wiele monitorów; pause/resume; domyślne 30 FPS; opcjonalny LivelyPropertyListener / WallpaperEngine property callbacks. Oddzielny feature flag dla cursor/touch-like desktop input.  
Testy: 1920×1080, 3840×2160, 3440×1440, 1366×768, 1024×768, 768×1024, multi-monitor; niezależne porównanie CPU/GPU, RAM, fps/jank przy scenach Soft/Balanced/Showcase; foreground/fullscreen i baterii.  
Deliverable: performance report z modelem urządzenia, wersją hosta, sceną i source SHA.  
Gate G2: zaakceptowane limity oparte na pomiarach; brak wiszących workerów/timerów w pauzie.

### W3 — Wideo WebM / MP4 [P1]
Spike A: rasteryzacja klatek -> Canvas.captureStream/MediaRecorder i runtime MIME detection.  
Spike B: deterministyczny render(tMs) -> WebCodecs VideoEncoder + sprawdzony muxer.  
Porównać 5/10/30 s, 1080p, portrait, 30 FPS: real time/export time, memory peak, dropped frames, plik odtwarzany w Chrome/Windows/Android, rozmiar, wykrywanie braku wsparcia. Benchmarkuj na sprzęcie i przeglądarce, nie deklaruj spełnienia przed QA. MP4/H.264 wymaga realnego encoder + muxer i testu Android; ffmpeg.wasm tylko rezerwowa opcja po benchmarku.  
Deliverable: ADR wyboru A/B/serwer, prototyp i test files, UI anulowania eksportu oraz komunikat o błędzie.  
Gate G3: deterministyczny wynik lub jawnie opisane ograniczenia, brak ukrytej konwersji/użytkownik widzi prawdziwy format, odtwarzalne MP4 po QA.

### W4 — Android delivery [P2, po G3]
Pierwszy produkt: dokumentowany eksport kompatybilnego wideo i instrukcja pracy z przetestowaną aplikacją Android, bez twierdzenia, że system zawsze natywnie ustawi MP4. Testy na telefonie i tablecie Android (co najmniej dwa profile urządzeń/OEM, jeśli dostępne).  
Opcja późniejsza: odrębna aplikacja Kotlin/WallpaperService, import MP4, Surface, lifecycle visibility, orientacja, touch opt-in; wyszczególnione koszty maintenance.  
Gate G4: testy rzeczywistych urządzeń + osobne owner GO dla aplikacji.

### W5 — Hardening / release readiness [P2]
Testy security: zero tokenów StreamElements w archiwum, zewnętrzne URL blocked/explicit opt-in, safe import, CORS, zaufane pliki, licencje assetów. Dokumentacja użytkownika, support matrix, rollback/feature flags.  
Gate G5: niezależne QA + owner GO dla integracji/release; dopiero wtedy rozważyć produkcyjne wdrożenie.

## Role (sugerowane, NIE przydzielone)

- **A00 / owner**: wybór source SHA, rozstrzygnięcie D0–D8, koordynacja z aktualną synchronizacją.
- **A10/source intake**: manifest, provenance, walidacja wersji/assetów.
- **A20/architektura-integracja**: wspólny renderer, host adaptery i kontrakt bez regresji SE.
- **Frontend/UX**: ekran eksportu, ostrzeżenia event-only, profile/preview.
- **Media/dev specialist**: zbadanie WebCodecs/muxer/MediaRecorder, realne testy kodowania.
- **A50 CI**: targeted automated testy bez niepotrzebnych runnerów.
- **A60 independent QA**: testy offline/native hosts/Android i potwierdzenie G1–G5.
- **A70 release**: strategia wdrożenia/rollback wyłącznie po OWNER GO.

Nazwy A00/A10/A20/A50/A60/A70 odwołują się do obecnego projektu SWARM-006, ale **nie są automatycznym zadaniem i nie przekierowują zasobów z P0 synchronizacji**. Koordynator przypisuje docelowy rój i ownerów po zamknięciu P0.

## Definition of Done dla pojedynczej paczki

1. Jeden izolowany branch/PR i jawny base/head SHA; nie mieszać z recovery GitHub↔R1.
2. Dotknięte pliki + import/export API + zachowane kompatybilne .aescene.json.
3. Odpalone testy z komendami, exit code, PASS/FAIL/NOT_RUN; test rzeczywisty hosta opisany ze sprzętem/wersją lub UNKNOWN.
4. Dowody braku regresji StreamElements (onWidgetLoad, onEventReceived, trigger, queue, captions, deterministic scene parse).
5. Dowody offline i brak przeniesienia tokenów/PII do ZIP oraz brak fetch nieautoryzowanych assetów.
6. Raport performance bez zgadywanych FPS; różnice pomiędzy DOM/Canvas/Chromium a Lively/WE oznaczone.
7. Wyraźny GO/NO-GO dla następnej fali; brak merge/deploy/publish bez zatwierdzenia ownera.

## Procedura przekazania do roju

1. Odczytaj obydwa dokumenty i aktualny issue #152; nie bazuj wyłącznie na gałęzi main ani na build output.
2. Podaj A00 decyzje D0–D8 z argumentacją, alternatywami, testami do wykonania.
3. Przed kodowaniem przedstaw krótki design ADR wraz z ryzykami i kosztami.
4. Po GO rozpocznij W1 od najmniejszego sensownego testu samodzielnego HTML, nie od dużej refaktoryzacji edytora.
5. Każde działanie w Replit tylko na warunkach HQ #152; bez równoległych operatorów.
6. Niniejszy dokument to **research docs-only**: żadnego wdrożenia, modyfikacji runtime czy nowego API nie wykonano.

## Dodatkowe ostrzeżenia

- Eksport HTML do tapety nie oznacza natywnego wsparcia OS; aplikacja Lively / Wallpaper Engine jest wymagana.
- Android video export nie jest równoznaczny z Android WallpaperService.
- GIF/PNG już mają kod w repo, MP4/WebM NIE ZOSTAŁY zweryfikowane jako dostępna funkcja.
- Nie wymagać Apple ani nie uzależniać kontraktów od Apple.
- Źródła i założenia: AE-WALLPAPER-001, 2026-11-01.

