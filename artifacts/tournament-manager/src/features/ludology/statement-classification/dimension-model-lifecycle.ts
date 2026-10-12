import type { DimensionModelStatus } from "./model";

export function canEditDimensionModelStructure(status: DimensionModelStatus): boolean {
  return status === "draft" || status === "pilot";
}

export function canTransitionDimensionModelStatus(
  from: DimensionModelStatus,
  to: DimensionModelStatus,
): boolean {
  if (from === to) return true;
  if (from === "draft") return to === "pilot" || to === "active" || to === "retired";
  if (from === "pilot") return to === "draft" || to === "active" || to === "retired";
  if (from === "active") return to === "retired";
  return false;
}

export function dimensionModelStatusOptions(
  current: DimensionModelStatus,
): DimensionModelStatus[] {
  return (["draft", "pilot", "active", "retired"] as const).filter((candidate) =>
    canTransitionDimensionModelStatus(current, candidate),
  );
}
