import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const relative =
  "artifacts/animated-effects/src/pack09/customization.ts";
const file =
  path.join(root, relative);

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

const source =
  fs.readFileSync(file, "utf8");

const pattern =
  /const changed = \[\s*\.\.\.mutation\.addedNodes,\s*\.\.\.mutation\.removedNodes,\s*\];/m;

if (!pattern.test(source)) {
  if (
    source.includes(
      "Array.from(mutation.addedNodes)",
    ) &&
    source.includes(
      "Array.from(mutation.removedNodes)",
    )
  ) {
    console.log("Fix jest już zastosowany.");
    process.exit(0);
  }

  fail(
    "Nie znaleziono oczekiwanego fragmentu NodeList. Nie zmieniono pliku.",
  );
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
    `pack-09-fix-nodelist-${stamp}`,
    relative,
  );

fs.mkdirSync(
  path.dirname(backup),
  {
    recursive: true,
  },
);

fs.copyFileSync(
  file,
  backup,
);

const fixed =
  source.replace(
    pattern,
    `const changed =
                Array.from(
                  mutation.addedNodes,
                ).concat(
                  Array.from(
                    mutation.removedNodes,
                  ),
                );`,
  );

fs.writeFileSync(
  file,
  fixed,
  "utf8",
);

console.log("");
console.log("========================================");
console.log(" Pack 09 NodeList TypeScript FIXED");
console.log("========================================");
console.log("");
console.log(
  "Naprawiono spread NodeList -> Array.from(...).concat(...).",
);
console.log(
  "Backup:",
  path.relative(root, backup),
);
console.log("");
console.log("Teraz uruchom:");
console.log(
  "  pnpm --filter animated-effects run typecheck",
);
console.log("");
console.log("Jeśli PASS:");
console.log(
  "  pnpm --filter animated-effects run build",
);
