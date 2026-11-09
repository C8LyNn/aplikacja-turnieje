import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const relative =
  "artifacts/animated-effects/src/pack09/uiStructuralFix.ts";

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

let source =
  fs.readFileSync(file, "utf8");

if (
  source.includes(
    "PACK13_FREEZE_HOTFIX"
  )
) {
  console.log("Pack 13 freeze hotfix jest już zastosowany.");
  process.exit(0);
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
    `pack-13-freeze-hotfix-${stamp}`,
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

/*
  1. Coalesce requestAnimationFrame callbacks.
     The original helper could queue many frames when MutationObserver
     reacted to DOM changes caused by its own repair pass.
*/
const oldSchedule =
`function schedule(
  callback: () => void,
): void {
  requestAnimationFrame(
    () => {
      callback();
    },
  );
}`;

const newSchedule =
`/* PACK13_FREEZE_HOTFIX */
let pack13FramePending = false;

function schedule(
  callback: () => void,
): void {
  if (pack13FramePending) {
    return;
  }

  pack13FramePending = true;

  requestAnimationFrame(
    () => {
      pack13FramePending = false;
      callback();
    },
  );
}`;

if (!source.includes(oldSchedule)) {
  fail(
    "Nie znaleziono oczekiwanej funkcji schedule() w uiStructuralFix.ts. Nic nie zmieniono.",
  );
}

source =
  source.replace(
    oldSchedule,
    newSchedule,
  );

/*
  2. Critical fix: do NOT watch the whole library subtree for childList
     changes. fixCards() itself moves buttons inside cards; subtree:true
     observes those moves and can create a self-triggering repair loop.
*/
const oldLibraryObserver =
`  if (library) {
    new MutationObserver(
      () => {
        schedule(
          fixCards,
        );
      },
    ).observe(
      library,
      {
        childList: true,
        subtree: true,
      },
    );
  }`;

const newLibraryObserver =
`  if (library) {
    new MutationObserver(
      () => {
        schedule(
          fixCards,
        );
      },
    ).observe(
      library,
      {
        childList: true,
        subtree: false,
      },
    );

    /*
      Pack06 may update controls inside an existing card without
      replacing the card itself. Re-run once after clicks, but do not
      observe nested child mutations continuously.
    */
    library.addEventListener(
      "click",
      () => {
        schedule(
          fixCards,
        );
      },
      true,
    );
  }`;

if (!source.includes(oldLibraryObserver)) {
  fail(
    "Nie znaleziono oczekiwanego obserwatora biblioteki. Nic nie zmieniono.",
  );
}

source =
  source.replace(
    oldLibraryObserver,
    newLibraryObserver,
  );

fs.writeFileSync(
  file,
  source,
  "utf8",
);

const rollbackPath =
  path.join(
    root,
    "ae-pack-13-freeze-hotfix-rollback.mjs",
  );

const rollback =
`import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const target =
  path.join(
    root,
    ${JSON.stringify(relative)},
  );

const backup =
  ${JSON.stringify(backup)};

if (!fs.existsSync(backup)) {
  console.error("Brak backupu:", backup);
  process.exit(1);
}

fs.copyFileSync(
  backup,
  target,
);

console.log("Pack 13 freeze hotfix cofnięty.");
`;

fs.writeFileSync(
  rollbackPath,
  rollback,
  "utf8",
);

console.log("");
console.log("==============================================");
console.log(" Pack 13 UI Freeze Hotfix INSTALLED");
console.log("==============================================");
console.log("");
console.log("Naprawiono:");
console.log(" - możliwą pętlę MutationObserver -> fixCards -> mutation -> observer");
console.log(" - wielokrotne kolejkowanie requestAnimationFrame");
console.log(" - zachowano ponowne porządkowanie kart po kliknięciu");
console.log("");
console.log("Backup:", path.relative(root, backup));
console.log("Rollback: .\\ae-pack-13-freeze-hotfix-rollback.mjs");
console.log("");
console.log("Teraz uruchom:");
console.log("  pnpm --filter animated-effects run typecheck");
console.log("  pnpm --filter animated-effects run build");
