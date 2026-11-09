import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function fail(message) {
  console.error("\nERROR:", message);
  process.exit(1);
}

function read(rel) {
  const file = path.join(root, rel);

  if (!fs.existsSync(file)) {
    fail("Brak pliku: " + rel);
  }

  return fs.readFileSync(
    file,
    "utf8",
  );
}

function write(rel, content) {
  const file = path.join(root, rel);

  fs.writeFileSync(
    file,
    content,
    "utf8",
  );
}

if (
  !fs.existsSync(
    path.join(
      root,
      "pnpm-workspace.yaml",
    ),
  )
) {
  fail(
    "Uruchom z głównego katalogu aplikacja-turnieje-live.",
  );
}

const registryRel =
  "artifacts/animated-effects/src/effects/registry.ts";

const inspectorRel =
  "artifacts/animated-effects/src/editor/inspector.ts";

const pack06Rel =
  "artifacts/animated-effects/src/pack06/install.ts";

for (const rel of [
  registryRel,
  inspectorRel,
  pack06Rel,
]) {
  read(rel);
}

const stamp =
  new Date()
    .toISOString()
    .replace(
      /[:.]/g,
      "-",
    )
    .replace(
      "T",
      "_",
    )
    .replace(
      "Z",
      "",
    );

const backupRoot =
  path.join(
    root,
    ".ae-pack-backup",
    `pack-07-fix-01-${stamp}`,
  );

for (const rel of [
  registryRel,
  inspectorRel,
  pack06Rel,
]) {
  const source =
    path.join(
      root,
      rel,
    );

  const target =
    path.join(
      backupRoot,
      rel,
    );

  fs.mkdirSync(
    path.dirname(
      target,
    ),
    {
      recursive: true,
    },
  );

  fs.copyFileSync(
    source,
    target,
  );
}

/*
  1. Pack 07 overrides existing effect IDs.
  The registry map already keeps the last module, but the library is built
  from getAllEffectDefinitions(), so duplicate IDs must be removed there too.
*/
let registry =
  read(
    registryRel,
  );

if (
  !registry.includes(
    "registeredEffectModules",
  )
) {
  const pattern =
    /const\s+allEffectModules\s*:\s*EffectModule\[\]\s*=\s*\[([\s\S]*?)\];/m;

  const match =
    registry.match(
      pattern,
    );

  if (!match) {
    fail(
      "Nie znaleziono allEffectModules w registry.ts.",
    );
  }

  const body =
    match[1]
      .trim()
      .replace(
        /,\s*$/,
        "",
      );

  const replacement =
`const registeredEffectModules:
  EffectModule[] = [
    ${body},
  ];

const allEffectModules:
  EffectModule[] =
    Array.from(
      new Map<
        EffectId,
        EffectModule
      >(
        registeredEffectModules.map(
          (module) => [
            module.definition.id,
            module,
          ],
        ),
      ).values(),
    );`;

  registry =
    registry.replace(
      pattern,
      replacement,
    );

  write(
    registryRel,
    registry,
  );
}

/*
  2. Expand the manual ranges so Overdrive values can actually be edited.
  400% means four times the normal 100% baseline.
*/
let inspector =
  read(
    inspectorRel,
  );

const densityOld =
`const densityField: RangeField = {
  key: "density",
  label: "Gęstość",
  min: 10,
  max: 100,
  suffix: "%",
};`;

const densityNew =
`const densityField: RangeField = {
  key: "density",
  label: "Gęstość",
  min: 10,
  max: 400,
  suffix: "%",
};`;

if (
  inspector.includes(
    densityOld,
  )
) {
  inspector =
    inspector.replace(
      densityOld,
      densityNew,
    );
}

const speedOld =
`const speedField: RangeField = {
  key: "speed",
  label: "Prędkość",
  min: 20,
  max: 300,
  suffix: "%",
};`;

const speedNew =
`const speedField: RangeField = {
  key: "speed",
  label: "Prędkość",
  min: 20,
  max: 400,
  suffix: "%",
};`;

if (
  inspector.includes(
    speedOld,
  )
) {
  inspector =
    inspector.replace(
      speedOld,
      speedNew,
    );
}

write(
  inspectorRel,
  inspector,
);

let pack06 =
  read(
    pack06Rel,
  );

if (
  pack06.includes(
    'data-pack06-intensity',
  )
) {
  pack06 =
    pack06.replace(
      /<input type="range" min="0" max="200" value="\$\{selected\.settings\.intensity\}" data-pack06-intensity>/,
      '<input type="range" min="0" max="400" value="${selected.settings.intensity}" data-pack06-intensity>',
    );
}

write(
  pack06Rel,
  pack06,
);

console.log("");
console.log("==========================================");
console.log(" Pack 07 Fix 01 INSTALLED");
console.log("==========================================");
console.log("");
console.log("Naprawiono:");
console.log(" - brak duplikatów efektów po override Pack 07");
console.log(" - Gęstość: max 400%");
console.log(" - Prędkość: max 400%");
console.log(" - Intensywność: max 400%");
console.log("");
console.log(
  "Backup:",
  path.relative(
    root,
    backupRoot,
  ),
);
console.log("");
console.log("Teraz uruchom:");
console.log(
  "  pnpm --filter animated-effects run typecheck",
);
console.log(
  "  pnpm --filter animated-effects run build",
);
