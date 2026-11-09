import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const relative = "artifacts/animated-effects/src/main.ts";
const file = path.join(root, relative);

function fail(message) {
  console.error("\nERROR:", message);
  process.exit(1);
}

if (!fs.existsSync(path.join(root, "pnpm-workspace.yaml"))) {
  fail("Uruchom z katalogu głównego aplikacja-turnieje-live.");
}

if (!fs.existsSync(file)) {
  fail("Brak pliku: " + relative);
}

let source = fs.readFileSync(file, "utf8");

if (!source.includes("AE_DIAGNOSTIC_ISOLATION_PACK_18")) {
  fail("Pack 19A wymaga wcześniej zainstalowanego Diagnostic Isolation Pack 18.");
}

const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-")
  .replace("T", "_")
  .replace("Z", "");

const backup = path.join(
  root,
  ".ae-pack-backup",
  `pack-19a-binary-search-${stamp}`,
  relative,
);

fs.mkdirSync(path.dirname(backup), { recursive: true });
fs.copyFileSync(file, backup);

const replacements = [
  [
    "const AE_DIAGNOSTIC_ENABLE_PACK06_POLISH02 = false;",
    "const AE_DIAGNOSTIC_ENABLE_PACK06_POLISH02 = true;",
  ],
  [
    "const AE_DIAGNOSTIC_ENABLE_PACK08_UI_QA = false;",
    "const AE_DIAGNOSTIC_ENABLE_PACK08_UI_QA = true;",
  ],
  [
    "const AE_DIAGNOSTIC_ENABLE_PACK09_CUSTOMIZATION = false;",
    "const AE_DIAGNOSTIC_ENABLE_PACK09_CUSTOMIZATION = false;",
  ],
  [
    "const AE_DIAGNOSTIC_ENABLE_PACK09_UI_POLISH = false;",
    "const AE_DIAGNOSTIC_ENABLE_PACK09_UI_POLISH = false;",
  ],
];

for (const [from, to] of replacements) {
  if (!source.includes(from)) {
    if (source.includes(to)) continue;
    fail("Nie znaleziono oczekiwanej flagi: " + from);
  }
  source = source.replace(from, to);
}

fs.writeFileSync(file, source, "utf8");

const rollbackPath = path.join(
  root,
  "ae-diagnostic-pack-19a-rollback.mjs",
);

const rollback = `import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, ${JSON.stringify(relative)});
const backup = ${JSON.stringify(backup)};

if (!fs.existsSync(backup)) {
  console.error("Brak backupu:", backup);
  process.exit(1);
}

fs.copyFileSync(backup, target);
console.log("Diagnostic Pack 19A cofnięty.");
`;

fs.writeFileSync(rollbackPath, rollback, "utf8");

console.log("");
console.log("==================================================");
console.log(" Animated Effects Diagnostic Pack 19A INSTALLED");
console.log("==================================================");
console.log("");
console.log("WŁĄCZONE:");
console.log(" - Pack06Polish02");
console.log(" - Pack08UiQa");
console.log("");
console.log("NADAL WYŁĄCZONE:");
console.log(" - Pack09Customization");
console.log(" - Pack09UiPolish");
console.log("");
console.log("Test: dodaj/usuń 5-10 efektów.");
console.log("Jeśli działa -> problem jest w Pack09.");
console.log("Jeśli freeze wróci -> problem jest w Pack06Polish02 lub Pack08UiQa.");
console.log("");
console.log("Backup:", path.relative(root, backup));
console.log("Rollback: .\\ae-diagnostic-pack-19a-rollback.mjs");
