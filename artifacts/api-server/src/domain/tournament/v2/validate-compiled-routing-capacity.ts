import type {
  CompiledParticipantRouteV2,
  CompiledStageOutputV2,
} from "./compiled-routing-model";
import {
  pairKey,
  type AddCompiledRoutingProblemV2,
} from "./compiled-routing-validation-model";

export function validateCompiledOutputCapacitiesV2(
  outputs: readonly CompiledStageOutputV2[],
  routes: readonly CompiledParticipantRouteV2[],
  add: AddCompiledRoutingProblemV2,
): void {
  for (const output of outputs) {
    const outputKey = pairKey(output.stageKey, output.outputKey);
    let unconditionalCapacity = 0;

    routes.forEach((route, index) => {
      if (
        route.target.type !== "stage_output" ||
        pairKey(route.target.stageKey, route.target.outputKey) !== outputKey
      ) {
        return;
      }
      if (route.condition.type !== "always") {
        add(
          "CONDITIONAL_EXACT_OUTPUT_ROUTE",
          `routes[${index}].condition`,
          `Conditional routes cannot deliver directly to exact output ${output.stageKey}/${output.outputKey}.`,
        );
        return;
      }
      unconditionalCapacity += route.reservedSlots;
    });

    if (unconditionalCapacity < output.exactCapacity) {
      add(
        "OUTPUT_CAPACITY_UNDERFILLED",
        "routes",
        `Unconditional routes provide ${unconditionalCapacity} participants to output ${output.stageKey}/${output.outputKey}, but exact capacity is ${output.exactCapacity}.`,
      );
    } else if (unconditionalCapacity > output.exactCapacity) {
      add(
        "OUTPUT_CAPACITY_EXCEEDED",
        "routes",
        `Unconditional routes provide ${unconditionalCapacity} participants to output ${output.stageKey}/${output.outputKey}, exceeding exact capacity ${output.exactCapacity}.`,
      );
    }
  }
}
