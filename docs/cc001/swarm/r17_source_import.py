#!/usr/bin/env python3
"""CC-001 R17 A70: one-time exact R16 Unity source import; no gameplay changes."""
import hashlib
import json
import shutil
import sys
import zipfile
from pathlib import Path, PurePosixPath

EXPECTED_SHA = "b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4"
EXPECTED_SIZE = 17690458
EXPECTED_ENTRIES = 639
PARTS = Path("docs/cc001/swarm/r17-import-parts")
DEST = Path("unity/cc001-r16")
MANIFEST = Path("docs/cc001/swarm/R17_A70_SOURCE_MANIFEST.json")
EXCLUDED_DIRS = {"library", "temp", "obj", "logs", "builds"}

def main():
    if not PARTS.exists():
        print("No import parts found: post-import run is a no-op")
        return
    parts = sorted(PARTS.glob("part-*.bin"))
    if len(parts) != 45:
        raise RuntimeError("Expected 45 source archive parts; got " + str(len(parts)))
    if DEST.exists():
        raise RuntimeError("Destination already exists; refusing to overwrite sources")
    assembled = Path("/tmp/cc001-r16-verified-source.zip")
    digest = hashlib.sha256()
    total = 0
    with assembled.open("wb") as out:
        for item in parts:
            blob = item.read_bytes()
            out.write(blob)
            digest.update(blob)
            total += len(blob)
    if total != EXPECTED_SIZE or digest.hexdigest() != EXPECTED_SHA:
        raise RuntimeError("Canonical archive SHA-256 or byte size mismatch")
    files, excluded = [], []
    with zipfile.ZipFile(assembled) as z:
        infos = z.infolist()
        if len(infos) != EXPECTED_ENTRIES or z.testzip() is not None:
            raise RuntimeError("R16 ZIP entry count/integrity mismatch")
        for info in infos:
            raw = info.filename
            rel = PurePosixPath(raw)
            if info.is_dir() or rel.is_absolute() or ".." in rel.parts or "\\" in raw:
                raise RuntimeError("Unexpected ZIP path: " + raw)
            if any(segment.lower() in EXCLUDED_DIRS for segment in rel.parts):
                excluded.append(raw)
                continue
            out = DEST.joinpath(*rel.parts)
            out.parent.mkdir(parents=True, exist_ok=True)
            data = z.read(info)
            out.write_bytes(data)
            files.append({"path": raw, "size": len(data), "sha256": hashlib.sha256(data).hexdigest()})
    root = DEST / "CoreClash-V149-Unity"
    required = [
        "Assets/CoreClash",
        "Assets/Resources/Data",
        "Tests",
        "Packages/manifest.json",
        "Packages/packages-lock.json",
        "ProjectSettings/ProjectVersion.txt"
    ]
    missing = [item for item in required if not (root / item).exists()]
    if missing:
        raise RuntimeError("Missing mandatory R16 files: " + ", ".join(missing))
    if sum(x["path"].endswith(".meta") for x in files) != 88:
        raise RuntimeError("Unity .meta file inventory mismatch")
    MANIFEST.write_text(json.dumps({
        "project": "CC-001",
        "revision": "V149 R16",
        "upstream": "Google Drive 1IhtpEBrC-AJyzLTd8elE6lWionI0_bkZ",
        "archive_sha256": EXPECTED_SHA,
        "archive_size": EXPECTED_SIZE,
        "archive_entries": EXPECTED_ENTRIES,
        "import_root": DEST.as_posix(),
        "imported_count": len(files),
        "excluded_generated": excluded,
        "generated_exclusion_rule": sorted(EXCLUDED_DIRS),
        "preserved_unity_meta_count": 88,
        "files": files
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    shutil.rmtree(PARTS)
    assembled.unlink(missing_ok=True)
    print("R16 IMPORT PASS", len(files), "files;", len(excluded), "generated exclusions; sha", digest.hexdigest())

if __name__ == "__main__":
    main()
