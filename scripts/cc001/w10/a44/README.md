# CC-001 R17-W10 — A44 PC1–PC2 physical session record

**Owner:** A44 External Playtest Infrastructure | **HQ:** #97 | **Status:** executable offline kit, not QA PASS.

This utility extends the **W9 A44 collector** from PR #164. It verifies two sanitized Player.logs against the previously produced W9 evidence manifest, combines them with operator-entered observations and outputs one bounded, structured **W10 session record** with per-issue triage. It does NOT deploy a new game, alter simulation/physics, repair multiplayer, merge A20/A31/A34 work, build Windows binaries, or certify cross-device success.

## Exact sequence on a trusted private LAN

1. A72 provides an independently SHA-verified **new W10 Windows Player**. Stage the exact same approved build on physically separate PC1 (host/P1) and PC2 (client/P2). Verify each complete build manifest, not just EXE. Collect original PC1/PC2 Unity Player.log and optional approved EXE hashes. NEVER expose TCP 7777 to the public Internet.
2. Perform a short real-session observation without modifying game code: `CONNECT`, `MOVING_SYNC`, `LOCAL_TURN`, `P2_AIM`, `P2_PERSPECTIVE`, `POWER_BAR`, `MATCH_END` (use `NOT_RUN` when not exercised). Observe both computers. Record symptom steps, timestamp, visible turn, relative aim, ball motion, and whether both sides agree. Capture authorized videos/screenshots privately if necessary.
3. Run the existing W9 collector, with the **actual newly approved EXE SHA** from A72. Never reuse the historical RC1 EXE example for a new W10 build:

   `node scripts/cc001/w9/a44/pack-multiplayer-evidence.cjs --host "C:\Evidence\PC1_Player.log" --client "C:\Evidence\PC2_Player.log" --session W10_PAIR_001 --out "C:\Evidence\W10_PAIR_001_PACK" --host-exe "C:\Evidence\PC1_CoreClash.exe" --client-exe "C:\Evidence\PC2_CoreClash.exe" --expected-exe-sha <A72_APPROVED_EXE_SHA256>`

4. Copy `observations.example.json` into your *private* `observations.json`; replace its synthetic timestamps, resolutions, scenarios and issues with actual operator observations. The same `sessionId` **must** match the W9 manifest. No names, private IPs, URLs, tokens or join codes. Operator-entered `OBSERVED_OK` is still not independent QA.
5. Run from the repository root:

   `node scripts/cc001/w10/a44/assemble-session.cjs --pack "C:\Evidence\W10_PAIR_001_PACK" --observations "C:\Evidence\observations.json" --out "C:\Evidence\W10_PAIR_001_SESSION.json"`

6. Independently review sanitized output for privacy. Send the JSON session record and selectively approved redacted logs privately to A60. A31 handles network causes and transport trace; A20 handles P2 aiming/turn presentation; A33/A34 visual/performance, A10 the power-meter design decision. A70 selects and integrates exactly one compatible gameplay patch set. **Do not combine all issues into one umbrella repair task.**

## Enforced behavior

- Session ID, UTC range, private LAN and distinct HOST/CLIENT role claims, Windows device class and screen resolutions required.
- Each scenario has `OBSERVED_OK`, `ISSUE` or `NOT_RUN`. Every issue is separately assigned PRIORITY/RISK LOW|MEDIUM|HIGH and SCOPE SMALL|MEDIUM|LARGE, expected vs actual behavior, affected PC, owner route. Generated IDs are session-scoped and unique.
- Sanitized log hashes and sizes are independently recalculated against the W9 manifest. Altered/truncated logs, duplicated scenarios, malformed observations and preexisting output file are rejected. No raw logs or binary payloads are copied.
- EXE hash pair status `MATCHED` / `MISMATCHED` / `UNVERIFIED` is an **operator-provided artifact comparison only**. Formal A72 certified SHA and full build manifest must be attached independently.
- Immutable `qaDisposition=PENDING_INDEPENDENT_A60_PHYSICAL_QA` and `defectFixClaims=NONE`; even a seemingly flawless session cannot self-certify G3 PASS. The tool never silently patches/overwrites an existing record.
- Best-effort privacy sanitization of free text. **Manual privacy review still required**.

## Validation

Run `node --test scripts/cc001/w10/a44/assemble-session.test.cjs`. The suite includes an actual end-to-end local invocation of the W9 packer with synthetic logs. A60 must independently rerun on an integrated revision and independently adjudicate physical PC1↔PC2.

**Integration:** Additive W10 A44-only files, stacked on previously committed W9 A44 branch. No main/release merge. A70 cherry-picks or stages after own source/permission review.