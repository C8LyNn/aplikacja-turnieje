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
  fail("Pack 19B wymaga wcześniej zainstalowanego Diagnostic Isolation Pack 18.");
}

const required = [
  "const AE_DIAGNOSTIC_ENABLE_PACK06_POLISH02 = true;",
  "const AE_DIAGNOSTIC_ENABLE_PACK08_UI_QA = true;",
  "const AE_DIAGNOSTIC_ENABLE_PACK09_CUSTOMIZATION = false;",
  "const AE_DIAGNOSTIC_ENABLE_PACK09_UI_POLISH = false;",
];

for (const item of required) {
  if (!source.includes(item)) {
    fail(
      "Stan nie odpowiada Pack 19A. Brakuje:\n" +
      item +
      "\nNie zmieniono pliku."
    );
  }
}

const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-")
  .replace("T", "_")
  .replace("Z", "");

const backup = path.join(
  root,
  ".ae-pack-backup",
  `pack-19b-pack09-customization-test-${stamp}`,
  relative,
);

fs.mkdirSync(path.dirname(backup), { recursive: true });
fs.copyFileSync(file, backup);

source = source.replace(
  "const AE_DIAGNOSTIC_ENABLE_PACK09_CUSTOMIZATION = false;",
  "const AE_DIAGNOSTIC_ENABLE_PACK09_CUSTOMIZATION = true;",
);

fs.writeFileSync(file, source, "utf8");

const rollbackPath = path.join(
  root,
  "ae-diagnostic-pack-19b-rollback.mjs",
);

const rollback =
`import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, ${JSON.stringify(relative)});
const backup = ${JSON.stringify(backup)};

if (!fs.existsSync(backup)) {
  console.error("Brak backupu:", backup);
  process.exit(1);
}

fs.copyFileSync(backup, target);
console.log("Diagnostic Pack 19B cofnięty.");
`;

fs.writeFileSync(rollbackPath, rollback, "utf8");

console.log("");
console.log("==================================================");
console.log(" Animated Effects Diagnostic Pack 19B INSTALLED");
console.log("==================================================");
console.log("");
console.log("WŁĄCZONE:");
console.log(" - Pack06Polish02");
console.log(" - Pack08UiQa");
console.log(" - Pack09Customization");
console.log("");
console.log("NADAL WYŁĄCZONE:");
console.log(" - Pack09UiPolish");
console.log("");
console.log("Test: dodaj/usuń 5-10 efektów.");
console.log("");
console.log("Interpretacja:");
console.log(" - jeśli freeze wróci -> winny jest Pack09Customization");
console.log(" - jeśli nadal działa -> winny jest Pack09UiPolish");
console.log("");
console.log("Backup:", path.relative(root, backup));
console.log("Rollback: .\\ae-diagnostic-pack-19b-rollback.mjs");
