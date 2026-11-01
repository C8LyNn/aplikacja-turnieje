# AE-WALLPAPER-004 — Instrukcja wdrożenia Three.js + WebGL2 w Animated Effects

**Status:** IMPLEMENTATION GUIDE / PROPOSAL — **NOT IMPLEMENTED**  
**Data:** 2026-11-01  
**Projekt:** C8LyNn/aplikacja-turnieje / artifacts/animated-effects  
**Zakres:** zaawansowane animacje 3D, pierwsza scena „Kosmiczny Olbrzym”, integracja z edytorem 2D i przygotowanie do eksportu StreamElements / Windows / wideo. Apple, Unreal i Unity poza MVP.  
**Wymagana zgoda:** A00/owner, po ustaleniu kanonicznego R1 source SHA (SWARM-006 [#152](https://github.com/C8LyNn/aplikacja-turnieje/issues/152)).  
**Powiązane:** [AE-001](./AE-WALLPAPER-001-RESEARCH-2026-11-01.md), [AE-002](./AE-WALLPAPER-002-DECISION-GATES-2026-11-01.md), [AE-003](./AE-WALLPAPER-003-3D-ENGINE-TECH-SELECTION-2026-11-01.md), [issue #274](https://github.com/C8LyNn/aplikacja-turnieje/issues/274).

> Ten dokument jest specyfikacją wykonawczą i źródłem decyzji dla roju. Nie oznacza wdrożonego silnika, potwierdzonej zgodności z OBS ani zakończonych testów. Nie scalać do main i nie modyfikować produkcji w ramach researchu.

## 1. Dwa komponenty i ich obowiązki

| Element | Zadanie | Gdzie w kodzie | Czego NIE robi |
|---|---|---|---|
| **Three.js** | Scene Graph, Mesh, Camera, Light, Material, animacje, GLB/glTF, Canvas/renderer | nowy moduł `src/engine3d/` | nie jest edytorem GUI ani platformą dystrybucji tapet |
| **WebGL2** | renderowanie 3D na GPU wewnątrz `canvas`, bufory, tekstury, shadery GLSL | backend `THREE.WebGLRenderer` | nie zastępuje logiki edytora i nie koduje automatycznie MP4 |

**Decyzja:** używać `THREE.WebGLRenderer` (który wymaga WebGL2). Nie tworzyć od razu własnego niskopoziomowego silnika na surowym `canvas.getContext("webgl2")`. Bezpieczeństwo i zgodność mają pierwszeństwo przed wyborem WebGPU. `THREE.ShaderMaterial` + GLSL stosować dopiero do efektów, których nie da się uzyskać wygodnie standardowymi materiałami.

Przepływ danych:

```text
Edytor Animated Effects: suwaki, presety, timeline, undo, sceny JSON
             |
        SceneDocument / validated params
             |
    SceneClock + CompositeStage (jeden zegar)
             |
     +-----------------------+----------------------------+
     | LegacyDOMRenderer     | ThreeSceneRenderer         |
     | efekty HTML/CSS       | WebGL2 + GLSL + GPU canvas |
     +-----------------------+----------------------------+
             |
      Preview / Export Runtime
             |
   StreamElements | Standalone HTML | Image/video export
```

## 2. Audyt istniejącego repo (weryfikacja kodu, nie pomiary)

Analizowana gałąź: `codex/animated-effects-scene-portability-export-kit`; **kanoniczna produkcyjna wersja Replit R1 nie jest przez to zweryfikowana.**

| Plik istniejący | Co potwierdzono | Konsekwencja |
|---|---|---|
| `artifacts/animated-effects/package.json` | TypeScript + Vite + gifenc + html-to-image + jszip; brak `three` w badanej wersji | dodać zależność do właściwego pakietu, nie do całej strony |
| `src/effects/effectModules.ts` | `EffectModule` ma `renderPreview(HTMLElement,...)`, CSS i generator StreamElements; ~175 KB kodu | pozostawić jako adapter legacy, nie przerabiać jednocześnie wszystkich efektów |
| `src/editor/preview.ts` | `renderEffect()` tworzy i wstawia elementy DOM i style | wstawić 3D jako osobną warstwę/kanwę, nie jako sklonowany HTML |
| `src/main.ts` | `renderPreview()` wywołuje `preview.replaceChildren()` | konieczna trwała instancja WebGL: nie odtwarzać całego GPU kontekstu przy każdej zmianie suwaka |
| `src/animation/previewTransport.ts` | `animated-effects:transport-state` z `playing`, `cursorMs`, `durationMs`; osobny zegar i `requestAnimationFrame` | adaptować do wspólnego zegara, eliminować podwójne pętle |
| `src/scenes/scenes.ts` | `SCENE_VERSION = 1`, parser **odrzuca inną wersję** i filtruje nieznane ID | wymagany jawny plan nowego schematu/migracji; nie dopisywać przypadkowych pól |
| `src/export/streamElements.ts` | generator HTML/CSS/JS; `onWidgetLoad` / `onEventReceived` | 3D runtime potrzebuje osobnego uruchamiania w standalone HTML, host SE testować odrębnie |
| `src/media/mediaExport.ts` | `html-to-image.toCanvas` i CSS `getAnimations`; ukryty iframe | nie zakładać, że uchwyci WebGL, dodać kontrolowane renderowanie do `WebGLRenderTarget` i kompozycję |

**Źródło sytuacyjne:** [issue #152](https://github.com/C8LyNn/aplikacja-turnieje/issues/152) pozostaje otwarty; `main` w chwili audytu `c50cc48e6fa508592bda3f4838111e9cff5af80c`. Opis issue wskazuje 86 commitów źródła R1 niezsynchronizowanych z `main`. P0 jest zabezpieczenie źródła, a dokument może służyć do planowania.

## 3. Zakres MVP — czego użytkownik ma doświadczyć

**Jedna scena „Kosmiczny Olbrzym”**:
- gazowy olbrzym (sfera 3D, obrót), powierzchnia w pasach (najpierw zwykły materiał, potem proceduralny GLSL);
- pierścień jako `RingGeometry`, możliwość regulacji nachylenia, wielkości i przezroczystości;
- słaba poświata/atmosfera (w MVP prosta półprzezroczysta otoczka, docelowo shader Fresnel);
- tło gwiazd/neutralne, później `Points` / `InstancedMesh` i mgławica na oddzielnej warstwie;
- użytkownik ustawia kolor, prędkość, wielkość, nachylenie pierścieni i pozycję;
- `renderAt(5000)` musi odtworzyć **dokładnie ten sam stan animacji** po każdym przewinięciu.

Nie implementować w pierwszym PR: własnego silnika WebGL od zera, WebGPU, swobodnego kompilowania shaderów od użytkowników, fizyki orbitalnej, Pixel Streaming, MP4, marketplace assetów.

## 4. Instalacja (dopiero po G0 / zatwierdzeniu source SHA)

Repo narzuca pnpm. W odizolowanej gałęzi implementacji, z katalogu głównego kanonicznej kopii:

```bash
pnpm --filter animated-effects add three
pnpm --filter animated-effects add -D @types/three
pnpm --filter animated-effects run typecheck
pnpm --filter animated-effects run test
pnpm --filter animated-effects run build
```

Sprawdzić, czy `@types/three` jest potrzebne przy wybranej wersji `three`, i przypiąć aktualne zgodne wersje w lockfile. **Nie podawać sztywnej wersji pakietu bez testu kompatybilności.** Powyższe polecenia to instrukcja dla wykonawcy; nie były tutaj uruchamiane.

Pierwszy eksperyment może być osobną stroną demo w module Animated Effects, **bez podłączania do globalnej biblioteki efektów**. Po pomiarze i akceptacji przenieść renderer do edytora.

## 5. Proponowane nowe moduły

```artifacts/animated-effects/src/
  engine3d/
    capabilities.ts           # sprawdzenie WebGL2 i ograniczeń sprzętu
    sceneClock.ts             # jeden stan czasu dla CSS/3D/exportu
    renderer3d.ts             # trwały WebGLRenderer + Scene + Camera
    renderTargetCapture.ts    # framebuffer capture i konwersja do klatek
    resourceTracker.ts        # dispose geometries/materials/textur/passów
    effects/
      cosmicGiant.ts          # pierwsza planeta
    shaders/
      gasGiant.vert.glsl
      gasGiant.frag.glsl
      atmosphere.frag.glsl
    tests/
      sceneClock.test.ts      # docelowe testy w stosownym runnerze
```

**Propozycja interfejsu** (API nie istnieje obecnie):

```ts
export interface SceneLayerRenderer {
  mount(host: HTMLElement): void;
  setParameters(input: Record<string, number | string | boolean>): void;
  renderAt(timeMs: number): void;
  resize(width: number, height: number): void;
  pause(): void;
  resume(): void;
  dispose(): void;
}
```

Uwaga: dla GPU `mount` ma być wywołane raz dla żywej instancji, `setParameters` modyfikuje wartości bez ponownej kompilacji shaderów, `renderAt` aktualizuje scenę w oparciu o *absolutny* czas, `dispose` kończy rAF i zwalnia zasoby.

## 6. Minimalny przykład działającego renderera planety

Poniższy kod to **prototyp referencyjny do zaadaptowania** — samodzielny moduł TypeScript korzystający z Three.js (nie jest jeszcze połączony z edytorem). Pokazuje, jak Three.js tworzy scenę, a WebGL2 ją renderuje.

```ts
// src/engine3d/effects/cosmicGiant.ts
import * as THREE from "three";
import WebGL from "three/addons/capabilities/WebGL.js";

export interface PlanetDemo {
  renderAt(timeMs: number): void;
  resize(width: number, height: number): void;
  dispose(): void;
}

export function createCosmicGiant(host: HTMLElement): PlanetDemo {
  if (!WebGL.isWebGL2Available()) {
    throw new Error("WebGL2 niedostępny — pokaż podgląd 2D.");
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 100);
  camera.position.set(0, 0, 5.8);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  host.appendChild(renderer.domElement);

  const group = new THREE.Group();
  scene.add(group);

  const sphereGeometry = new THREE.SphereGeometry(1, 64, 48);
  const sphereMaterial = new THREE.MeshStandardMaterial({
    color: 0x8970c3,
    roughness: 1,
    metalness: 0,
  });
  const planet = new THREE.Mesh(sphereGeometry, sphereMaterial);
  group.add(planet);

  const ringGeometry = new THREE.RingGeometry(1.35, 2.1, 128);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xbca8ed,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = -0.85;
  group.add(ring);

  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const sun = new THREE.DirectionalLight(0xffffff, 2.5);
  sun.position.set(3, 2, 4);
  scene.add(sun);

  return {
    renderAt(timeMs: number) {
      // Absolutny czas: seek 5s -> zawsze ta sama orientacja.
      planet.rotation.y = (timeMs / 1000) * 0.18;
      renderer.render(scene, camera);
    },
    resize(width: number, height: number) {
      if (width <= 0 || height <= 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    },
    dispose() {
      // Uwaga: usuwać też osobno tekstury/FX przy rozbudowie.
      sphereGeometry.dispose();
      sphereMaterial.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
```

Sposób wykorzystania w izolowanej stronie demo:

```ts
const demo = createCosmicGiant(document.querySelector("#demo")!);
demo.resize(1280, 720);
demo.renderAt(0);      // początek
demo.renderAt(5000);   // przewinięcie do 5 sekund
// Przy zamknięciu/zmianie sceny: demo.dispose().
```

Dla odtwarzania na żywo **jeden** scheduler hosta dostarcza czas do `renderAt`. Nie dodawać `requestAnimationFrame` wewnątrz każdej planety. Prawdziwa otoczka atmosferyczna, gradient gazowy i światła wolumetryczne są następnym etapem; ten demo kod jest celowo prosty, nie jest gotową sceną z wcześniejszej referencji wizualnej.

## 7. GLSL: jak stworzyć gazowe pasy i atmosferę

Three.js udostępnia `THREE.ShaderMaterial` i przekazuje programy GLSL do backendu WebGL2. Wariant MVP: własny shader pasów (animowany parametr `uTime`), następnie osobna powłoka atmosfery oparta o kąt pomiędzy normalną a kierunkiem obserwatora (Fresnel). Nie stosować skomplikowanego raymarchingu w pierwszym PR.

**Prototyp pasów (ShaderMaterial)** — pełny vertex + fragment w GLSL zgodnym z typowym `ShaderMaterial`; dołączyć do planety zamiast `MeshStandardMaterial`:

```glsl
// vertexShader:
varying vec3 vLocalPosition;
void main() {
  vLocalPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

```glsl
// fragmentShader:
precision highp float;
varying vec3 vLocalPosition;
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
void main() {
  float turbulence = 0.28 * sin(vLocalPosition.x * 6.0 + uTime * 0.16);
  float stripe = sin(vLocalPosition.y * 18.0 + turbulence);
  float blend = smoothstep(-0.55, 0.55, stripe);
  vec3 normal = normalize(vLocalPosition);
  float light = 0.28 + 0.72 *
    max(dot(normal, normalize(vec3(0.6, 0.4, 1.0))), 0.0);
  vec3 color = mix(uColorA, uColorB, blend) * light;
  gl_FragColor = vec4(color, 1.0);
}
```

Po stronie TypeScript:

```ts
const uniforms = {
  uTime: { value: 0 },
  uColorA: { value: new THREE.Color("#382877") },
  uColorB: { value: new THREE.Color("#ba8bdf") },
};
// const gasMaterial = new THREE.ShaderMaterial({
//   uniforms,
//   vertexShader: GAS_VERTEX_SOURCE,
//   fragmentShader: GAS_FRAGMENT_SOURCE,
// });
// renderAt(ms): uniforms.uTime.value = ms / 1000;
```

GAS_VERTEX_SOURCE i GAS_FRAGMENT_SOURCE to stałe z dwóch pokazanych wyżej shaderów (potrzebny loader/import lub stałe JS). Wersja pokazuje **stylistyczne pasy**, nie fizycznie dokładną atmosferę/gaz. Dołożyć fresnel i post-processing dopiero po działającym podglądzie oraz po pomiarach GPU. `ShaderMaterial` jest backendem `WebGLRenderer`, **nie zakładać kompatybilności 1:1 z WebGPURenderer**.

## 8. Integracja z obecnym edytorem (krok po kroku)

### Krok A — trwała kompozycja 2D + 3D

W aktualnym `src/main.ts` `preview.replaceChildren()` czyści cały preview. Dla WebGL utworzyć wewnątrz stabilnego `#effect-preview` dwa kontenery, np. `#ae-three-stage` z jednym `canvas` i `#ae-dom-stage` z elementami CSS. Funkcja odświeżania czyści **tylko** `ae-dom-stage`, a 3D aktualizuje parametry przez API. Zwalniać GPU dopiero przy wyłączeniu/zmianie sceny/komponentu, nie przy każdej zmianie suwaka.

W pierwszej wersji WebGL jako tło za 2D. Pełne mieszanie dowolnego z-index między 2D i wieloma 3D warstwami wymaga osobnej specyfikacji kompozycji i testów alfa; nie udawać że dwa Canvas rozwiązały całkowicie kolejność warstw.

### Krok B — jeden zegar czasu

`previewTransport.ts` już publikuje zdarzenie `animated-effects:transport-state` z `cursorMs` i `playing`. Adapter może początkowo reagować na zdarzenia, ale docelowo **jeden scheduler** wywołuje `renderAt(t)` dla WebGL i steruje CSS/WAAPI. Nie uruchamiać nowych równoległych niezależnych pętli każdej warstwy.

W `renderAt(t)` używać czasu absolutnego (i zapisanych seedów), nie kumulować transformacji przez `+= speed * dt`. Eksport 90. klatki przy 30 FPS = `renderAt(3000)` niezależnie od pory jej wygenerowania.

### Krok C — schemat scen i undo

Obecne `SCENE_VERSION=1` jest weryfikowane sztywno w parserze. Bezpieczna propozycja: najpierw własny, izolowany format sceny testowej (`scene3d.json`), a dopiero po GO dodać `SceneDocumentV2` (legacy `effects` + `sceneNodes3d`) z jawnie testowaną migracją z V1. Wsteczny odczyt V1 musi być bezstratny dla istniejących efektów.

Struktura parametrów deklaratywna i walidowana: `type: "planet"`, `id`, `enabled`, `transform`, `rotationSpeed`, `ringTilt`, `atmosphereIntensity`, `seed`, `quality`. Bez dowolnego JS w plikach scen. Przełącznik obsługi nieznanych typów: ostrzeżenie i bezpieczny fallback, nigdy bezgłośna utrata reszty pliku.

### Krok D — suwaki i biblioteka efektów

Nowy typ `planet3d` nie może być po prostu dopisany do obecnego `EffectModule` jako pusty `renderPreview()` i uznany za gotowy — eksport SE bazuje na `streamElementsRendererSource`. Najpierw osobna zakładka "3D (Eksperymentalne)" i capability flag; następnie adapter 3D do rejestru z rzeczywistymi rendererem, eksportem, testami i komunikatem niedostępności tam, gdzie brak WebGL2.

Ustawienia minimalne: `rotationSpeed`, `planetRadius`, `colorA/B`, `ringTilt`, `ringOpacity`, `atmosphereStrength`, `cameraDistance` — ograniczone do bezpiecznych zakresów, z debounce dla cięższych zmian i bez wymuszania przebudowy shaderów.

## 9. Eksport: cele i prawdziwe ograniczenia

| Cel | Co trzeba zrobić | Status tej dokumentacji |
|---|---|---|
| Podgląd w przeglądarce | Three.js WebGL2 + warstwa Canvas, fallback gdy brak WebGL2 | PLAN |
| HTML offline dla Lively / Wallpaper Engine | Vite bundled JS+asset manifest, standalone startup, pełne ścieżki lokalne, brak tokenów, host pause | PLAN / TEST HOST REQUIRED |
| StreamElements Custom Widget | zweryfikować, czy kompletny bundle JS/WebGL2 uruchamia się w OBS/SE, limit kodu, zasobów i politykę eventów; WebGL może nie być dostępny | PLAN / UNKNOWN |
| PNG, GIF | render do `WebGLRenderTarget`, odczyt RGBA + odwrócenie orientacji Y, synchronizacja, kompozycja CSS/Canvas | PLAN |
| WebM / MP4 | osobny pipeline klatek + encoder + muxer, MIME/capability check; MP4 nie powstaje automatycznie z WebGL | OUT OF MVP |
| Android | po sprawdzeniu MP4/własnej aplikacji; WebGL2 nie jest automatycznie natywną WallpaperService | OUT OF MVP |

**Nie używać `preserveDrawingBuffer: true` jako domyślnego obejścia eksportu.** Potrzebny kontrolowany render do osobnego targetu i `readRenderTargetPixelsAsync` gdzie dostępne. Wideo wymaga kompozycji DOM i WebGL oraz zapewnienia właściwych timestamps, nie tylko snapshotu `html-to-image`.

StreamElements: jeśli host nie obsługuje WebGL2 albo ma problem z kodem, zachować obecny 2D widget i zaoferować jasny fallback; nie deklarować dostępności SE 3D przed E2E.

## 10. Wydajność: minimalne wymagania testowe

Przed GO dla użytkownika:
- Docelowe **30 FPS** przy 1920×1080 Balanced, budżet średni 33,3 ms/klatkę; pomiar p50/p95/p99 i rzeczywistych dropów FPS. Nie deklarować bez uruchomienia benchmarku.
- Co najmniej dwa profile sprzętu: budżetowy iGPU oraz dedykowane GPU; sesje 5–10 min, wielokrotne przełączanie scen.
- Viewport: 1366×768, 1920×1080, 3440×1440, 3840×2160 oraz 1080×1920.
- Ograniczać DPR i rozdzielczość renderowania; osobna pula jakości `Lite/Balanced/Ultra`.
- Preferować `THREE.Points` / `THREE.InstancedMesh` zamiast tysięcy DOM elementów dla gwiazd/cząstek.
- Reużywać geometrię/materiały, bez tworzenia `WebGLRenderer` lub nowych shaderów przy poruszaniu suwakiem.
- Na `dispose()` zwalniać `geometry.dispose()`, `material.dispose()`, `texture.dispose()`, post-processing, render targets, event listeners, zatrzymywać rAF. Test utraty/odzyskania kontekstu `webglcontextlost/restored`.
- Sprawdzić brak narastania pamięci/zasobów po 100 zmianach sceny, brak pętli w niewidocznej tapecie, działanie fallback 2D.
- Nie dodawać interakcji myszy do canvas domyślnie: w tapecie kliknięcia mogą być przekazywane inaczej przez host.

Dla Bloom dopiero po stabilnym base POC: `EffectComposer`, `RenderPass`, `UnrealBloomPass`. Postprocessing może znacząco zwiększyć czas GPU przy 4K, więc musi mieć przełącznik OFF i pomiary.

## 11. Konkretny kontrakt pracy dla roju

| Fala | Wykonanie | Deliverable | GO/NO-GO |
|---|---|---|---|
| G0 (P0) | Zweryfikować źródło R1 i zatwierdzić branch bazowy, porównać z audytowaną gałęzią | SHA/tree manifest, lista różnic | OWNER GO |
| POC-01 | Dodać `three` i izolowaną stronę demo z kodem §6; bez integracji z edytorem | screen + wersja paczek + `typecheck/build/test` | WebGL2 działa, fallback działa |
| POC-02 | Zastąpić materiał planety prostym GLSL, dodać pierścień i kontrolę parametrów | kadr 0s / 5s / 10s i porównanie | brak błędów shader compile |
| POC-03 | Trwały canvas, wspólny scheduler, zintegrowany podgląd i suwaki | Draft PR + brak wycieków przy 100 zmianach | QA lifecycle |
| POC-04 | Zapis/odczyt V2 + migracja V1 + undo/redo, bez zmian istniejącego SE | testy migracji, sample V1/V2 | SE V1 regression PASS |
| POC-05 | Eksport offline HTML, osobny spike PNG/3D | ZIP, SHA, host tests Lively/WE | offline / host verified |
| POC-06 | Wybór dalszych funkcji (nebula, atmosfery, video, Android) | ADR i nowe issue | OWNER GO |

**Minimalny PR POC-01 nie może zmieniać** `src/export/streamElements.ts`, `src/scenes/scenes.ts`, `src/media/mediaExport.ts`, routingu produkcyjnego ani Replit. To umożliwia bardzo niski koszt testu technologii przed cięższą integracją.

### Testy i dowody dla każdego PR
- `pnpm --filter animated-effects run typecheck`
- `pnpm --filter animated-effects run test`
- `pnpm --filter animated-effects run build`
- Rejestrować komendę, wynik, exit code, SHA, przeglądarkę/GPU oraz czy był prawdziwy manualny test OBS/SE/Lively.
- Smoke: 2D-only scene, 3D-only scene, mixed scene, pauza, seek w obu kierunkach, resize, restore context, offline render, import V1; bez dopisywania fikcyjnych PASS.
- Draft PR + raport + regresja + niezależny QA. Żadnego merge/deploy bez owner GO.

## 12. Kryteria ukończenia pierwszego etapu

- [ ] Bez WebGL2 edytor nadal działa w 2D i pokazuje jasny komunikat (bez crasha).
- [ ] Jedna planeta 3D jest wyświetlana wewnątrz izolowanego prototypu w istniejącym pakiecie Vite.
- [ ] `renderAt(5000)` daje spójny kadr, bez opierania się na `Date.now()`.
- [ ] `resize` i `dispose` nie pozostawiają dodatkowych kontekstów i timerów.
- [ ] `pnpm` typecheck/test/build uruchomione i udokumentowane, nie tylko zadeklarowane.
- [ ] Brak zmiany aktywnych 2D animacji, StreamElements i plików V1 w POC-01.
- [ ] Owner po raporcie decyduje czy integrować POC z edytorem.

## 13. Materiały techniczne (dokumentacja oficjalna, 2026-11-01)

1. Three.js — WebGLRenderer (WebGL2 required): https://threejs.org/docs/pages/WebGLRenderer
2. Three.js — WebGL capability test: https://threejs.org/docs/pages/WebGL
3. Three.js — ShaderMaterial i GLSL: https://threejs.org/docs/pages/ShaderMaterial
4. Three.js — asynchronous readRenderTargetPixelsAsync: https://threejs.org/docs/pages/WebGLRenderer
5. Three.js — GPU memory and resource lifecycle: https://threejs.org/manual/pages/cleanup.html
6. Three.js — InstancedMesh: https://threejs.org/docs/pages/InstancedMesh
7. Three.js — EffectComposer: https://threejs.org/docs/pages/EffectComposer
8. Three.js — UnrealBloomPass: https://threejs.org/docs/pages/UnrealBloomPass
9. Three.js — GLTFLoader for later Blender assets: https://threejs.org/docs/pages/GLTFLoader
10. MDN — WebGL2RenderingContext: https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext
11. MDN — webglcontextlost: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/webglcontextlost_event
12. Three.js — WebGPURenderer (separate future backend): https://threejs.org/manual/pages/webgpurenderer

**Kolejna czynność:** A00 wyznacza wykonawcę i dopiero po synchronizacji #152 zatwierdza minimalny POC-01. Samo opublikowanie dokumentu nie jest autoryzacją implementacji.
