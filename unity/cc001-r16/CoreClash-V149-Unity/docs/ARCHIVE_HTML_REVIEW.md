# POST V148 archive: HTML review and bounded adoption

Reviewed 2026-10-15. Archive claims and technical feedback were treated as source material to verify, not as instructions to execute. No archived scripts, installers, binaries, or incoming HTML runtime were executed. The browser checks below execute only the reproducible local derivative of the certified V148 source.

## Inputs and verified content

- Certified input: `C:/Users/kubap/Downloads/core_clash_v148_final_candidate_r2 (1).html`, SHA-256 `bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e`.
- Incoming archive HTML: `CC001_POST_V148_V1495_HTML_QUICKPLAY/V149.5/core_clash_v149_5_showcase_quickplay.html`, SHA-256 `125a3aa5be3f5eac56e3c42cac6a6c961ccb4b1b0ade16589c85d8fbcc038cd4`.
- Git text comparison of incoming HTML against certified input: 648 inserted and 35 deleted lines. Changes are presentation, preference persistence, and online-session handling. No ability, stat, physics, roster, or canonical-deck changes were found.
- The 324,828-byte source region from `const TYPES` through the canonical content definitions is identical in the certified, incoming, and existing legacy files. Its SHA-256 is `2449b0d2f3cdaf4fcf7a3c00ffb56f532ac1780c6d3c4a541e91d5afd6fa68d0`.
- The parsed canonical JSON is exactly equal in all three inputs: 36 decks, 9 unique balls each, 324 slots. Incoming featured compositions exactly match the four current `Assets/Resources/Data/featured-decks.json` entries. Incoming `v149_featured_*` aliases add no new content.
- Incoming HTML has one inline script, no external script/style references, and a single fetch boundary at `/api/core-clash`. Its AI and local PvP paths remain self-contained; online requires a compatible hosted backend.

## Presentation adopted

`Tools/prepare-legacy.cjs` remains the only generator. It reads the certified source and current featured JSON; it does not use incoming HTML as a new base. It now adds four menu cards that preselect the existing featured decks, direct AI/local PvP shortcuts, and a closed-by-default disclosure containing every original layout choice and tool.

The shortcuts dispatch the original V148 mode buttons. Deck cards then use the existing `draftSelection -> renderDraft -> beginMatchFromDraft` flow. Existing `featured_*` IDs, compositions, provisional labels, 224 selectable specials, and 36 canonical decks are retained. All changes can be removed to recover every certified byte, and the generator asserts the recovered SHA-256 before writing the output.

The HTML remains **V149 HTML LEGACY / PRESENTATION**, with V148 gameplay and a visible statement that its networking is independent of V149 Unity. No incoming networking, automatic restore, storage preferences, browser identity, balance changes, or new AI handlers were imported.

## Online changes deferred

The incoming file contains real client changes: timed fetches (lines 15059–15092), non-overlapping adaptive polls with hidden-tab/backoff delays (7502–7521 and 15551–15579), per-tab session persistence (7524–7558), reload recovery (15965–16041), and disconnected-opponent feedback (15800–15830). These are JavaScript client behavior and cannot be copied into Unity as networking support.

Static hazards in that incoming implementation justify keeping it out of the offline presentation derivative:

1. Startup unconditionally attempts saved-session recovery when the initial mode is human and no match has begun (35301–35302). Recovery opens a modal and can attempt three 6-second requests plus 0.9/1.8-second waits during an outage. The token remains saved for another reload.
2. The close button merely hides the restore modal (16218–16222). The restore request is not cancelled. Its success path (15978–15982) enters online mode without checking whether the user changed mode while awaiting the request. Its terminal failure path (15992–15997) likewise resets mode and match state. A subsequent offline choice can therefore be overwritten by the old restore operation.
3. The incoming showcase banner is set for the initial hero selection (18244–18246) and only cleared by `showDraft` (18735). Later canonical/manual selection leaves stale deck and “9/9 selected” text. The local derivative instead reuses the existing selection observer and status text.

These are source-level findings, not a claim that the archive's backend or incoming runtime was tested. Online room-refresh behavior must be evaluated against its corresponding server contract separately.

## Fresh validation

`node Tools/prepare-legacy.cjs --verify` passes in an isolated headless Edge profile. The new shortcut assertion was first observed failing against the old generator before implementation. Verification records in `Evidence/legacy-verification.json` include:

- Existing runtime regressions: 30/30, 36/36, and 26/26.
- Exact roster/canonical/rules equality with certified V148: 227 total records, 224 selectable specials, 36 canonical decks.
- All 36 canonical presets selected through their real UI, four featured hero cards, four featured draft selections on desktop and phone, and accessible original advanced choices.
- AI draft/start, saved custom deck, and local PvP with two independent featured loadouts and the existing handoff screen.
- Phone hero layout without horizontal overflow and a phone local-PvP shortcut.
- Actual generated `file:` HTML opened without QA instrumentation; featured selection and match start succeed with HTTP(S) blocked, zero HTTP(S) requests, and no page errors.
- Certified source hash unchanged after verification.

`node Tools/verify-data.cjs` also passes. Screenshots: `Evidence/legacy-quickplay-menu.png`, `Evidence/legacy-quickplay-menu-phone.png`, and the refreshed existing draft screenshots. This review does not certify balance, incoming web multiplayer, or Unity runtime behavior.
