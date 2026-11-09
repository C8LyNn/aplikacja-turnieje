import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "tournament-exp-pack-02-lib.mjs");

if (!fs.existsSync(file)) {
  console.error("[Pack 02 hotfix] FAIL — brak tournament-exp-pack-02-lib.mjs w bieżącym katalogu.");
  process.exit(1);
}

let source = fs.readFileSync(file, "utf8");

if (source.includes('const normalizedBefore = before.replace(/\\r\\n/g, "\\n");')) {
  console.log("[Pack 02 hotfix] Hotfix Windows EOL jest już zastosowany.");
  process.exit(0);
}

const oldBlock = `function patch(rel, fn) {
  const before = read(rel);
  const after = fn(before);
  if (after !== before) write(rel, after);
}`;

const newBlock = `function patch(rel, fn) {
  const before = read(rel);
  const usesCrlf = before.includes("\\\\r\\\\n");
  const normalizedBefore = before.replace(/\\\\r\\\\n/g, "\\\\n");
  const normalizedAfter = fn(normalizedBefore);

  if (normalizedAfter !== normalizedBefore) {
    const after = usesCrlf
      ? normalizedAfter.replace(/\\\\n/g, "\\\\r\\\\n")
      : normalizedAfter;
    write(rel, after);
  }
}`;

if (!source.includes(oldBlock)) {
  console.error("[Pack 02 hotfix] FAIL — nie rozpoznaję wersji tournament-exp-pack-02-lib.mjs.");
  process.exit(1);
}

source = source.replace(oldBlock, newBlock);
fs.writeFileSync(file, source, "utf8");

console.log("[Pack 02 hotfix] PASS — instalator obsługuje teraz CRLF/LF bez zmiany całych plików.");
