import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const relative =
  "artifacts/animated-effects/src/pack06/install.ts";

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

let source = fs.readFileSync(file, "utf8");

if (source.includes("PACK16_ACTIVE_CARD_HARD_FIX")) {
  console.log("Pack 16 jest już zainstalowany.");
  process.exit(0);
}

if (!source.includes('card.dataset.pack14Active=')) {
  fail("Nie znaleziono struktury Pack 14 w pack06/install.ts. Nic nie zmieniono.");
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
    `pack-16-active-card-hard-fix-${stamp}`,
    relative,
  );

fs.mkdirSync(path.dirname(backup), { recursive: true });
fs.copyFileSync(file, backup);

const helper = `
/* PACK16_ACTIVE_CARD_HARD_FIX */
function applyPack16CardLayout(
  card: HTMLElement,
  active: boolean,
): void {
  card.style.setProperty(
    "display",
    "grid",
    "important",
  );

  card.style.setProperty(
    "height",
    "auto",
    "important",
  );

  card.style.setProperty(
    "overflow",
    "hidden",
    "important",
  );

  card.style.setProperty(
    "align-items",
    "center",
    "important",
  );

  card.style.setProperty(
    "box-sizing",
    "border-box",
    "important",
  );

  if (active) {
    card.style.setProperty(
      "grid-template-columns",
      "26px minmax(0, 1fr)",
      "important",
    );

    card.style.setProperty(
      "grid-template-areas",
      '"favorite preview" "actions actions"',
      "important",
    );

    card.style.setProperty(
      "grid-template-rows",
      "minmax(42px, auto) 36px",
      "important",
    );

    card.style.setProperty(
      "min-height",
      "98px",
      "important",
    );

    card.style.setProperty(
      "padding",
      "7px 8px 10px",
      "important",
    );

    card.style.setProperty(
      "column-gap",
      "7px",
      "important",
    );

    card.style.setProperty(
      "row-gap",
      "8px",
      "important",
    );

    return;
  }

  card.style.setProperty(
    "grid-template-columns",
    "26px minmax(0, 1fr) 36px",
    "important",
  );

  card.style.setProperty(
    "grid-template-areas",
    '"favorite preview add"',
    "important",
  );

  card.style.setProperty(
    "grid-template-rows",
    "minmax(42px, auto)",
    "important",
  );

  card.style.setProperty(
    "min-height",
    "58px",
    "important",
  );

  card.style.setProperty(
    "padding",
    "6px 8px",
    "important",
  );

  card.style.setProperty(
    "gap",
    "6px",
    "important",
  );
}

function applyPack16ActionsLayout(
  actions: HTMLElement,
): void {
  actions.style.setProperty(
    "display",
    "grid",
    "important",
  );

  actions.style.setProperty(
    "grid-template-columns",
    "repeat(3, minmax(0, 1fr))",
    "important",
  );

  actions.style.setProperty(
    "grid-area",
    "actions",
    "important",
  );

  actions.style.setProperty(
    "height",
    "36px",
    "important",
  );

  actions.style.setProperty(
    "min-height",
    "36px",
    "important",
  );

  actions.style.setProperty(
    "margin",
    "0 0 0 28px",
    "important",
  );

  actions.style.setProperty(
    "padding",
    "0",
    "important",
  );

  actions.style.setProperty(
    "gap",
    "6px",
    "important",
  );

  actions.style.setProperty(
    "align-self",
    "end",
    "important",
  );

  actions
    .querySelectorAll<HTMLElement>(
      "button",
    )
    .forEach(
      (button) => {
        button.style.setProperty(
          "height",
          "34px",
          "important",
        );

        button.style.setProperty(
          "min-height",
          "34px",
          "important",
        );

        button.style.setProperty(
          "width",
          "100%",
          "important",
        );

        button.style.setProperty(
          "min-width",
          "0",
          "important",
        );

        button.style.setProperty(
          "margin",
          "0",
          "important",
        );

        button.style.setProperty(
          "padding",
          "0 6px",
          "important",
        );
      },
    );
}
`;

const decorateStart = source.indexOf("function decorateLibrary():void{");

if (decorateStart < 0) {
  fail("Nie znaleziono decorateLibrary(). Nic nie zmieniono.");
}

source =
  source.slice(0, decorateStart) +
  helper +
  "\n" +
  source.slice(decorateStart);

const stateNeedle =
`    card.dataset.pack14Active=
      active?"1":"0";`;

if (!source.includes(stateNeedle)) {
  fail("Nie znaleziono miejsca ustawiania stanu aktywnej karty. Nic nie zmieniono.");
}

source = source.replace(
  stateNeedle,
  stateNeedle +
`
    applyPack16CardLayout(
      card,
      active,
    );`,
);

const actionsNeedle =
`        actions.append(
          minus,
          count,
          add,
        );

        card.appendChild(
          actions,
        );`;

if (!source.includes(actionsNeedle)) {
  fail("Nie znaleziono tworzenia rzędu akcji. Nic nie zmieniono.");
}

source = source.replace(
  actionsNeedle,
`        actions.append(
          minus,
          count,
          add,
        );

        applyPack16ActionsLayout(
          actions,
        );

        card.appendChild(
          actions,
        );`,
);

fs.writeFileSync(file, source, "utf8");

const rollbackPath =
  path.join(
    root,
    "ae-ui-pack-16-active-card-hard-fix-rollback.mjs",
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
console.log("Pack 16 cofnięty.");
`;

fs.writeFileSync(rollbackPath, rollback, "utf8");

console.log("");
console.log("==================================================");
console.log(" Animated Effects UI Pack 16 HARD FIX INSTALLED");
console.log("==================================================");
console.log("");
console.log("Naprawa jest źródłowa, nie kolejnym override CSS.");
console.log("");
console.log("Aktywna karta:");
console.log(" - wysokość min. 98 px");
console.log(" - osobny 36 px rząd kontrolek");
console.log(" - 8 px odstępu między treścią i kontrolkami");
console.log(" - 10 px dolnego paddingu");
console.log(" - przyciski mają wymuszony stabilny rozmiar 34 px");
console.log("");
console.log("Nieaktywne karty zachowują kompaktowy układ.");
console.log("");
console.log("Backup:", path.relative(root, backup));
console.log("Rollback: .\\ae-ui-pack-16-active-card-hard-fix-rollback.mjs");
console.log("");
console.log("Teraz:");
console.log("  pnpm --filter animated-effects run typecheck");
console.log("  pnpm --filter animated-effects run build");
