import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function fail(message) {
  console.error("\nERROR:", message);
  process.exit(1);
}

if (!fs.existsSync(path.join(root, "pnpm-workspace.yaml"))) {
  fail("Uruchom ten plik z głównego katalogu aplikacja-turnieje-live.");
}

const mediaPath = path.join(
  root,
  "artifacts",
  "animated-effects",
  "src",
  "media",
  "mediaExport.ts",
);

const installPath = path.join(
  root,
  "artifacts",
  "animated-effects",
  "src",
  "pack06",
  "install.ts",
);

for (const target of [mediaPath, installPath]) {
  if (!fs.existsSync(target)) {
    fail(`Brak pliku Pack 06: ${target}`);
  }
}

const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-")
  .replace("T", "_")
  .replace("Z", "");

const backupRoot = path.join(
  root,
  ".ae-pack-backup",
  `pack-06-fix-01-${stamp}`,
);

function backup(source, relative) {
  const destination = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

backup(
  mediaPath,
  path.join(
    "artifacts",
    "animated-effects",
    "src",
    "media",
    "mediaExport.ts",
  ),
);

backup(
  installPath,
  path.join(
    "artifacts",
    "animated-effects",
    "src",
    "pack06",
    "install.ts",
  ),
);

let media = fs.readFileSync(mediaPath, "utf8");
let install = fs.readFileSync(installPath, "utf8");

const replacements = [
  {
    name: "cross-window Event constructor",
    file: "mediaExport.ts",
    from: 'win.dispatchEvent(new win.Event("onWidgetLoad"));',
    to: 'win.dispatchEvent(new Event("onWidgetLoad"));',
    get text() { return media; },
    set text(value) { media = value; },
  },
  {
    name: "effect card NodeList iteration",
    file: "install.ts",
    from: 'const cards=[...library.querySelectorAll<HTMLElement>(".ae-effect-card")];',
    to: 'const cards=Array.from(library.querySelectorAll<HTMLElement>(".ae-effect-card"));',
    get text() { return install; },
    set text(value) { install = value; },
  },
  {
    name: "decorated card NodeList iteration",
    file: "install.ts",
    from: 'const decorated=[...library.querySelectorAll<HTMLElement>(".ae-effect-card[data-effect-id]")];',
    to: 'const decorated=Array.from(library.querySelectorAll<HTMLElement>(".ae-effect-card[data-effect-id]"));',
    get text() { return install; },
    set text(value) { install = value; },
  },
  {
    name: "layer NodeList iteration",
    file: "install.ts",
    from: 'const rows=[...document.querySelectorAll<HTMLElement>(".ae-layer-row")];',
    to: 'const rows=Array.from(document.querySelectorAll<HTMLElement>(".ae-layer-row"));',
    get text() { return install; },
    set text(value) { install = value; },
  },
];

let applied = 0;

for (const replacement of replacements) {
  if (replacement.text.includes(replacement.to)) {
    console.log(`OK already fixed: ${replacement.name}`);
    continue;
  }

  if (!replacement.text.includes(replacement.from)) {
    fail(
      `Nie znalazłem oczekiwanego fragmentu (${replacement.name}) w ${replacement.file}. ` +
      "Nie wykonano dalszych zmian."
    );
  }

  replacement.text = replacement.text.replace(
    replacement.from,
    replacement.to,
  );

  applied += 1;
  console.log(`FIXED: ${replacement.name}`);
}

fs.writeFileSync(mediaPath, media, "utf8");
fs.writeFileSync(installPath, install, "utf8");

console.log("");
console.log("======================================");
console.log(" Animated Effects Pack 06 Fix 01");
console.log("======================================");
console.log(`Zastosowane poprawki: ${applied}`);
console.log(`Backup: ${path.relative(root, backupRoot)}`);
console.log("");
console.log("Teraz uruchom:");
console.log("  pnpm --filter animated-effects run typecheck");
console.log("");
console.log("Jeśli typecheck PASS:");
console.log("  pnpm --filter animated-effects run build");
