import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const pack09Relative =
  "artifacts/animated-effects/src/pack09/customization.ts";

const pack08Relative =
  "artifacts/animated-effects/src/pack08/uiQa.ts";

const pack09File =
  path.join(root, pack09Relative);

const pack08File =
  path.join(root, pack08Relative);

function fail(message) {
  console.error("\nERROR:", message);
  process.exit(1);
}

if (!fs.existsSync(path.join(root, "pnpm-workspace.yaml"))) {
  fail("Uruchom z katalogu głównego aplikacja-turnieje-live.");
}

for (const file of [pack09File, pack08File]) {
  if (!fs.existsSync(file)) {
    fail("Brak pliku: " + path.relative(root, file));
  }
}

let pack09 =
  fs.readFileSync(pack09File, "utf8");

let pack08 =
  fs.readFileSync(pack08File, "utf8");

if (
  pack09.includes("PACK17_OBSERVER_STABILITY_FIX") ||
  pack08.includes("PACK17_OBSERVER_STABILITY_FIX")
) {
  console.log("Pack 17 jest już zainstalowany.");
  process.exit(0);
}

const stamp =
  new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .replace("Z", "");

const backupRoot =
  path.join(
    root,
    ".ae-pack-backup",
    `pack-17-observer-stability-${stamp}`,
  );

for (const relative of [pack09Relative, pack08Relative]) {
  const source =
    path.join(root, relative);

  const backup =
    path.join(
      backupRoot,
      relative,
    );

  fs.mkdirSync(
    path.dirname(backup),
    { recursive: true },
  );

  fs.copyFileSync(
    source,
    backup,
  );
}

/* ---------------------------------------------------------
   PACK09
   The existing observer watches direct inspector children and calls
   queueRender(). queueRender() mutates those same children.
   Disconnect the observer BEFORE scheduling own render, and reconnect
   only after that render has fully completed.
   --------------------------------------------------------- */

const oldQueueRender =
`function queueRender(): void {
  if (renderQueued) {
    return;
  }

  renderQueued = true;

  queueMicrotask(
    () => {
      renderQueued = false;
      renderPanel();
    },
  );
}`;

const newQueueRender =
`/* PACK17_OBSERVER_STABILITY_FIX */
function observeInspectorSafely(): void {
  const inspector =
    document.querySelector(
      "#inspector",
    );

  if (
    !observer ||
    !inspector
  ) {
    return;
  }

  observer.observe(
    inspector,
    {
      childList: true,
      subtree: false,
    },
  );
}

function queueRender(): void {
  if (renderQueued) {
    return;
  }

  renderQueued = true;

  /*
    renderPanel() changes the same inspector children observed below.
    Disconnect first so our own DOM mutations cannot recursively queue
    another render forever.
  */
  observer?.disconnect();

  queueMicrotask(
    () => {
      try {
        renderPanel();
      } finally {
        renderQueued = false;
        observeInspectorSafely();
      }
    },
  );
}`;

if (!pack09.includes(oldQueueRender)) {
  fail(
    "Pack09: nie znaleziono oczekiwanej funkcji queueRender(). Nic nie zmieniono.",
  );
}

pack09 =
  pack09.replace(
    oldQueueRender,
    newQueueRender,
  );

const oldPack09Observe =
`  observer.observe(
    inspector,
    {
      childList: true,
      subtree: false,
    },
  );

  renderPanel();`;

const newPack09Observe =
`  /*
    Initial render happens while observer is disconnected.
    Only external inspector replacements are observed afterwards.
  */
  renderPanel();
  observeInspectorSafely();`;

if (!pack09.includes(oldPack09Observe)) {
  fail(
    "Pack09: nie znaleziono końcowego observer.observe()/renderPanel(). Nic nie zmieniono.",
  );
}

pack09 =
  pack09.replace(
    oldPack09Observe,
    newPack09Observe,
  );

fs.writeFileSync(
  pack09File,
  pack09,
  "utf8",
);

/* ---------------------------------------------------------
   PACK08
   scanRanges() runs from an inspector-wide subtree observer.
   Guard it exactly like polish02: coalesce to one frame, disconnect
   while applying DOM polish, reconnect only afterwards.
   --------------------------------------------------------- */

const oldPack08Observer =
`  if (inspector) {
    const observer =
      new MutationObserver(
        () => {
          scanRanges();
        },
      );

    observer.observe(
      inspector,
      {
        childList: true,
        subtree: true,
      },
    );
  }`;

const newPack08Observer =
`  if (inspector) {
    /* PACK17_OBSERVER_STABILITY_FIX */
    let rangeScanQueued = false;

    const observer =
      new MutationObserver(
        () => {
          if (rangeScanQueued) {
            return;
          }

          rangeScanQueued = true;

          requestAnimationFrame(
            () => {
              observer.disconnect();

              try {
                scanRanges();
              } finally {
                rangeScanQueued = false;

                observer.observe(
                  inspector,
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
      inspector,
      {
        childList: true,
        subtree: true,
      },
    );
  }`;

if (!pack08.includes(oldPack08Observer)) {
  fail(
    "Pack08: nie znaleziono oczekiwanego MutationObserver inspectora. Nic nie zmieniono.",
  );
}

pack08 =
  pack08.replace(
    oldPack08Observer,
    newPack08Observer,
  );

fs.writeFileSync(
  pack08File,
  pack08,
  "utf8",
);

const rollbackPath =
  path.join(
    root,
    "ae-stability-pack-17-observer-fix-rollback.mjs",
  );

const rollback =
`import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const backupRoot = ${JSON.stringify(backupRoot)};

for (const relative of [
  ${JSON.stringify(pack09Relative)},
  ${JSON.stringify(pack08Relative)},
]) {
  const source =
    path.join(backupRoot, relative);

  const target =
    path.join(root, relative);

  if (!fs.existsSync(source)) {
    console.error("Brak backupu:", source);
    process.exit(1);
  }

  fs.copyFileSync(source, target);
}

console.log("Pack 17 cofnięty.");
`;

fs.writeFileSync(
  rollbackPath,
  rollback,
  "utf8",
);

console.log("");
console.log("==================================================");
console.log(" Animated Effects Stability Pack 17 INSTALLED");
console.log("==================================================");
console.log("");
console.log("Naprawiono dwa niezależne obserwatory inspectora:");
console.log("");
console.log("Pack09 customization:");
console.log(" - observer jest odłączany PRZED renderPanel()");
console.log(" - własne mutacje panelu nie mogą ponownie wywołać renderu");
console.log(" - reconnect następuje dopiero po zakończeniu renderu");
console.log(" - initial render odbywa się przed uruchomieniem obserwatora");
console.log("");
console.log("Pack08 uiQa:");
console.log(" - scanRanges jest koaleskowany do jednego requestAnimationFrame");
console.log(" - observer jest odłączany podczas scanRanges()");
console.log(" - reconnect następuje dopiero po zakończeniu skanowania");
console.log("");
console.log("Pack06 polish02 pozostawiono bez zmian, ponieważ już sam");
console.log("odłącza observer podczas własnego apply().");
console.log("");
console.log("Backup:", path.relative(root, backupRoot));
console.log("Rollback: .\\ae-stability-pack-17-observer-fix-rollback.mjs");
console.log("");
console.log("Teraz:");
console.log("  pnpm --filter animated-effects run typecheck");
console.log("  pnpm --filter animated-effects run build");
