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

const registryPath = path.join(
  root,
  "artifacts/animated-effects/src/effects/registry.ts",
);

if (!fs.existsSync(registryPath)) {
  fail("Brak registry.ts.");
}

const current = fs.readFileSync(registryPath, "utf8");

for (const required of [
  "effectModules",
  "pack06EffectModules",
  "pack06ExtraEffectModules",
]) {
  if (!current.includes(required)) {
    fail(`registry.ts nie zawiera oczekiwanego elementu: ${required}`);
  }
}

const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-")
  .replace("T", "_")
  .replace("Z", "");

const backupPath = path.join(
  root,
  ".ae-pack-backup",
  `pack-06-polish-02-fix-registry-${stamp}`,
  "artifacts/animated-effects/src/effects/registry.ts",
);

fs.mkdirSync(
  path.dirname(backupPath),
  { recursive: true },
);

fs.copyFileSync(
  registryPath,
  backupPath,
);

const repaired = `import type {
  EffectDefinition,
  EffectId,
} from "../core/types";

import {
  effectModules,
  type EffectModule,
} from "./effectModules";

import {
  pack06EffectModules,
} from "./modules/pack06";

import {
  pack06ExtraEffectModules,
} from "./modules/pack06Extra";

const allEffectModules:
  EffectModule[] = [
    ...effectModules,
    ...pack06EffectModules,
    ...pack06ExtraEffectModules,
  ];

const effectModuleMap =
  new Map<
    EffectId,
    EffectModule
  >(
    allEffectModules.map(
      (module) => [
        module.definition.id,
        module,
      ],
    ),
  );

export const effectRegistry:
  Record<
    EffectId,
    EffectDefinition
  > =
    Object.fromEntries(
      allEffectModules.map(
        (module) => [
          module.definition.id,
          module.definition,
        ],
      ),
    );

export function getEffectModule(
  id: EffectId,
):
  | EffectModule
  | undefined {
  return (
    effectModuleMap.get(id)
  );
}

export function getEffectDefinition(
  id: EffectId,
):
  | EffectDefinition
  | undefined {
  return (
    effectModuleMap.get(id)
      ?.definition
  );
}

export function getAllEffectDefinitions():
  EffectDefinition[] {
  return allEffectModules.map(
    (module) =>
      module.definition,
  );
}

export function getAllEffectModules():
  EffectModule[] {
  return [
    ...allEffectModules,
  ];
}
`;

fs.writeFileSync(
  registryPath,
  repaired,
  "utf8",
);

console.log("");
console.log("========================================");
console.log(" Pack 06 Polish 02 - registry FIXED");
console.log("========================================");
console.log("");
console.log("Naprawiono składnię src/effects/registry.ts");
console.log("Backup:", path.relative(root, backupPath));
console.log("");
console.log("Teraz uruchom:");
console.log("  pnpm --filter animated-effects run typecheck");
