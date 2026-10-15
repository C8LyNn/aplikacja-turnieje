# Core Clash V149 — Unity WebGL Migration Demo

**STAGING ONLY — BUILD NOT SUPPLIED / NOT READY TO DEPLOY**

This directory is reserved for the third, separate Core Clash game.

Expected authorized input: `CoreClash-V149-Unity-WebGL-site-deploy.zip` or the
exact corresponding exported `WebGL.zip`.

After the owner supplies the build, place the **unchanged extracted export** here:
- `index.html`
- `Build/` with all actual generated files
- `TemplateData/` if present in the export
- any other files shipped in the same export

Do not synthesize or replace Unity build binaries. Do not use another historical
WebGL archive as a substitute.

Static route: `/prototypes/minigames/core-clash-unity/index.html`.
Application wrapper: `/minigames/core-clash-unity`.

**Before allowing production release**, verify 200/MIME/404/Unity boot,
desktop/mobile/tablet framing, fullscreen behavior, and that the two original
Core Clash HTML artifacts are unchanged.

Multiplayer is intended for LAN/Wi-Fi with a Windows host and WebGL joiner.
Do not market it as public Internet multiplayer.
