# Core Clash V149 Unity — R9 source handoff

Snapshot date: 17 October 2026, Europe/Warsaw.
Canonical local commit: 6d2be67f8805576cf9341e6df3286bda92af59b6.
Branch: exp/cc-v149-class-demo-unity-port. No Git remote configured in the local Unity repository at snapshot time.

This is a compact source/context bundle for continuing work in ChatGPT or another environment. It is NOT a new gameplay revision and is NOT the runnable full class-demo distribution. No game, website, ability, deck or imported statistic was changed to create it.

## Contents

- CoreClash-V149-Unity/: tracked source/data, Unity Assets/Packages/ProjectSettings, tests, tools, docs, JSON evidence and legacy presentation HTML.
- Five selected renderer/browser PNGs for visual context; other screenshots/logs/build binaries are omitted to keep this archive compact.
- Reference/V148_reference_original.html: byte-identical certified HTML reference. Its SHA256 matches catalog.sourceSha256.
- Reference/HOSTING_AUDIT_20261017.md: historical read-only audit of the older public deployment, not R9 deployment proof.
- HANDOFF_MANIFEST.json: hashes of all included payload files, plus local source/baseline provenance.

## Start here

Read MIGRATION_STATUS.md, README.md, docs/PROPOSED_DESIGN.md (latest amendments override old wording), FEATURED_DECK_PORT_STATUS.md and docs/R9_REPORT_PL.md. Then inspect Data/AbilitySupport.cs and Evidence/ability-support.json before assuming an ability exists.

V149 is the gameplay/spec version. R9 is the current local implementation revision. V148 HTML is a reference/catalogue, not a requirement for exact physics/event/timing parity. Preserve the physical turn-based PvP concept, full roster, nine-ball decks and approved exact four featured presets. Do not rebalance abilities to force combos or silently remove data-only balls.

At snapshot time: 227 records (Standard + 224 specials + 2 hidden tokens), 36 canonical decks, 4 data-driven provisional CLASS DEMO decks; readiness 37 UNITY_READY / 32 PARTIAL / 158 DATA_ONLY. Featured readiness 31 ready / 5 partial. Tests: 180 C# and 13 wire checks. Windows, WebGL and Android builds exist in the separate full distribution. Hardware/cross-NAT acceptance remains untested.

## Environment limits

Unity 6000.4.0f1; pure simulation tests target .NET 9. Unity/Android modules and browser harness dependencies must exist in the execution environment. Several Tools scripts contain this machine's Windows paths to Unity, Playwright, SDK and the certified HTML in Downloads. The catalog sourcePath is provenance for that local path; it is not a portable content URI. Use Reference/V148_reference_original.html in an environment-specific working copy; do not change the reference bytes or ability statistics.

The inherited delivery manifest describes full local build artifacts that are deliberately not in this compact bundle. Old R6/R7/R8 seals enforce their own historical snapshots; do not treat their failure on R9 or on a source-only bundle as a new game regression. Tests and builds must be actually run before claiming new verification. The compact source bundle itself was hash-verified against the R9 workspace.

Only the host simulates gameplay/physics. Clients send intent and render host snapshots/events. Internet uses NGO + Unity Transport + MPS Sessions/Relay WSS; LAN has Windows UDP discovery and browser invitations. Do not attempt HTML/JavaScript crossplay with Unity. No deployment is authorized by this handoff.

The repository C8LyNn/aplikacja-turnieje and Replit Tournament Replicate are the WEBSITE integration, not a confirmed remote copy of this current Unity source. The public WebGL is older; current R9 is local. Preserve existing website functions, use separate branches/PRs, and obtain separate approval before synchronizing/publishing Replit.

## Full runnable package on the user's computer

C:/Users/kubap/Desktop/CoreClash-V149-ClassDemo-R9.zip
145478558 bytes; 1141 entries.
SHA256: E1B9FBFF1D477E9CC4B0191856210E7BB4B9E065686B1A34300C114A12AC0785

Detailed R9 Google Doc (additional context, not the complete project handoff):
https://docs.google.com/document/d/1Ik0sGr1y2bk4qgeF7uuQpGQQGvAjU-dezQEDsNyX4Qg
