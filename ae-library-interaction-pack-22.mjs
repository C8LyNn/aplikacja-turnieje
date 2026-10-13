import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const files = {
  main: "artifacts/animated-effects/src/main.ts",
  style: "artifacts/animated-effects/src/style.css",
  polish: "artifacts/animated-effects/src/pack06/polish02.ts",
};

function fail(message) {
  console.error("\nERROR:", message);
  process.exit(1);
}

if (!fs.existsSync(path.join(root, "pnpm-workspace.yaml"))) {
  fail("Uruchom instalator z katalogu głównego aplikacja-turnieje-live.");
}

for (const relative of Object.values(files)) {
  if (!fs.existsSync(path.join(root, relative))) {
    fail("Brak pliku: " + relative);
  }
}

let main = fs.readFileSync(path.join(root, files.main), "utf8");
let style = fs.readFileSync(path.join(root, files.style), "utf8");
let polish = fs.readFileSync(path.join(root, files.polish), "utf8");

if (main.includes("AE_LIBRARY_INTERACTION_PACK_22")) {
  console.log("Library Interaction Pack 22 jest już zainstalowany.");
  process.exit(0);
}

const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-")
  .replace("T", "_")
  .replace("Z", "");

const backupRoot = path.join(
  root,
  ".ae-pack-backup",
  `pack-22-library-interaction-${stamp}`,
);

for (const relative of Object.values(files)) {
  const source = path.join(root, relative);
  const backup = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(source, backup);
}

/* -----------------------------------------------------------
   1. Remove Pack 21's overly broad flex override.
   It fixed neither root cause and could disturb active-card layout.
----------------------------------------------------------- */
style = style.replace(
  /\/\* === AE_LIBRARY_STABILITY_PACK_21_START ===[\s\S]*?\/\* === AE_LIBRARY_STABILITY_PACK_21_END === \*\//m,
  "",
);

/* -----------------------------------------------------------
   2. Add narrow CSS guardrails only.
   Preserve the native active-card grid (- | count | + row).
----------------------------------------------------------- */
style = style.trimEnd() + `

/* === AE_LIBRARY_INTERACTION_PACK_22_CSS_START === */

/*
  Keep library width stable WITHOUT changing its layout model.
  Active cards keep the native two-row layout from the UI packs.
*/
#effect-library {
  width: 100% !important;
  min-width: 0 !important;
  box-sizing: border-box !important;
  overflow-anchor: none !important;
}

#effect-library > .ae-effect-card {
  width: 100% !important;
  min-width: 0 !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
  overflow-anchor: none !important;
}

#effect-library > .ae-effect-card > .ae-effect-card-preview {
  min-width: 0 !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

/* === AE_LIBRARY_INTERACTION_PACK_22_CSS_END === */
`;

/* -----------------------------------------------------------
   3. Remove the old "restore exact scrollTop" workaround.
   It fights with real visual anchoring after card-height changes.
----------------------------------------------------------- */
const oldScrollRestore = /current\.scrollTop\s*=\s*value\s*;/m;

if (oldScrollRestore.test(polish)) {
  polish = polish.replace(
    oldScrollRestore,
    `/* AE_LIBRARY_INTERACTION_PACK_22:
       visual anchoring is handled by main.ts after the final DOM update.
    */
    void value;`,
  );
} else {
  console.warn(
    "UWAGA: nie znaleziono starego current.scrollTop = value w polish02.ts. " +
    "Kontynuuję, bo mógł już zostać zmieniony."
  );
}

/* -----------------------------------------------------------
   4. Stable visual anchor + preview UI sync.
----------------------------------------------------------- */
const renderLibraryNeedle = "function renderEffectLibrary(): void {";

if (!main.includes(renderLibraryNeedle)) {
  fail("Nie znaleziono renderEffectLibrary() w main.ts.");
}

const helpers = `/* AE_LIBRARY_INTERACTION_PACK_22 */

type EffectLibraryVisualAnchor = {
  effectId: string;
  topOffset: number;
  scrollTop: number;
};

function captureEffectLibraryVisualAnchor():
  EffectLibraryVisualAnchor | null {
  const libraryRect =
    effectLibrary.getBoundingClientRect();

  const cards =
    Array.from(
      effectLibrary.querySelectorAll<HTMLElement>(
        ":scope > .ae-effect-card[data-effect-id]",
      ),
    ).filter(
      (card) =>
        !card.hidden &&
        getComputedStyle(card).display !== "none",
    );

  const anchor =
    cards.find(
      (card) =>
        card.getBoundingClientRect().bottom >
        libraryRect.top + 1,
    );

  if (!anchor) {
    return null;
  }

  const effectId =
    anchor.dataset.effectId;

  if (!effectId) {
    return null;
  }

  return {
    effectId,
    topOffset:
      anchor.getBoundingClientRect().top -
      libraryRect.top,
    scrollTop:
      effectLibrary.scrollTop,
  };
}

function restoreEffectLibraryVisualAnchor(
  anchor: EffectLibraryVisualAnchor | null,
): void {
  if (!anchor) {
    return;
  }

  const libraryRect =
    effectLibrary.getBoundingClientRect();

  const card =
    Array.from(
      effectLibrary.querySelectorAll<HTMLElement>(
        ":scope > .ae-effect-card[data-effect-id]",
      ),
    ).find(
      (candidate) =>
        candidate.dataset.effectId ===
        anchor.effectId,
    );

  if (!card) {
    effectLibrary.scrollTop =
      anchor.scrollTop;
    return;
  }

  const currentOffset =
    card.getBoundingClientRect().top -
    libraryRect.top;

  const delta =
    currentOffset -
    anchor.topOffset;

  if (
    Number.isFinite(delta) &&
    Math.abs(delta) > 0.25
  ) {
    effectLibrary.scrollTop +=
      delta;
  }
}

function scheduleEffectLibraryVisualAnchorRestore(
  anchor: EffectLibraryVisualAnchor | null,
): void {
  if (!anchor) {
    return;
  }

  /*
    Pack06 decoration runs in a microtask and cosmetic polish may run
    on the following animation frame. Restore after both have settled.
  */
  requestAnimationFrame(
    () => {
      requestAnimationFrame(
        () => {
          restoreEffectLibraryVisualAnchor(
            anchor,
          );
        },
      );
    },
  );
}

function syncTemporaryPreviewUi(): void {
  Array.from(
    effectLibrary.querySelectorAll<HTMLElement>(
      ":scope > .ae-effect-card[data-effect-id]",
    ),
  ).forEach(
    (card) => {
      const effectId =
        card.dataset.effectId;

      if (!effectId) {
        return;
      }

      const isPreviewing =
        temporaryPreviewEffect
          ?.effectId ===
        effectId;

      card.classList.toggle(
        "is-previewing",
        isPreviewing,
      );

      const button =
        card.querySelector<HTMLButtonElement>(
          ".ae-effect-card-preview",
        );

      if (!button) {
        return;
      }

      button.setAttribute(
        "aria-pressed",
        String(isPreviewing),
      );

      const definition =
        getEffectDefinition(
          effectId,
        );

      if (definition) {
        button.setAttribute(
          "aria-label",
          isPreviewing
            ? \`Wyłącz tymczasowy podgląd \${definition.name}\`
            : \`Podejrzyj tymczasowo \${definition.name}\`,
        );
      }
    },
  );
}

`;

main = main.replace(
  renderLibraryNeedle,
  helpers + renderLibraryNeedle,
);

/* -----------------------------------------------------------
   5. Every base card gets a stable identity before Pack06 touches it.
----------------------------------------------------------- */
const categoryAssignment =
`      card.dataset.category =
        definition.category;`;

if (!main.includes(categoryAssignment)) {
  fail("Nie znaleziono przypisania card.dataset.category w main.ts.");
}

main = main.replace(
  categoryAssignment,
  categoryAssignment + `

      card.dataset.effectId =
        definition.id;`,
);

/* -----------------------------------------------------------
   6. renderEffectLibrary captures/restores the visible card.
----------------------------------------------------------- */
main = main.replace(
  renderLibraryNeedle,
  renderLibraryNeedle + `
  const visualAnchor =
    captureEffectLibraryVisualAnchor();
`,
);

const beforeRenderPreview =
/\n}\n\nfunction renderPreview\(\): void \{/m;

if (!beforeRenderPreview.test(main)) {
  fail("Nie znaleziono końca renderEffectLibrary().");
}

main = main.replace(
  beforeRenderPreview,
  `
  scheduleEffectLibraryVisualAnchorRestore(
    visualAnchor,
  );
}

function renderPreview(): void {`,
);

/* -----------------------------------------------------------
   7. Temporary preview must NOT rebuild the whole library.
   Rebuilding was deleting Pack06/active-card decorations and caused
   the "double click makes list narrower" regression.
----------------------------------------------------------- */
let previewPairReplacements = 0;

main = main.replace(
  /renderEffectLibrary\(\);\s*\n(\s*)renderPreview\(\);/g,
  (_match, indent) => {
    previewPairReplacements += 1;
    return `syncTemporaryPreviewUi();\n${indent}renderPreview();`;
  },
);

if (previewPairReplacements < 2) {
  console.warn(
    "UWAGA: znaleziono tylko " +
    previewPairReplacements +
    " par renderEffectLibrary()+renderPreview()."
  );
}

/*
  + already causes a state update, which triggers the normal editor render.
  Do not rebuild the library once before addEffect and then again from state.
*/
main = main.replace(
  /temporaryPreviewEffect\s*=\s*null;\s*\n\s*renderEffectLibrary\(\);\s*\n\s*addEffect\(/m,
  `temporaryPreviewEffect =
              null;

            syncTemporaryPreviewUi();

            addEffect(`,
);

/*
  Clearing state also triggers renderEditor; avoid the duplicate pre-render.
*/
main = main.replace(
  /temporaryPreviewEffect\s*=\s*null;\s*\n\s*renderEffectLibrary\(\);\s*\n\s*clearEffects\(\);/m,
  `temporaryPreviewEffect =
        null;

      clearEffects();`,
);

fs.writeFileSync(path.join(root, files.main), main, "utf8");
fs.writeFileSync(path.join(root, files.style), style, "utf8");
fs.writeFileSync(path.join(root, files.polish), polish, "utf8");

const rollbackPath =
  path.join(
    root,
    "ae-library-interaction-pack-22-rollback.mjs",
  );

const rollback = `import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const backupRoot = ${JSON.stringify(backupRoot)};
const files = ${JSON.stringify(Object.values(files))};

for (const relative of files) {
  const backup = path.join(backupRoot, relative);
  const target = path.join(root, relative);

  if (!fs.existsSync(backup)) {
    console.error("Brak backupu:", backup);
    process.exit(1);
  }

  fs.copyFileSync(backup, target);
}

console.log("Library Interaction Pack 22 cofnięty.");
`;

fs.writeFileSync(rollbackPath, rollback, "utf8");

console.log("");
console.log("=====================================================");
console.log(" Animated Effects Library Interaction Pack 22 INSTALLED");
console.log("=====================================================");
console.log("");
console.log("Naprawiono:");
console.log(" 1. Pack 21 flex override usunięty - aktywne karty zachowują układ - | 1x | +.");
console.log(" 2. Klikanie korpusu karty nie przebudowuje już całej biblioteki.");
console.log(" 3. Tymczasowy preview zmienia tylko stan wizualny istniejącej karty.");
console.log(" 4. Dodanie/usunięcie zachowuje wizualną pozycję pierwszej widocznej karty.");
console.log(" 5. Stary restoreScroll z Polish02 nie walczy już z anchorem.");
console.log("");
console.log("Backup:", path.relative(root, backupRoot));
console.log("Rollback: .\\ae-library-interaction-pack-22-rollback.mjs");
console.log("");
console.log("Teraz:");
console.log("  pnpm --filter animated-effects run typecheck");
console.log("  pnpm --filter animated-effects run build");
