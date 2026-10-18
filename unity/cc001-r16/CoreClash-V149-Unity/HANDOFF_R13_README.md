# R13 Elemental Candidate — handoff to local Windows Codex

Base: `CoreClash-V149-R12-Source-Candidate.zip` SHA256 `12a0403a4b998c88a7555e7c2e08f6b1d102b9db61a47250d30490570af579d4`.

Do not apply this patch to R9, R10 or R11 directly. Full R13 Source Candidate includes their previous source changes.

Read `docs/R13_ELEMENTAL_CANDIDATE_PL.md` before testing. No skills are promoted to UNITY_READY without successful native tests. Original source HTML, roster, canonical decks and featured decks are unchanged.

Windows, from the R13 project directory:

```powershell
pwsh -NoProfile -File .\Tools\r13-qa.ps1
```

Override log destination:

```powershell
pwsh -NoProfile -File .\Tools\r13-qa.ps1 -OutputRoot 'G:\Mój dysk\ChatGPT\CoreClash\QA\R13'
```

Reports are local files at that path; Google Drive syncing must be checked separately. For explicit Windows Unity build add `-BuildWindows`. Run full featured matches, physical device and LAN/Relay validation separately. Do not deploy or push.
