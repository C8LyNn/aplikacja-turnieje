# CC-001 R17-W9 — A72 PC1–PC2 native evidence kit

Owner: **A72 / Build & CI**. This is test and evidence tooling, **not** a gameplay/network fix. No edits to the protected RC1 Unity source, R16, V148, Protocol149, CI or main.

## Pinned RC1 production binary (A60 PASS_SCOPED)

- RC1 source SHA: 10f64e4d213f17a352ed8fa83bc75884a39549f0.
- CoreClash.exe SHA256: 97845574417B7FC4DB70BFBAA4D3F941EAB8628DF2BCC9424DBA328D3A6549C3.
- CoreClash_Data/Managed/Assembly-CSharp.dll SHA256: D80AB677155F44FF05BD9FE0972F8833F37BA25AB79CDF7D1F77D60FB418883F.
- Capture script refuses unknown/rebuilt Player bytes. New fixes need newly reviewed pins; do not disable the check.

## Operator instructions — both Windows 11 PCs, trusted private LAN

Copy Start-TwoPc-Capture.ps1 onto both devices. Use the same unique RunId, for example W9LAN001; PlayerExe must be the absolute path to the *same accepted* WindowsPlayer/CoreClash.exe, but on each host's local disk.

On PC1 run in Windows PowerShell 5.1, in the script's directory:

    .\Start-TwoPc-Capture.ps1 -Role host -RunId W9LAN001 -PlayerExe 'C:\YOUR\PATH\WindowsPlayer\CoreClash.exe' -Seconds 240

On PC2 run at approximately the same time:

    .\Start-TwoPc-Capture.ps1 -Role client -RunId W9LAN001 -PlayerExe 'C:\YOUR\PATH\WindowsPlayer\CoreClash.exe' -Seconds 240

The script launches original Unity Windows Player with a dedicated -logFile. On PC1 select MULTIPLAYER → CREATE GAME → LAN; PC2: JOIN GAME → LAN and enter PC1's local private address only in the game. Make ONE legal Player 2 move. Close both games normally before the allotted time to flush original Player.log. The script never terminates the game, edits firewall rules, starts Unity Editor, rebuilds code, or sends network packets.

Each machine creates Documents\CC001_W9_A72_Captures\W9LAN001_host or W9LAN001_client containing Player.log, capture.json and samples.csv. Each sample stores UTC time, process PID, working set bytes, process CPU seconds and **count** of established TCP connections (not IP addresses). Capture SHA256 for EXE, DLL, log and CSV. Partial logs cannot pass.

Copy both folders unchanged to one trusted QA workstation with Node 22. Run:

    node verify-two-pc.cjs 'C:\PATH\W9LAN001_host' 'C:\PATH\W9LAN001_client'

Verifier exit 0 = PASS_LOG_SUBSET_ONLY, not G3. Exit 2 = HOLD due to missing required log event. Exit 1 = STOP invalid/tampered/mixed/wrong binary evidence. Run local deterministic regression suite:

    node verify-two-pc.cjs --self-test

## Limits, ownership, release gates

Current RC1 source logs HOST P2 connection and accepted owner=1 intent; CLIENT logs CC_NET_STATE_APPLIED only on the FIRST accepted snapshot. The validator can verify connection, exactly one accepted P2 intent for the scoped NET-W6-01 test, first received snapshot, and source/artifact identity. It cannot claim host/client state parity, animation smoothness, rendering frame time, P2 turn text, camera flip, aiming arrow or shot-strength semantics from these limited logs; those gates remain NOT_OBSERVABLE until further source-instrumented proof or real A60 screenshots/observations.

Current source NgoGameSession schedules movement snapshots every ~0.2s (5Hz); this is a credible stutter candidate, **not** proof of the unique cause. A31/networking owns replication/interpolation and authoritative transport; A20/presentation owns LocalOwner UI/camera/arrow; A10 must accept any strength-meter redesign; A60 independently QA-verifies PC1/PC2; A70 integrates.

Keep private IPs, log contents, account identifiers and invitation codes OFF public GitHub comments. Share originals privately with A60 and publish only redacted verdicts plus hashes. No public port forwarding; use private TCP7777 LAN only.

**Gates:** A72 source-only tool and Node selftest can PASS; TWO_PC_RUNTIME=NOT_RUN until operator executes; P0 gameplay defects remain OPEN; no merge into main, release or deployment.
