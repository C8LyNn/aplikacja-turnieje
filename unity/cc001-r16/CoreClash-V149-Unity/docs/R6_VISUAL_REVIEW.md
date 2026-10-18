# R6 browser visual review

The final unchanged build passed **82 checks / 94 captures / 8 configurations**, with no browser page exceptions, Unity exceptions or failed build requests. File fingerprints match before and after the run; retained R4/R5 browser evidence also matches.

The matrix covers PC 1280×900; phone 390×844 and 844×390; compact phone 667×375 and 320×568; tablet 768×1024 and 1024×768; phone at browser DPR3. Canvas height excludes the responsive toolbar. Touch, safe-area insets and device density are browser emulation.

Full-size captures and contact sheets were inspected for setup, canonical library, builder, Internet/LAN and Advanced, portrait/landscape arenas, mobile tray, native portals and Relay client state. The 320-pixel logo and mobile arrow glyphs were corrected after inspection. The short landscape library/builder now prioritizes list space and retains ordinary P1/P2 builder controls; the browser test opens a real ball's information, searches using the standard keyboard Done/Enter action, blocks an eight-ball deck and applies the repaired nine-ball custom deck. Very short windows below the tested 325-pixel landscape canvas height remain less comfortable; portrait is the preferred phone setup orientation.

Ordinary pointer tests verify mouse release, canceled touch, accepted fresh touch, resize/rotation, fullscreen entry/visible Exit, profile changes, safe-area geometry, later-card selection through the visible tray arrow and lower controls through scrolling. DOM evaluation reads only the shell and geometry; the harness does not inject game state. The shell's normal UI events cancel pending Unity input explicitly.

NOT TESTED: physical Android/iOS/tablets, Safari, touch hardware, thermal/performance behavior and accessibility certification. Internet service traffic and LAN authority/recovery are separate real-process tests; they do not prove separate physical networks. Native ability readiness, game data and balance are unchanged by this presentation pass.

Evidence: Evidence/r6-webgl-smoke.json, its capture manifest and review sheets. Reproduce with node Tools/r6-webgl-smoke.cjs. Prior failed/diagnostic runs are not delivery proof; only the complete current report is used by the R6 seal.
