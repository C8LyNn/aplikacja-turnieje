import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function fail(message) {
  console.error("\nERROR:", message);
  process.exit(1);
}

if (!fs.existsSync(path.join(root, "pnpm-workspace.yaml"))) {
  fail("Uruchom z głównego katalogu aplikacja-turnieje-live.");
}

const target = path.join(
  root,
  "artifacts/animated-effects/src/pack06/polish02.ts",
);

if (!fs.existsSync(target)) {
  fail("Brak src/pack06/polish02.ts.");
}

let source = fs.readFileSync(target, "utf8");

const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-")
  .replace("T", "_")
  .replace("Z", "");

const backup = path.join(
  root,
  ".ae-pack-backup",
  `pack-06-polish-02-fix-freeze-${stamp}`,
  "artifacts/animated-effects/src/pack06/polish02.ts",
);

fs.mkdirSync(
  path.dirname(backup),
  { recursive: true },
);

fs.copyFileSync(
  target,
  backup,
);

const oldBlock = `  const observer =
    new MutationObserver(
      () => {
        if (queued) {
          return;
        }

        queued = true;

        queueMicrotask(
          () => {
            queued = false;
            apply();
          },
        );
      },
    );

  observer.observe(
    document.body,
    {
      childList: true,
      subtree: true,
    },
  );`;

const newBlock = `  const observer =
    new MutationObserver(
      () => {
        if (queued) {
          return;
        }

        queued = true;

        requestAnimationFrame(
          () => {
            /*
              Polish modifies labels/classes itself. While it is applying,
              disconnect the observer so those cosmetic mutations cannot
              schedule another polish pass forever and starve browser input.
            */
            observer.disconnect();

            try {
              apply();
            } finally {
              queued = false;

              observer.observe(
                document.body,
                {
                  childList: true,
                  subtree: true,
                },
              );
            }
          },
        );
      },
    );

  observer.observe(
    document.body,
    {
      childList: true,
      subtree: true,
    },
  );`;

if (source.includes(newBlock)) {
  console.log("Fix freeze jest już zainstalowany.");
  process.exit(0);
}

if (!source.includes(oldBlock)) {
  fail(
    "Nie znaleziono oczekiwanego MutationObservera w polish02.ts. " +
    "Nie wykonano zmian."
  );
}

source = source.replace(
  oldBlock,
  newBlock,
);

fs.writeFileSync(
  target,
  source,
  "utf8",
);

console.log("");
console.log("========================================");
console.log(" Pack 06 Polish 02 - UI FREEZE FIXED");
console.log("========================================");
console.log("");
console.log("Usunięto pętlę MutationObserver -> apply -> mutation -> MutationObserver.");
console.log("Backup:", path.relative(root, backup));
console.log("");
console.log("Teraz uruchom:");
console.log("  pnpm --filter animated-effects run typecheck");
console.log("  pnpm --filter animated-effects run build");
