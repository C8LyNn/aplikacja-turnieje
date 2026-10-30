# CC-001 / R17-W15 / A80 — asynchronous same-revision evidence

## Scope

**RESEARCH RECOMMENDATION:** Compare PC1 and PC2 *source-annotated authoritative snapshots* by exact revision, even when the two PCs reached that revision in different observation pairs. Do **not** require synchronized wall clocks or assume packet loss when one device is behind.

W12 A80 independently validates one PC1+PC2 pair and signals NO_SAME_REVISION_PAIR when their revisions differ. W14 A80 checks revision chronology for **each PC separately**. Previously an asynchronous sequence such as pair 1: PC1 r42/PC2 r41, pair 2: PC1 r43/PC2 r42, could leave a PC1-vs-PC2 contradiction at r42 uncategorized. W15 adds crossPairRevisions to the *existing* W13 verify-frozen-captures.cjs verdict; it is not another player verifier or game networking implementation.

## Checks

- Compare turn, phase, and valid optional actionSerial of the **same revision** across different pairs.
- Compare supplied 64-hex state digest and Player assembly SHA; missing/invalid evidence -> **gap**, inconsistent values -> **contradiction**.
- Compare canonical ball positions for shared IDs; incomplete ball sets -> **gap**, differing shared canonical coordinates -> **contradiction**.
- Keep a bounded ledger of at most the parent W13 500 pairs; ignore unknown devices; no time synchronization or invented latency claims.
- Preserve W13/W14 capture SHA, file inventory and per-PC chronology gates and all W12 frozen visual/Y-inversion checks.

## How to run

Node.js 18+, no npm install:

~~~sh
node --check scripts/cc001/w15/a80/verify-cross-pair-revisions.cjs
node --test scripts/cc001/w15/a80/verify-cross-pair-revisions.test.cjs
node --test scripts/cc001/w14/a80/verify-snapshot-chronology.test.cjs
node --test scripts/cc001/w13/a80/verify-frozen-captures.test.cjs
node scripts/cc001/w13/a80/verify-frozen-captures.cjs --input PRIVATE/session.json --root PRIVATE/captures --out PRIVATE/a80-w15-report.json
~~~

CAPTURE_CONTRADICTION means conflicting input annotations/source evidence, **not** independently reproduced gameplay/network failure. INSUFFICIENT_EVIDENCE means evidence is not enough to certify the claimed parity. CAPTURE_BYTES_AND_ANNOTATIONS_CONSISTENT is still scoped to input-byte and declaration checks and physicalG3Status=NOT_ASSESSED. Do not upload original logs, images, IPs, paths, tokens or session data publicly.

## Execution evidence and dependency pins

W15 source Git blob: e3b30e60c7fbaf8c39249b50b87a437970701bcb; W15 test Git blob: 390c4d453b454897d48a036680893a4a1b0c91df. Exact local tested bytes were matched via git hash-object to authenticated GitHub readback. Native Linux Node v22.16.0: **18/18 tests PASS**, zero failures (synthetic observations). Full combined W13/W14/W15 CLI, historical W13/W14 suites, .NET9, Unity6000.4.0f1 Player and physical PC1+PC2 **not executed by A80 W15**. Test execution is not Windows native Player QA.

- **Stack dependency:** A80 W12 #236 -> A80 W13 #240 -> A80 W14 #265 -> W15 draft; A70 decides admission/integration.
- **Only W11 QA source:** immutable integration/cc001-r17-w11-qa-freeze-20261030 = 3f972cdbaea6289a7e33ce608f5d3256cfdab0a3.
- **Do not substitute** moving W11 DEV #207 or Phoenix W14 DEV #266 for the frozen source.
- A72 #188/#262 must provide genuine fresh Windows Unity6000.4.0f1 Player and .NET9 records. A60/A31 independently verify same binary SHA on PC1/PC2, local turn/aim, authoritative state, teleport/snap, smoothing, FPS and network timing.
- **G3/G4 HOLD; W11 still open.** No Unity, gameplay, V148 Mitosis, Furnace FIRE/tick, R16 HP, Protocol149, RC1, QA-freeze ref, main, release or deploy changes.
