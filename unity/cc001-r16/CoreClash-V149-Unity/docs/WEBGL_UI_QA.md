# Actual Unity WebGL browser QA

Historical R1 record. Current presentation, screenshots and acceptance evidence are in [R3 visual comparison](R3_VISUAL_COMPARISON.md) and `Evidence/r3-webgl-smoke.json`; [R2 comparison](R2_VISUAL_COMPARISON.md) remains the earlier baseline. `Tools/webgl-smoke.cjs` now runs R3 by default; `--historical-r1` retains the original coordinates for an R1 artifact only.

The updated `Builds/WebGL` build was launched in an isolated headless Microsoft Edge browser on 2026-10-15. This checks the compiled Unity build, including its actual canvas input and rendering. It does not rebuild Unity or validate source changes made after that build. The test scope is the exact file hashes in `Evidence/webgl-smoke.json`; a subsequent rebuild needs a new run.

The tested build boots and logs `CORE_CLASH_READY V149 catalog=227 canonicalDecks=36 featured=4`. The automated run completes without page errors, browser warnings, or console errors. Exact SHA256 values for the tested HTML, data, framework, loader, and WASM are recorded in `Evidence/webgl-smoke.json`.

## Reproduce

From the repository root, serve the uncompressed build locally:

```powershell
node Tools/serve-web.cjs --port 8080
```

Open `http://127.0.0.1:8080/`. The server binds **127.0.0.1 only**, uses `application/wasm` for WASM, rejects directory traversal and symlink escapes, and serves files only under the build root. `--root` can select a different static build folder. Stop the server with Ctrl+C.

Run the self-contained browser smoke check:

```powershell
node Tools/webgl-smoke.cjs
```

The script starts its own ephemeral loopback server, launches isolated headless Edge with `--enable-unsafe-swiftshader --use-gl=angle --use-angle=swiftshader`, captures evidence, then closes browser contexts and the server. `--boot-only` performs a shorter boot capture. The local desktop sandbox requires approved elevated execution for the isolated browser; no personal browser profile is used.

The default builder fixture matches the current first preset, DEATH ENGINE. After a rebuild changes that first preset, pass its actual compiled nine IDs explicitly:

```powershell
node Tools/webgl-smoke.cjs --initial-ids=agony,requiem,bonfire,wildfire,soulburst,reclaimer,gravehide,packheart,cascade
```

The script validates all four approved featured names and each exact nine-ID list against the source JSON and records that JSON with its hash. Actual GUI screenshots verify the four compiled names. The custom builder checks the nine compiled DEATH ENGINE members; the script reads their display names from the unchanged source catalog.

## Verified behavior

- Correct WASM MIME type and traversal rejection.
- Desktop application boot, setup, and deck builder rendered.
- Canvas search and card clicks remove nine default choices, showing **0/9**; then select nine, showing **9/9**.
- Use This Deck and Start produce `CORE_CLASH_MATCH_START custom_0 vs featured_status_reactor`.
- Mouse drag from the glowing bottom launcher toward the center produces one `CORE_CLASH_LAUNCH owner=0 type=normal` and a visible ball.
- After movement resolves, the inspected screenshot shows **TURN 2 / 50 · PLAYER 2**, **P1 20 HP / P2 19 HP**, and the upper launcher active.
- Android-emulated 390×844 portrait boots and starts a local match. The board and ten ball choices fit.
- Emulated touch cancellation emits no launch and clears the aim; a subsequent completed touch gesture emits exactly one launch and visibly spawns Standard.
- The match responds to an 844×390 landscape resize. Dragging the actual side scrollbar exposes the final stock row and Ball Details / Match Setup. Clicking that scrolled Match Setup, then Start, logs another match start.
- The four compiled names fit in portrait: **DEATH ENGINE**, **STATUS REACTOR**, **GRAVITY TRAP**, and **REALITY HACKERS**.

Screenshots under `Evidence/webgl-*` were visually inspected. `webgl-visual-review.json` records visual assertions separately from automatic console/assertion checks.

## Current UI findings

The expanded portrait LAN panel now has an **opaque backdrop**, verified in the final compiled build. Underlying headings no longer bleed through its address/status controls. It temporarily covers the setup heading while expanded, and collapses with LAN. See `Evidence/webgl-network-panel-portrait.png`. No remaining Important UI finding was identified in this tested scope. This UI run did not itself host/join; the separate real network smoke passed against the same final artifacts.

The two first-build findings are **fixed in this tested update**: long featured names are readable in portrait, and lower landscape controls are reachable through the new scrollbar. Evidence: `webgl-setup-portrait.png`, `webgl-match-landscape-scrolled.png`, and `webgl-setup-landscape-return.png`.

QA made no changes to build files, Unity code, catalog, or featured data. The script confirms the compiled files have identical hashes before and after its run. It closes its isolated browser and loopback server after completion.

Software rendering and emulated touch establish a browser execution path. They do not establish physical-device performance, full gameplay parity, all ability behavior, networking, or production readiness.
