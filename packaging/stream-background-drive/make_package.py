#!/usr/bin/env python3
"""Build source-only Windows install artifact for GitHub Actions -> Google Drive.
Payload source is locked to PR14's verified merge SHA, not the packaging branch.
"""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[2]
PACKAGING = ROOT / "packaging" / "stream-background-drive"
RELEASE = ROOT / "release-stream-background-effects"
SOURCE_COMMIT = "2f10c39f7fa5d480e772ec2bb34b56af18d57f04"
TITLE = "stream-background-effects_PR8_PR9_20261012"

SUPPLEMENTAL = (
    "artifacts/tournament-manager/scripts/stage-animated-effects.mjs",
    "artifacts/tournament-manager/src/features/streaming/obs-lab/animated-effects-trigger.test.ts",
    "artifacts/tournament-manager/src/features/streaming/obs-lab/stream-elements-profiles.test.ts",
    "artifacts/tournament-manager/src/features/streaming/obs-lab/stream-elements-simulator.test.ts",
    "START_ANIMATED_EFFECTS_PREVIEW.cmd",
)


def git(*args: str) -> bytes:
    return subprocess.check_output(["git", "-C", str(ROOT), *args])


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    tracked = set(
        p.decode("utf-8") for p in
        git("ls-files", "-z", "--", "artifacts/animated-effects/").split(b"\0") if p
    )
    tracked.update(SUPPLEMENTAL)
    files = sorted(tracked)
    assert len(files) >= 80, "Unexpectedly incomplete Animated Effects source directory"

    # Packaging scripts and workflow are the only allowed changes vs verified PR14.
    diff = git("diff", "--name-only", SOURCE_COMMIT, "--", *files)
    if diff:
        raise RuntimeError("Payload changed since verified PR14 merge: " + diff.decode())

    if RELEASE.exists():
        shutil.rmtree(RELEASE)
    RELEASE.mkdir()
    payload = RELEASE / "payload"
    entries = []
    for name in files:
        if not (
            name.startswith("artifacts/animated-effects/")
            or name in SUPPLEMENTAL
        ):
            raise ValueError("Unexpected file path: " + name)
        src = ROOT / name
        if not src.is_file() or src.is_symlink():
            raise ValueError("Missing or symlink source: " + name)
        content = src.read_bytes()
        target = payload / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
        entries.append({"path": name, "sha256": sha256(content), "size": len(content)})
    for name in ["INSTALL_STREAM_BACKGROUND_EFFECTS.ps1", "README_START.md"]:
        shutil.copyfile(PACKAGING / name, RELEASE / name)

    manifest = {
        "format": "stream-background-effects-local-overlay",
        "version": 1,
        "name": TITLE,
        "source_commit": SOURCE_COMMIT,
        "source_pr": "https://github.com/C8LyNn/aplikacja-turnieje/pull/14",
        "date": "2026-10-12",
        "file_count": len(entries),
        "payload_size_bytes": sum(e["size"] for e in entries),
        "files": entries,
    }
    (RELEASE / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    sums = [
        f"{sha256((RELEASE / name).read_bytes())}  {name}"
        for name in ["manifest.json", "INSTALL_STREAM_BACKGROUND_EFFECTS.ps1", "README_START.md"]
    ]
    (RELEASE / "CHECKSUMS.sha256").write_text(
        "\n".join(sums) + "\n", encoding="utf-8"
    )
    # Complete read-back verification before uploading the final Actions artifact.
    loaded = json.loads((RELEASE / "manifest.json").read_text("utf-8"))
    for item in loaded["files"]:
        assert sha256((payload / item["path"]).read_bytes()) == item["sha256"]
    assert len(loaded["files"]) == loaded["file_count"]
    print(f"PACKAGE PASS: {len(entries)} files, "
          f"{manifest['payload_size_bytes']:,} payload bytes, "
          f"PR14 source {SOURCE_COMMIT}")
    print("UPLOAD_ROOT=" + str(RELEASE))


if __name__ == "__main__":
    main()
