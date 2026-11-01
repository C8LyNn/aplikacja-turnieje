# AE-WALLPAPER-003 — Advanced Scene Engine: WebGL / WebGPU / Unity / Unreal

Status: **RESEARCH ADDENDUM / OPTIONS — NOT IMPLEMENTED**  
Data: 2026-11-01  
Repository: \`C8LyNn/aplikacja-turnieje\`  
Cross-reference: [AE-WALLPAPER-001](./AE-WALLPAPER-001-RESEARCH-2026-11-01.md), [AE-WALLPAPER-002](./AE-WALLPAPER-002-DECISION-GATES-2026-11-01.md), [Issue #274](https://github.com/C8LyNn/aplikacja-turnieje/issues/274), synchronization [#152](https://github.com/C8LyNn/aplikacja-turnieje/issues/152)

## Executive recommendation

**Approve a limited technology proof-of-concept using Three.js + WebGL2 for in-browser procedural 3D scenes. Keep Unity Web and Babylon.js as explicit comparison spikes; use Unreal primarily to produce offline assets/videos, not as the runtime for a downloadable browser wallpaper. Treat Three.js WebGPU as an experimental track, not the production baseline.**

Reason: The existing Animated Effects editor is TypeScript/Vite and exports DOM-based StreamElements widgets; WebGL2 integrates without a heavy WASM build and can share a local runtime across Chrome/OBS Browser Source, Lively/Wallpaper Engine (test required), and future video exports. Unity Web is technically possible but introduces build/runtime weight and separate C# ↔ JS control. Official UE5 delivery to browsers is Pixel Streaming from a separately running GPU application/server, not native UE5 WebGL export.

**No change to production or implementation is authorized by this document.** Canonical source of truth and source sync are unresolved per #152.

## 1. Source audit — confirmed observations

Read at \`codex/animated-effects-scene-portability-export-kit\`:
- \`artifacts/animated-effects/src/core/types.ts\`: \`EffectDefinition\`, \`EffectInstance\`, \`EditorState\`, palette, \`Resolution\`, CSS-oriented settings, timeline and StreamElements trigger. No \`renderBackend\`, 3D camera, 3D geometry/material scene node or renderer lifecycle contract.
- \`artifacts/animated-effects/src/effects/effectModules.ts\`: ~175 KB / ~6,929 lines in one source file. \`EffectModule\` has \`definition\`, \`css\`, \`streamElementsRendererName\`, \`streamElementsRendererSource\`, \`renderPreview(layer, settings, seededRandom)\` and \`estimateDomNodes\`; there is no generic \`mount/update/seek/dispose\`. Some implementations use \`requestAnimationFrame\` (e.g. Pong) and self-exit when \`layer.isConnected\` becomes false; do not assume every future GPU resource will be automatically released by DOM removal.
- \`artifacts/animated-effects/src/effects/registry.ts\`: module registry collects legacy and pack06/07/08/09 effect modules, maps effect IDs, de-duplicates by ID. Existing effects (e.g. \`orbital-rings\`, \`spiral-galaxy\`, \`black-hole-accretion\`) are CSS/DOM effects and **not evidence of a general WebGL 3D scene engine**.
- \`artifacts/animated-effects/src/editor/preview.ts\`: directly creates DOM layer and inserts CSS timeline/motion wrappers; \`ensureModuleStyles\` joins CSS from all effect modules.
- \`artifacts/animated-effects/src/main.ts\`: \`renderPreview()\` clears preview via \`preview.replaceChildren()\` then recreates layers. For a WebGL renderer this must not imply uncontrolled context creation, shader compilation or lost resources every state update.
- \`artifacts/animated-effects/src/export/streamElements.ts\`: \`generateStreamElementsExport\` creates HTML/CSS/JS and initialization on \`onWidgetLoad\`; StreamElements triggers are host-specific, so a generic browser runtime needs standalone startup.
- \`artifacts/animated-effects/src/media/mediaExport.ts\`: createFrame builds a hidden iframe from StreamElements export, manually dispatches \`onWidgetLoad\`, pauses/seeks \`document.getAnimations()\`, then captures via \`html-to-image.toCanvas\`. **WebGL canvases are not automatically guaranteed in this DOM-snapshot pipeline.** 3D capture needs explicit render/readback or validated compositing (WebGL framebuffer / WebGPU readback) with a deterministic scene time.
- \`artifacts/animated-effects/src/scenes/scenes.ts\`: version 1 JSON with normalization and roundtrip. Renderer changes must preserve existing \`.aescene.json\` compatibility.
- \`artifacts/animated-effects/package.json\`: Vite, TypeScript, gifenc, html-to-image, jszip; no Three.js/Babylon.js installed in the audited branch. This does NOT prove absence on current Replit R1.

Integration on \`codex/replit-visual-polish-handoff\` has \`OBS Lab\` and static \`/stream/animated-effects/index.html\`. \`main\` is behind R1 per #152. No browser/native-host performance tests executed here.

## 2. Technology decisions

| Option | Browser-local/OBS | Windows wallpapers | Mobile video | Dev productivity | Major drawback | Decision |
|---|---|---|---|---|---|---|
| Three.js + WebGL2 | YES, host/browser test | Web HTML target; verify Lively/WE | Capture from Canvas pipeline | Native TS/Vite; reusable shader library | Need implement own procedural FX/editor adapters | **Recommended P0** |
| Babylon.js + WebGL2/WebGPU | YES, test | Web HTML target; verify | Canvas pipeline | Node Material Editor, inspector, more complete scene tooling | Different abstraction/vendor choice, compare complexity/bundle | **P0 comparative spike** |
| Three.js WebGPURenderer + TSL | WebGPU with WebGL2 fallback where supported | depends on host WebGPU availability | readback and postprocess differ | modern GPU compute/TSL | WebGPURenderer still experimental; \`ShaderMaterial\`/\`EffectComposer\` do NOT migrate directly | **P2 experimental** |
| Unity 6 Web + WebGL2 | YES with compatible browser and hosting | Host-specific packaging test | separate video/capture bridge | Unity URP, Shader Graph, Timeline, VFX workflows | larger WASM/assets, load time/memory, separate C#/JS/host interface; local file & server header issues | **P1 conditional spike** |
| Unity Windows standalone EXE | NO, not browser widget | Lively *application wallpaper* supported only in compatible installation, security/install concerns | separate native export | native engine quality | Not self-contained HTML; users download/launch EXE | **Separate product, not default** |
| Unreal Engine 5 | No official native modern UE5 WebGL build | standalone EXE possible but not Web HTML | render offline video | cinematic Nanite/Lumen/Sequencer | Pixel Streaming needs GPU app/server/network, expensive per session | **Offline renderer only by default** |

**Technical corrections/constraints:** 
- Unity 6000.3 officially supports WebGL2, with WebGPU an **experimental** graphics API where supported; browser/mobile compatibility is not the same as guaranteed Lively/OBS compatibility. Unity recommends caution about memory, threads, real-time GI/shader and web delivery.
- Three.js WebGPURenderer can fall back to WebGL2, but ordinary \`ShaderMaterial\` / \`RawShaderMaterial\` and legacy \`EffectComposer\` do not directly work with the new renderer; WebGPU path needs TSL/node materials and separate post effects.
- UE HTML5 support was moved out of official Unreal Engine releases after UE4-era platform work. UE5 Pixel Streaming streams server-side frames and input through WebRTC. A per-user, offline WebGL/HTML wallpaper is not created by Pixel Streaming.
- Lively supports web wallpapers and application/executable wallpapers. Lively official wiki warns about fullscreen modes and notes limitations of app wallpaper behavior. Do not describe importing untrusted executables as safe; browser-hosted HTML is preferred.

## 3. Proposed engine architecture (ADR candidate)

Separate *scene data*, *render technology* and *runtime target*:

\`\`\`text
Animated Effects editor (existing controls, layers, presets, scenes)
         |
SceneDocumentV1 + backwards-compatible 3D extension
         |
SceneGraph / ParameterStore / deterministic SceneClock
         |
+----------------------------+-----------------------------+
| CSS/DOM 2D Renderer        | WebGL2 3D Renderer (Three) |
| existing legacy effects    | planets, shader fog, rings  |
+----------------------------+-----------------------------+
         |
FrameCompositor / SceneCapture / ResourceLifecycle
         |
+---------------+-------------------+--------------------+
| StreamElements| Lively/WE HTML ZIP| WebM/MP4 exporter  |
+---------------+-------------------+--------------------+
\`\`\`

**Planowane kontrakty, nie istniejący API:** 
- \`SceneClock.setTime(ms)\`, \`start()\`, \`pause()\`, \`seek(ms)\`; supports exact time, seed and fixed export duration.
- \`RenderableLayer.mount(host)\`, \`setParameters(changes)\`, \`renderAt(timeMs)\`, \`resize(width,height)\`, \`pause()\`, \`dispose()\`.
- \`RendererCapabilities\`: webgl2, webgpu, maxTextureSize, maxRenderTarget, supportedFormats, maxFps profile; runtime feature detection, no fake availability.
- \`SceneNode3D\`: mesh / material / transform / light / camera / particle emitter / shader params / optional animation clips; scene serialization must store declarative values, **never arbitrary JS or shader code from untrusted uploads**.
- \`SceneCapture.captureAt(t,width,height)\`: compositing DOM + WebGL layers with explicit pixel readback; source timestamps match encoder input timestamps.
- \`HostAdapter\`: OBS events only in StreamElements; standalone HTML boot on document ready; Lively/WE pause + host settings optional; VideoHost supplies synthetic time and no live event triggers.

Keep existing \`EffectModule\` as legacy adapter; do not require porting 2D presets to new system. Extract coherent modules only after tests are in place; don't rewrite all 175KB at once.

For V1 JSON, prefer a formally versioned additive \`sceneNodes\` or \`layers3d\` envelope with migration/unknown-field policies; keep legacy files loading unchanged. A hard v1 parser rejects wrong versions, so schema/version strategy needs tests before change. Document possible fallbacks for new files opened in old editor.

## 4. First visual demonstration: Cosmic Giant 3D (MVP)

Create one preset with no copyrighted images/models and no runtime network:
1. Sphere geometry (gas giant) with procedural latitude/noise/material; planet surface rotation independent of clouds.
2. Thin atmosphere shell with Fresnel rim and independently controlled color/glow.
3. Tilted translucent rings with radial texture, noise and optional shadow/occlusion; avoid overdraw by using alpha test as feasible.
4. Starfield as GPU points/instanced sprites; no thousands of animated DOM nodes.
5. Nebula background: 2D texture or low-cost procedural shader on sky geometry; no costly volumetric raymarching in first version.
6. Bloom/post processing: WebGL2 via \`EffectComposer\` / \`UnrealBloomPass\`, only after base render stable; note WebGPU path requires separate stack.
7. Mouse-driven camera parallax as optional desktop feature, with frame-rate independent smoothing; disable if host doesn't pass input.
8. Deterministic timeline with fixed seed and user-controlled planet spin, rings tilt, atmosphere intensity, camera motion, color.
9. Poster/PNG and 5–10 s loop video export via explicit framebuffer capture in a **separate spike**.
10. Quality profiles Lite/Balanced/Ultra via render resolution scale, ring quality, nebula passes, particle count and target FPS, backed by measurements, not brand names alone.

**Acceptance:** same scene JSON -> matching composition in browser and exported offline HTML at 1920×1080; correct at portrait 1080×1920, ultra-wide 3440×1440, 3840×2160; no nonlocal network requests. No more than one active WebGL context per preview instance and clean disposal on scene switch. WebGL context lost/restored test; independently verified SE regression.

## 5. Unity WebGL comparative spike (must not displace Web-first MVP)

A limited parallel spike with Unity **6000.3 LTS / URP** (pin exact project editor version and packages in report):
- Single gas giant scene with equivalent basic settings and no large external assets; WebGL2 build, conservative quality, no GI features unsupported in Web; optional experiment with Unity WebGPU only if labeled experimental.
- HTML bridge via \`unityInstance.SendMessage\` and \`.jslib\` calling out to JS; contract: \`setScene(json)\`, \`setTime(ms)\`, \`setQuality(x)\`, \`pause()/resume()\`, \`captureFrame()\` if supported.
- Measure network download/build artifacts .wasm/.data/.js, cold/warm time to first visible frame, GPU/CPU memory, idle and busy FPS, audio/visibility behavior, browser warning/error logs.
- **Critical risk:** local file loading / packaged wallpaper host may need proper MIME types, HTTP compression headers, and/or a local web server. A simple offline \`index.html\` may not load Unity Web compressed artifacts in the target host. Prove or falsify in Lively and WE; no workaround requiring remote production services without approval.
- Evaluate 2 options: embedded Unity Web canvas with shared HTML controls vs Unity-rendered frames/baked assets imported into the WebGL-first renderer.
- Unity Web C# ↔ JS integration is possible; question is cost and export portability, NOT whether it is theoretically possible.
- Unity standalone EXE/Lively application wallpaper is a separate Windows-only packaging path; do not conflate it with StreamElements or mobile HTML exports.

**Unity GO criteria:** demonstrate a feature impossible/very costly in Three.js, acceptable source size/load and memory on baseline machine, reliable preview + wallpaper host + video path, editor data contract, no extra source-sync risk. Otherwise choose Three.js.

## 6. Unreal Engine comparative spike (offline-first)

Use Unreal for **cinematic content production**, e.g. high fidelity planets/nebula animation rendered into high-quality frame sequence or intermediate video, imported into Animated Effects as video background/texture. Retain responsive overlays and interactive GPU planet/particles in the web renderer if needed.

Only investigate UE Pixel Streaming if business case explicitly requires remote high-end GPU scenes with concurrent user sessions and a measured budget. Architecture would require UE app running on a host/server, encoder, signalling/STUN/TURN infrastructure, WebRTC, per-session compute + network cost, latency, privacy and uptime. **This is not offline Windows wallpaper export**. Do not make Pixel Streaming first-path architecture for a consumer animation creator.

## 7. Performance / regression contract

### Mandatory visual and runtime scenarios
- Browser: Chrome/Edge with WebGL2, offline static host, OBS Browser Source or testable OBS host; host versions and source SHA captured.
- Windows: Lively WebView2 and if possible CEF, Wallpaper Engine import of local HTML folder, fullscreen game pause/resume, display reconnect/multiple monitors.
- Hardware: one entry-level laptop/IGPU and one dedicated GPU; avoid extrapolating from RTX 5080 results.
- Viewports: 1366×768, 1920×1080, 3440×1440, 3840×2160, 1080×1920.
- Events: no WebGL2, context-lost/context-restored, tab hidden/revealed, rapid preset switching, repeated exports and aborts, resizing, missing assets/font/texture, 2D + 3D overlay order, alpha correctness, HDR/bloom clipping, texture color space.
- Animation: continuous preview vs deterministic \`renderAt(t)\` matches within documented image tolerance; no stutter/jumps at loop seam; stable seeds; event-only 2D effects omitted/warned in wallpaper mode.
- Resource lifecycle: log contexts, geometries, materials, textures, render targets, active rAF loops and listeners before and after 100 scene switches. Assert no monotonically growing resources and no dangling renderer after dispose.
- Renderer: measure frame p50/p95/p99, CPU JS cost, GPU time (when reliable), memory, time-to-first-frame, cold-start asset load and exported package size; no invented performance figures.

### Suggested preliminary release thresholds (subject to baseline device approval)
- No GPU context leaks across 100 switches; no uncaught fatal browser errors.
- 30 fps P95 frame budget target 33.3ms for default 1080p Balanced; on lower hardware or higher resolutions allow adaptive downgrade; final threshold after hardware baseline.
- First-frame load and memory caps set **after measurement**, not guessed.
- Same source scene opens in old/new parser; old StreamElements widget event regressions pass.
- Never expose a "Unity/Unreal WebGL" option unless corresponding implementation is actually tested and available.

## 8. Implementation waves for swarm (proposed)

- **W3D-0 — Authority/source gate**: wait for #152 canonical R1 SHA and map actual source; do not mix with W0–W5 of AE-WALLPAPER-002. Output signed/provenance report.
- **W3D-1 — Renderer shell**: new \`src/engine3d/*\`, scene clock, capability probing, empty 3D layer mount/dispose, webgl2 fallback, tests; no UI redesign.
- **W3D-2 — Gas Giant POC**: sphere shader, ring, atmosphere, starfield, nebula and parameter panel; screenshot and performance measurements.
- **W3D-3 — Mixed 2D/3D and persistence**: timeline, save/import, undo, animation/seek, layers and context lifecycle; legacy SE tests.
- **W3D-4 — Portable outputs**: bundle standalone HTML/ZIP with assets and deterministic capture; test Lively + WE, media pipeline.
- **W3D-5 — Compare Unity/Babylon**: bounded prototypes measured against same test harness, prove extra value and runtime cost.
- **W3D-6 — GO decision**: owner + independent QA choose Three.js WebGL2, Babylon, Unity hybrid or hold; separate WebGPU/Unreal feasibility track.

**Deliverables per wave:** isolated branch/draft PR; pinned base/head SHA; exact changed files; build/test commands+exit status; screenshots and runtime metrics; risk register; independent QA; explicit owner GO before merge/release. No production deployment in research waves. Replit only by the authorised coordinator on #152.

## 9. Official and upstream references (checked 2026-11-01)

- Three.js WebGPURenderer WebGL2 fallback and migration limitations: https://threejs.org/manual/pages/webgpurenderer
- Three.js GLTFLoader and supported compressed assets: https://threejs.org/docs/pages/GLTFLoader
- Three.js KTX2 textures: https://threejs.org/docs/pages/KTX2Loader
- Babylon.js Node Material Editor, WebGL/WebGPU: https://doc.babylonjs.com/features/featuresDeepDive/materials/node_material/nodeMaterial
- Babylon.js specifications: https://www.babylonjs.com/specifications/
- Unity 6000.3 WebGL2: https://docs.unity.com/en-us/engine/6000.3/manual/platform-specific/webgl/develop/graphics/web-gl2
- Unity 6000.3 WebGPU experimental selection: https://docs.unity.com/en-us/engine/6000.3/manual/platform-specific/webgl/develop/graphics/web-gpu/enable
- Unity Web limitations incl. threading/memory/graphics: https://docs.unity.com/en-us/engine/6000.3/manual/platform-specific/webgl/intro/technical-overview
- Unity Web JS bridge: https://docs.unity.com/en-us/engine/6000.3/manual/platform-specific/webgl/develop/interactingwithbrowserscripting/web-interacting-browser-js-to-unity
- Unity compressed build deployment headers: https://docs.unity.com/en-us/engine/7000.0/manual/platform-specific/webgl/building-distribution/deploying (check exact project version equivalent before implementation)
- Lively official Web Player: https://github.com/lively-community/lively/wiki/Web-Player
- Lively official Application Wallpaper: https://github.com/lively-community/lively/wiki/Application-Wallpaper
- Unreal official Pixel Streaming: https://dev.epicgames.com/documentation/en-us/unreal-engine/pixel-streaming-in-unreal-engine
- Epic Unreal Pixel Streaming hardware/encoder needs: https://dev.epicgames.com/documentation/unreal-engine/unreal-engine-pixel-streaming-reference
- Community history of removed UE4 HTML5 target: https://github.com/UnrealEngineHTML5/Documentation/blob/master/Platforms/HTML5/HowTo/README.1.emscripten.UE4.HTML5.md

This addendum compares feasible future designs; **no actual 3D implementation, build, host test, or performance benchmark has been performed**.
