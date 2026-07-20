import type { SeedingCeremonyDraw, SeedingCeremonyState } from "@/lib/seeding-ceremony-api";

export interface RandomCeremonyStage {
  entrySeedingPolicy?: string | null;
  seedingPolicy?: string | null;
  randomRevealOrder?: "instant" | "sequential" | string | null;
}

export function stageHasRandomCeremony(stage: RandomCeremonyStage): boolean {
  return stage.entrySeedingPolicy === "random" ||
    stage.seedingPolicy === "random_groups" ||
    stage.seedingPolicy === "random_bracket";
}

export function stageRequiresSequentialCeremony(stage: RandomCeremonyStage): boolean {
  return stageHasRandomCeremony(stage) && stage.randomRevealOrder === "sequential";
}

export function isSequentialCeremonyReady(
  stage: RandomCeremonyStage,
  state: Pick<SeedingCeremonyState, "status"> | null,
): boolean {
  if (!stageRequiresSequentialCeremony(stage)) return true;
  return state?.status === "completed" || state?.status === "applied";
}

export function drawResultLabel(
  draw: SeedingCeremonyDraw,
  mode: SeedingCeremonyState["drawMode"],
): string {
  return mode === "seed" ? `Seed ${draw.seed}` : draw.placement.label;
}

export function remainingWheelDraws(state: SeedingCeremonyState): SeedingCeremonyDraw[] {
  return [...state.draws.slice(state.revealedCount)].sort((left, right) =>
    state.drawMode === "seed"
      ? left.seed - right.seed
      : left.placement.label.localeCompare(right.placement.label, "pl", { numeric: true }),
  );
}

export function revealedCeremonyDraws(state: SeedingCeremonyState): SeedingCeremonyDraw[] {
  return state.draws.slice(0, state.revealedCount);
}

export function visibleWheelDraws(
  state: SeedingCeremonyState,
  targetDrawNumber?: number,
  limit = 32,
): SeedingCeremonyDraw[] {
  const remaining = remainingWheelDraws(state);
  if (remaining.length <= limit) return remaining;
  const visible = remaining.slice(0, limit);
  if (targetDrawNumber == null || visible.some((draw) => draw.drawNumber === targetDrawNumber)) {
    return visible;
  }
  const target = remaining.find((draw) => draw.drawNumber === targetDrawNumber);
  if (!target) return visible;
  return [...remaining.slice(0, Math.max(0, limit - 1)), target];
}
