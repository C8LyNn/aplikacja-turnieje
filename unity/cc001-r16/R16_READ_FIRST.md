# Core Clash V149 Unity — R16 source candidate

Read **CoreClash-V149-Unity/HANDOFF_R16_README.md**, then docs/R16_REPORT_PL.md and docs/R16_QA_PL.md in that project.

This is the complete R16 source tree derived from the actual R15 source ZIP, not a patch for local R9. The older HANDOFF_README.md and R9–R15 reports/manifests remain historical. Current readiness: CoreClash-V149-Unity/Evidence/R16/ability-support.json.

Source archive excludes Unity Library, build binaries and platform SDKs. All three platform builds were produced locally; build and runtime evidence are included. No website/cloud deployment was performed.

R16_CANDIDATE_MANIFEST.json hashes the source/evidence files. SHA256SUMS.txt is checked independently. The external delivery SHA256 file hashes the final source ZIP and R15 patch.

Original R15 ZIP SHA256: f70497f8be326e34e2f87bbe54c0716294e35887ef5ab9d993a5ae5cade3e21e.

Apply the accompanying R16 patch only from an unmodified extraction of that exact R15 ZIP. Use git apply --check before applying. Full R16 archive already contains the changes and needs no patch.
