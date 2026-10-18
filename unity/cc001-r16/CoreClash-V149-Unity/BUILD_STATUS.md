<!-- R16 CURRENT -->
# Aktualny stan: R16 / 18.10.2026

Źródła R15 zostały rzeczywiście sprawdzone i rozwinięte. 269 testów C# PASS; gotowość:42 UNITY_READY /51 PARTIAL /134 DATA_ONLY. StandaloneWindows64: Succeeded; WebGL: Succeeded; Android: Succeeded.

Czytaj [handoff R16](HANDOFF_R16_README.md), [raport R16](docs/R16_REPORT_PL.md), [wykonane QA i ograniczenia](docs/R16_QA_PL.md). Aktualny rejestr: Evidence/R16/ability-support.json. Roster, statystyki,36 kanonicznych i4 featured talii oraz HTML niezmienione. Brak publikacji.

**Poniżej zachowany opis historyczny R9; jego liczniki i buildy nie są aktualnym wynikiem R16.**
<!-- R16 END -->

# V149 R9 build and runtime status

Unity **6000.4.0f1**; Windows, WebGL and Android SDK/NDK/OpenJDK installed. One C# gameplay/physics source and authored NGO scene are shared. R9 adds Mine/Time Bomb/Bomb trigger separation, symmetric Mine contact and one-time safety settlement, continuing R8 momentum mechanics. Imported statistics, catalog and featured definitions remain unchanged.

| Target | Current scope | Artifact / evidence |
| --- | --- | --- |
| Windows x64 | DONE — release build, rendered pointer launch and complete local match; three additional staged explosive captures | `Builds/Windows/CoreClash.exe`, `Evidence/build-StandaloneWindows64.json`, `r9-native/r6-native-runner.json`, `r9-native-html/r9-html-runner.json` |
| WebGL | DONE — new build, real Relay armed Mine/two-turn fuse sync, LAN and phone gesture regression; older full device matrix/lifecycle retained | `Builds/WebGL/index.html`, `Evidence/build-WebGL.json`, `r6-webgl-r9-phone-smoke.json`, `r9-internet-smoke.json` |
| Android ARM64 / IL2CPP | DONE build/package verification; NOT TESTED on hardware | `Builds/Android/CoreClash.apk`, `Evidence/build-Android.json`, `android-package.json` |
| iOS native | NOT STARTED | Browser path exists; Safari/iOS runtime NOT TESTED |
| Public website | PARTIAL — older build already hosted and audited; R9 NOT PUBLISHED | Supplied Replit URL; separate `CoreClash-Hosting-Audit-20261017/RAPORT_AUDYTU.md`. No website synchronization/deployment in R9. |
| HTML legacy | Retained independent presentation | `Legacy/core_clash_v149_legacy_presentation.html`; unchanged in R6 |

All three latest builds succeed with **0 errors / 1 warning** each. The warning is ServicesCore's Editor project-link/login check; a real Runtime Project ID is embedded and actual Windows/WebGL Authentication + Sessions + Relay WSS succeeded. Warning counts are preserved in the build reports.

The Android package is signed for local testing, API26 minimum, ARM64-only, IL2CPP with INTERNET permission. Seven package/signature checks pass; no physical-device install or store publication is claimed.

## Reproduce

```powershell
dotnet run --project Tests/CoreClash.Tests.csproj -- .
./Tools/build.ps1 -Target Windows
./Tools/build.ps1 -Target WebGL
./Tools/build.ps1 -Target Android
node Tools/r6-shell-test.cjs
node Tools/verify-data.cjs
node Tools/network-codec-test.cjs
node Tools/r9-source-explosives.cjs
node Tools/r6-webgl-smoke.cjs --only=phone-portrait --tag=r9-phone
./Tools/r9-native-html-smoke.ps1
./Tools/r6-native-smoke.ps1 -VisiblePlayer -OutputDirectory Evidence/r9-native
node Tools/r6-internet-smoke.cjs --tag=r9 --explosives
node Tools/lan-runtime-smoke.cjs --output=Evidence/r9-lan
node Tools/verify-android.cjs
./Tools/cloud-status.ps1
node Tools/r9-seal-delivery.cjs
```

Only one Unity Editor/build can own the project at once. WebGL builds refresh Windows/WebRoot. Keep the entire Windows directory, including that WebRoot. WebGL requires HTTP serving with `application/wasm`, not `file://`; use `Tools/start-webgl.ps1` for loopback. `Tools/sync-web-shell.cjs` can regenerate only the static HTML from its source template without changing the compiled runtime.

The native runner needs a visible test window for real GUI repaint and cleans up its own process. Browser automation uses ordinary UI and real mouse/browser touch events. R9 repeats 30 phone checks/21 captures and a complete rendered Windows match, plus real network flows. Three additional renderer captures stage arming, countdown and blasts; they do not claim a legal empty-board match. The images/contact sheets were inspected. The eight-profile R6 matrix and R7 Cloud lifecycle suite remain historical, not repeated R9 coverage. Current source/build hashes are sealed in `Evidence/delivery-manifest.json`; earlier R2–R8 reports remain historical. Use the R9 seal for this source tree. The old seals deliberately enforce their historical scope.
