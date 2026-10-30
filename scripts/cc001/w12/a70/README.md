# CC-001 / R17-W12 — A70 development delta vs frozen W11 QA source

**A70 role:** integration, candidate admission and no source confusion. This is a SOURCE-ONLY tool; it does **not** compile Unity, produce a Windows binary, certify PC1↔PC2 multiplayer, merge a PR or issue a release.

**Protected QA freeze** `integration/cc001-r17-w11-qa-freeze-20261030` at `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`.
**Protected RC1** `integration/cc001-r17-w8-phoenix-rc1` at `10f64e4d213f17a352ed8fa83bc75884a39549f0`.

Run inside a clone that contains the freeze, RC1 and candidate commits (fetch refs first using read-only Git if necessary):

```powershell
node scripts/cc001/w12/a70/w12-source-delta-gate.test.cjs
node scripts/cc001/w12/a70/w12-source-delta-gate.cjs --repo=C:/src/aplikacja-turnieje --dev=EXACT40HEX_CANDIDATE_SHA
```

**Checks:** frozen SHA unchanged, RC1 SHA unchanged, frozen RC1 ancestry and exactly 22 expected frozen diff paths, protected source/data/meta modifications not permitted, candidate must descend from W11 freeze, all new development changes enumerated. Exit0 = `PASS_SOURCE_ONLY`, exit2 = `HOLD`, exit64 = usage failure. The result *always* says `w11NativeBuild=NOT_ATTESTED`, `twoPcG3=NOT_ATTESTED` and `devPromotion=HOLD_UNTIL_W11_CLOSED` even if source checks pass. Any later live PR207 HEAD or W12 draft is DEV_ONLY; no retroactive approval on W11 frozen binaries.

**Run reality at authoring:** native Node v22.16.0 test command 17/17 PASS, 0 fail, exit0; both committed script/test blob hashes verified against independently locally tested identical bytes. No real private checkout CLI run here; GitHub remote frozen ref and RC1 SHA were separately read; no native Unity/Windows or 2-PC G3 test run.

**Protect owner decisions:** Mitosis V148 physical ball-contact semantics; Furnace only FIRE zone + periodic damage; R16 catalog HP unchanged. Exclude protected data, gameplay core, Protocol149, settings, packages and existing Unity metadata from W11 frozen delta. Existing independently authored owner-contract tests are in draft PR #219, **not auto-imported** here. No W11 QA ref edits, main merge, deployment or release.
