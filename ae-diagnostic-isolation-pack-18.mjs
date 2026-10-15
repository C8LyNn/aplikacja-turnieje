import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const relative =
  "artifacts/animated-effects/src/main.ts";

const file =
  path.join(root, relative);

function fail(message) {
  console.error("\nERROR:", message);
  process.exit(1);
}

if (!fs.existsSync(path.join(root, "pnpm-workspace.yaml"))) {
  fail("Uruchom instalator z katalogu głównego aplikacja-turnieje-live.");
}

if (!fs.existsSync(file)) {
  fail("Brak pliku: " + relative);
}

let source =
  fs.readFileSync(file, "utf8");

const marker =
  "AE_DIAGNOSTIC_ISOLATION_PACK_18";

if (source.includes(marker)) {
  console.log("Diagnostic Isolation Pack 18 jest już zainstalowany.");
  process.exit(0);
}

const requiredCalls = [
  "installPack06Polish02();",
  "installPack08UiQa();",
  "installPack09Customization();",
  "installPack09UiPolish();",
];

for (const call of requiredCalls) {
  if (!source.includes(call)) {
    fail("Nie znaleziono wywołania: " + call);
  }
}

const stamp =
  new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .replace("Z", "");

const backup =
  path.join(
    root,
    ".ae-pack-backup",
    `pack-18-diagnostic-isolation-${stamp}`,
    relative,
  );

fs.mkdirSync(
  path.dirname(backup),
  { recursive: true },
);

fs.copyFileSync(
  file,
  backup,
);

const originalBlock =
`installPack06Polish02();
installPack08UiQa();
installPack09Customization();
installPack09UiPolish();`;

const isolatedBlock =
`/* AE_DIAGNOSTIC_ISOLATION_PACK_18
   Temporary diagnostic isolation:
   keep imports referenced, but disable DOM-polish/customization modules
   that can observe or rewrite the editor DOM.
*/
const AE_DIAGNOSTIC_ENABLE_PACK06_POLISH02 = false;
const AE_DIAGNOSTIC_ENABLE_PACK08_UI_QA = false;
const AE_DIAGNOSTIC_ENABLE_PACK09_CUSTOMIZATION = false;
const AE_DIAGNOSTIC_ENABLE_PACK09_UI_POLISH = false;

if (AE_DIAGNOSTIC_ENABLE_PACK06_POLISH02) {
  installPack06Polish02();
}

if (AE_DIAGNOSTIC_ENABLE_PACK08_UI_QA) {
  installPack08UiQa();
}

if (AE_DIAGNOSTIC_ENABLE_PACK09_CUSTOMIZATION) {
  installPack09Customization();
}

if (AE_DIAGNOSTIC_ENABLE_PACK09_UI_POLISH) {
  installPack09UiPolish();
}

console.warn(
  "[AE diagnostic] Pack 18 isolation active: " +
  "Pack06Polish02, Pack08UiQa, Pack09Customization and Pack09UiPolish are disabled.",
);`;

if (source.includes(originalBlock)) {
  source =
    source.replace(
      originalBlock,
      isolatedBlock,
    );
} else {
  // Fallback: replace the four calls one-by-one only if the exact contiguous block changed.
  source =
    source.replace(
      "installPack06Polish02();",
      `/* ${marker} */\nif (false) { installPack06Polish02(); }`,
    );

  source =
    source.replace(
      "installPack08UiQa();",
      "if (false) { installPack08UiQa(); }",
    );

  source =
    source.replace(
      "installPack09Customization();",
      "if (false) { installPack09Customization(); }",
    );

  source =
    source.replace(
      "installPack09UiPolish();",
      "if (false) { installPack09UiPolish(); }",
    );
}

fs.writeFileSync(
  file,
  source,
  "utf8",
);

const rollbackPath =
  path.join(
    root,
    "ae-diagnostic-isolation-pack-18-rollback.mjs",
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
console.log("Diagnostic Isolation Pack 18 cofnięty.");
`;

fs.writeFileSync(
  rollbackPath,
  rollback,
  "utf8",
);

console.log("");
console.log("=========================================================");
console.log(" Animated Effects Diagnostic Isolation Pack 18 INSTALLED");
console.log("=========================================================");
console.log("");
console.log("TYMCZASOWO WYŁĄCZONE:");
console.log(" - Pack06Polish02");
console.log(" - Pack08UiQa");
console.log(" - Pack09Customization");
console.log(" - Pack09UiPolish");
console.log("");
console.log("Pozostaje aktywny bazowy edytor i Pack06.");
console.log("Celem jest sprawdzenie, czy freeze po dodaniu 2. efektu znika.");
console.log("");
console.log("Backup:", path.relative(root, backup));
console.log("Rollback: .\\ae-diagnostic-isolation-pack-18-rollback.mjs");
console.log("");
console.log("Teraz:");
console.log("  pnpm --filter animated-effects run typecheck");
console.log("  pnpm --filter animated-effects run build");
console.log("");
console.log("Potem uruchom ponownie tournament-manager przez pnpm run dev.");
