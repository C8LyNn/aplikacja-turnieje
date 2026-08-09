import type { AddCompiledRoutingProblemV2 } from "./compiled-routing-validation-model";

function containsCycle(
  nodeKeys: ReadonlySet<string>,
  edges: ReadonlyMap<string, readonly string[]>,
): boolean {
  const state = new Map<string, "visiting" | "visited">();

  const visit = (nodeKey: string): boolean => {
    const current = state.get(nodeKey);
    if (current === "visiting") return true;
    if (current === "visited") return false;

    state.set(nodeKey, "visiting");
    for (const target of edges.get(nodeKey) ?? []) {
      if (visit(target)) return true;
    }
    state.set(nodeKey, "visited");
    return false;
  };

  return [...nodeKeys].some((nodeKey) => visit(nodeKey));
}

export function validateCompiledRoutingGraphV2(
  nodeKeys: ReadonlySet<string>,
  edges: ReadonlyMap<string, readonly string[]>,
  add: AddCompiledRoutingProblemV2,
): void {
  if (containsCycle(nodeKeys, edges)) {
    add(
      "CYCLIC_ROUTING_GRAPH",
      "routes",
      "Compiled routing graph must be acyclic.",
    );
  }
}
