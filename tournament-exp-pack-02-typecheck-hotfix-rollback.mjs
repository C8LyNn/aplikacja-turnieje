import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BACKUP = path.join(ROOT, ".tournament-exp-pack-02-typecheck-hotfix-backup");

if (!fs.existsSync(BACKUP)) {
  console.error("[Pack 02 typecheck hotfix] ROLLBACK FAIL — brak backupu.");
  process.exit(1);
}

function restore(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const src = path.join(dir, entry.name);
    const rel = path.relative(BACKUP, src);
    const dst = path.join(ROOT, rel);
    if (entry.isDirectory()) {
      restore(src);
    } else {
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(src, dst);
    }
  }
}

restore(BACKUP);
fs.rmSync(BACKUP, { recursive: true, force: true });
console.log("[Pack 02 typecheck hotfix] ROLLBACK PASS");
