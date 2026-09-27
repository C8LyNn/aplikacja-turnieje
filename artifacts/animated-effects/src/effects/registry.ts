import type {
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
import {
  pack07OverdriveEffectModules,
} from "./modules/pack07Overdrive";
import {
  pack08EffectModules,
} from "./modules/pack08Expansion";

const registeredEffectModules:
  EffectModule[] = [
    ...effectModules,
    ...pack06EffectModules,
    ...pack06ExtraEffectModules,
  ...pack07OverdriveEffectModules,
    ...pack08EffectModules,
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
    );

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
