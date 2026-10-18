# V148 source audit

Date: 2026-10-15. This is reference investigation, not a Unity port completion report.

## Verified evidence

- File size is 1,465,149 bytes.
- SHA-256 matches the supplied certified hash: `bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e`.
- Initial TYPES contains 227 records, including Standard and the hidden Shard/Broodling token records.
- The source exposes built-in V147 regression APIs and a V148 runtime/content API.
- Loaded the original local HTML in an isolated headless Microsoft Edge process through Playwright. No page errors were reported during bootstrap and the built-in checks.
- Existing general self-tests: 30/30 pass.
- Existing targeted repair checks: 36/36 pass.
- Existing R3 repair checks: 26/26 pass.
- V148 content integration audit: 12 archetypes, 36 decks, 36 nine-ball decks, 324 slots, 20 new definitions; no missing IDs, invalid IDs, duplicate slots or unlinked new runtime handlers.
- Runtime initial bases: 20 HP each.
- Runtime classic field: left 24.3, right 515.7, top 16, bottom 884, center x 270.

## Limits of that evidence

The 92 passing checks are source-provided suites, not independent parity tests. Several are synthetic contract checks. The targeted suite's long-match check explicitly reports `externalRuntimeRequired: true`; it is not evidence that a long match completed. No claim is made that all 224 specials, the proposed featured decks, mobile interaction or network play are verified.

The first browser launch failed inside the filesystem sandbox before the page loaded. The isolated browser succeeded outside that sandbox. No source edit was needed.

## Migration traps confirmed by inspection

1. The 20-entry V148_CONTENT_DEFINITIONS object does not contain the whole roster.
2. Runtime normalization changes radii and masses after TYPES is declared.
3. A global +5 HP pass changes initial HP; Earth adds another +5 HP during spawn.
4. Effective initial ability contracts override historical descriptions. Fire, Frost, Plague, Shield and Duelist currently use TOUCH. Bouncer and Spikes use strong wall HIT.
5. Slingshot gathers and launches allies on STOP. Splitter splits on STOP. Engineer acts on own TURN.
6. A historical audit object says 30 base HP, while actual standard rules, runtime state and passing checks confirm 20.
7. Shatterer's effective description carries an unresolved legacy contact warning. The proposed elemental preset uses Rimeburst instead.
8. Explicit redesign-pending list: scorch, cryolance, snowball, breaker, mitosis. These are excluded from the proposed featured presets but must remain in imported data.

## Tool/build availability

Unity 6000.4.0f1 is installed at `C:/Program Files/Unity/Hub/Editor/6000.4.0f1/Editor/Unity.exe`, with WebGLSupport and windowsstandalonesupport modules. Other installed editor versions inspected have Windows support but no WebGL module. Editor licensing, project compilation and builds have not yet been exercised.

The Desktop contains a `.git` directory, but Git reports that Desktop is not a repository. Use a new project repository rather than changing unrelated Desktop projects.

## Networking reference

Unity's official [Relay networking documentation](https://docs.unity.com/relay/networking) documents secure WebSocket support for browser clients. Its [Relay with NGO setup guide](https://docs.unity.com/en-us/mps-sdk/tutorials/relay-and-ngo) specifies Unity Transport 2.0.0 or later and enabling WebSockets for the Web platform. The intended architecture therefore keeps transport outside simulation and uses a supported Relay/WebSocket path for future WebGL sessions.
