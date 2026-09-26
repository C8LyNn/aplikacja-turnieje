import type {
  EffectDefinition,
  EffectId,
} from "../core/types";

import {
  effectModules,
  type EffectModule,
} from "./effectModules";

const effectModuleMap =
  new Map<EffectId, EffectModule>(
    effectModules.map(
      (module) => [
        module.definition.id,
        module,
      ],
    ),
  );

export const effectRegistry: Record<
  EffectId,
  EffectDefinition
> = Object.fromEntries(
  effectModules.map(
    (module) => [
      module.definition.id,
      module.definition,
    ],
  ),
);

export function getEffectModule(
  id: EffectId,
): EffectModule | undefined {
  return effectModuleMap.get(id);
}

export function getEffectDefinition(
  id: EffectId,
): EffectDefinition | undefined {
  return effectModuleMap.get(id)?.definition;
}

export function getAllEffectDefinitions():
  EffectDefinition[] {
  return effectModules.map(
    (module) => module.definition,
  );
}

export function getAllEffectModules():
  EffectModule[] {
  return [...effectModules];
}